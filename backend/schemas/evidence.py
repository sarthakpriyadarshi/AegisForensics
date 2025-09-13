# schemas/evidence.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EvidenceCreate(BaseModel):
    case_name: str
    filename: str
    file_path: str

class EvidenceOut(BaseModel):
    id: int
    case_id: int
    filename: str
    file_path: str
    file_hash: str
    collected_at: datetime
    current_hash: str

    class Config:
        orm_mode = True
