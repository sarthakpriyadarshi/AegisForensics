# middleware/auth_middleware.py
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from database.models import SessionLocal, User
from services.auth import AuthService
import logging

logger = logging.getLogger(__name__)

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # List of endpoints that are always public (no auth required)
        always_public_endpoints = [
            "/docs",
            "/openapi.json", 
            "/redoc",
            "/favicon.ico"
        ]
        
        # Check if this is an always public endpoint or root path exactly
        is_always_public = (path == "/" or 
                           any(path.startswith(endpoint) for endpoint in always_public_endpoints))
        
        if is_always_public:
            response = await call_next(request)
            return response
        
        # Check if admin user exists
        db = SessionLocal()
        try:
            admin_exists = db.query(User).filter(User.is_admin == True).first() is not None
            
            # If no admin exists, only allow setup-admin endpoint
            if not admin_exists:
                if path == "/auth/setup-admin" and request.method == "POST":
                    response = await call_next(request)
                    return response
                else:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={
                            "detail": "No admin user exists. Please create an admin user first at POST /auth/setup-admin",
                            "setup_endpoint": "/auth/setup-admin"
                        }
                    )
            
            # If admin exists, check JWT for all endpoints except login
            else:
                # Allow login endpoint without JWT
                if path == "/auth/login" and request.method == "POST":
                    response = await call_next(request)
                    return response
                
                # All other endpoints require JWT authentication
                auth_header = request.headers.get("authorization")
                if not auth_header or not auth_header.startswith("Bearer "):
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={
                            "detail": "Authorization header required. Please login first at POST /auth/login",
                            "login_endpoint": "/auth/login"
                        },
                        headers={"WWW-Authenticate": "Bearer"}
                    )
                
                # Verify JWT token
                try:
                    token = auth_header.split(" ")[1]
                    token_data = AuthService.verify_token(token)
                    
                    # Check if user still exists and is active
                    user = db.query(User).filter(User.email == token_data["email"]).first()
                    if not user or not user.is_active:
                        return JSONResponse(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            content={"detail": "User not found or inactive"},
                            headers={"WWW-Authenticate": "Bearer"}
                        )
                        
                except Exception as e:
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={"detail": "Invalid or expired token"},
                        headers={"WWW-Authenticate": "Bearer"}
                    )
                    
        finally:
            db.close()
        
        response = await call_next(request)
        return response
