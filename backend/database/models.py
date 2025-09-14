# database/models.py
import hashlib
import json
from datetime import datetime, timedelta
from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import enum

DB_URL = "sqlite:///aegis_forensics.db"  # file-based sqlite; change if you want Postgres etc.

engine = create_engine(DB_URL, connect_args={"check_same_thread": False}, echo=False)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

class CaseStatus(enum.Enum):
    OPEN = "OPEN"
    ANALYZING = "ANALYZING"
    CLOSED = "CLOSED"
    SUSPENDED = "SUSPENDED"

class CasePriority(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

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
    case_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    investigator = Column(String, nullable=False)
    status = Column(Enum(CaseStatus), default=CaseStatus.OPEN, nullable=False)
    priority = Column(Enum(CasePriority), default=CasePriority.MEDIUM, nullable=False)
    tags = Column(Text, nullable=True)  # JSON array of tags
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    evidences = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="case", cascade="all, delete-orphan")
    agent_reports = relationship("AgentReport", back_populates="case", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    filename = Column(String)
    file_path = Column(String)
    file_hash = Column(String)      # SHA-256 of file contents
    file_size = Column(Integer, nullable=True)
    file_type = Column(String, nullable=True)
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

class AgentReport(Base):
    __tablename__ = "agent_reports"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    agent_name = Column(String, nullable=False)  # e.g., "NetworkAnalyzer", "BinaryAnalyzer"
    evidence_id = Column(Integer, ForeignKey("evidence.id"), nullable=True)  # Optional link to specific evidence
    analysis_type = Column(String, nullable=False)  # e.g., "network_analysis", "binary_analysis"
    verdict = Column(String, nullable=True)  # MALICIOUS, SUSPICIOUS, BENIGN
    severity = Column(String, nullable=True)  # Critical, High, Medium, Low
    confidence = Column(String, nullable=True)  # High, Medium, Low
    summary = Column(Text, nullable=True)
    findings = Column(Text, nullable=True)  # JSON array of findings
    technical_details = Column(Text, nullable=True)  # JSON object with technical info
    recommendations = Column(Text, nullable=True)  # JSON array of recommendations
    raw_output = Column(Text, nullable=True)  # Full raw JSON output from agent
    created_at = Column(DateTime, default=datetime.utcnow)
    case = relationship("Case", back_populates="agent_reports")
    evidence = relationship("Evidence")

def compute_sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

# create tables
def init_db():
    """Initialize database with tables and sample data if needed"""
    import os
    
    # Ensure the database file exists before creating tables
    db_path = DB_URL.replace('sqlite:///', '')
    
    # Check if database file exists
    db_exists = os.path.exists(db_path)
    
    if not db_exists:
        print(f"Database file not found. Creating new database at: {db_path}")
        # Create an empty file (SQLite will initialize it)
        open(db_path, 'a').close()
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # If this is a new database, add some sample data
    if not db_exists:
        create_sample_data()

def create_sample_data():
    """Create sample cases and users for a new database"""
    from sqlalchemy.orm import Session
    import bcrypt
    
    session = Session(bind=engine)
    try:
        # Check if any users exist
        existing_users = session.query(User).count()
        if existing_users == 0:
            print("Creating default admin user...")
            # Create default admin user
            default_password = "admin123"
            password_bytes = default_password.encode('utf-8')
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
            
            admin_user = User(
                full_name="Admin User",
                email="admin@aegisforensics.com",
                organization="Aegis Forensics",
                timezone="UTC",
                password_hash=password_hash,
                is_admin=True
            )
            session.add(admin_user)
        
        # Check if any cases exist
        existing_cases = session.query(Case).count()
        if existing_cases == 0:
            print("Creating sample cases...")
            # Create sample cases
            sample_cases = [
                Case(
                    case_number="CASE-2024-001",
                    name="Suspicious Email Investigation",
                    description="Investigation of phishing email with malicious attachments",
                    investigator="Admin User",
                    status=CaseStatus.OPEN,
                    priority=CasePriority.HIGH,
                    tags='["phishing", "email", "malware"]'
                ),
                Case(
                    case_number="CASE-2024-002", 
                    name="Network Intrusion Analysis",
                    description="Analysis of potential network breach and data exfiltration",
                    investigator="Admin User",
                    status=CaseStatus.ANALYZING,
                    priority=CasePriority.CRITICAL,
                    tags='["network", "intrusion", "breach"]'
                ),
                Case(
                    case_number="CASE-2024-003",
                    name="Mobile Device Forensics",
                    description="Forensic analysis of confiscated mobile device",
                    investigator="Admin User", 
                    status=CaseStatus.OPEN,
                    priority=CasePriority.MEDIUM,
                    tags='["mobile", "device", "forensics"]'
                )
            ]
            
            for case in sample_cases:
                session.add(case)
        
        session.commit()
        print("Sample data created successfully!")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        session.rollback()
    finally:
        session.close()
