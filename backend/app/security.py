import datetime

import bcrypt
import jwt

from app.core.config import settings


SECRET = settings.jwt_secret 
ALGORITHM = "HS256"
EXPIRY_MINUNTES = 60

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed:str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def issue_token(user_id: int, role: str) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    return jwt.encode(
        {
            "sub": str(user_id), 
            "role": role,
            "iat": now,
            "exp": now + datetime.timedelta(minutes=EXPIRY_MINUNTES),
        },
        SECRET,
        algorithm=ALGORITHM,
    )

class InvalidToken(Exception):
    pass

def decode_token(token: str) -> dict:
    """Raises InvalidToken on expiry or any tampering."""
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise InvalidToken("token has expired")
    except jwt.InvalidTokenError:
        raise InvalidToken("token is invalid")