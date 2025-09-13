# Schemas Documentation

The `schemas/` directory contains Pydantic models for API validation, data serialization, and type safety throughout the Aegis Forensics platform. These schemas ensure data integrity, provide automatic validation, and generate OpenAPI documentation.

## 🏗️ Schema Architecture

### Technology Stack
- **Pydantic**: Data validation and serialization
- **Python Type Hints**: Static type checking
- **FastAPI Integration**: Automatic API documentation
- **JSON Schema**: Standards-compliant validation

### Design Principles
- **Type Safety**: Comprehensive type annotations
- **Validation**: Automatic data validation and sanitization
- **Documentation**: Self-documenting schemas with examples
- **Interoperability**: JSON Schema compatible for external integrations
- **Forensic Standards**: Compliance with digital forensics best practices

## 📋 Schema Catalog

### Core Data Models

#### Evidence Schema
**File:** `evidence.py`

**Purpose:** Defines the structure for forensic evidence records, ensuring proper validation and metadata handling.

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class EvidenceType(str, Enum):
    """Supported evidence types"""
    MEMORY_DUMP = "memory_dump"
    DISK_IMAGE = "disk_image"
    NETWORK_CAPTURE = "network_capture"
    BINARY_FILE = "binary_file"
    LOG_FILE = "log_file"
    DOCUMENT = "document"
    OTHER = "other"

class EvidenceStatus(str, Enum):
    """Evidence processing status"""
    COLLECTED = "collected"
    PROCESSING = "processing"
    ANALYZED = "analyzed"
    VERIFIED = "verified"
    ARCHIVED = "archived"

class ChainOfCustodyEntry(BaseModel):
    """Single chain of custody entry"""
    timestamp: datetime = Field(..., description="When custody changed")
    custodian: str = Field(..., description="Person taking custody")
    action: str = Field(..., description="Action performed")
    location: Optional[str] = Field(None, description="Physical/logical location")
    notes: Optional[str] = Field(None, description="Additional notes")

class EvidenceMetadata(BaseModel):
    """Evidence metadata structure"""
    source_system: Optional[str] = Field(None, description="System where evidence originated")
    collection_method: Optional[str] = Field(None, description="How evidence was collected")
    tools_used: Optional[List[str]] = Field(default_factory=list, description="Tools used for collection")
    environment: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Collection environment details")
    legal_hold: Optional[bool] = Field(False, description="Whether evidence is under legal hold")

class EvidenceBase(BaseModel):
    """Base evidence model"""
    filename: str = Field(..., description="Evidence filename", max_length=255)
    description: Optional[str] = Field(None, description="Evidence description", max_length=1000)
    evidence_type: EvidenceType = Field(..., description="Type of evidence")
    collected_by: str = Field(..., description="Person who collected evidence", max_length=100)
    collected_at: datetime = Field(..., description="When evidence was collected")
    metadata: Optional[EvidenceMetadata] = Field(default_factory=EvidenceMetadata, description="Additional metadata")

class EvidenceCreate(EvidenceBase):
    """Schema for creating new evidence"""
    case_id: str = Field(..., description="Associated case ID")
    original_path: str = Field(..., description="Original file path")
    
    @validator('filename')
    def validate_filename(cls, v):
        """Validate filename doesn't contain path separators"""
        if '/' in v or '\\' in v:
            raise ValueError('Filename cannot contain path separators')
        return v

class EvidenceUpdate(BaseModel):
    """Schema for updating evidence"""
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[EvidenceStatus] = None
    metadata: Optional[EvidenceMetadata] = None

class Evidence(EvidenceBase):
    """Complete evidence model with computed fields"""
    id: str = Field(..., description="Unique evidence ID")
    case_id: str = Field(..., description="Associated case ID")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="MIME type")
    sha256_hash: str = Field(..., description="SHA256 hash for integrity")
    md5_hash: Optional[str] = Field(None, description="MD5 hash for compatibility")
    status: EvidenceStatus = Field(default=EvidenceStatus.COLLECTED, description="Processing status")
    chain_of_custody: List[ChainOfCustodyEntry] = Field(default_factory=list, description="Custody chain")
    created_at: datetime = Field(..., description="Record creation time")
    updated_at: Optional[datetime] = Field(None, description="Last update time")
    
    class Config:
        """Pydantic configuration"""
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        schema_extra = {
            "example": {
                "id": "evidence-123e4567-e89b-12d3-a456-426614174000",
                "case_id": "case-123e4567-e89b-12d3-a456-426614174000",
                "filename": "memory_dump.mem",
                "description": "Memory dump from suspected compromised workstation",
                "evidence_type": "memory_dump",
                "collected_by": "John Doe",
                "collected_at": "2025-09-13T10:30:00Z",
                "file_size": 1073741824,
                "sha256_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                "status": "analyzed"
            }
        }
```

#### Case Schema
**File:** `case.py`

**Purpose:** Defines forensic case structure with investigation metadata and status tracking.

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class CaseStatus(str, Enum):
    """Case status options"""
    OPEN = "open"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CLOSED = "closed"
    ARCHIVED = "archived"

class CasePriority(str, Enum):
    """Case priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CaseType(str, Enum):
    """Types of forensic cases"""
    MALWARE_INVESTIGATION = "malware_investigation"
    DATA_BREACH = "data_breach"
    INSIDER_THREAT = "insider_threat"
    FRAUD_INVESTIGATION = "fraud_investigation"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    CRIMINAL_INVESTIGATION = "criminal_investigation"
    COMPLIANCE_AUDIT = "compliance_audit"
    INCIDENT_RESPONSE = "incident_response"
    OTHER = "other"

class InvestigationTeam(BaseModel):
    """Investigation team member"""
    name: str = Field(..., description="Team member name")
    role: str = Field(..., description="Role in investigation")
    contact: Optional[str] = Field(None, description="Contact information")

class CaseMetadata(BaseModel):
    """Extended case metadata"""
    incident_date: Optional[datetime] = Field(None, description="When incident occurred")
    discovery_date: Optional[datetime] = Field(None, description="When incident was discovered")
    affected_systems: Optional[List[str]] = Field(default_factory=list, description="Systems affected")
    estimated_impact: Optional[str] = Field(None, description="Estimated business impact")
    regulatory_requirements: Optional[List[str]] = Field(default_factory=list, description="Applicable regulations")
    external_parties: Optional[List[str]] = Field(default_factory=list, description="External parties involved")

class CaseBase(BaseModel):
    """Base case model"""
    case_number: str = Field(..., description="Unique case number", max_length=50)
    name: str = Field(..., description="Case name", max_length=200)
    description: Optional[str] = Field(None, description="Case description", max_length=2000)
    case_type: CaseType = Field(..., description="Type of case")
    priority: CasePriority = Field(default=CasePriority.MEDIUM, description="Case priority")
    lead_investigator: str = Field(..., description="Lead investigator", max_length=100)
    
    @validator('case_number')
    def validate_case_number(cls, v):
        """Validate case number format"""
        import re
        if not re.match(r'^[A-Z0-9-_]+$', v):
            raise ValueError('Case number must contain only uppercase letters, numbers, hyphens, and underscores')
        return v

class CaseCreate(CaseBase):
    """Schema for creating new case"""
    team_members: Optional[List[InvestigationTeam]] = Field(default_factory=list, description="Investigation team")
    metadata: Optional[CaseMetadata] = Field(default_factory=CaseMetadata, description="Additional metadata")

class CaseUpdate(BaseModel):
    """Schema for updating case"""
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    lead_investigator: Optional[str] = Field(None, max_length=100)
    team_members: Optional[List[InvestigationTeam]] = None
    metadata: Optional[CaseMetadata] = None

class Case(CaseBase):
    """Complete case model"""
    id: str = Field(..., description="Unique case ID")
    status: CaseStatus = Field(default=CaseStatus.OPEN, description="Case status")
    team_members: List[InvestigationTeam] = Field(default_factory=list, description="Investigation team")
    metadata: CaseMetadata = Field(default_factory=CaseMetadata, description="Extended metadata")
    evidence_count: Optional[int] = Field(0, description="Number of evidence items")
    created_at: datetime = Field(..., description="Case creation time")
    updated_at: Optional[datetime] = Field(None, description="Last update time")
    closed_at: Optional[datetime] = Field(None, description="Case closure time")
    
    class Config:
        """Pydantic configuration"""
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        schema_extra = {
            "example": {
                "id": "case-123e4567-e89b-12d3-a456-426614174000",
                "case_number": "INC-2025-001",
                "name": "Suspected APT Intrusion",
                "description": "Investigation of suspected advanced persistent threat activity",
                "case_type": "data_breach",
                "priority": "high",
                "status": "active",
                "lead_investigator": "Jane Smith",
                "created_at": "2025-09-13T09:00:00Z"
            }
        }
```

#### Event Schema
**File:** `event.py`

**Purpose:** Defines forensic event structure for audit trails and timeline analysis.

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class EventType(str, Enum):
    """Types of forensic events"""
    EVIDENCE_COLLECTED = "evidence_collected"
    ANALYSIS_STARTED = "analysis_started"
    ANALYSIS_COMPLETED = "analysis_completed"
    FINDING_IDENTIFIED = "finding_identified"
    CASE_CREATED = "case_created"
    CASE_UPDATED = "case_updated"
    CASE_CLOSED = "case_closed"
    CUSTODY_TRANSFER = "custody_transfer"
    VERIFICATION_COMPLETED = "verification_completed"
    REPORT_GENERATED = "report_generated"
    EXTERNAL_CONSULTATION = "external_consultation"
    SYSTEM_ACCESS = "system_access"
    OTHER = "other"

class EventSeverity(str, Enum):
    """Event severity levels"""
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class EventActor(BaseModel):
    """Event actor information"""
    name: str = Field(..., description="Actor name")
    role: Optional[str] = Field(None, description="Actor role")
    system: Optional[str] = Field(None, description="System performing action")

class EventContext(BaseModel):
    """Additional event context"""
    location: Optional[str] = Field(None, description="Physical or logical location")
    tool_used: Optional[str] = Field(None, description="Tool used for action")
    duration: Optional[float] = Field(None, description="Action duration in seconds")
    affected_systems: Optional[List[str]] = Field(default_factory=list, description="Systems affected")
    related_events: Optional[List[str]] = Field(default_factory=list, description="Related event IDs")

class EventBase(BaseModel):
    """Base event model"""
    event_type: EventType = Field(..., description="Type of event")
    description: str = Field(..., description="Event description", max_length=1000)
    severity: EventSeverity = Field(default=EventSeverity.INFO, description="Event severity")
    actor: EventActor = Field(..., description="Who or what performed the action")
    
    @validator('description')
    def validate_description(cls, v):
        """Ensure description is not empty"""
        if not v.strip():
            raise ValueError('Description cannot be empty')
        return v.strip()

class EventCreate(EventBase):
    """Schema for creating new event"""
    case_id: str = Field(..., description="Associated case ID")
    evidence_id: Optional[str] = Field(None, description="Related evidence ID")
    context: Optional[EventContext] = Field(default_factory=EventContext, description="Additional context")
    analysis_results: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Analysis results if applicable")

class EventUpdate(BaseModel):
    """Schema for updating event"""
    description: Optional[str] = Field(None, max_length=1000)
    severity: Optional[EventSeverity] = None
    context: Optional[EventContext] = None
    analysis_results: Optional[Dict[str, Any]] = None

class Event(EventBase):
    """Complete event model"""
    id: str = Field(..., description="Unique event ID")
    case_id: str = Field(..., description="Associated case ID")
    evidence_id: Optional[str] = Field(None, description="Related evidence ID")
    context: EventContext = Field(default_factory=EventContext, description="Event context")
    analysis_results: Dict[str, Any] = Field(default_factory=dict, description="Analysis results")
    confidence_score: Optional[float] = Field(None, description="Confidence in event accuracy", ge=0.0, le=1.0)
    timestamp: datetime = Field(..., description="When event occurred")
    recorded_at: Optional[datetime] = Field(None, description="When event was recorded")
    
    class Config:
        """Pydantic configuration"""
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        schema_extra = {
            "example": {
                "id": "event-123e4567-e89b-12d3-a456-426614174000",
                "case_id": "case-123e4567-e89b-12d3-a456-426614174000",
                "event_type": "analysis_completed",
                "description": "Memory analysis completed with suspicious findings",
                "severity": "high",
                "actor": {
                    "name": "MemoryAnalyzer",
                    "role": "AI Agent",
                    "system": "Aegis Forensics"
                },
                "timestamp": "2025-09-13T11:45:00Z"
            }
        }
```

### API Schemas

#### Script Configuration Schema
**File:** `script_config.py`

**Purpose:** Validation schemas for the script generation system, ensuring proper configuration of forensic analysis scripts.

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from enum import Enum

class OperatingSystem(str, Enum):
    """Supported operating systems"""
    LINUX = "linux"
    WINDOWS = "windows"
    MACOS = "macos"

class AnalysisType(str, Enum):
    """Types of analysis scripts can perform"""
    MEMORY = "memory"
    DISK = "disk"
    NETWORK = "network"
    COMPREHENSIVE = "comprehensive"
    LIVE_RESPONSE = "live_response"

class BurstMode(BaseModel):
    """Burst mode configuration for data collection"""
    enabled: bool = Field(default=True, description="Enable burst mode data collection")
    interval_seconds: int = Field(default=60, description="Interval between bursts", ge=10, le=3600)
    burst_count: int = Field(default=5, description="Number of data bursts to collect", ge=1, le=100)
    batch_size_kb: int = Field(default=100, description="Maximum batch size in KB", ge=10, le=10240)
    
    @validator('interval_seconds')
    def validate_interval(cls, v):
        """Ensure reasonable interval"""
        if v < 10:
            raise ValueError('Interval must be at least 10 seconds')
        return v

class ServerConfig(BaseModel):
    """Server configuration for script communication"""
    host: str = Field(..., description="Aegis Forensics server hostname or IP")
    port: int = Field(default=8000, description="Server port", ge=1, le=65535)
    use_https: bool = Field(default=True, description="Use HTTPS for communication")
    api_key: Optional[str] = Field(None, description="API key for authentication")
    timeout: int = Field(default=30, description="Request timeout in seconds", ge=5, le=300)
    custom_headers: Optional[Dict[str, str]] = Field(default_factory=dict, description="Custom HTTP headers")
    
    @property
    def base_url(self) -> str:
        """Construct base URL"""
        protocol = "https" if self.use_https else "http"
        return f"{protocol}://{self.host}:{self.port}"
    
    @validator('host')
    def validate_host(cls, v):
        """Basic hostname validation"""
        import re
        # Simple validation - allows IP addresses and hostnames
        if not re.match(r'^[a-zA-Z0-9.-]+$', v):
            raise ValueError('Invalid hostname format')
        return v

class ScriptConfig(BaseModel):
    """Complete script configuration"""
    os: OperatingSystem = Field(..., description="Target operating system")
    analysis_type: AnalysisType = Field(..., description="Type of analysis to perform")
    server: ServerConfig = Field(..., description="Server connection configuration")
    burst: BurstMode = Field(default_factory=BurstMode, description="Burst mode settings")
    include_system_info: bool = Field(default=True, description="Include system information")
    include_environment: bool = Field(default=True, description="Include environment variables")
    stealth_mode: bool = Field(default=False, description="Enable stealth mode operation")
    custom_commands: Optional[List[str]] = Field(default_factory=list, description="Custom commands to execute")
    output_format: str = Field(default="json", description="Output format", regex="^(json|xml|csv)$")
    
    class Config:
        """Pydantic configuration"""
        schema_extra = {
            "example": {
                "os": "linux",
                "analysis_type": "memory",
                "server": {
                    "host": "forensics.company.com",
                    "port": 8000,
                    "use_https": True,
                    "api_key": "your-secret-api-key"
                },
                "burst": {
                    "enabled": True,
                    "interval_seconds": 60,
                    "burst_count": 5,
                    "batch_size_kb": 100
                },
                "include_system_info": True,
                "stealth_mode": False
            }
        }

class ScriptGenerationRequest(BaseModel):
    """Request schema for script generation"""
    config: ScriptConfig = Field(..., description="Script configuration")
    filename: Optional[str] = Field(None, description="Custom filename for generated script")
    deployment_notes: Optional[str] = Field(None, description="Custom deployment notes")

class ScriptMetadata(BaseModel):
    """Generated script metadata"""
    platform: OperatingSystem = Field(..., description="Target platform")
    analysis_type: AnalysisType = Field(..., description="Analysis type")
    server_endpoint: str = Field(..., description="Target server endpoint")
    generation_time: str = Field(..., description="When script was generated")
    script_version: str = Field(default="1.0.0", description="Script version")
    estimated_runtime: Optional[str] = Field(None, description="Estimated execution time")

class DeploymentInstructions(BaseModel):
    """Script deployment instructions"""
    transfer_method: str = Field(..., description="How to transfer script to target")
    execution_command: str = Field(..., description="Command to run the script")
    prerequisites: List[str] = Field(default_factory=list, description="Required software/permissions")
    security_notes: List[str] = Field(default_factory=list, description="Security considerations")
    cleanup_instructions: Optional[str] = Field(None, description="How to clean up after execution")

class ScriptGenerationResponse(BaseModel):
    """Response schema for script generation"""
    script_id: str = Field(..., description="Unique script identifier")
    filename: str = Field(..., description="Generated script filename")
    script_content: str = Field(..., description="Complete script content")
    config_summary: ScriptMetadata = Field(..., description="Script metadata")
    deployment_instructions: DeploymentInstructions = Field(..., description="How to deploy the script")
    
    class Config:
        """Pydantic configuration"""
        schema_extra = {
            "example": {
                "script_id": "script-123e4567-e89b-12d3-a456-426614174000",
                "filename": "aegis_linux_memory_analysis.py",
                "script_content": "#!/usr/bin/env python3\n# Generated Aegis Forensics Script...",
                "config_summary": {
                    "platform": "linux",
                    "analysis_type": "memory",
                    "server_endpoint": "https://forensics.company.com:8000"
                },
                "deployment_instructions": {
                    "transfer_method": "Secure copy or removable media",
                    "execution_command": "python3 aegis_linux_memory_analysis.py",
                    "prerequisites": ["Python 3.6+", "Network connectivity"]
                }
            }
        }
```

### Analysis Result Schemas

#### Analysis Response Schema
```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class AnalysisVerdict(str, Enum):
    """Analysis verdict options"""
    BENIGN = "BENIGN"
    SUSPICIOUS = "SUSPICIOUS" 
    MALICIOUS = "MALICIOUS"
    UNKNOWN = "UNKNOWN"
    ERROR = "ERROR"

class SeverityLevel(str, Enum):
    """Severity level options"""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class ConfidenceLevel(str, Enum):
    """Confidence level options"""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class Finding(BaseModel):
    """Individual analysis finding"""
    category: str = Field(..., description="Finding category")
    description: str = Field(..., description="Detailed finding description")
    severity: SeverityLevel = Field(..., description="Finding severity")
    evidence: Optional[str] = Field(None, description="Supporting evidence")
    iocs: Optional[List[str]] = Field(default_factory=list, description="Indicators of Compromise")
    references: Optional[List[str]] = Field(default_factory=list, description="External references")

class TechnicalDetails(BaseModel):
    """Technical analysis details"""
    analysis_duration: Optional[float] = Field(None, description="Analysis time in seconds")
    tools_used: Optional[List[str]] = Field(default_factory=list, description="Analysis tools used")
    data_processed: Optional[str] = Field(None, description="Amount of data processed")
    error_details: Optional[str] = Field(None, description="Error details if analysis failed")

class AnalysisResult(BaseModel):
    """Complete analysis result"""
    verdict: AnalysisVerdict = Field(..., description="Overall analysis verdict")
    severity: SeverityLevel = Field(..., description="Threat severity level")
    criticality: SeverityLevel = Field(..., description="Business criticality")
    confidence: ConfidenceLevel = Field(..., description="Analysis confidence")
    summary: str = Field(..., description="Executive summary of findings")
    findings: List[Finding] = Field(default_factory=list, description="Detailed findings")
    technical_details: TechnicalDetails = Field(default_factory=TechnicalDetails, description="Technical details")
    recommendations: List[str] = Field(default_factory=list, description="Recommended actions")
    
    class Config:
        """Pydantic configuration"""
        schema_extra = {
            "example": {
                "verdict": "MALICIOUS",
                "severity": "High",
                "criticality": "High", 
                "confidence": "High",
                "summary": "Memory analysis revealed active malware injection",
                "findings": [
                    {
                        "category": "Process Injection",
                        "description": "Suspicious code injection detected in explorer.exe",
                        "severity": "High",
                        "evidence": "Process PID 1234 has anomalous memory regions"
                    }
                ],
                "recommendations": [
                    "Immediately isolate affected system",
                    "Perform full malware scan",
                    "Check for lateral movement"
                ]
            }
        }

class AnalysisResponse(BaseModel):
    """API response wrapper for analysis results"""
    status: str = Field(..., description="Response status")
    message: Optional[str] = Field(None, description="Status message")
    analysis: Optional[AnalysisResult] = Field(None, description="Analysis results")
    analysis_id: Optional[str] = Field(None, description="Unique analysis identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    class Config:
        """Pydantic configuration"""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
```

## 🔧 Schema Utilities

### Validation Helpers
```python
from pydantic import validator
import re

class ValidationHelpers:
    """Common validation functions"""
    
    @staticmethod
    def validate_hash(v: str, algorithm: str = "sha256") -> str:
        """Validate cryptographic hash format"""
        if algorithm == "sha256":
            if not re.match(r'^[a-fA-F0-9]{64}$', v):
                raise ValueError('Invalid SHA256 hash format')
        elif algorithm == "md5":
            if not re.match(r'^[a-fA-F0-9]{32}$', v):
                raise ValueError('Invalid MD5 hash format')
        return v.lower()
    
    @staticmethod
    def validate_filename(v: str) -> str:
        """Validate filename safety"""
        if not v or not v.strip():
            raise ValueError('Filename cannot be empty')
        
        # Check for path traversal
        if '..' in v or '/' in v or '\\' in v:
            raise ValueError('Filename cannot contain path separators')
        
        # Check for dangerous characters
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*']
        if any(char in v for char in dangerous_chars):
            raise ValueError('Filename contains invalid characters')
        
        return v.strip()
    
    @staticmethod
    def validate_ip_address(v: str) -> str:
        """Validate IP address format"""
        import ipaddress
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            raise ValueError('Invalid IP address format')
```

### Schema Mixins
```python
class TimestampMixin(BaseModel):
    """Mixin for timestamp fields"""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class HashMixin(BaseModel):
    """Mixin for hash fields"""
    sha256_hash: str = Field(..., description="SHA256 hash")
    md5_hash: Optional[str] = Field(None, description="MD5 hash")
    
    @validator('sha256_hash')
    def validate_sha256(cls, v):
        return ValidationHelpers.validate_hash(v, "sha256")
    
    @validator('md5_hash')
    def validate_md5(cls, v):
        if v is not None:
            return ValidationHelpers.validate_hash(v, "md5")
        return v

class MetadataMixin(BaseModel):
    """Mixin for metadata fields"""
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
```

## 🔄 Schema Conversion

### Database Integration
```python
from sqlalchemy.orm import Session
from database.models import Evidence as EvidenceDB
from schemas.evidence import Evidence as EvidenceSchema

def db_to_schema(db_evidence: EvidenceDB) -> EvidenceSchema:
    """Convert database model to Pydantic schema"""
    return EvidenceSchema.from_orm(db_evidence)

def schema_to_db(evidence_schema: EvidenceSchema, db: Session) -> EvidenceDB:
    """Convert Pydantic schema to database model"""
    evidence_data = evidence_schema.dict(exclude={'id', 'created_at'})
    return EvidenceDB(**evidence_data)
```

### JSON Serialization
```python
def serialize_for_api(obj: BaseModel) -> dict:
    """Serialize Pydantic model for API response"""
    return obj.dict(
        exclude_none=True,
        by_alias=True,
        exclude_unset=True
    )

def serialize_for_storage(obj: BaseModel) -> dict:
    """Serialize Pydantic model for database storage"""
    return obj.dict(
        exclude={'id', 'created_at', 'updated_at'},
        exclude_none=False
    )
```

## 🧪 Schema Testing

### Validation Testing
```python
import pytest
from pydantic import ValidationError
from schemas.evidence import EvidenceCreate

def test_evidence_validation():
    """Test evidence schema validation"""
    
    # Valid evidence
    valid_evidence = {
        "case_id": "case-123",
        "filename": "test.mem",
        "evidence_type": "memory_dump",
        "collected_by": "John Doe",
        "collected_at": "2025-09-13T10:30:00Z",
        "original_path": "/evidence/test.mem"
    }
    
    evidence = EvidenceCreate(**valid_evidence)
    assert evidence.filename == "test.mem"
    
    # Invalid filename with path separator
    invalid_evidence = valid_evidence.copy()
    invalid_evidence["filename"] = "../malicious.exe"
    
    with pytest.raises(ValidationError):
        EvidenceCreate(**invalid_evidence)

def test_schema_serialization():
    """Test schema JSON serialization"""
    evidence = EvidenceCreate(**valid_evidence)
    
    # Test JSON serialization
    json_data = evidence.json()
    assert "filename" in json_data
    
    # Test dictionary conversion
    dict_data = evidence.dict()
    assert dict_data["evidence_type"] == "memory_dump"
```

### API Integration Testing
```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_schema_integration():
    """Test schema integration with API endpoints"""
    
    # Test valid request
    response = client.post("/api/evidence", json={
        "case_id": "case-123",
        "filename": "test.mem",
        "evidence_type": "memory_dump",
        "collected_by": "John Doe",
        "collected_at": "2025-09-13T10:30:00Z",
        "original_path": "/evidence/test.mem"
    })
    
    assert response.status_code == 201
    
    # Test invalid request
    response = client.post("/api/evidence", json={
        "filename": "../invalid.exe"  # Invalid filename
    })
    
    assert response.status_code == 422  # Validation error
```

## 📊 Documentation Generation

### OpenAPI Schema
```python
def customize_openapi_schema(app):
    """Customize OpenAPI schema generation"""
    from fastapi.openapi.utils import get_openapi
    
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Aegis Forensics API",
        version="1.0.0",
        description="AI-Powered Digital Forensics Platform",
        routes=app.routes,
    )
    
    # Add custom schema information
    openapi_schema["info"]["x-logo"] = {
        "url": "/static/logo.png"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema
```

### Schema Examples
```python
def generate_schema_examples():
    """Generate comprehensive schema examples"""
    from schemas.evidence import Evidence
    from schemas.case import Case
    
    examples = {
        "evidence": Evidence.schema_json(indent=2),
        "case": Case.schema_json(indent=2)
    }
    
    return examples
```

## 🔒 Security Considerations

### Input Sanitization
```python
from pydantic import validator
import html

class SecureSchema(BaseModel):
    """Base schema with security validators"""
    
    @validator('*', pre=True)
    def sanitize_strings(cls, v):
        """Sanitize string inputs"""
        if isinstance(v, str):
            # HTML escape
            v = html.escape(v)
            # Remove null bytes
            v = v.replace('\x00', '')
            # Limit length
            if len(v) > 10000:
                raise ValueError('Input too long')
        return v
```

### Sensitive Data Handling
```python
from pydantic import Field, SecretStr

class SecureConfig(BaseModel):
    """Configuration with sensitive data protection"""
    api_key: SecretStr = Field(..., description="API key (will be hidden)")
    database_url: SecretStr = Field(..., description="Database URL (will be hidden)")
    
    class Config:
        json_encoders = {
            SecretStr: lambda v: v.get_secret_value() if v else None
        }
```

## 📈 Performance Optimization

### Lazy Loading
```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from schemas.case import Case

class Evidence(BaseModel):
    """Evidence with lazy loaded relationships"""
    case: Optional["Case"] = None
    
    @validator('case', pre=True, always=True)
    def load_case_if_needed(cls, v, values):
        """Lazy load case data when needed"""
        if v is None and 'case_id' in values:
            # Load case data on demand
            pass
        return v
```

### Caching
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_schema_validator(schema_class):
    """Cache schema validators for performance"""
    return schema_class.__validators__
```

---

## 📚 Additional Resources

- **[Pydantic Documentation](https://pydantic-docs.helpmanual.io/)**: Official Pydantic docs
- **[FastAPI Schemas](https://fastapi.tiangolo.com/tutorial/response-model/)**: FastAPI schema integration
- **[JSON Schema](https://json-schema.org/)**: JSON Schema specification
- **[Database Models](../database/README.md)**: Database integration patterns
- **[API Documentation](../README.md#api-reference)**: Complete API reference
