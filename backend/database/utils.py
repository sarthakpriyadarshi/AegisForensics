# database/utils.py
from datetime import datetime
from .models import compute_sha256, SessionLocal, Evidence, Event, Case

def next_evidence_hash(prev_hash: str, filename: str, file_hash: str) -> str:
    ts = datetime.utcnow().isoformat()
    data = f"{prev_hash}|{filename}|{file_hash}|{ts}"
    return compute_sha256(data)

def next_event_hash(prev_hash: str, description: str) -> str:
    ts = datetime.utcnow().isoformat()
    data = f"{prev_hash}|{description}|{ts}"
    return compute_sha256(data)

def add_evidence_record(case_identifier: str, filename: str, file_path: str, file_hash: str, evidence_metadata: str = None):
    db = SessionLocal()
    try:
        # Try to find case by ID first (if it's a number), then by name
        case = None
        if case_identifier.isdigit():
            case = db.query(Case).filter_by(id=int(case_identifier)).first()
        
        if not case:
            case = db.query(Case).filter_by(name=case_identifier).first()
        
        if not case:
            # Generate a unique case number for new cases
            import uuid
            case_number = f"CASE-{datetime.utcnow().year}-{str(uuid.uuid4())[:8].upper()}"
            case = Case(
                case_number=case_number,
                name=case_identifier,
                description=f"Auto-created case for {case_identifier}",
                investigator="System",
                status="OPEN",
                priority="MEDIUM"
            )
            db.add(case)
            db.commit()
            db.refresh(case)
            
        last = db.query(Evidence).order_by(Evidence.id.desc()).first()
        prev_hash = last.current_hash if last else ""
        curr_hash = next_evidence_hash(prev_hash, filename, file_hash)
        evidence = Evidence(case_id=case.id, filename=filename, file_path=file_path,
                            file_hash=file_hash, prev_hash=prev_hash, current_hash=curr_hash, evidence_metadata=evidence_metadata)
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
        return evidence
    finally:
        db.close()

def add_event(case_identifier: str, description: str, extra: str = None):
    db = SessionLocal()
    try:
        # Try to find case by ID first (if it's a number), then by name
        case = None
        if case_identifier.isdigit():
            case = db.query(Case).filter_by(id=int(case_identifier)).first()
        
        if not case:
            case = db.query(Case).filter_by(name=case_identifier).first()
        
        if not case:
            # Generate a unique case number for new cases
            import uuid
            case_number = f"CASE-{datetime.utcnow().year}-{str(uuid.uuid4())[:8].upper()}"
            case = Case(
                case_number=case_number,
                name=case_identifier,
                description=f"Auto-created case for {case_identifier}",
                investigator="System",
                status="OPEN",
                priority="MEDIUM"
            )
            db.add(case)
            db.commit()
            db.refresh(case)
            
        last = db.query(Event).order_by(Event.id.desc()).first()
        prev_hash = last.current_hash if last else ""
        curr_hash = next_event_hash(prev_hash, description)
        event = Event(case_id=case.id, description=description, prev_hash=prev_hash, current_hash=curr_hash, extra=extra)
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    finally:
        db.close()
