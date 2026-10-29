"""persist bounded pipeline output for 30 days"""
from alembic import op
import sqlalchemy as sa
revision = "20261029_pipeline_output"
down_revision = "6a1b2c3d4e5f"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("pipeline_runs", sa.Column("log_output", sa.Text(), nullable=True))
    op.add_column("pipeline_runs", sa.Column("logs_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_pipeline_runs_logs_expires_at", "pipeline_runs", ["logs_expires_at"])

def downgrade():
    op.drop_index("ix_pipeline_runs_logs_expires_at", table_name="pipeline_runs")
    op.drop_column("pipeline_runs", "logs_expires_at")
    op.drop_column("pipeline_runs", "log_output")
