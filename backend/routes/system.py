# routes/system.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List
from database.models import User
from schemas.system import (
    SystemInfo, SystemMetrics, DatabaseStats, BackupInfo, BackupRequest, 
    BackupResponse, SystemLog, TimelineEvent
)
from services.auth import get_current_user, get_db
from services.system import SystemService

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/info", response_model=SystemInfo)
async def get_system_info(current_user: User = Depends(get_current_user)):
    """
    Get current system information including version, hostname, platform, etc.
    Requires authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access system information"
        )
    
    system_info = SystemService.get_system_info()
    return SystemInfo(**system_info)

@router.get("/metrics", response_model=SystemMetrics)
async def get_system_metrics(current_user: User = Depends(get_current_user)):
    """
    Get real-time system metrics including CPU, memory, disk, and network usage.
    Requires authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access system metrics"
        )
    
    system_metrics = SystemService.get_system_metrics()
    return SystemMetrics(**system_metrics)

@router.get("/database-stats", response_model=DatabaseStats)
async def get_database_stats(current_user: User = Depends(get_current_user)):
    """
    Get database statistics including record counts and size.
    Requires authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access database statistics"
        )
    
    db_stats = SystemService.get_database_stats()
    return DatabaseStats(**db_stats)

@router.get("/logs", response_model=List[SystemLog])
async def get_system_logs(
    limit: int = Query(50, ge=1, le=1000),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent system logs.
    Requires authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access system logs"
        )
    
    logs_data = SystemService.get_system_logs(limit=limit)
    logs = []
    for log_data in logs_data:
        try:
            logs.append(SystemLog(
                id=log_data["id"],
                timestamp=log_data["timestamp"],
                level=log_data["level"],
                category=log_data["category"],
                message=log_data["message"]
            ))
        except Exception:
            # Skip invalid log entries
            continue
    
    return logs

@router.get("/timeline", response_model=List[TimelineEvent])
async def get_timeline_events(
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user)
):
    """
    Get timeline of system events including cases, evidence, and system events.
    Requires authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access timeline events"
        )
    
    timeline_data = SystemService.get_timeline_events(limit=limit)
    timeline_events = []
    for event_data in timeline_data:
        try:
            timeline_events.append(TimelineEvent(
                id=hash(event_data["id"]) % 2147483647,  # Convert string ID to int
                timestamp=event_data["timestamp"],
                event_type=event_data["event_type"],
                description=event_data["description"],
                user=event_data.get("user"),
                case_id=event_data.get("case_id"),
                evidence_id=event_data.get("evidence_id")
            ))
        except Exception:
            # Skip invalid timeline entries
            continue
    
    return timeline_events

@router.get("/backups", response_model=List[BackupInfo])
async def get_backup_list(current_user: User = Depends(get_current_user)):
    """
    Get list of available backups.
    Requires authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access backup information"
        )
    
    backups_data = SystemService.get_backup_list()
    backups = []
    for backup_data in backups_data:
        try:
            backups.append(BackupInfo(
                id=backup_data["id"],
                filename=backup_data["filename"],
                size=backup_data["size"],
                created_at=backup_data["created_at"],
                type=backup_data["type"],
                status=backup_data["status"]
            ))
        except Exception:
            # Skip invalid backup entries
            continue
    
    return backups

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

@router.get("/processes")
async def get_running_processes(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of running processes with CPU and memory usage.
    Requires authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access process information"
        )
    
    processes = SystemService.get_running_processes(limit=limit)
    return processes

@router.get("/events")
async def get_system_events(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user)
):
    """
    Get system events for timeline display.
    Requires authentication.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access system events"
        )
    
    events = SystemService.get_system_events(limit=limit)
    return events
