# schemas/case.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CaseStatus(str, Enum):
    OPEN = "open"
    ANALYZING = "analyzing"
    CLOSED = "closed"
    SUSPENDED = "suspended"

class CasePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CaseBase(BaseModel):
    name: str
    description: Optional[str] = None
    investigator: str
    status: CaseStatus = CaseStatus.OPEN
    priority: CasePriority = CasePriority.MEDIUM
    tags: Optional[List[str]] = []

class CaseCreate(CaseBase):
    pass

class CaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    investigator: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    tags: Optional[List[str]] = None

class CaseOut(CaseBase):
    id: int
    case_number: str
    created_at: datetime
    updated_at: datetime
    evidence_count: int = 0
    event_count: int = 0
    report_count: int = 0

    class Config:
        from_attributes = True

class AgentReportBase(BaseModel):
    agent_name: str
    analysis_type: str
    verdict: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[str] = None
    summary: Optional[str] = None
    findings: Optional[List[dict]] = []
    technical_details: Optional[dict] = {}
    recommendations: Optional[List[str]] = []

class AgentReportCreate(AgentReportBase):
    case_id: int
    evidence_id: Optional[int] = None
    raw_output: Optional[str] = None

class AgentReportOut(AgentReportBase):
    id: int
    case_id: int
    evidence_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
