# tools/recon_tools.py
import subprocess
import re
from google.adk.tools import ToolContext

def reconnaissance(tool_context: ToolContext) -> dict:
    """
    Perform OSINT reconnaissance on domains, IPs, or file hashes.
    
    First tries to get target from the user's request text,
    then falls back to tool_context state.
    """
    target = None
    
    # Try to extract target from user content
    if hasattr(tool_context, 'user_content') and tool_context.user_content:
        content = str(tool_context.user_content)
        print(f"[DEBUG] User content: {content}")
        
        # Try to find domains, IPs, or hashes
        target_patterns = [
            r'\b([a-f0-9]{32})\b',                  # MD5 hash
            r'\b([a-f0-9]{40})\b',                  # SHA1 hash
            r'\b([a-f0-9]{64})\b',                  # SHA256 hash
            r'\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b',  # IP address
            r'\b([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b',  # Domain name
        ]
        
        for pattern in target_patterns:
            matches = re.findall(pattern, content)
            if matches:
                target = matches[0]
                print(f"[DEBUG] Found target in user content: {target}")
                break
    
    # If not found in user content, try tool_context state
    if not target:
        state = tool_context.state
        print("[DEBUG] State type:", type(state))
        
        # Try using to_dict() method
        if hasattr(state, 'to_dict'):
            state_dict = state.to_dict()
            target = state_dict.get("recon_target")
            print("[DEBUG] target from to_dict():", target)
        
        # If still no target, try the get method
        if not target and hasattr(state, 'get'):
            target = state.get("recon_target")
            print("[DEBUG] target via get():", target)
    
    print(f"[DEBUG] Final target: {target}")
    
    if not target:
        return {"status": "error", "message": "No recon_target found in request or state."}
    try:
        proc = subprocess.run(["theHarvester", "-d", target, "-l", "50", "-b", "bing"], capture_output=True, text=True, timeout=120)
        return {"status": "success", "report": proc.stdout[:4000]}
    except Exception as e:
        return {"status": "error", "message": f"recon failed: {e}"}
