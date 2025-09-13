# main.py
import os
import hashlib
import uuid
import logging
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse, PlainTextResponse, Response
import asyncio
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Ensure Google API key is set
if not os.getenv('GOOGLE_API_KEY'):
    raise ValueError("GOOGLE_API_KEY environment variable is required")

from database.models import init_db, SessionLocal, compute_sha256
from database.utils import add_evidence_record, add_event
from schemas.evidence import EvidenceCreate
from schemas.script_config import ScriptGenerationRequest, ScriptGenerationResponse, OperatingSystem, AnalysisType
from services.script_generator import ScriptGenerator
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

from agents.forensic_orchestrator import ForensicOrchestrator
from agents.memory_analyzer import memory_agent

# Setup comprehensive logging
def setup_logging():
    """Setup logging configuration with both file and console output"""
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Create log file path
    log_file = log_dir / "aegis_forensics.log"
    
    # Configure logging format
    log_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # File handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(log_format)
    root_logger.addHandler(file_handler)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(log_format)
    root_logger.addHandler(console_handler)
    
    # Create aegis_forensics logger
    logger = logging.getLogger("aegis_forensics")
    logger.info(f"Logging initialized - Log file: {log_file.absolute()}")
    
    return logger

# Initialize logging
logger = setup_logging()

# Init DB
init_db()

app = FastAPI(title="Aegis Forensics API")

# Initialize script generator
script_generator = ScriptGenerator()

# ADK session/runner global objects
session_service = InMemorySessionService()
AGENT_APP = "aegis_forensics_app"
AGENT_USER = "aegis_sys"
AGENT_SESSION_ID = "session_main"
runner = None
agent_session = None

@app.on_event("startup")
async def startup():
    global runner, agent_session
    logger.info("Starting Aegis Forensics server...")
    # create a session for ADK orchestrator
    agent_session = await session_service.create_session(app_name=AGENT_APP, user_id=AGENT_USER, session_id=AGENT_SESSION_ID, state={})
    runner = Runner(agent=ForensicOrchestrator, app_name=AGENT_APP, session_service=session_service)
    logger.info("ADK runner initialized.")

# helper to run orchestrator with a prompt and return final response text
async def run_orchestrator_prompt(prompt: str):
    content = types.Content(role="user", parts=[types.Part(text=prompt)])
    events = runner.run_async(user_id=AGENT_USER, session_id=agent_session.id, new_message=content)
    result_text = ""
    async for ev in events:
        try:
            if ev.is_final_response() and ev.content and ev.content.parts:
                result_text = ev.content.parts[0].text
                break
        except Exception:
            continue
    return result_text

def parse_agent_response(response_text: str):
    """
    Try to parse JSON from agent response. First try to extract from markdown code blocks,
    then try to parse as raw JSON, otherwise return a structured format with the text as a report.
    """
    # Clean the response text
    response_text = response_text.strip()
    
    # First, try to extract JSON from markdown code blocks
    markdown_json_patterns = [
        r'```json\s*\n(.*?)\n```',  # ```json ... ```
        r'```\s*\n(\{.*?\})\s*\n```',  # ``` { ... } ```
        r'`(\{.*?\})`',  # `{ ... }`
    ]
    
    for pattern in markdown_json_patterns:
        matches = re.findall(pattern, response_text, re.DOTALL)
        for match in matches:
            try:
                parsed = json.loads(match.strip())
                if isinstance(parsed, dict) and 'verdict' in parsed:
                    print(f"[DEBUG] Successfully parsed JSON from markdown: {parsed.get('verdict', 'unknown')}")
                    return parsed
            except json.JSONDecodeError:
                continue
    
    # Try to parse the entire response as JSON (for raw JSON responses)
    try:
        parsed = json.loads(response_text)
        if isinstance(parsed, dict):
            print(f"[DEBUG] Successfully parsed raw JSON: {parsed.get('verdict', 'unknown')}")
            return parsed
    except json.JSONDecodeError:
        pass
    
    # Try to find JSON objects in the response using regex patterns
    json_patterns = [
        r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}',  # Nested JSON objects
        r'\{.*?\}',  # Simple JSON object (non-greedy)
    ]
    
    for pattern in json_patterns:
        json_matches = re.findall(pattern, response_text, re.DOTALL)
        
        for match in json_matches:
            try:
                parsed = json.loads(match)
                # Validate that it has the expected structure
                if isinstance(parsed, dict) and 'verdict' in parsed:
                    print(f"[DEBUG] Successfully parsed JSON from regex: {parsed.get('verdict', 'unknown')}")
                    return parsed
            except json.JSONDecodeError:
                continue
    
    print(f"[DEBUG] No valid JSON found, creating structured response from text")
    
    # If no valid JSON found, extract information from text more intelligently
    verdict = "UNKNOWN"
    severity = "Medium"
    criticality = "Medium"
    confidence = "Medium"
    
    # Extract verdict from text with more precise patterns
    verdict_patterns = [
        r'verdict\s+is\s+(MALICIOUS|SUSPICIOUS|BENIGN)',  # "verdict is SUSPICIOUS"
        r'verdict[:\-\s]+(MALICIOUS|SUSPICIOUS|BENIGN)',  # "verdict: SUSPICIOUS"
        r'The\s+verdict\s+is\s+(MALICIOUS|SUSPICIOUS|BENIGN)',  # "The verdict is SUSPICIOUS"
    ]
    
    for pattern in verdict_patterns:
        matches = re.findall(pattern, response_text, re.IGNORECASE)
        if matches:
            verdict = matches[0].upper()
            break
    else:
        # Fallback to simple word matching if no explicit verdict statement found
        if "MALICIOUS" in response_text.upper():
            verdict = "MALICIOUS"
        elif "SUSPICIOUS" in response_text.upper():
            verdict = "SUSPICIOUS"
        elif "BENIGN" in response_text.upper():
            verdict = "BENIGN"
    
    # Extract severity and criticality from parenthetical statements like "(Medium severity, Medium criticality)"
    combined_pattern = r'\(\s*(Critical|High|Medium|Low)\s+severity\s*,\s*(Critical|High|Medium|Low)\s+criticality\s*\)'
    combined_matches = re.findall(combined_pattern, response_text, re.IGNORECASE)
    
    if combined_matches:
        severity = combined_matches[0][0].title()
        criticality = combined_matches[0][1].title()
    else:
        # Fallback to individual patterns if combined pattern doesn't match
        severity_patterns = [
            r'\(\s*(Critical|High|Medium|Low)\s+severity',  # (Medium severity, ...)
            r'severity\s*[:\-\s]*\s*(Critical|High|Medium|Low)',  # severity: Medium
            r'["\*\s]Severity["\*\s]*:?\s*(Critical|High|Medium|Low)',  # **Severity:** Medium
        ]
        
        for pattern in severity_patterns:
            matches = re.findall(pattern, response_text, re.IGNORECASE)
            if matches:
                severity = matches[0].title()
                break
        
        # Extract criticality - look for explicit criticality statements with better patterns  
        criticality_patterns = [
            r'severity\s*,\s*(Critical|High|Medium|Low)\s+criticality',  # severity, Medium criticality)
            r'criticality\s*[:\-\s]*\s*(Critical|High|Medium|Low)',  # criticality: Medium
            r'["\*\s]Criticality["\*\s]*:?\s*(Critical|High|Medium|Low)',  # **Criticality:** Medium
        ]
        
        for pattern in criticality_patterns:
            matches = re.findall(pattern, response_text, re.IGNORECASE)
            if matches:
                criticality = matches[0].title()
                break
    
    # Extract confidence if mentioned
    confidence_patterns = [
        r'["\*\s]Confidence["\*\s]*:?\s*(High|Medium|Low)',
        r'confidence["\*\s]*:?\s*(High|Medium|Low)',
    ]
    
    for pattern in confidence_patterns:
        matches = re.findall(pattern, response_text, re.IGNORECASE)
        if matches:
            confidence = matches[0].title()  # Capitalize first letter
            break
    
    # If no explicit severity/criticality found, infer from verdict and content
    if severity == "Medium" and criticality == "Medium":
        # Count severity indicators in the text
        critical_keywords = ["critical", "immediate", "urgent", "severe", "major"]
        high_keywords = ["high", "significant", "important", "notable"]
        low_keywords = ["low", "minor", "minimal", "slight"]
        
        text_lower = response_text.lower()
        
        critical_count = sum(1 for keyword in critical_keywords if keyword in text_lower)
        high_count = sum(1 for keyword in high_keywords if keyword in text_lower)
        low_count = sum(1 for keyword in low_keywords if keyword in text_lower)
        
        # Determine severity based on keyword frequency and verdict
        if critical_count > 0 or verdict == "MALICIOUS":
            severity = "High"  # Don't auto-assign Critical unless explicitly stated
            criticality = "High"
        elif high_count > low_count:
            severity = "Medium"
            criticality = "Medium"
        elif low_count > 0:
            severity = "Low"
            criticality = "Low"
    
    # Return structured fallback format with properly extracted values
    return {
        "verdict": verdict,
        "severity": severity,
        "criticality": criticality,
        "confidence": confidence,
        "summary": response_text[:200] + "..." if len(response_text) > 200 else response_text,
        "findings": [
            {
                "category": "General Analysis",
                "description": response_text[:500] + "..." if len(response_text) > 500 else response_text,
                "severity": severity,
                "evidence": "Analysis output"
            }
        ],
        "technical_details": {
            "raw_response": response_text
        },
        "recommendations": ["Review detailed analysis", "Consider additional investigation if needed"]
    }

@app.post("/analyze/uploadfile/")
async def analyze_uploadfile(file: UploadFile = File(...)):
    """
    Upload static file (binary, pcap, image) for analysis.
    Workflow:
      - Save to /tmp
      - compute SHA256 and record evidence via custodian
      - set appropriate session.state key (binary_path/pcap_path/disk_image_path)
      - call orchestrator with an instruction to analyze it
    """
    contents = await file.read()
    filename = file.filename or f"upload_{uuid.uuid4().hex}"
    safe_name = filename.replace(" ", "_")
    tmp_path = f"/tmp/{uuid.uuid4().hex}_{safe_name}"
    with open(tmp_path, "wb") as f:
        f.write(contents)
    file_hash = hashlib.sha256(contents).hexdigest()

    # Basic content-type guessing by extension
    ext = os.path.splitext(filename)[1].lower()
    # store in DB via utils
    evidence_rec = add_evidence_record("default", filename, tmp_path, file_hash, evidence_metadata=f"uploaded_at:{datetime.utcnow().isoformat()}")

    # Set appropriate state keys for the orchestrator
    state = agent_session.state
    print(f"[DEBUG MAIN] Setting state. Type: {type(state)}")
    
    # JSON format instructions - to be added to all prompts
    json_instruction = """

CRITICAL: Your response must be ONLY raw JSON without any markdown formatting, code blocks, or additional text. Do not use ```json``` blocks or any other formatting. Return only the pure JSON object starting with { and ending with }.

Required JSON structure:
{
    "verdict": "MALICIOUS|SUSPICIOUS|BENIGN",
    "severity": "Critical|High|Medium|Low", 
    "criticality": "Critical|High|Medium|Low",
    "confidence": "High|Medium|Low",
    "summary": "Brief summary of findings",
    "findings": [
        {
            "category": "Category name",
            "description": "Detailed description",
            "severity": "Critical|High|Medium|Low",
            "evidence": "Supporting evidence"
        }
    ],
    "technical_details": {
        "raw_response": "Full technical details"
    },
    "recommendations": ["recommendation1", "recommendation2"]
}"""
    
    if ext in [".pcap", ".pcapng"]:
        state["pcap_path"] = tmp_path
        
        # Get raw network analysis data first
        try:
            from tools.network_tools import analyze_network_direct
            print(f"[DEBUG] Executing network analysis directly on {tmp_path}")
            network_data = analyze_network_direct(tmp_path)
            print(f"[DEBUG] Network analysis status: {network_data.get('status', 'unknown')}")
            
            if network_data.get("status") == "success":
                # Now let the agent analyze the raw data and make forensic decisions
                raw_data = network_data.get("raw_data", {})
                analysis_notes = network_data.get("analysis_notes", {})
                
                # Create a detailed prompt for the NetworkAnalyzer agent with the raw data
                analysis_prompt = f"""NetworkAnalyzer: Analyze this PCAP network traffic data and provide forensic assessment in the standard JSON format:

NETWORK DATA EXTRACTED:
- Total packets: {raw_data.get('total_packets', '0')}
- Unique IP addresses: {len(raw_data.get('unique_ips', []))} ({raw_data.get('unique_ips', [])[:5]})
- DNS queries found: {len(raw_data.get('dns_queries', []))}
- Suspicious domains detected: {analysis_notes.get('suspicious_domains', [])}
- Protocols detected: {raw_data.get('protocols_detected', [])}
- HTTP hosts: {raw_data.get('http_hosts', [])}

ANALYSIS INDICATORS:
- Suspicious DNS count: {analysis_notes.get('suspicious_dns_count', 0)}
- High IP count (>50): {analysis_notes.get('high_ip_count', False)}
- Unusual protocols detected: {analysis_notes.get('unusual_protocols', False)}

RAW TSHARK OUTPUT:
{raw_data.get('tshark_stats', '')[:500]}...

Based on this technical data, provide your forensic assessment following the exact JSON format specified in your instructions.{json_instruction}"""
                
                # Let NetworkAnalyzer agent make the forensic decisions
                result_text = await run_orchestrator_prompt(analysis_prompt)
                parsed_response = parse_agent_response(result_text)
                
                # Ensure technical_details includes the raw data for completeness
                if isinstance(parsed_response, dict) and "technical_details" in parsed_response:
                    parsed_response["technical_details"].update({
                        "total_packets": raw_data.get('total_packets', '0'),
                        "unique_ips": str(len(raw_data.get('unique_ips', []))),
                        "protocols_detected": raw_data.get('protocols_detected', [])[:10],
                        "top_talkers": raw_data.get('unique_ips', [])[:10],
                        "suspicious_domains": analysis_notes.get('suspicious_domains', []),
                        "dns_queries_count": str(len(raw_data.get('dns_queries', []))),
                        "http_hosts_count": str(len(raw_data.get('http_hosts', [])))
                    })
                
                return JSONResponse(content={
                    "status": "success", 
                    "analysis": parsed_response,
                    "evidence_id": evidence_rec.id,
                    "file_info": {
                        "filename": filename,
                        "file_hash": file_hash,
                        "file_type": ext,
                        "file_path": tmp_path
                    }
                })
            else:
                # Tool failed, fallback to orchestrator
                print(f"[DEBUG] Network tool failed: {network_data.get('error_message', 'Unknown error')}")
                analysis_prompt = f"NetworkAnalyzer: Analyze the uploaded PCAP file at {tmp_path} and provide network forensics analysis in the standard JSON format.{json_instruction}"
                
        except Exception as e:
            print(f"[DEBUG] Direct network analysis failed: {e}")
            # Fallback to orchestrator approach
            analysis_prompt = f"NetworkAnalyzer: Analyze the uploaded PCAP file at {tmp_path} and provide network forensics analysis in the standard JSON format.{json_instruction}"
    elif ext in [".lime", ".raw", ".mem"]:
        state["memory_path"] = tmp_path
        analysis_prompt = f"Analyze the uploaded memory image at {tmp_path} and produce a summary.{json_instruction}"
    elif ext in [".img", ".dd", ".ewf", ".aff"]:
        state["disk_image_path"] = tmp_path
        analysis_prompt = f"Analyze the uploaded disk image at {tmp_path} for interesting artifacts and create timeline.{json_instruction}"
    elif ext in [".log", ".txt", ".csv", ".evtx", ".evt"]:
        # Log files and user activity files should go to user profiler
        state["user_profile_path"] = tmp_path
        analysis_prompt = f"Analyze the uploaded log file at {tmp_path} for user behavior patterns, login activities, and suspicious user actions.{json_instruction}"
    elif ext in [".exe", ".dll", ".bin", ".so", ".msi", ".deb", ".rpm"]:
        # Explicitly binary/executable files
        state["binary_path"] = tmp_path
        print(f"[DEBUG MAIN] Set binary_path to: {tmp_path}")
        analysis_prompt = f"Please analyze the binary file located at '{tmp_path}'. Extract strings, check for signatures, and provide a summary of findings.{json_instruction}"
    else:
        # For unknown file types, try to determine based on content or treat as general analysis
        state["binary_path"] = tmp_path
        print(f"[DEBUG MAIN] Set binary_path to: {tmp_path} (unknown file type: {ext})")
        analysis_prompt = f"Please analyze the file located at '{tmp_path}'. Determine the file type and provide appropriate analysis.{json_instruction}"
    # Also set latest_evidence_path for custodian tool to pick up
    state["latest_evidence_path"] = tmp_path
    state["case_name"] = "default"
    
    print(f"[DEBUG MAIN] Final state contents: {dict(state) if hasattr(state, 'items') else 'Cannot convert to dict'}")
    print(f"[DEBUG MAIN] State keys: {list(state.keys()) if hasattr(state, 'keys') else 'No keys method'}")

    # Log event
    add_event("default", f"File uploaded: {filename}")

    # Run orchestrator
    result_text = await run_orchestrator_prompt(analysis_prompt)
    
    # Parse the agent response to extract JSON format
    parsed_response = parse_agent_response(result_text)
    
    return JSONResponse(content={
        "status": "success", 
        "analysis": parsed_response,
        "evidence_id": evidence_rec.id,
        "file_info": {
            "filename": filename,
            "file_hash": file_hash,
            "file_type": ext,
            "file_path": tmp_path
        }
    })

@app.post("/analyze/streamdata/")
async def analyze_streamdata(request: Request):
    """
    Receive a binary stream from a client (e.g., a live memory dump streamed over HTTP).
    Stores the full stream to a temp file and sets the appropriate state for analysis.
    """
    tmp_path = f"/tmp/stream_{uuid.uuid4().hex}.bin"
    with open(tmp_path, "wb") as f:
        async for chunk in request.stream():
            f.write(chunk)
    
    # JSON format instructions
    json_instruction = """

CRITICAL: Your response must be ONLY raw JSON without any markdown formatting, code blocks, or additional text. Do not use ```json``` blocks or any other formatting. Return only the pure JSON object starting with { and ending with }.

Required JSON structure:
{
    "verdict": "MALICIOUS|SUSPICIOUS|BENIGN",
    "severity": "Critical|High|Medium|Low", 
    "criticality": "Critical|High|Medium|Low",
    "confidence": "High|Medium|Low",
    "summary": "Brief summary of findings",
    "findings": [
        {
            "category": "Category name",
            "description": "Detailed description",
            "severity": "Critical|High|Medium|Low",
            "evidence": "Supporting evidence"
        }
    ],
    "technical_details": {
        "raw_response": "Full technical details"
    },
    "recommendations": ["recommendation1", "recommendation2"]
}"""
    
    # Try to detect if this is a pcap by magic bytes - naive check
    with open(tmp_path, "rb") as fh:
        head = fh.read(8)
    if head.startswith(b"\xd4\xc3\xb2\xa1") or head.startswith(b"\xa1\xb2\xc3\xd4"):  # PCAP magic numbers
        agent_session.state["pcap_path"] = tmp_path
        analysis_prompt = f"A streamed PCAP has been saved to {tmp_path}. Analyze it for suspicious flows.{json_instruction}"
    else:
        # assume memory dump if large and not pcap
        agent_session.state["memory_path"] = tmp_path
        analysis_prompt = f"A streamed memory image has been saved to {tmp_path}. Analyze memory for processes and command lines.{json_instruction}"
    add_evidence_record("default", os.path.basename(tmp_path), tmp_path, hashlib.sha256(open(tmp_path,'rb').read()).hexdigest())
    add_event("default", f"Stream received and saved to {tmp_path}")
    result_text = await run_orchestrator_prompt(analysis_prompt)
    
    # Parse the agent response to extract JSON format
    parsed_response = parse_agent_response(result_text)
    
    return JSONResponse({"status": "success", "analysis": parsed_response})

@app.post("/generate_script/")
async def generate_script(payload: dict):
    """
    Generate a small shell script for remote collection.
    Expects JSON:
      { "analysis_type": "live_memory", "server_ip": "x.x.x.x", "server_port": 9999 }
    """
    analysis_type = payload.get("analysis_type", "live_memory")
    server_ip = payload.get("server_ip", "127.0.0.1")
    server_port = int(payload.get("server_port", 9999))
    # set session state so LiveResponseAgent can make script
    agent_session.state["analysis_type"] = analysis_type
    agent_session.state["server_ip"] = server_ip
    agent_session.state["server_port"] = server_port

    # Prompt orchestrator to generate a script via LiveResponseAgent
    prompt = f"Generate a client-side script for '{analysis_type}' that streams data to {server_ip}:{server_port}."
    result_text = await run_orchestrator_prompt(prompt)
    # Many ADK runners return structured outputs; try to detect script in state or in response
    # For simplicity, return the plain text result
    add_event("default", f"Generated script for {analysis_type} to {server_ip}:{server_port}")
    return {"status": "success", "agent_response": result_text}

# Additional API endpoints for frontend integration

@app.get("/api/cases")
async def get_cases():
    """Get all forensic cases"""
    with SessionLocal() as db:
        from database.models import Case
        cases = db.query(Case).all()
        return {
            "status": "success",
            "cases": [
                {
                    "id": case.id,
                    "name": case.name,
                    "description": case.description,
                    "created_at": case.created_at.isoformat(),
                    "evidence_count": len(case.evidences),
                    "event_count": len(case.events)
                }
                for case in cases
            ]
        }

@app.post("/api/cases")
async def create_case(case_data: dict):
    """Create a new forensic case"""
    with SessionLocal() as db:
        from database.models import Case
        new_case = Case(
            name=case_data.get("name", f"case_{uuid.uuid4().hex[:8]}"),
            description=case_data.get("description", "")
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)
        return {
            "status": "success",
            "case": {
                "id": new_case.id,
                "name": new_case.name,
                "description": new_case.description,
                "created_at": new_case.created_at.isoformat()
            }
        }

@app.get("/api/cases/{case_id}/evidence")
async def get_case_evidence(case_id: int):
    """Get all evidence for a specific case"""
    with SessionLocal() as db:
        from database.models import Evidence
        evidence_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()
        return {
            "status": "success",
            "evidence": [
                {
                    "id": evidence.id,
                    "filename": evidence.filename,
                    "file_path": evidence.file_path,
                    "file_hash": evidence.file_hash,
                    "collected_at": evidence.collected_at.isoformat(),
                    "metadata": evidence.evidence_metadata
                }
                for evidence in evidence_list
            ]
        }

@app.get("/api/cases/{case_id}/events")
async def get_case_events(case_id: int):
    """Get all events for a specific case"""
    with SessionLocal() as db:
        from database.models import Event
        events = db.query(Event).filter(Event.case_id == case_id).order_by(Event.timestamp.desc()).all()
        return {
            "status": "success",
            "events": [
                {
                    "id": event.id,
                    "description": event.description,
                    "timestamp": event.timestamp.isoformat(),
                    "extra": event.extra
                }
                for event in events
            ]
        }

@app.get("/api/evidence/{evidence_id}")
async def get_evidence_details(evidence_id: int):
    """Get detailed information about specific evidence"""
    with SessionLocal() as db:
        from database.models import Evidence
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence:
            raise HTTPException(status_code=404, detail="Evidence not found")
        
        return {
            "status": "success",
            "evidence": {
                "id": evidence.id,
                "filename": evidence.filename,
                "file_path": evidence.file_path,
                "file_hash": evidence.file_hash,
                "collected_at": evidence.collected_at.isoformat(),
                "metadata": evidence.evidence_metadata,
                "case_id": evidence.case_id
            }
        }

@app.get("/api/analysis/summary")
async def get_analysis_summary():
    """Get summary statistics of all analyses"""
    with SessionLocal() as db:
        from database.models import Evidence, Event, Case
        total_cases = db.query(Case).count()
        total_evidence = db.query(Evidence).count()
        total_events = db.query(Event).count()
        
        return {
            "status": "success",
            "summary": {
                "total_cases": total_cases,
                "total_evidence": total_evidence,
                "total_events": total_events,
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
        }

@app.post("/api/analysis/bulk")
async def bulk_analysis(files_data: dict):
    """Submit multiple files for analysis"""
    results = []
    file_list = files_data.get("files", [])
    
    for file_info in file_list:
        # This would need to be implemented based on file paths or file data
        # For now, return a placeholder response
        results.append({
            "filename": file_info.get("filename", "unknown"),
            "status": "queued",
            "analysis_id": str(uuid.uuid4())
        })
    
    return {
        "status": "success",
        "bulk_analysis": {
            "submitted_count": len(file_list),
            "results": results
        }
    }

@app.get("/api/agents/status")
async def get_agent_status():
    """Get status of all forensic agents"""
    return {
        "status": "success",
        "agents": {
            "NetworkAnalyzer": {"status": "active", "specialization": "Network traffic analysis"},
            "BinaryAnalyzer": {"status": "active", "specialization": "Executable and binary analysis"},
            "MemoryAnalyzer": {"status": "active", "specialization": "Memory dump analysis"},
            "DiskAnalyzer": {"status": "active", "specialization": "Disk image analysis"},
            "UserProfiler": {"status": "active", "specialization": "User activity and log analysis"},
            "TimelineAnalyzer": {"status": "active", "specialization": "Forensic timeline creation"},
            "SandboxAgent": {"status": "active", "specialization": "Dynamic malware analysis"},
            "ReconAgent": {"status": "active", "specialization": "Threat intelligence"},
            "CustodianAgent": {"status": "active", "specialization": "Evidence integrity"},
            "LiveResponseAgent": {"status": "active", "specialization": "Live system analysis"}
        }
    }

@app.get("/api/file-types")
async def get_supported_file_types():
    """Get list of supported file types and their routing"""
    return {
        "status": "success",
        "supported_types": {
            "network": {
                "extensions": [".pcap", ".pcapng"],
                "agent": "NetworkAnalyzer",
                "description": "Network packet captures"
            },
            "binary": {
                "extensions": [".exe", ".dll", ".bin", ".so", ".msi", ".deb", ".rpm"],
                "agent": "BinaryAnalyzer", 
                "description": "Executable files and libraries"
            },
            "memory": {
                "extensions": [".lime", ".raw", ".mem"],
                "agent": "MemoryAnalyzer",
                "description": "Memory dumps and images"
            },
            "disk": {
                "extensions": [".img", ".dd", ".ewf", ".aff"],
                "agent": "DiskAnalyzer",
                "description": "Disk images and forensic containers"
            },
            "logs": {
                "extensions": [".log", ".txt", ".csv", ".evtx", ".evt"],
                "agent": "UserProfiler",
                "description": "Log files and user activity data"
            }
        }
    }

@app.get("/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

# ============================================================================
# Script Generation API Endpoints
# ============================================================================

@app.post("/api/scripts/generate", response_model=ScriptGenerationResponse)
async def generate_forensics_script(request: ScriptGenerationRequest):
    """
    Generate a platform-specific forensic analysis script
    
    This endpoint creates downloadable scripts for live forensic analysis
    that can be deployed on target systems to collect and stream data back
    to the Aegis Forensics server.
    """
    try:
        # Validate configuration
        warnings = script_generator.validate_config(request.config)
        if warnings:
            logger.warning(f"Script generation warnings: {warnings}")
        
        # Generate the script
        response = script_generator.generate_script(request)
        
        # Log the generation event
        add_event(
            "default", 
            f"Generated {request.config.os} script for {request.config.analysis_type} analysis"
        )
        
        return response
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Template not found: {str(e)}")
    except Exception as e:
        logger.error(f"Script generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")

@app.post("/api/scripts/download")
async def download_forensics_script(request: ScriptGenerationRequest):
    """
    Generate and download a forensic analysis script as a file
    
    Returns the script as a downloadable file with appropriate headers
    """
    try:
        # Generate the script
        response = script_generator.generate_script(request)
        
        # Determine content type based on file extension
        content_type = "text/plain"
        if response.filename.endswith('.ps1'):
            content_type = "application/x-powershell"
        elif response.filename.endswith('.py'):
            content_type = "text/x-python"
        
        # Log the download event
        add_event(
            "default", 
            f"Downloaded {request.config.os} script: {response.filename}"
        )
        
        return Response(
            content=response.script_content,
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={response.filename}",
                "Content-Type": content_type
            }
        )
        
    except Exception as e:
        logger.error(f"Script download failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Script download failed: {str(e)}")

@app.get("/api/scripts/platforms")
async def get_supported_platforms():
    """
    Get list of supported operating systems for script generation
    """
    return {
        "platforms": [
            {
                "id": "windows",
                "name": "Windows",
                "description": "Windows PowerShell scripts (Windows 7/Server 2008 R2+)",
                "file_extension": ".ps1",
                "supported_analysis_types": [
                    "memory", "network", "disk", "processes", "registry", "logs", "comprehensive"
                ]
            },
            {
                "id": "linux", 
                "name": "Linux",
                "description": "Python scripts for Linux distributions",
                "file_extension": ".py",
                "supported_analysis_types": [
                    "memory", "network", "disk", "processes", "logs", "comprehensive"
                ]
            },
            {
                "id": "macos",
                "name": "macOS", 
                "description": "Python scripts for macOS systems",
                "file_extension": ".py",
                "supported_analysis_types": [
                    "memory", "network", "disk", "processes", "logs", "comprehensive"
                ]
            }
        ]
    }

@app.get("/api/scripts/analysis-types")
async def get_analysis_types():
    """
    Get list of supported analysis types for forensic scripts
    """
    return {
        "analysis_types": [
            {
                "id": "memory",
                "name": "Memory Analysis",
                "description": "Collect running processes, memory usage, and loaded modules"
            },
            {
                "id": "network", 
                "name": "Network Analysis",
                "description": "Collect network connections, routing tables, and DNS information"
            },
            {
                "id": "disk",
                "name": "Disk Analysis", 
                "description": "Collect filesystem information, mounted drives, and recent files"
            },
            {
                "id": "processes",
                "name": "Process Analysis",
                "description": "Detailed process information, services, and scheduled tasks"
            },
            {
                "id": "registry",
                "name": "Registry Analysis (Windows Only)",
                "description": "Windows registry analysis including startup programs and recent documents"
            },
            {
                "id": "logs",
                "name": "Log Analysis",
                "description": "System logs, security events, and audit trails"
            },
            {
                "id": "comprehensive",
                "name": "Comprehensive Analysis",
                "description": "All available analysis types combined"
            }
        ]
    }

@app.post("/api/scripts/validate")
async def validate_script_config(request: ScriptGenerationRequest):
    """
    Validate script configuration without generating the script
    
    Returns warnings and compatibility information
    """
    try:
        warnings = script_generator.validate_config(request.config)
        
        # Check template availability
        template_available = True
        try:
            script_generator._load_template(request.config.os)
        except FileNotFoundError:
            template_available = False
        
        return {
            "valid": template_available and len([w for w in warnings if "not found" in w.lower()]) == 0,
            "warnings": warnings,
            "template_available": template_available,
            "estimated_script_size_kb": 15 if request.config.os == OperatingSystem.WINDOWS else 12,
            "dependencies": script_generator._get_dependencies(request.config)
        }
        
    except Exception as e:
        logger.error(f"Config validation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@app.post("/api/stream/live-analysis")
async def receive_live_analysis_data(request: Request):
    """
    Endpoint to receive live analysis data from generated scripts
    
    This endpoint receives the data streams from the generated forensic scripts
    and processes them through the forensic analysis pipeline.
    """
    try:
        payload = await request.json()
        
        # Extract metadata
        burst_id = payload.get("burst_id", "unknown")
        platform = payload.get("platform", "unknown")
        analysis_type = payload.get("analysis_type", "unknown")
        timestamp = payload.get("timestamp")
        data = payload.get("data", {})
        
        logger.info(f"📥 Received live analysis data: {burst_id} ({platform}/{analysis_type})")
        
        # Store in session state for agent processing
        agent_session.state[f"live_data_{burst_id}"] = {
            "platform": platform,
            "analysis_type": analysis_type,
            "timestamp": timestamp,
            "data": data,
            "data_size": len(json.dumps(data))
        }
        
        # Route to specific agents based on analysis type
        if analysis_type.lower() == "memory":
            # Route memory analysis to Memory Analyzer agent
            prompt = f"""
            Analyze the following live memory data collected from a {platform} system:
            
            Burst ID: {burst_id}
            Timestamp: {timestamp}
            Platform: {platform}
            Data: {json.dumps(data, indent=2)}
            
            This is live memory analysis data, not a memory dump file. Analyze the process information, 
            memory usage patterns, network connections, and loaded modules for security indicators.
            
            Look for:
            - Suspicious processes or process injection
            - Unusual memory consumption patterns
            - Malicious network connections
            - Hidden or rootkit processes
            - Anomalous loaded modules
            
            Provide a comprehensive forensic analysis in the required JSON format.
            """
            
            # Use Memory Analyzer agent for memory analysis
            content = types.Content(role="user", parts=[types.Part(text=prompt)])
            
            # Create a temporary session for the memory agent
            memory_session = await session_service.create_session(
                app_name=AGENT_APP, 
                user_id=AGENT_USER, 
                session_id=f"memory_analysis_{burst_id}", 
                state={}
            )
            
            # Run the memory agent directly
            memory_runner = Runner(agent=memory_agent, app_name=AGENT_APP, session_service=session_service)
            events = memory_runner.run_async(
                user_id=AGENT_USER, 
                session_id=memory_session.id, 
                new_message=content
            )
            
            result_text = ""
            async for ev in events:
                try:
                    if ev.is_final_response() and ev.content and ev.content.parts:
                        result_text = ev.content.parts[0].text
                        break
                except Exception as e:
                    logger.error(f"Error processing memory agent event: {e}")
                    
            if not result_text:
                result_text = '{"verdict": "ERROR", "severity": "High", "summary": "Memory agent failed to respond"}'
        else:
            # Route other analysis types to orchestrator
            prompt = f"""
            Analyze the following live {analysis_type} data collected from a {platform} system:
            
            Burst ID: {burst_id}
            Timestamp: {timestamp}
            Data: {json.dumps(data, indent=2)}
            
            Please provide a comprehensive forensic analysis including:
            1. Security assessment (verdict: CLEAN/SUSPICIOUS/MALICIOUS)
            2. Risk level and confidence
            3. Key findings and indicators
            4. Technical details and evidence
            5. Recommendations for further action
            
            Provide analysis in JSON format.
            """
            
            # Run analysis through orchestrator
            result_text = await run_orchestrator_prompt(prompt)
        
        # Parse the response
        analysis_result = parse_agent_response(result_text)
        
        # Add event record
        add_event(
            "default",
            f"Processed live {analysis_type} analysis from {platform} system (burst: {burst_id})"
        )
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"Live analysis processing failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Analysis processing failed: {str(e)}",
            "analysis": {
                "verdict": "ERROR",
                "severity": "High",
                "criticality": "High", 
                "confidence": "Low",
                "summary": "Failed to process live analysis data",
                "findings": [],
                "technical_details": {"error": str(e)},
                "recommendations": ["Check server logs", "Retry data transmission"]
            }
        }

# ============================================================================

# Direct server startup functionality
def start_server():
    """Start the Aegis Forensics server directly"""
    import uvicorn
    
    logger.info("🚀 Starting Aegis Forensics Server...")
    logger.info("=" * 50)
    logger.info("Aegis Forensics - AI-Powered Digital Forensics Platform")
    logger.info("Version: 1.0.0")
    logger.info("=" * 50)
    
    # Log configuration
    logger.info("Server Configuration:")
    logger.info(f"  Host: 0.0.0.0")
    logger.info(f"  Port: 8000")
    logger.info(f"  Environment: {'Development' if os.getenv('DEBUG') else 'Production'}")
    logger.info(f"  Log file: logs/aegis_forensics.log")
    logger.info(f"  Database: aegis_forensics.db")
    
    # Log agent status
    logger.info("\nForensic Agents Status:")
    agents = [
        "NetworkAnalyzer", "BinaryAnalyzer", "MemoryAnalyzer", "DiskAnalyzer",
        "UserProfiler", "TimelineAnalyzer", "SandboxAgent", "ReconAgent", 
        "CustodianAgent", "LiveResponseAgent"
    ]
    
    for agent in agents:
        logger.info(f"  ✅ {agent} - Ready")
    
    logger.info("\nAPI Endpoints Available:")
    logger.info("  POST /analyze/uploadfile/ - File analysis")
    logger.info("  POST /analyze/streamdata/ - Stream analysis")
    logger.info("  GET  /api/agents/status - Agent status")
    logger.info("  GET  /api/file-types - Supported file types")
    logger.info("  GET  /api/cases - Case management")
    logger.info("  GET  /health - Health check")
    
    logger.info("\n" + "=" * 50)
    logger.info("Server starting... Press Ctrl+C to stop")
    logger.info("API Documentation: http://localhost:8000/docs")
    logger.info("=" * 50)
    
    try:
        # Start uvicorn server
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True if os.getenv('DEBUG') else False,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("\n🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()
