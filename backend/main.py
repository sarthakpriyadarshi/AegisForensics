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
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, BackgroundTasks, Form
from fastapi.responses import JSONResponse, PlainTextResponse, Response
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Ensure Google API key is set
if not os.getenv('GOOGLE_API_KEY'):
    raise ValueError("GOOGLE_API_KEY environment variable is required")

from database.models import init_db, SessionLocal, compute_sha256, User
from database.utils import add_evidence_record, add_event
from schemas.evidence import EvidenceCreate
from schemas.script_config import ScriptGenerationRequest, ScriptGenerationResponse, OperatingSystem, AnalysisType
from services.script_generator import ScriptGenerator
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

from agents.forensic_orchestrator import ForensicOrchestrator
from agents.memory_analyzer import memory_agent

# Import new auth and system routes
from routes.auth import router as auth_router
from routes.system import router as system_router
from middleware.auth_middleware import AuthMiddleware

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

# Database initialization with enhanced logging
def initialize_database():
    """Initialize database with enhanced error handling and logging"""
    try:
        db_path = "aegis_forensics.db"
        db_exists = os.path.exists(db_path)
        
        if not db_exists:
            logger.info("Database file not found. Creating new database...")
            logger.info(f"Database will be created at: {os.path.abspath(db_path)}")
        else:
            logger.info(f"Using existing database: {os.path.abspath(db_path)}")
        
        # Initialize database
        init_db()
        
        # Verify database was created successfully
        if not db_exists and os.path.exists(db_path):
            logger.info("✅ Database created successfully!")
            logger.info("📝 Sample cases and admin user have been created")
            logger.info("👤 Default login: admin@aegisforensics.com / admin123")
        elif db_exists:
            logger.info("✅ Database connection verified")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        logger.error("🔧 You can try running: python database/init_database.py")
        return False

# Initialize database
database_ok = initialize_database()
if not database_ok:
    logger.warning("⚠️  Database initialization had issues, but continuing startup...")

# Init DB (legacy call - keeping for compatibility)
# init_db()

app = FastAPI(
    title="Aegis Forensics API",
    description="Advanced Digital Forensics Platform with AI-powered analysis",
    version="2.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom auth middleware
app.add_middleware(AuthMiddleware)

# Include routers
app.include_router(auth_router)
app.include_router(system_router)

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

@app.get("/")
async def root():
    """
    Root endpoint that provides API information and setup status
    """
    # Check if admin user exists
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.is_admin == True).first() is not None
    finally:
        db.close()
    
    return {
        "message": "Aegis Forensics API",
        "version": "2.1.0",
        "admin_setup_required": not admin_exists,
        "setup_endpoint": "/auth/setup-admin" if not admin_exists else None,
        "docs": "/docs",
        "status": "ready" if admin_exists else "setup_required"
    }

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

# Fallback analysis function when AI service is unavailable
def create_fallback_analysis_result(filename: str, file_ext: str) -> str:
    """Create a basic analysis result when AI service is unavailable"""
    
    # Determine file type and basic analysis
    file_type = "Unknown"
    basic_analysis = "Basic file information extracted"
    
    if file_ext.lower() in [".pcap", ".pcapng"]:
        file_type = "Network Capture"
        basic_analysis = "Network packet capture file detected. Contains network traffic data for analysis."
    elif file_ext.lower() in [".exe", ".dll", ".bin"]:
        file_type = "Binary/Executable"
        basic_analysis = "Binary executable file detected. Requires malware analysis and reverse engineering."
    elif file_ext.lower() in [".img", ".dd", ".e01"]:
        file_type = "Disk Image"
        basic_analysis = "Disk image file detected. Contains file system data for forensic examination."
    elif file_ext.lower() in [".mem", ".dmp", ".vmem"]:
        file_type = "Memory Dump"
        basic_analysis = "Memory dump file detected. Contains system memory snapshot for analysis."
    elif file_ext.lower() in [".log", ".txt", ".csv"]:
        file_type = "Log File"
        basic_analysis = "Log file detected. Contains system or application logs for timeline analysis."
    
    # Create JSON response similar to AI analysis
    fallback_result = {
        "summary": "File uploaded successfully. AI analysis temporarily unavailable - basic analysis provided.",
        "file_info": {
            "filename": filename,
            "file_type": file_type,
            "extension": file_ext,
            "status": "uploaded"
        },
        "analysis": {
            "type": "basic_analysis",
            "description": basic_analysis,
            "confidence": "low",
            "recommendations": [
                "File has been stored securely for analysis",
                "Manual examination recommended",
                "Re-run analysis when AI service is available"
            ]
        },
        "next_steps": [
            "Verify file integrity",
            "Manual preliminary examination",
            "Schedule for detailed analysis"
        ],
        "status": "completed_basic"
    }
    
    return json.dumps(fallback_result, indent=2)

# Helper function to save agent reports to database
async def save_agent_report(agent_name: str, analysis_type: str, evidence_id: int, 
                          parsed_response: dict, raw_output: str, case_id: int = None):
    """Save agent analysis report to database"""
    with SessionLocal() as db:
        from database.models import AgentReport, Case
        import json
        
        # If no case_id provided, use default case or create one
        if case_id is None:
            default_case = db.query(Case).filter(Case.name == "default").first()
            if not default_case:
                from database.models import CaseStatus, CasePriority
                default_case = Case(
                    case_number="CASE-DEFAULT-001",
                    name="default",
                    description="Default case for automated analysis",
                    investigator="System",
                    status=CaseStatus.ANALYZING,
                    priority=CasePriority.MEDIUM,
                    tags=json.dumps(["automated", "system"])
                )
                db.add(default_case)
                db.commit()
                db.refresh(default_case)
            case_id = default_case.id
        
        # Extract data from parsed response
        verdict = parsed_response.get("verdict") if isinstance(parsed_response, dict) else None
        severity = parsed_response.get("severity") if isinstance(parsed_response, dict) else None
        confidence = parsed_response.get("confidence") if isinstance(parsed_response, dict) else None
        summary = parsed_response.get("summary") if isinstance(parsed_response, dict) else None
        findings = parsed_response.get("findings", []) if isinstance(parsed_response, dict) else []
        technical_details = parsed_response.get("technical_details", {}) if isinstance(parsed_response, dict) else {}
        recommendations = parsed_response.get("recommendations", []) if isinstance(parsed_response, dict) else []
        
        # Create agent report
        report = AgentReport(
            case_id=case_id,
            agent_name=agent_name,
            evidence_id=evidence_id,
            analysis_type=analysis_type,
            verdict=verdict,
            severity=severity,
            confidence=confidence,
            summary=summary,
            findings=json.dumps(findings),
            technical_details=json.dumps(technical_details),
            recommendations=json.dumps(recommendations),
            raw_output=raw_output
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        logger.info(f"Saved agent report: {agent_name} - {analysis_type} - Verdict: {verdict}")
        return report.id

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
async def analyze_uploadfile(file: UploadFile = File(...), case_id: str = Form(None)):
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
    
    # Use provided case_id or default to "default"
    case_identifier = case_id if case_id else "default"
    
    # store in DB via utils
    evidence_rec = add_evidence_record(case_identifier, filename, tmp_path, file_hash, evidence_metadata=f"uploaded_at:{datetime.utcnow().isoformat()}")

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

    # Run orchestrator with error handling for authentication issues
    try:
        result_text = await run_orchestrator_prompt(analysis_prompt)
    except Exception as e:
        # Handle Google API authentication errors gracefully
        if "401" in str(e) or "UNAUTHENTICATED" in str(e) or "API keys are not supported" in str(e):
            logger.warning(f"Google API authentication failed: {e}")
            result_text = create_fallback_analysis_result(filename, ext)
        else:
            logger.error(f"Unexpected error during analysis: {e}")
            raise e
    
    # Parse the agent response to extract JSON format
    parsed_response = parse_agent_response(result_text)
    
    # Determine agent name and analysis type based on file extension
    agent_name = "UnknownAgent"
    analysis_type = "general_analysis"
    
    if ext in [".pcap", ".pcapng"]:
        agent_name = "NetworkAnalyzer"
        analysis_type = "network_analysis"
    elif ext in [".lime", ".raw", ".mem"]:
        agent_name = "MemoryAnalyzer"
        analysis_type = "memory_analysis"
    elif ext in [".img", ".dd", ".ewf", ".aff"]:
        agent_name = "DiskAnalyzer"
        analysis_type = "disk_analysis"
    elif ext in [".log", ".txt", ".csv", ".evtx", ".evt"]:
        agent_name = "UserProfiler"
        analysis_type = "user_behavior_analysis"
    elif ext in [".exe", ".dll", ".bin", ".so", ".msi", ".deb", ".rpm"]:
        agent_name = "BinaryAnalyzer"
        analysis_type = "binary_analysis"
    
    # Save agent report to database
    try:
        await save_agent_report(
            agent_name=agent_name,
            analysis_type=analysis_type,
            evidence_id=evidence_rec.id,
            parsed_response=parsed_response,
            raw_output=result_text
        )
        logger.info(f"Saved agent report for {filename} - Agent: {agent_name}")
    except Exception as e:
        logger.error(f"Failed to save agent report: {e}")
    
    return JSONResponse(content={
        "status": "success", 
        "analysis": parsed_response,
        "evidence_id": evidence_rec.id,
        "agent_name": agent_name,
        "analysis_type": analysis_type,
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
    
    # Add evidence record
    evidence_rec = add_evidence_record("default", os.path.basename(tmp_path), tmp_path, hashlib.sha256(open(tmp_path,'rb').read()).hexdigest())
    add_event("default", f"Stream received and saved to {tmp_path}")
    result_text = await run_orchestrator_prompt(analysis_prompt)
    
    # Parse the agent response to extract JSON format
    parsed_response = parse_agent_response(result_text)
    
    # Determine agent based on detected file type
    agent_name = "NetworkAnalyzer" if "pcap" in analysis_prompt else "MemoryAnalyzer"
    analysis_type = "network_analysis" if "pcap" in analysis_prompt else "memory_analysis"
    
    # Save agent report to database
    try:
        await save_agent_report(
            agent_name=agent_name,
            analysis_type=analysis_type,
            evidence_id=evidence_rec.id,
            parsed_response=parsed_response,
            raw_output=result_text
        )
        logger.info(f"Saved agent report for streamed data - Agent: {agent_name}")
    except Exception as e:
        logger.error(f"Failed to save agent report: {e}")
    
    return JSONResponse({
        "status": "success", 
        "analysis": parsed_response,
        "evidence_id": evidence_rec.id,
        "agent_name": agent_name,
        "analysis_type": analysis_type
    })

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
        case_list = []
        for case in cases:
            # Parse tags from JSON string
            tags = []
            if case.tags:
                try:
                    import json
                    tags = json.loads(case.tags)
                except:
                    tags = []
            
            case_list.append({
                "id": case.id,
                "caseNumber": case.case_number,
                "name": case.name,
                "description": case.description or "",
                "investigator": case.investigator,
                "status": case.status.value if hasattr(case.status, 'value') else str(case.status),
                "priority": case.priority.value if hasattr(case.priority, 'value') else str(case.priority),
                "createdAt": case.created_at.isoformat(),
                "updatedAt": case.updated_at.isoformat(),
                "evidenceCount": len(case.evidences),
                "tags": tags
            })
        
        return {
            "status": "success",
            "cases": case_list
        }

@app.post("/api/cases")
async def create_case(case_data: dict):
    """Create a new forensic case"""
    with SessionLocal() as db:
        from database.models import Case, CaseStatus, CasePriority
        import json
        
        # Generate case number
        case_count = db.query(Case).count()
        case_number = f"CASE-{datetime.now().year}-{str(case_count + 1).zfill(3)}"
        
        # Create new case
        new_case = Case(
            case_number=case_number,
            name=case_data.get("name", f"Case {case_number}"),
            description=case_data.get("description", ""),
            investigator=case_data.get("investigator", "Unknown"),
            status=CaseStatus(case_data.get("status", "open")),
            priority=CasePriority(case_data.get("priority", "medium")),
            tags=json.dumps(case_data.get("tags", []))
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)
        
        return {
            "status": "success",
            "case": {
                "id": new_case.id,
                "caseNumber": new_case.case_number,
                "name": new_case.name,
                "description": new_case.description,
                "investigator": new_case.investigator,
                "status": new_case.status.value,
                "priority": new_case.priority.value,
                "createdAt": new_case.created_at.isoformat(),
                "updatedAt": new_case.updated_at.isoformat(),
                "evidenceCount": 0,
                "tags": json.loads(new_case.tags) if new_case.tags else []
            }
        }

@app.put("/api/cases/{case_id}")
async def update_case(case_id: int, case_data: dict):
    """Update an existing case"""
    with SessionLocal() as db:
        from database.models import Case, CaseStatus, CasePriority
        import json
        
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Update fields if provided
        if "name" in case_data:
            case.name = case_data["name"]
        if "description" in case_data:
            case.description = case_data["description"]
        if "investigator" in case_data:
            case.investigator = case_data["investigator"]
        if "status" in case_data:
            case.status = CaseStatus(case_data["status"])
        if "priority" in case_data:
            case.priority = CasePriority(case_data["priority"])
        if "tags" in case_data:
            case.tags = json.dumps(case_data["tags"])
        
        case.updated_at = datetime.now()
        db.commit()
        db.refresh(case)
        
        return {
            "status": "success",
            "case": {
                "id": case.id,
                "caseNumber": case.case_number,
                "name": case.name,
                "description": case.description,
                "investigator": case.investigator,
                "status": case.status.value,
                "priority": case.priority.value,
                "createdAt": case.created_at.isoformat(),
                "updatedAt": case.updated_at.isoformat(),
                "evidenceCount": len(case.evidences),
                "tags": json.loads(case.tags) if case.tags else []
            }
        }

@app.delete("/api/cases/{case_id}")
async def delete_case(case_id: int):
    """Delete a case and all associated data"""
    with SessionLocal() as db:
        from database.models import Case
        
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        db.delete(case)
        db.commit()
        
        return {"status": "success", "message": "Case deleted successfully"}

@app.get("/api/cases/{case_id}")
async def get_case_details(case_id: int):
    """Get detailed information about a specific case"""
    with SessionLocal() as db:
        from database.models import Case
        import json
        
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        return {
            "status": "success",
            "case": {
                "id": case.id,
                "caseNumber": case.case_number,
                "name": case.name,
                "description": case.description,
                "investigator": case.investigator,
                "status": case.status.value,
                "priority": case.priority.value,
                "createdAt": case.created_at.isoformat(),
                "updatedAt": case.updated_at.isoformat(),
                "evidenceCount": len(case.evidences),
                "tags": json.loads(case.tags) if case.tags else []
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
                    "file_size": evidence.file_size,
                    "file_type": evidence.file_type,
                    "collected_at": evidence.collected_at.isoformat(),
                    "metadata": evidence.evidence_metadata
                }
                for evidence in evidence_list
            ]
        }

@app.post("/api/cases/{case_id}/evidence")
async def add_evidence_to_case(case_id: int, evidence_data: dict):
    """Add evidence to a case"""
    with SessionLocal() as db:
        from database.models import Evidence, Case
        
        # Verify case exists
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        evidence = Evidence(
            case_id=case_id,
            filename=evidence_data.get("filename", "unknown"),
            file_path=evidence_data.get("file_path", ""),
            file_hash=evidence_data.get("file_hash", ""),
            file_size=evidence_data.get("file_size"),
            file_type=evidence_data.get("file_type"),
            evidence_metadata=evidence_data.get("metadata", "")
        )
        
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
        
        return {
            "status": "success",
            "evidence": {
                "id": evidence.id,
                "filename": evidence.filename,
                "file_path": evidence.file_path,
                "file_hash": evidence.file_hash,
                "collected_at": evidence.collected_at.isoformat()
            }
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

@app.get("/api/cases/{case_id}/reports")
async def get_case_reports(case_id: int):
    """Get all agent reports for a specific case"""
    with SessionLocal() as db:
        from database.models import AgentReport
        import json
        
        reports = db.query(AgentReport).filter(AgentReport.case_id == case_id).order_by(AgentReport.created_at.desc()).all()
        
        report_list = []
        for report in reports:
            # Parse JSON fields
            findings = []
            technical_details = {}
            recommendations = []
            
            try:
                if report.findings:
                    findings = json.loads(report.findings)
                if report.technical_details:
                    technical_details = json.loads(report.technical_details)
                if report.recommendations:
                    recommendations = json.loads(report.recommendations)
            except:
                pass
            
            report_list.append({
                "id": report.id,
                "agent_name": report.agent_name,
                "analysis_type": report.analysis_type,
                "verdict": report.verdict,
                "severity": report.severity,
                "confidence": report.confidence,
                "summary": report.summary,
                "findings": findings,
                "technical_details": technical_details,
                "recommendations": recommendations,
                "evidence_id": report.evidence_id,
                "created_at": report.created_at.isoformat()
            })
        
        return {
            "status": "success",
            "reports": report_list
        }

@app.post("/api/cases/{case_id}/reports")
async def create_agent_report(case_id: int, report_data: dict):
    """Create a new agent report for a case"""
    with SessionLocal() as db:
        from database.models import AgentReport, Case
        import json
        
        # Verify case exists
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Create agent report
        report = AgentReport(
            case_id=case_id,
            agent_name=report_data.get("agent_name", "Unknown"),
            evidence_id=report_data.get("evidence_id"),
            analysis_type=report_data.get("analysis_type", "general"),
            verdict=report_data.get("verdict"),
            severity=report_data.get("severity"),
            confidence=report_data.get("confidence"),
            summary=report_data.get("summary"),
            findings=json.dumps(report_data.get("findings", [])),
            technical_details=json.dumps(report_data.get("technical_details", {})),
            recommendations=json.dumps(report_data.get("recommendations", [])),
            raw_output=report_data.get("raw_output")
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return {
            "status": "success",
            "report": {
                "id": report.id,
                "agent_name": report.agent_name,
                "analysis_type": report.analysis_type,
                "verdict": report.verdict,
                "severity": report.severity,
                "created_at": report.created_at.isoformat()
            }
        }

@app.post("/api/cases/{case_id}/analyze")
async def analyze_file_for_case(case_id: int, file: UploadFile = File(...)):
    """
    Upload and analyze a file for a specific case.
    This endpoint automatically links the evidence and analysis to a case.
    """
    with SessionLocal() as db:
        from database.models import Case
        
        # Verify case exists
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
    
    # Process file similar to uploadfile but with case association
    contents = await file.read()
    filename = file.filename or f"upload_{uuid.uuid4().hex}"
    safe_name = filename.replace(" ", "_")
    tmp_path = f"/tmp/{uuid.uuid4().hex}_{safe_name}"
    with open(tmp_path, "wb") as f:
        f.write(contents)
    file_hash = hashlib.sha256(contents).hexdigest()

    # Get file extension and size
    ext = os.path.splitext(filename)[1].lower()
    file_size = len(contents)
    
    # Add evidence record to specific case
    with SessionLocal() as db:
        from database.models import Evidence
        evidence = Evidence(
            case_id=case_id,
            filename=filename,
            file_path=tmp_path,
            file_hash=file_hash,
            file_size=file_size,
            file_type=ext,
            evidence_metadata=f"uploaded_at:{datetime.utcnow().isoformat()}"
        )
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
        evidence_id = evidence.id

    # Set appropriate state keys for the orchestrator
    state = agent_session.state
    
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
    
    # Determine analysis type and agent based on file extension
    agent_name = "UnknownAgent"
    analysis_type = "general_analysis"
    analysis_prompt = ""
    
    if ext in [".pcap", ".pcapng"]:
        state["pcap_path"] = tmp_path
        agent_name = "NetworkAnalyzer"
        analysis_type = "network_analysis"
        
        # Get raw network analysis data first
        try:
            from tools.network_tools import analyze_network_direct
            network_data = analyze_network_direct(tmp_path)
            
            if network_data.get("status") == "success":
                raw_data = network_data.get("raw_data", {})
                analysis_notes = network_data.get("analysis_notes", {})
                
                analysis_prompt = f"""NetworkAnalyzer: Analyze this PCAP network traffic data for Case #{case_id} and provide forensic assessment:

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

Based on this technical data, provide your forensic assessment.{json_instruction}"""
            else:
                analysis_prompt = f"NetworkAnalyzer: Analyze the uploaded PCAP file at {tmp_path} for Case #{case_id}.{json_instruction}"
        except Exception as e:
            analysis_prompt = f"NetworkAnalyzer: Analyze the uploaded PCAP file at {tmp_path} for Case #{case_id}.{json_instruction}"
            
    elif ext in [".lime", ".raw", ".mem"]:
        state["memory_path"] = tmp_path
        agent_name = "MemoryAnalyzer"
        analysis_type = "memory_analysis"
        analysis_prompt = f"MemoryAnalyzer: Analyze the uploaded memory image at {tmp_path} for Case #{case_id}.{json_instruction}"
        
    elif ext in [".img", ".dd", ".ewf", ".aff"]:
        state["disk_image_path"] = tmp_path
        agent_name = "DiskAnalyzer"
        analysis_type = "disk_analysis"
        analysis_prompt = f"DiskAnalyzer: Analyze the uploaded disk image at {tmp_path} for Case #{case_id}.{json_instruction}"
        
    elif ext in [".log", ".txt", ".csv", ".evtx", ".evt"]:
        state["user_profile_path"] = tmp_path
        agent_name = "UserProfiler"
        analysis_type = "user_behavior_analysis"
        analysis_prompt = f"UserProfiler: Analyze the uploaded log file at {tmp_path} for user behavior patterns in Case #{case_id}.{json_instruction}"
        
    elif ext in [".exe", ".dll", ".bin", ".so", ".msi", ".deb", ".rpm"]:
        state["binary_path"] = tmp_path
        agent_name = "BinaryAnalyzer"
        analysis_type = "binary_analysis"
        analysis_prompt = f"BinaryAnalyzer: Analyze the binary file at {tmp_path} for Case #{case_id}.{json_instruction}"
        
    else:
        state["binary_path"] = tmp_path
        agent_name = "GeneralAnalyzer"
        analysis_type = "file_analysis"
        analysis_prompt = f"Analyze the file at {tmp_path} for Case #{case_id} and determine its type and potential threats.{json_instruction}"

    # Set additional state
    state["latest_evidence_path"] = tmp_path
    state["case_name"] = f"case_{case_id}"

    # Run orchestrator analysis
    result_text = await run_orchestrator_prompt(analysis_prompt)
    
    # Parse the agent response
    parsed_response = parse_agent_response(result_text)
    
    # Save agent report to database with case association
    try:
        report_id = await save_agent_report(
            agent_name=agent_name,
            analysis_type=analysis_type,
            evidence_id=evidence_id,
            parsed_response=parsed_response,
            raw_output=result_text,
            case_id=case_id
        )
        logger.info(f"Saved agent report for Case #{case_id} - Agent: {agent_name} - Report ID: {report_id}")
    except Exception as e:
        logger.error(f"Failed to save agent report for Case #{case_id}: {e}")

    # Add event to case
    add_event(f"case_{case_id}", f"File analyzed: {filename} by {agent_name}")

    return JSONResponse(content={
        "status": "success", 
        "analysis": parsed_response,
        "evidence_id": evidence_id,
        "agent_name": agent_name,
        "analysis_type": analysis_type,
        "case_id": case_id,
        "file_info": {
            "filename": filename,
            "file_hash": file_hash,
            "file_type": ext,
            "file_size": file_size,
            "file_path": tmp_path
        }
    })

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

@app.get("/api/evidence-results")
async def get_evidence_results():
    """Get all evidence with their analysis results"""
    with SessionLocal() as db:
        from database.models import Evidence, AgentReport, Case
        import json
        
        # Get all evidence with their cases and reports
        evidence_query = db.query(Evidence).join(Case).order_by(Evidence.collected_at.desc()).all()
        
        results = []
        for evidence in evidence_query:
            # Get associated reports for this evidence
            reports = db.query(AgentReport).filter(AgentReport.evidence_id == evidence.id).order_by(AgentReport.created_at.desc()).all()
            
            # Process reports
            analysis_results = []
            latest_verdict = "unknown"
            latest_severity = "low"
            latest_confidence = 0
            
            for report in reports:
                try:
                    findings = json.loads(report.findings) if report.findings else []
                    technical_details = json.loads(report.technical_details) if report.technical_details else {}
                    recommendations = json.loads(report.recommendations) if report.recommendations else []
                    
                    analysis_results.append({
                        "id": report.id,
                        "agent_name": report.agent_name,
                        "analysis_type": report.analysis_type,
                        "verdict": report.verdict,
                        "severity": report.severity,
                        "confidence": report.confidence,
                        "summary": report.summary,
                        "findings": findings,
                        "technical_details": technical_details,
                        "recommendations": recommendations,
                        "created_at": report.created_at.isoformat()
                    })
                    
                    # Update latest analysis result
                    if report.verdict:
                        latest_verdict = report.verdict
                    if report.severity:
                        latest_severity = report.severity
                    if report.confidence:
                        latest_confidence = report.confidence
                        
                except Exception as e:
                    logger.error(f"Error processing report {report.id}: {e}")
            
            # Get case info
            case_info = {
                "id": evidence.case.id if evidence.case else None,
                "case_number": evidence.case.case_number if evidence.case else "Unknown",
                "name": evidence.case.name if evidence.case else "Unknown Case"
            }
            
            results.append({
                "id": evidence.id,
                "filename": evidence.filename,
                "file_path": evidence.file_path,
                "file_hash": evidence.file_hash,
                "file_size": evidence.file_size,
                "file_type": evidence.file_type,
                "collected_at": evidence.collected_at.isoformat(),
                "metadata": evidence.evidence_metadata,
                "case": case_info,
                "analysis_status": "completed" if analysis_results else "pending",
                "latest_verdict": latest_verdict,
                "latest_severity": latest_severity,
                "latest_confidence": latest_confidence,
                "analysis_results": analysis_results,
                "report_count": len(analysis_results)
            })
        
        return {
            "status": "success",
            "evidence_results": results,
            "total_count": len(results)
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
