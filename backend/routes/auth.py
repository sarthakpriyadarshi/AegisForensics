# routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database.models import User
from schemas.auth import UserCreate, UserLogin, UserResponse, Token, PasswordChange, ProfileUpdate
from services.auth import AuthService, get_db, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/setup-admin", response_model=UserResponse)
async def setup_admin(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create the first admin user. Only allows one admin user to exist.
    This endpoint is only available if no admin user exists.
    """
    # Check if any admin user already exists
    existing_admin = db.query(User).filter(User.is_admin == True).first()
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user already exists. Only one admin user is allowed."
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new admin user
    hashed_password = AuthService.get_password_hash(user_data.password)
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        organization=user_data.organization,
        timezone=user_data.timezone,
        password_hash=hashed_password,
        avatar_base64=user_data.avatar_base64,
        is_admin=True,
        password_expires_at=datetime.utcnow() + timedelta(days=90)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login endpoint that returns JWT token
    """
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not AuthService.verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=1440)  # 24 hours
    access_token = AuthService.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 1440 * 60  # seconds
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information
    """
    return current_user

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    # Verify current password
    if not AuthService.verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.password_hash = AuthService.get_password_hash(password_data.new_password)
    current_user.password_changed_at = datetime.utcnow()
    current_user.password_expires_at = datetime.utcnow() + timedelta(days=90)
    
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.get("/password-status")
async def get_password_status(current_user: User = Depends(get_current_user)):
    """
    Get password expiration status
    """
    days_until_expiry = (current_user.password_expires_at - datetime.utcnow()).days
    
    return {
        "password_expires_at": current_user.password_expires_at,
        "days_until_expiry": days_until_expiry,
        "password_expired": days_until_expiry < 0
    }

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile information including avatar
    """
    # Update profile fields if provided
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.organization is not None:
        current_user.organization = profile_data.organization
    if profile_data.timezone is not None:
        current_user.timezone = profile_data.timezone
    if profile_data.avatar_base64 is not None:
        current_user.avatar_base64 = profile_data.avatar_base64
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
