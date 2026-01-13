from models import db


class SubmissionAnswer(db.Model):
    __tablename__ = "submission_answers"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(
        db.Integer, db.ForeignKey("submissions.id"), nullable=False
    )
    question_id = db.Column(
        db.Integer, db.ForeignKey("questions.id"), nullable=False
    )
    selected_label = db.Column(db.String(10), nullable=False)
    points_awarded = db.Column(db.Integer, nullable=False, default=0)

    submission = db.relationship("Submission", back_populates="answers")
    question = db.relationship("Question", back_populates="submission_answers")