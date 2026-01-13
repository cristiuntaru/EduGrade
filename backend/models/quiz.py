from models import db


class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    owner_professor_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False
    )
    title = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(120), nullable=True)
    duration = db.Column(db.Integer, nullable=False)
    open_date = db.Column(db.DateTime, nullable=True)
    close_date = db.Column(db.DateTime, nullable=True)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, server_default="published")
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now())

    owner_professor = db.relationship(
        "User", back_populates="quizzes", foreign_keys=[owner_professor_id]
    )
    questions = db.relationship("Question", back_populates="quiz")
    submissions = db.relationship("Submission", back_populates="quiz")
