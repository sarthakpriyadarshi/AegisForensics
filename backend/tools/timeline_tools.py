# tools/timeline_tools.py
import subprocess
import re
import os
from google.adk.tools import ToolContext

def generate_timeline(tool_context: ToolContext) -> dict:
    """
    Generate forensic timeline from disk image using log2timeline.
    
    First tries to get disk_image_path from the user's request text,
    then falls back to tool_context state.
    """
    disk_image = None
    
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
                disk_image = matches[0]
                print(f"[DEBUG] Found disk_image in user content: {disk_image}")
                break
    
    # If not found in user content, try tool_context state
    if not disk_image:
        state = tool_context.state
        print("[DEBUG] State type:", type(state))
        
        # Try using to_dict() method
        if hasattr(state, 'to_dict'):
            state_dict = state.to_dict()
            disk_image = state_dict.get("disk_image_path")
            print("[DEBUG] disk_image from to_dict():", disk_image)
        
        # If still no disk_image, try the get method
        if not disk_image and hasattr(state, 'get'):
            disk_image = state.get("disk_image_path")
            print("[DEBUG] disk_image via get():", disk_image)
    
    print(f"[DEBUG] Final disk_image: {disk_image}")
    
    if not disk_image:
        return {"status": "error", "message": "No disk_image_path in request or session state."}
    try:
        # Example: run log2timeline if available (plaso). This is a placeholder.
        output_path = f"/tmp/timeline_{os.path.basename(disk_image)}.txt"
        proc = subprocess.run(["log2timeline.py", output_path, disk_image], capture_output=True, text=True, timeout=600)
        if proc.returncode != 0:
            return {"status": "error", "message": proc.stderr}
        return {"status": "success", "report_file": output_path}
    except Exception as e:
        return {"status": "error", "message": f"timeline generation failed: {e}"}
