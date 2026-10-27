"""Selects the best rollback target from known-good versions.

A "known-good" version is a Deployment with status='success' and
health_score >= 80. On rollback, the most recent such version is
preferred over blindly reverting to the immediately previous deployment,
which may itself be broken.
"""


class RollbackSelector:
    def __init__(self, db_session):
        self.db = db_session

    def select_rollback_target(self, project_id: int,
                               exclude_deployment_id: int | None = None):
        """Most recent known-good Deployment for rollback.

        Returns a Deployment row or None.
        """
        query = (
            self.db.query(Deployment)
            .filter(
                Deployment.project_id == project_id,
                Deployment.status == "success",
                Deployment.health_score >= 80,
            )
        )
        if exclude_deployment_id is not None:
            query = query.filter(Deployment.id != exclude_deployment_id)
        return query.order_by(Deployment.deployed_at.desc()).first()

    def select_fallback_target(self, project_id: int,
                               exclude_deployment_id: int | None = None):
        """Most recent previous deployment regardless of health."""
        query = self.db.query(Deployment).filter(
            Deployment.project_id == project_id,
        )
        if exclude_deployment_id is not None:
            query = query.filter(Deployment.id != exclude_deployment_id)
        return query.order_by(Deployment.deployed_at.desc()).first()

    def choose(self, project_id: int, current_deployment_id: int):
        """Picks a rollback target: known-good first, then fallback.

        Returns (deployment_row_or_None, reason_string).
        """
        from app.models.deployment import Deployment

        target = self.select_rollback_target(
            project_id, exclude_deployment_id=current_deployment_id
        )
        if target is not None:
            return target, "rolled back to known-good version"

        fallback = self.select_fallback_target(
            project_id, exclude_deployment_id=current_deployment_id
        )
        if fallback is not None:
            return fallback, (
                "no known-good version; fell back to previous deployment"
            )

        return None, "no previous deployment to roll back to"
