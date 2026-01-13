import csv
import io

from datetime import datetime

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy.orm import joinedload

from models import Choice, Question, Quiz, Submission, db

csv_bp = Blueprint("csv_tools", __name__, url_prefix="/api/csv")


def _current_user_id():
    user_id = get_jwt_identity()
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


def _require_professor():
    claims = get_jwt()
    return claims.get("role") == "professor"


def _parse_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def _parse_datetime(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


@csv_bp.get("/quizzes/<int:quiz_id>/export-results")
@jwt_required()
def export_results_csv(quiz_id):
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "invalid token subject"}), 401
    if not _require_professor():
        return jsonify({"error": "professor role required"}), 403

    quiz = (
        Quiz.query.options(joinedload(Quiz.questions))
        .filter_by(id=quiz_id)
        .first()
    )
    if not quiz:
        return jsonify({"error": "quiz not found"}), 404
    if quiz.owner_professor_id != user_id:
        return jsonify({"error": "not quiz owner"}), 403

    questions = sorted(quiz.questions, key=lambda q: q.order)
    submissions = (
        Submission.query.options(
            joinedload(Submission.answers), joinedload(Submission.student)
        )
        .filter_by(quiz_id=quiz_id)
        .order_by(Submission.submitted_at.asc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    header = [
        "submission_id",
        "student_id",
        "student_name",
        "student_email",
        "score",
        "submitted_at",
    ]
    for q in questions:
        header.append(f"q{q.order}_selected")
        header.append(f"q{q.order}_points")
    writer.writerow(header)

    for submission in submissions:
        answers = {a.question_id: a for a in submission.answers}
        row = [
            submission.id,
            submission.student_id,
            submission.student.name if submission.student else "",
            submission.student.email if submission.student else "",
            submission.score,
            submission.submitted_at.isoformat() if submission.submitted_at else "",
        ]
        for q in questions:
            ans = answers.get(q.id)
            row.append(ans.selected_label if ans else "")
            row.append(ans.points_awarded if ans else 0)
        writer.writerow(row)

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=quiz_{quiz_id}_results.csv"
        },
    )


@csv_bp.post("/quizzes/import")
@jwt_required()
def import_quiz_csv():
    if not _require_professor():
        return jsonify({"error": "professor role required"}), 403

    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "invalid token subject"}), 401

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    duration = data.get("duration")
    csv_text = data.get("csv")
    status = (data.get("status") or "").strip().lower() or "published"

    if not title:
        return jsonify({"error": "title is required"}), 400
    if not isinstance(duration, int) or duration <= 0:
        return jsonify({"error": "duration must be a positive integer"}), 400
    if not isinstance(csv_text, str) or not csv_text.strip():
        return jsonify({"error": "csv is required"}), 400
    if status not in {"draft", "published", "archived"}:
        return jsonify({"error": "status must be draft, published, or archived"}), 400

    open_date = _parse_datetime(data.get("open_date"))
    close_date = _parse_datetime(data.get("close_date"))
    if data.get("open_date") and not open_date:
        return jsonify({"error": "open_date must be ISO datetime"}), 400
    if data.get("close_date") and not close_date:
        return jsonify({"error": "close_date must be ISO datetime"}), 400

    reader = csv.DictReader(io.StringIO(csv_text))
    required = {"order", "question", "points", "label", "text", "is_correct"}
    if not required.issubset({h.strip().lower() for h in reader.fieldnames or []}):
        return jsonify({"error": "csv headers invalid"}), 400

    quiz = Quiz(
        owner_professor_id=user_id,
        title=title,
        subject=(data.get("subject") or "").strip() or None,
        duration=duration,
        open_date=open_date,
        close_date=close_date,
        description=(data.get("description") or "").strip() or None,
        status=status,
    )
    db.session.add(quiz)
    db.session.flush()

    questions = {}
    for row in reader:
        try:
            order = int(row.get("order") or 0)
            points = int(row.get("points") or 0)
        except ValueError:
            db.session.rollback()
            return jsonify({"error": "order/points must be integers"}), 400

        question_text = (row.get("question") or "").strip()
        label = (row.get("label") or "").strip()
        choice_text = (row.get("text") or "").strip()
        is_correct = _parse_bool(row.get("is_correct"))

        if not question_text or not label or not choice_text or order <= 0 or points <= 0:
            db.session.rollback()
            return jsonify({"error": "invalid row in csv"}), 400

        key = (order, question_text, points)
        if key not in questions:
            question = Question(quiz_id=quiz.id, text=question_text, points=points, order=order)
            db.session.add(question)
            db.session.flush()
            questions[key] = question

        question = questions[key]
        db.session.add(
            Choice(
                question_id=question.id,
                label=label,
                text=choice_text,
                is_correct=is_correct,
            )
        )

    db.session.commit()
    return jsonify({"quiz_id": quiz.id}), 201
