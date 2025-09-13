# Database Documentation

The `database/` directory contains the data models, utilities, and database management functions for the Aegis Forensics platform. It provides persistent storage for cases, evidence, events, and analysis results.

## 🗄️ Database Architecture

### Technology Stack
- **SQLAlchemy**: Object-Relational Mapping (ORM)
- **SQLite**: Default database engine (configurable)
- **Alembic**: Database migrations (if needed)
- **Pydantic**: Data validation and serialization

### Design Principles
- **Evidence Integrity**: Cryptographic hashing and verification
- **Audit Trail**: Complete action logging and timestamping
- **Chain of Custody**: Forensic-grade evidence tracking
- **Scalability**: Designed for large-scale investigations
- **Compliance**: Legal and regulatory requirement support

## 📋 Database Schema

### Core Tables

#### Cases Table
Stores forensic investigation cases and their metadata.

```sql
CREATE TABLE cases (
    id TEXT PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    investigator TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON
);
```

#### Evidence Table  
Tracks all evidence files and their forensic metadata.

```sql
CREATE TABLE evidence (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id),
    filename TEXT NOT NULL,
    original_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    sha256_hash TEXT UNIQUE NOT NULL,
    md5_hash TEXT,
    collected_at DATETIME,
    collected_by TEXT,
    chain_of_custody JSON,
    analysis_status TEXT DEFAULT 'pending',
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Events Table
Records all forensic analysis events and activities.

```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id),
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    analyst TEXT,
    evidence_id TEXT REFERENCES evidence(id),
    analysis_results JSON,
    confidence_score REAL,
    severity TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON
);
```

#### Analysis Results Table
Stores detailed analysis outputs from AI agents.

```sql
CREATE TABLE analysis_results (
    id TEXT PRIMARY KEY,
    evidence_id TEXT REFERENCES evidence(id),
    agent_name TEXT NOT NULL,
    analysis_type TEXT NOT NULL,
    verdict TEXT,
    severity TEXT,
    confidence TEXT,
    summary TEXT,
    findings JSON,
    technical_details JSON,
    recommendations JSON,
    execution_time REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📄 File Structure

### `models.py`
**Purpose:** SQLAlchemy ORM models and database schema definitions.

#### Key Components

##### Database Engine and Session
```python
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Database configuration
DATABASE_URL = "sqlite:///aegis_forensics.db"
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

##### Case Model
```python
class Case(Base):
    __tablename__ = "cases"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    investigator = Column(String)
    status = Column(String, default="open")  # open, closed, suspended
    priority = Column(String, default="medium")  # low, medium, high, critical
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON)
    
    # Relationships
    evidence = relationship("Evidence", back_populates="case")
    events = relationship("Event", back_populates="case")
```

##### Evidence Model
```python
class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"))
    filename = Column(String, nullable=False)
    original_path = Column(String)
    file_size = Column(Integer)
    mime_type = Column(String)
    sha256_hash = Column(String, unique=True, nullable=False)
    md5_hash = Column(String)
    collected_at = Column(DateTime)
    collected_by = Column(String)
    chain_of_custody = Column(JSON)
    analysis_status = Column(String, default="pending")
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="evidence")
    events = relationship("Event", back_populates="evidence")
    analysis_results = relationship("AnalysisResult", back_populates="evidence")
```

##### Event Model
```python
class Event(Base):
    __tablename__ = "events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"))
    event_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    analyst = Column(String)
    evidence_id = Column(String, ForeignKey("evidence.id"), nullable=True)
    analysis_results = Column(JSON)
    confidence_score = Column(Float)
    severity = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON)
    
    # Relationships
    case = relationship("Case", back_populates="events")
    evidence = relationship("Evidence", back_populates="events")
```

##### Analysis Result Model
```python
class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id = Column(String, ForeignKey("evidence.id"))
    agent_name = Column(String, nullable=False)
    analysis_type = Column(String, nullable=False)
    verdict = Column(String)  # BENIGN, SUSPICIOUS, MALICIOUS
    severity = Column(String)  # Low, Medium, High, Critical
    confidence = Column(String)  # Low, Medium, High
    summary = Column(Text)
    findings = Column(JSON)
    technical_details = Column(JSON)
    recommendations = Column(JSON)
    execution_time = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    evidence = relationship("Evidence", back_populates="analysis_results")
```

##### Utility Functions
```python
def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def compute_sha256(file_path: str) -> str:
    """Compute SHA256 hash of file"""
    import hashlib
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()

def compute_md5(file_path: str) -> str:
    """Compute MD5 hash of file"""
    import hashlib
    md5_hash = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            md5_hash.update(chunk)
    return md5_hash.hexdigest()
```

### `utils.py`
**Purpose:** Database utility functions for common operations.

#### Key Functions

##### Evidence Management
```python
def add_evidence_record(
    case_id: str,
    filename: str,
    file_path: str,
    collected_by: str = "system",
    metadata: dict = None
) -> str:
    """
    Add evidence record to database with integrity verification.
    
    Args:
        case_id: Associated case ID
        filename: Evidence filename
        file_path: Path to evidence file
        collected_by: Person who collected evidence
        metadata: Additional evidence metadata
        
    Returns:
        str: Evidence ID
    """
    from database.models import Evidence, SessionLocal
    import os
    
    db = SessionLocal()
    try:
        # Compute file hashes for integrity
        sha256_hash = compute_sha256(file_path)
        md5_hash = compute_md5(file_path)
        
        # Get file metadata
        file_size = os.path.getsize(file_path)
        
        # Create evidence record
        evidence = Evidence(
            case_id=case_id,
            filename=filename,
            original_path=file_path,
            file_size=file_size,
            sha256_hash=sha256_hash,
            md5_hash=md5_hash,
            collected_by=collected_by,
            metadata=metadata or {}
        )
        
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
        
        return evidence.id
        
    finally:
        db.close()
```

##### Event Logging
```python
def add_event(
    case_id: str,
    description: str,
    event_type: str = "analysis",
    analyst: str = "system",
    evidence_id: str = None,
    analysis_results: dict = None,
    severity: str = None
) -> str:
    """
    Add forensic event to audit trail.
    
    Args:
        case_id: Associated case ID
        description: Event description
        event_type: Type of event (analysis, collection, etc.)
        analyst: Person performing action
        evidence_id: Related evidence ID (if applicable)
        analysis_results: Analysis output (if applicable)
        severity: Event severity level
        
    Returns:
        str: Event ID
    """
    from database.models import Event, SessionLocal
    
    db = SessionLocal()
    try:
        event = Event(
            case_id=case_id,
            event_type=event_type,
            description=description,
            analyst=analyst,
            evidence_id=evidence_id,
            analysis_results=analysis_results,
            severity=severity
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event.id
        
    finally:
        db.close()
```

##### Case Management
```python
def create_case(
    case_number: str,
    name: str,
    description: str = None,
    investigator: str = None,
    priority: str = "medium"
) -> str:
    """
    Create new forensic case.
    
    Args:
        case_number: Unique case number
        name: Case name
        description: Case description
        investigator: Lead investigator
        priority: Case priority level
        
    Returns:
        str: Case ID
    """
    from database.models import Case, SessionLocal
    
    db = SessionLocal()
    try:
        case = Case(
            case_number=case_number,
            name=name,
            description=description,
            investigator=investigator,
            priority=priority
        )
        
        db.add(case)
        db.commit()
        db.refresh(case)
        
        return case.id
        
    finally:
        db.close()
```

##### Analysis Result Storage
```python
def store_analysis_result(
    evidence_id: str,
    agent_name: str,
    analysis_type: str,
    result_data: dict,
    execution_time: float = None
) -> str:
    """
    Store AI agent analysis results.
    
    Args:
        evidence_id: Evidence being analyzed
        agent_name: Name of analyzing agent
        analysis_type: Type of analysis performed
        result_data: Analysis results from agent
        execution_time: Analysis execution time
        
    Returns:
        str: Analysis result ID
    """
    from database.models import AnalysisResult, SessionLocal
    
    db = SessionLocal()
    try:
        analysis_result = AnalysisResult(
            evidence_id=evidence_id,
            agent_name=agent_name,
            analysis_type=analysis_type,
            verdict=result_data.get("verdict"),
            severity=result_data.get("severity"),
            confidence=result_data.get("confidence"),
            summary=result_data.get("summary"),
            findings=result_data.get("findings", []),
            technical_details=result_data.get("technical_details", {}),
            recommendations=result_data.get("recommendations", []),
            execution_time=execution_time
        )
        
        db.add(analysis_result)
        db.commit()
        db.refresh(analysis_result)
        
        return analysis_result.id
        
    finally:
        db.close()
```

##### Query Functions
```python
def get_case_evidence(case_id: str) -> list:
    """Get all evidence for a case"""
    from database.models import Evidence, SessionLocal
    
    db = SessionLocal()
    try:
        evidence = db.query(Evidence).filter(Evidence.case_id == case_id).all()
        return [
            {
                "id": e.id,
                "filename": e.filename,
                "file_size": e.file_size,
                "sha256_hash": e.sha256_hash,
                "analysis_status": e.analysis_status,
                "created_at": e.created_at.isoformat() if e.created_at else None
            }
            for e in evidence
        ]
    finally:
        db.close()

def get_case_timeline(case_id: str) -> list:
    """Get chronological timeline of case events"""
    from database.models import Event, SessionLocal
    
    db = SessionLocal()
    try:
        events = db.query(Event).filter(
            Event.case_id == case_id
        ).order_by(Event.timestamp.asc()).all()
        
        return [
            {
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "event_type": e.event_type,
                "description": e.description,
                "analyst": e.analyst,
                "severity": e.severity
            }
            for e in events
        ]
    finally:
        db.close()

def get_evidence_analysis_history(evidence_id: str) -> list:
    """Get all analysis results for evidence"""
    from database.models import AnalysisResult, SessionLocal
    
    db = SessionLocal()
    try:
        results = db.query(AnalysisResult).filter(
            AnalysisResult.evidence_id == evidence_id
        ).order_by(AnalysisResult.created_at.desc()).all()
        
        return [
            {
                "agent_name": r.agent_name,
                "analysis_type": r.analysis_type,
                "verdict": r.verdict,
                "severity": r.severity,
                "confidence": r.confidence,
                "summary": r.summary,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in results
        ]
    finally:
        db.close()
```

## 🔧 Database Operations

### Initialization
```python
# Initialize database on first run
from database.models import init_db
init_db()
```

### Session Management
```python
# Use database session
from database.models import SessionLocal

def perform_database_operation():
    db = SessionLocal()
    try:
        # Database operations here
        pass
    finally:
        db.close()

# Or use context manager
from contextlib import contextmanager

@contextmanager
def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Usage
with get_db_session() as db:
    cases = db.query(Case).all()
```

### Bulk Operations
```python
def bulk_insert_events(events_data: list):
    """Efficiently insert multiple events"""
    from database.models import Event, SessionLocal
    
    db = SessionLocal()
    try:
        events = [Event(**event_data) for event_data in events_data]
        db.bulk_save_objects(events)
        db.commit()
    finally:
        db.close()
```

## 📊 Data Integrity and Security

### Hash Verification
```python
def verify_evidence_integrity(evidence_id: str) -> dict:
    """
    Verify evidence file integrity using stored hashes.
    
    Returns:
        dict: Verification results with status and details
    """
    from database.models import Evidence, SessionLocal
    
    db = SessionLocal()
    try:
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence:
            return {"status": "error", "message": "Evidence not found"}
        
        # Recompute current hash
        current_sha256 = compute_sha256(evidence.original_path)
        
        # Compare with stored hash
        integrity_verified = current_sha256 == evidence.sha256_hash
        
        return {
            "status": "success",
            "evidence_id": evidence_id,
            "integrity_verified": integrity_verified,
            "stored_hash": evidence.sha256_hash,
            "current_hash": current_sha256,
            "verification_time": datetime.utcnow().isoformat()
        }
        
    finally:
        db.close()
```

### Chain of Custody
```python
def update_chain_of_custody(evidence_id: str, custodian: str, action: str, notes: str = ""):
    """
    Update chain of custody record for evidence.
    
    Args:
        evidence_id: Evidence ID
        custodian: Person taking custody
        action: Action performed (collected, analyzed, transferred, etc.)
        notes: Additional notes
    """
    from database.models import Evidence, SessionLocal
    
    db = SessionLocal()
    try:
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence:
            return
        
        # Get existing chain of custody or create new
        custody_chain = evidence.chain_of_custody or []
        
        # Add new entry
        custody_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "custodian": custodian,
            "action": action,
            "notes": notes,
            "location": os.path.abspath(evidence.original_path) if evidence.original_path else None
        }
        
        custody_chain.append(custody_entry)
        evidence.chain_of_custody = custody_chain
        
        db.commit()
        
    finally:
        db.close()
```

## 🔍 Query Examples

### Case Statistics
```python
def get_case_statistics(case_id: str) -> dict:
    """Get comprehensive case statistics"""
    from database.models import Case, Evidence, Event, AnalysisResult, SessionLocal
    from sqlalchemy import func
    
    db = SessionLocal()
    try:
        # Basic case info
        case = db.query(Case).filter(Case.id == case_id).first()
        
        # Evidence counts
        evidence_count = db.query(Evidence).filter(Evidence.case_id == case_id).count()
        
        # Event counts by type
        event_counts = db.query(
            Event.event_type,
            func.count(Event.id)
        ).filter(Event.case_id == case_id).group_by(Event.event_type).all()
        
        # Analysis results summary
        analysis_summary = db.query(
            AnalysisResult.verdict,
            func.count(AnalysisResult.id)
        ).join(Evidence).filter(Evidence.case_id == case_id).group_by(AnalysisResult.verdict).all()
        
        return {
            "case": {
                "id": case.id,
                "name": case.name,
                "status": case.status,
                "created_at": case.created_at.isoformat() if case.created_at else None
            },
            "evidence_count": evidence_count,
            "event_counts": dict(event_counts),
            "analysis_summary": dict(analysis_summary)
        }
        
    finally:
        db.close()
```

### Search Functions
```python
def search_evidence_by_hash(hash_value: str) -> list:
    """Search for evidence by hash value"""
    from database.models import Evidence, SessionLocal
    
    db = SessionLocal()
    try:
        evidence = db.query(Evidence).filter(
            (Evidence.sha256_hash == hash_value) | 
            (Evidence.md5_hash == hash_value)
        ).all()
        
        return [
            {
                "id": e.id,
                "filename": e.filename,
                "case_id": e.case_id,
                "sha256_hash": e.sha256_hash
            }
            for e in evidence
        ]
        
    finally:
        db.close()

def search_cases_by_investigator(investigator: str) -> list:
    """Find all cases assigned to an investigator"""
    from database.models import Case, SessionLocal
    
    db = SessionLocal()
    try:
        cases = db.query(Case).filter(Case.investigator == investigator).all()
        
        return [
            {
                "id": c.id,
                "case_number": c.case_number,
                "name": c.name,
                "status": c.status,
                "priority": c.priority
            }
            for c in cases
        ]
        
    finally:
        db.close()
```

## 🚀 Performance Optimization

### Indexing Strategy
```sql
-- Recommended indexes for performance
CREATE INDEX idx_evidence_case_id ON evidence(case_id);
CREATE INDEX idx_evidence_hash ON evidence(sha256_hash);
CREATE INDEX idx_events_case_id ON events(case_id);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_analysis_evidence_id ON analysis_results(evidence_id);
CREATE INDEX idx_analysis_agent ON analysis_results(agent_name);
```

### Query Optimization
```python
def optimized_case_query(case_id: str):
    """Optimized query with eager loading"""
    from database.models import Case, Evidence, Event, SessionLocal
    from sqlalchemy.orm import joinedload
    
    db = SessionLocal()
    try:
        case = db.query(Case).options(
            joinedload(Case.evidence),
            joinedload(Case.events)
        ).filter(Case.id == case_id).first()
        
        return case
        
    finally:
        db.close()
```

### Connection Pooling
```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

# Configure connection pooling for production
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

## 🔄 Database Migrations

### Migration Script Template
```python
"""
Database migration script
"""
from sqlalchemy import MetaData, Table, Column, String, DateTime
from database.models import engine

def upgrade():
    """Apply migration"""
    metadata = MetaData()
    
    # Add new column example
    with engine.begin() as conn:
        conn.execute(
            "ALTER TABLE evidence ADD COLUMN mime_type TEXT"
        )

def downgrade():
    """Rollback migration"""
    with engine.begin() as conn:
        conn.execute(
            "ALTER TABLE evidence DROP COLUMN mime_type"
        )
```

## 🔒 Security Considerations

### Data Encryption
```python
def encrypt_sensitive_data(data: str, key: bytes) -> str:
    """Encrypt sensitive evidence metadata"""
    from cryptography.fernet import Fernet
    
    f = Fernet(key)
    encrypted_data = f.encrypt(data.encode())
    return encrypted_data.decode()

def decrypt_sensitive_data(encrypted_data: str, key: bytes) -> str:
    """Decrypt sensitive evidence metadata"""
    from cryptography.fernet import Fernet
    
    f = Fernet(key)
    decrypted_data = f.decrypt(encrypted_data.encode())
    return decrypted_data.decode()
```

### Access Control
```python
def audit_database_access(user: str, action: str, table: str, record_id: str = None):
    """Log database access for auditing"""
    audit_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "user": user,
        "action": action,
        "table": table,
        "record_id": record_id,
        "ip_address": get_client_ip()  # Implement based on your setup
    }
    
    # Log to secure audit file or separate audit table
    log_audit_entry(audit_entry)
```

## 🧪 Testing

### Unit Tests
```python
import unittest
from database.models import init_db, SessionLocal, Case, Evidence
from database.utils import create_case, add_evidence_record

class TestDatabaseOperations(unittest.TestCase):
    def setUp(self):
        """Set up test database"""
        # Use in-memory SQLite for testing
        from sqlalchemy import create_engine
        from database.models import Base
        
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
    
    def test_create_case(self):
        """Test case creation"""
        case_id = create_case(
            case_number="TEST-001",
            name="Test Case",
            investigator="Test Investigator"
        )
        
        self.assertIsNotNone(case_id)
    
    def test_evidence_integrity(self):
        """Test evidence hash verification"""
        # Create test file and verify hash computation
        pass
```

## 📊 Backup and Recovery

### Backup Strategy
```python
def backup_database(backup_path: str):
    """Create database backup"""
    import shutil
    import sqlite3
    
    # For SQLite
    conn = sqlite3.connect("aegis_forensics.db")
    backup = sqlite3.connect(backup_path)
    conn.backup(backup)
    backup.close()
    conn.close()

def restore_database(backup_path: str):
    """Restore database from backup"""
    import shutil
    
    # Ensure current database is closed
    engine.dispose()
    
    # Restore from backup
    shutil.copy2(backup_path, "aegis_forensics.db")
```

---

## 📚 Additional Resources

- **[Models Reference](models.py)**: Complete ORM model definitions
- **[Utilities Reference](utils.py)**: Database utility functions
- **[API Integration](../README.md#api-reference)**: How APIs use database
- **[Agent Integration](../agents/README.md)**: How agents store results
- **[Schema Validation](../schemas/README.md)**: Data validation models
