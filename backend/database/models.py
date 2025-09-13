# database/models.py
import hashlib
from datetime import datetime, timedelta
from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DB_URL = "sqlite:///aegis_forensics.db"  # file-based sqlite; change if you want Postgres etc.

engine = create_engine(DB_URL, connect_args={"check_same_thread": False}, echo=False)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    organization = Column(String, nullable=False)
    timezone = Column(String, default="UTC", nullable=False)
    password_hash = Column(String, nullable=False)
    avatar_base64 = Column(Text, nullable=True)  # Base64 encoded avatar image
    is_admin = Column(Boolean, default=True, nullable=False)  # Only one admin user allowed
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, default=datetime.utcnow)
    password_expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=90))
    is_active = Column(Boolean, default=True)

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    evidences = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="case", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    filename = Column(String)
    file_path = Column(String)
    file_hash = Column(String)      # SHA-256 of file contents
    collected_at = Column(DateTime, default=datetime.utcnow)
    prev_hash = Column(String, default="")
    current_hash = Column(String, index=True)
    evidence_metadata = Column(Text, nullable=True)
    case = relationship("Case", back_populates="evidences")

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    description = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    prev_hash = Column(String, default="")
    current_hash = Column(String, index=True)
    extra = Column(Text, nullable=True)
    case = relationship("Case", back_populates="events")

def compute_sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

# create tables
def init_db():
    # Ensure the database file exists before creating tables
    db_path = DB_URL.replace('sqlite:///', '')
    import os
    if not os.path.exists(db_path):
        # Create an empty file (SQLite will initialize it)
        open(db_path, 'a').close()
    Base.metadata.create_all(bind=engine)
