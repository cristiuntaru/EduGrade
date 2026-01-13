"""add quiz metadata

Revision ID: 0002_add_quiz_metadata
Revises: 0001_initial_schema
Create Date: 2026-01-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_add_quiz_metadata"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("quizzes", sa.Column("subject", sa.String(length=120), nullable=True))
    op.add_column("quizzes", sa.Column("open_date", sa.DateTime(), nullable=True))
    op.add_column("quizzes", sa.Column("close_date", sa.DateTime(), nullable=True))
    op.add_column("quizzes", sa.Column("description", sa.Text(), nullable=True))
    op.add_column(
        "quizzes",
        sa.Column(
            "status",
            sa.String(length=50),
            nullable=False,
            server_default="published",
        ),
    )


def downgrade():
    op.drop_column("quizzes", "status")
    op.drop_column("quizzes", "description")
    op.drop_column("quizzes", "close_date")
    op.drop_column("quizzes", "open_date")
    op.drop_column("quizzes", "subject")
