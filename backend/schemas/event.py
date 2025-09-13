# schemas/event.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EventCreate(BaseModel):
    case_name: str
    description: str

class EventOut(BaseModel):
    id: int
    case_id: int
    description: str
    timestamp: datetime
    current_hash: str

    class Config:
        orm_mode = True
