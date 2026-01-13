import os
from datetime import timedelta


def _normalize_database_url(url):
    if url and url.startswith("postgres://"):
        return "postgresql+psycopg2://" + url[len("postgres://"):]
    return url


class Config:
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(os.getenv("DATABASE_URL"))
    if not SQLALCHEMY_DATABASE_URI:
        raise RuntimeError(
            "DATABASE_URL is not set. Example: "
            "postgresql+psycopg2://user:pass@localhost:5432/edugrade"
        )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
    JWT_SECRET_KEY = JWT_SECRET
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)