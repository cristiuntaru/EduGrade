from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .quiz import Quiz
from .question import Question
from .choice import Choice
from .submission import Submission
from .submission_answer import SubmissionAnswer

__all__ = [
    "db",
    "User",
    "Quiz",
    "Question",
    "Choice",
    "Submission",
    "SubmissionAnswer",
]