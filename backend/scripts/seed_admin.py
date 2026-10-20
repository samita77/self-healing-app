"""Creates the initial administrator account.

Registration deliberately always creates a `developer`, so an admin can
never be created through the HTTP API. This script is the only path.

Usage:
    .venv/bin/python -m scripts.seed_admin
"""

import sys

from app.core.database import SessionLocal
from app.models.user import User
from app.security import hash_password

ADMIN_EMAIL = "admin@self-healing.dev"
ADMIN_NAME = "Platform Administrator"


def seed() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"Admin already exists (id={existing.id}, role={existing.role})")
            return

        admin = User(
            email=ADMIN_EMAIL,
            full_name=ADMIN_NAME,
            hashed_password=hash_password("admin123"),
            role="admin",
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Created admin: id={admin.id} email={admin.email} role={admin.role}")
    finally:
        db.close()


if __name__ == "__main__":
    try:
        seed()
    except Exception as exc:
        print(f"Seed failed: {exc}", file=sys.stderr)
        raise
