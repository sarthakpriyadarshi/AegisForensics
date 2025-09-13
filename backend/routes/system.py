# routes/system.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from database.models import User
from schemas.system import SystemInfo, BackupRequest, BackupResponse
from services.auth import get_current_user, get_db
from services.system import SystemService

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/info", response_model=SystemInfo)
async def get_system_info(current_user: User = Depends(get_current_user)):
    """
    Get current system information including CPU, memory, disk usage, etc.
    Requires authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access system information"
        )
    
    system_info = SystemService.get_system_info()
    return SystemInfo(**system_info)

@router.post("/backup", response_model=BackupResponse)
async def create_backup(
    backup_request: BackupRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Create a manual backup of the system.
    Requires admin authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can create backups"
        )
    
    # Create backup synchronously for now (can be moved to background later)
    backup_result = SystemService.create_backup(
        backup_name=backup_request.backup_name,
        include_logs=backup_request.include_logs,
        include_database=backup_request.include_database
    )
    
    return BackupResponse(**backup_result)

@router.get("/backups")
async def list_backups(current_user: User = Depends(get_current_user)):
    """
    List all available backups.
    Requires admin authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can view backups"
        )
    
    backups = SystemService.list_backups()
    return {"backups": backups}

@router.delete("/backup/{backup_name}")
async def delete_backup(backup_name: str, current_user: User = Depends(get_current_user)):
    """
    Delete a specific backup.
    Requires admin authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can delete backups"
        )
    
    success = SystemService.delete_backup(backup_name)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup not found"
        )
    
    return {"message": f"Backup '{backup_name}' deleted successfully"}

@router.post("/backup/auto")
async def setup_auto_backup(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Setup automatic backup (placeholder for cron job or scheduler).
    Requires admin authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can setup automatic backups"
        )
    
    # This is a placeholder - in a real implementation, you would:
    # 1. Setup a background scheduler (like APScheduler)
    # 2. Store backup preferences in the database
    # 3. Schedule regular backup tasks
    
    return {
        "message": "Automatic backup setup initiated",
        "note": "This is a placeholder. Implement actual scheduling logic as needed."
    }
