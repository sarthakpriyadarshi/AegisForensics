# tools/custodian_tools.py
from google.adk.tools import ToolContext
from database.utils import add_event, add_evidence_record
import hashlib
import os
import re

def custodian_record(tool_context: ToolContext) -> dict:
    """
    Record evidence to database with cryptographic integrity.
    
    First tries to get file_path from the user's request text,
    then falls back to tool_context state.
    """
    file_path = None
    case_name = "default"
    
    # Try to extract file path from user content
    if hasattr(tool_context, 'user_content') and tool_context.user_content:
        content = str(tool_context.user_content)
        print(f"[DEBUG] User content: {content}")
        
        # Try to find file paths
        path_patterns = [
            r"'([^']+/tmp/[^']+)'",     # Paths in single quotes with /tmp/
            r'"([^"]+/tmp/[^"]+)"',     # Paths in double quotes with /tmp/
            r'(\S*/tmp/\S+)',           # Any path starting with /tmp/
            r'(\S+\.\w+)',              # Any file with extension
        ]
        
        for pattern in path_patterns:
            matches = re.findall(pattern, content)
            if matches:
                file_path = matches[0]
                print(f"[DEBUG] Found file_path in user content: {file_path}")
                break
    
    # If not found in user content, try tool_context state
    if not file_path:
        state = tool_context.state
        print("[DEBUG] State type:", type(state))
        
        # Try using to_dict() method
        if hasattr(state, 'to_dict'):
            state_dict = state.to_dict()
            file_path = state_dict.get("latest_evidence_path")
            case_name = state_dict.get("case_name", "default")
            print("[DEBUG] file_path from to_dict():", file_path)
        
        # If still no file_path, try the get method
        if not file_path and hasattr(state, 'get'):
            file_path = state.get("latest_evidence_path")
            case_name = state.get("case_name", "default")
            print("[DEBUG] file_path via get():", file_path)
    
    print(f"[DEBUG] Final file_path: {file_path}")
    
    if not file_path or not os.path.exists(file_path):
        return {"status": "error", "message": "No latest_evidence_path present or file not found."}
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        file_hash = hashlib.sha256(content).hexdigest()
        file_size = len(content)
        file_type = os.path.splitext(file_path)[1].lower() or ".unknown"
        evidence = add_evidence_record(
            case_name, 
            os.path.basename(file_path), 
            file_path, 
            file_hash,
            file_size=file_size,
            file_type=file_type
        )
        event = add_event(case_name, f"Evidence {evidence.filename} recorded by custodian.")
        return {"status": "success", "evidence_id": evidence.id, "event_id": event.id}
    except Exception as e:
        return {"status": "error", "message": str(e)}
