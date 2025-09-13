# tools/disk_tools.py
import subprocess
import re
from google.adk.tools import ToolContext

def analyze_disk(tool_context: ToolContext) -> dict:
    """
    Analyze a disk image file using Sleuth Kit tools.
    
    First tries to get disk_image_path from the user's request text,
    then falls back to tool_context state.
    """
    disk_path = None
    
    # Try to extract disk image path from user content
    if hasattr(tool_context, 'user_content') and tool_context.user_content:
        content = str(tool_context.user_content)
        print(f"[DEBUG] User content: {content}")
        
        # Try to find disk image paths
        path_patterns = [
            r"'([^']+\.img)'",      # Paths in single quotes ending with .img
            r'"([^"]+\.img)"',      # Paths in double quotes ending with .img
            r'(\S+\.img)',          # Any non-whitespace sequence ending with .img
            r'(\S+\.dd)',           # Any non-whitespace sequence ending with .dd
            r'(\S+\.ewf)',          # Any non-whitespace sequence ending with .ewf
            r'(\S+\.aff)',          # Any non-whitespace sequence ending with .aff
            r'(\S*/tmp/\S+)',       # Any path starting with /tmp/
        ]
        
        for pattern in path_patterns:
            matches = re.findall(pattern, content)
            if matches:
                disk_path = matches[0]
                print(f"[DEBUG] Found disk_path in user content: {disk_path}")
                break
    
    # If not found in user content, try tool_context state
    if not disk_path:
        state = tool_context.state
        print("[DEBUG] State type:", type(state))
        
        # Try using to_dict() method
        if hasattr(state, 'to_dict'):
            state_dict = state.to_dict()
            disk_path = state_dict.get("disk_image_path")
            print("[DEBUG] disk_path from to_dict():", disk_path)
        
        # If still no disk_path, try the get method
        if not disk_path and hasattr(state, 'get'):
            disk_path = state.get("disk_image_path")
            print("[DEBUG] disk_path via get():", disk_path)
    
    print(f"[DEBUG] Final disk_path: {disk_path}")
    
    if not disk_path:
        return {"status": "error", "message": "No disk_image_path found in request or session state."}
    try:
        # Example: list files using fls (Sleuth Kit)
        proc = subprocess.run(["fls", "-r", "-p", disk_path], capture_output=True, text=True, timeout=300)
        out = proc.stdout or proc.stderr
        return {"status": "success", "report": out}
    except Exception as e:
        return {"status": "error", "message": f"disk analysis failed: {e}"}
