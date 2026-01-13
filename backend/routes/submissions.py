from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy.orm import joinedload

from models import Choice, Question, Quiz, Submission, SubmissionAnswer, db

submissions_bp = Blueprint("submissions", __name__, url_prefix="/api/submissions")


def _current_user_id():
    user_id = get_jwt_identity()
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


def _require_role(role):
    claims = get_jwt()
    return claims.get("role") == role


def _serialize_submission(submission):
    return {
        "id": submission.id,
        "quiz_id": submission.quiz_id,
        "student_id": submission.student_id,
        "student_name": submission.student.name if submission.student else None,
        "student_email": submission.student.email if submission.student else None,
        "score": submission.score,
        "submitted_at": submission.submitted_at.isoformat()
        if submission.submitted_at
        else None,
        "answers": [
            {
                "id": a.id,
                "question_id": a.question_id,
                "selected_label": a.selected_label,
                "points_awarded": a.points_awarded,
            }
            for a in submission.answers
        ],
    }


@submissions_bp.post("")
@jwt_required()
def create_submission():
    if not _require_role("student"):
        return jsonify({"error": "student role required"}), 403

    student_id = _current_user_id()
    if not student_id:
        return jsonify({"error": "invalid token subject"}), 401

    data = request.get_json(silent=True) or {}
    quiz_id = data.get("quiz_id")
    answers = data.get("answers")

    if not isinstance(quiz_id, int):
        return jsonify({"error": "quiz_id must be an integer"}), 400
    if not isinstance(answers, list) or not answers:
        return jsonify({"error": "answers must be a non-empty list"}), 400

    quiz = (
        Quiz.query.options(joinedload(Quiz.questions).joinedload(Question.choices))
        .filter_by(id=quiz_id)
        .first()
    )
    if not quiz:
        return jsonify({"error": "quiz not found"}), 404

    question_map = {q.id: q for q in quiz.questions}
    score = 0

    submission = Submission(quiz_id=quiz_id, student_id=student_id, score=0)
    db.session.add(submission)
    db.session.flush()

    seen_questions = set()
    for ans in answers:
        question_id = ans.get("question_id")
        selected_raw = ans.get("selected_label")
        if not isinstance(question_id, int):
            db.session.rollback()
            return jsonify({"error": "invalid answer payload"}), 400

        if isinstance(selected_raw, list):
            selected_list = [str(v).strip() for v in selected_raw if str(v).strip()]
        else:
            selected_list = [v.strip() for v in str(selected_raw or "").split(",") if v.strip()]

        if not selected_list:
            db.session.rollback()
            return jsonify({"error": "selected_label is required"}), 400
        if len(selected_list) > 3:
            db.session.rollback()
            return jsonify({"error": "too many selections"}), 400
        if question_id in seen_questions:
            db.session.rollback()
            return jsonify({"error": "duplicate question_id"}), 400
        seen_questions.add(question_id)

        question = question_map.get(question_id)
        if not question:
            db.session.rollback()
            return jsonify({"error": "question does not belong to quiz"}), 400

        correct_labels = {c.label for c in question.choices if c.is_correct}
        selected_set = set(selected_list)
        points_awarded = question.points if selected_set == correct_labels else 0
        score += points_awarded

        db.session.add(
            SubmissionAnswer(
                submission_id=submission.id,
                question_id=question.id,
                selected_label=",".join(selected_list),
                points_awarded=points_awarded,
            )
        )

    submission.score = score
    db.session.commit()
    return jsonify({"submission": _serialize_submission(submission)}), 201


@submissions_bp.get("/<int:submission_id>")
@jwt_required()
def get_submission(submission_id):
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "invalid token subject"}), 401

    submission = (
        Submission.query.options(joinedload(Submission.answers))
        .filter_by(id=submission_id)
        .first()
    )
    if not submission:
        return jsonify({"error": "submission not found"}), 404

    if _require_role("student") and submission.student_id != user_id:
        return jsonify({"error": "not submission owner"}), 403

    if _require_role("professor"):
        quiz = db.session.get(Quiz, submission.quiz_id)
        if not quiz or quiz.owner_professor_id != user_id:
            return jsonify({"error": "not quiz owner"}), 403

    return jsonify({"submission": _serialize_submission(submission)})


@submissions_bp.get("/quiz/<int:quiz_id>")
@jwt_required()
def list_submissions_for_quiz(quiz_id):
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "invalid token subject"}), 401

    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"error": "quiz not found"}), 404

    if not _require_role("professor"):
        return jsonify({"error": "professor role required"}), 403
    if quiz.owner_professor_id != user_id:
        return jsonify({"error": "not quiz owner"}), 403

    submissions = (
        Submission.query.options(
            joinedload(Submission.answers), joinedload(Submission.student)
        )
        .filter_by(quiz_id=quiz_id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    return jsonify({"submissions": [_serialize_submission(s) for s in submissions]})


@submissions_bp.get("/me")
@jwt_required()
def list_my_submissions():
    if not _require_role("student"):
        return jsonify({"error": "student role required"}), 403

    student_id = _current_user_id()
    if not student_id:
        return jsonify({"error": "invalid token subject"}), 401

    submissions = (
        Submission.query.options(
            joinedload(Submission.answers), joinedload(Submission.student)
        )
        .filter_by(student_id=student_id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    return jsonify({"submissions": [_serialize_submission(s) for s in submissions]})
