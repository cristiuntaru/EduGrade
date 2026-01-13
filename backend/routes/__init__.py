from .auth import auth_bp
from .csv_tools import csv_bp
from .health import health_bp
from .ocr import ocr_bp
from .quizzes import quizzes_bp
from .submissions import submissions_bp


def register_routes(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(quizzes_bp)
    app.register_blueprint(submissions_bp)
    app.register_blueprint(csv_bp)
    app.register_blueprint(ocr_bp)
