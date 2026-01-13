from models import db


class Submission(db.Model):
    __tablename__ = "submissions"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    score = db.Column(db.Integer, nullable=False, default=0)
    submitted_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now())

    quiz = db.relationship("Quiz", back_populates="submissions")
    student = db.relationship("User", back_populates="submissions")
    answers = db.relationship("SubmissionAnswer", back_populates="submission")