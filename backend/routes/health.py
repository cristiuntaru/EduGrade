from flask import Blueprint, jsonify
from sqlalchemy import text

from models import db

health_bp = Blueprint("health", __name__)


@health_bp.get("/api/health")
def health():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify({"status": "ok", "db": "ok"})
    except Exception as exc:
        return jsonify({"status": "error", "db": "error", "detail": str(exc)}), 500