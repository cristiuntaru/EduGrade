from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from models import Choice, Question, Quiz, db

quizzes_bp = Blueprint("quizzes", __name__, url_prefix="/api/quizzes")


def _current_user_id():
    user_id = get_jwt_identity()
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


def _require_professor():
    claims = get_jwt()
    return claims.get("role") == "professor"


def _serialize_choice(choice):
    return {
        "id": choice.id,
        "label": choice.label,
        "text": choice.text,
        "is_correct": choice.is_correct,
    }


def _serialize_question(question):
    return {
        "id": question.id,
        "text": question.text,
        "points": question.points,
        "order": question.order,
        "choices": [_serialize_choice(c) for c in question.choices],
    }


def _serialize_quiz(quiz):
    return {
        "id": quiz.id,
        "owner_professor_id": quiz.owner_professor_id,
        "title": quiz.title,
        "subject": quiz.subject,
        "duration": quiz.duration,
        "open_date": quiz.open_date.isoformat() if quiz.open_date else None,
        "close_date": quiz.close_date.isoformat() if quiz.close_date else None,
        "description": quiz.description,
        "status": quiz.status,
        "created_at": quiz.created_at.isoformat() if quiz.created_at else None,
        "questions": [_serialize_question(q) for q in quiz.questions],
    }


def _parse_datetime(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _validate_quiz_payload(data, require_questions=False):
    title = (data.get("title") or "").strip()
    duration = data.get("duration")
    questions = data.get("questions")
    status = (data.get("status") or "").strip().lower() or "published"

    if not title:
        return None, None, None, None, "title is required"
    if not isinstance(duration, int) or duration <= 0:
        return None, None, None, None, "duration must be a positive integer"
    if require_questions and not isinstance(questions, list):
        return None, None, None, None, "questions must be a list"
    if status not in {"draft", "published", "archived"}:
        return None, None, None, None, "status must be draft, published, or archived"

    return title, duration, questions, status, None


def _build_questions(quiz, questions):
    for q in questions:
        text = (q.get("text") or "").strip()
        points = q.get("points")
        order = q.get("order")
        choices = q.get("choices")

        if not text:
            return "question text is required"
        if not isinstance(points, int) or points <= 0:
            return "question points must be a positive integer"
        if not isinstance(order, int) or order <= 0:
            return "question order must be a positive integer"
        if not isinstance(choices, list) or not choices:
            return "choices must be a non-empty list"

        question = Question(quiz=quiz, text=text, points=points, order=order)
        db.session.add(question)

        for c in choices:
            label = (c.get("label") or "").strip()
            text_c = (c.get("text") or "").strip()
            is_correct = bool(c.get("is_correct"))
            if not label or not text_c:
                return "choice label and text are required"
            choice = Choice(
                question=question, label=label, text=text_c, is_correct=is_correct
            )
            db.session.add(choice)

    return None


@quizzes_bp.get("")
@jwt_required()
def list_quizzes():
    quizzes = Quiz.query.order_by(Quiz.created_at.desc()).all()
    return jsonify({"quizzes": [_serialize_quiz(q) for q in quizzes]})


@quizzes_bp.post("")
@jwt_required()
def create_quiz():
    if not _require_professor():
        return jsonify({"error": "professor role required"}), 403

    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "invalid token subject"}), 401

    data = request.get_json(silent=True) or {}
    title, duration, questions, status, error = _validate_quiz_payload(
        data, require_questions=False
    )
    if error:
        return jsonify({"error": error}), 400

    open_date = _parse_datetime(data.get("open_date"))
    close_date = _parse_datetime(data.get("close_date"))
    if data.get("open_date") and not open_date:
        return jsonify({"error": "open_date must be ISO datetime"}), 400
    if data.get("close_date") and not close_date:
        return jsonify({"error": "close_date must be ISO datetime"}), 400

    if status != "draft" and not isinstance(questions, list):
        return jsonify({"error": "questions must be a list"}), 400
    if status != "draft" and isinstance(questions, list) and not questions:
        return jsonify({"error": "questions cannot be empty"}), 400

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

    if isinstance(questions, list) and questions:
        error = _build_questions(quiz, questions)
        if error:
            db.session.rollback()
            return jsonify({"error": error}), 400

    db.session.commit()
    return jsonify({"quiz": _serialize_quiz(quiz)}), 201


@quizzes_bp.get("/<int:quiz_id>")
@jwt_required()
def get_quiz(quiz_id):
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"error": "quiz not found"}), 404
    return jsonify({"quiz": _serialize_quiz(quiz)})


@quizzes_bp.put("/<int:quiz_id>")
@jwt_required()
def update_quiz(quiz_id):
    if not _require_professor():
        return jsonify({"error": "professor role required"}), 403

    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "invalid token subject"}), 401

    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"error": "quiz not found"}), 404
    if quiz.owner_professor_id != user_id:
        return jsonify({"error": "not quiz owner"}), 403
    if quiz.submissions:
        return jsonify({"error": "quiz already has submissions"}), 409

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    duration = data.get("duration")
    subject = (data.get("subject") or "").strip()
    description = (data.get("description") or "").strip()
    status = (data.get("status") or "").strip().lower()
    open_date = data.get("open_date")
    close_date = data.get("close_date")

    if title:
        quiz.title = title
    if duration is not None:
        if not isinstance(duration, int) or duration <= 0:
            return jsonify({"error": "duration must be a positive integer"}), 400
        quiz.duration = duration
    if subject:
        quiz.subject = subject
    if description:
        quiz.description = description
    if status:
        if status not in {"draft", "published", "archived"}:
            return jsonify({"error": "status must be draft, published, or archived"}), 400
        quiz.status = status
    if open_date is not None:
        parsed = _parse_datetime(open_date)
        if open_date and not parsed:
            return jsonify({"error": "open_date must be ISO datetime"}), 400
        quiz.open_date = parsed
    if close_date is not None:
        parsed = _parse_datetime(close_date)
        if close_date and not parsed:
            return jsonify({"error": "close_date must be ISO datetime"}), 400
        quiz.close_date = parsed

    if "questions" in data:
        questions = data.get("questions")
        if not isinstance(questions, list):
            return jsonify({"error": "questions must be a list"}), 400

        for question in list(quiz.questions):
            for choice in list(question.choices):
                db.session.delete(choice)
            db.session.delete(question)

        error = _build_questions(quiz, questions)
        if error:
            db.session.rollback()
            return jsonify({"error": error}), 400

    db.session.commit()
    return jsonify({"quiz": _serialize_quiz(quiz)})


@quizzes_bp.delete("/<int:quiz_id>")
@jwt_required()
def delete_quiz(quiz_id):
    if not _require_professor():
        return jsonify({"error": "professor role required"}), 403

    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "invalid token subject"}), 401

    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"error": "quiz not found"}), 404
    if quiz.owner_professor_id != user_id:
        return jsonify({"error": "not quiz owner"}), 403
    if quiz.submissions:
        return jsonify({"error": "quiz already has submissions"}), 409

    for question in list(quiz.questions):
        for choice in list(question.choices):
            db.session.delete(choice)
        db.session.delete(question)
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({"status": "deleted"})
