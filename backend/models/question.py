from models import db


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False)
    text = db.Column(db.Text, nullable=False)
    points = db.Column(db.Integer, nullable=False)
    order = db.Column("order", db.Integer, nullable=False)

    quiz = db.relationship("Quiz", back_populates="questions")
    choices = db.relationship("Choice", back_populates="question")
    submission_answers = db.relationship("SubmissionAnswer", back_populates="question")