# schemas/case.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CaseBase(BaseModel):
    name: str
    description: Optional[str] = None

class CaseCreate(CaseBase):
    pass

class CaseOut(CaseBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
