from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    # The model returns a datetime object, so the field must be typed as
    # one - a `str` here fails validation with a confusing error.
    created_at: datetime

    class Config:
        from_attributes = True
