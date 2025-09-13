# schemas/system.py
from pydantic import BaseModel
from typing import Dict, Any

class SystemInfo(BaseModel):
    version: str
    uptime: str
    cpu_usage: str
    memory_usage: str
    disk_usage: str
    active_connections: int
    last_update: str

class BackupRequest(BaseModel):
    backup_name: str = None
    include_logs: bool = True
    include_database: bool = True

class BackupResponse(BaseModel):
    backup_id: str
    backup_name: str
    backup_path: str
    created_at: str
    size_mb: float
    status: str
