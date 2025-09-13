# schemas/auth.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    organization: str
    timezone: str = "UTC"
    password: str
    avatar_base64: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    organization: str
    timezone: str
    avatar_base64: Optional[str]
    is_admin: bool
    created_at: datetime
    last_login: Optional[datetime]
    password_expires_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    organization: Optional[str] = None
    timezone: Optional[str] = None
    avatar_base64: Optional[str] = None
