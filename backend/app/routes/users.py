from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.routes.auth import require_admin
from app.schemas.user_schema import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    # require_admin runs before the handler, so a developer never reaches it.
    admin: User = Depends(require_admin),
):
    """Lists every account. Administrator only."""
    return db.query(User).order_by(User.id.asc()).all()
