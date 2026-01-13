from models import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)

    quizzes = db.relationship(
        "Quiz",
        back_populates="owner_professor",
        foreign_keys="Quiz.owner_professor_id",
    )
    submissions = db.relationship(
        "Submission",
        back_populates="student",
        foreign_keys="Submission.student_id",
    )