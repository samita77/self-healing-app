from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.user_schema import UserLogin, UserRegister, UserResponse
from app.security import (
    InvalidToken,
    decode_token,
    hash_password,
    issue_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Extracts and verifies the bearer token. Raises 401 if absent or invalid.

    Header() is required - a plain `str = None` parameter is treated as a
    *query parameter* by FastAPI, so the Authorization header would never
    be read and every request would be rejected as unauthenticated.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )

    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_token(token)
    except InvalidToken as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )
    return user


@router.post("/register", response_model=UserResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Registration ALWAYS creates a user. If this allowed choosing a role,
    # anyone could make themselves an administrator.
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    # Same message either way - do not reveal whether the email exists.
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return {
        "access_token": issue_token(user.id, user.role),
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Guard for administrator-only endpoints.

    Registration always creates a `user`, so the admin role is rare by
    construction. Anything that can change roles or view every tenant's data
    belongs behind this.
    """
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return user