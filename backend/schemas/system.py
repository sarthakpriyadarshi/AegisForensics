# schemas/system.py
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

class SystemInfo(BaseModel):
    version: str
    hostname: str
    platform: str
    architecture: str
    python_version: str
    timezone: str
    uptime: float  # in hours

class SystemMetrics(BaseModel):
    cpu: Dict[str, Any]  # usage, cores, frequency
    memory: Dict[str, Any]  # total, used, available, percentage
    disk: Dict[str, Any]  # total, used, free, percentage
    network: Dict[str, Any]  # bytes_received, bytes_sent, packets_received, packets_sent

class SystemLog(BaseModel):
    id: int
    timestamp: datetime
    level: str
    category: str
    message: str

class DatabaseStats(BaseModel):
    total_cases: int
    total_evidence: int
    total_events: int
    database_size: int  # in bytes
    last_backup: Optional[str]

class BackupInfo(BaseModel):
    id: str
    filename: str
    size: int  # in bytes
    created_at: datetime
    type: str  # manual or automatic
    status: str  # completed, in-progress, failed

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

class TimelineEvent(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    description: str
    user: Optional[str]
    case_id: Optional[int]
    evidence_id: Optional[int]
