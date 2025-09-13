# tools/sandbox_tools.py
import subprocess
import re
from google.adk.tools import ToolContext

def sandbox_analysis(tool_context: ToolContext) -> dict:
    """
    Execute dynamic analysis in sandbox environment.
    
    First tries to get binary_path from the user's request text,
    then falls back to tool_context state.
    """
    binary_path = None
    
    # Try to extract binary path from user content
    if hasattr(tool_context, 'user_content') and tool_context.user_content:
        content = str(tool_context.user_content)
        print(f"[DEBUG] User content: {content}")
        
        # Try to find binary paths
        path_patterns = [
            r"'([^']+\.exe)'",      # Paths in single quotes ending with .exe
            r'"([^"]+\.exe)"',      # Paths in double quotes ending with .exe
            r'(\S+\.exe)',          # Any non-whitespace sequence ending with .exe
            r'(\S+\.bin)',          # Any non-whitespace sequence ending with .bin
            r'(\S*/tmp/\S+)',       # Any path starting with /tmp/
        ]
        
        for pattern in path_patterns:
            matches = re.findall(pattern, content)
            if matches:
                binary_path = matches[0]
                print(f"[DEBUG] Found binary_path in user content: {binary_path}")
                break
    
    # If not found in user content, try tool_context state
    if not binary_path:
        state = tool_context.state
        print("[DEBUG] State type:", type(state))
        
        # Try using to_dict() method
        if hasattr(state, 'to_dict'):
            state_dict = state.to_dict()
            binary_path = state_dict.get("binary_path")
            print("[DEBUG] binary_path from to_dict():", binary_path)
        
        # If still no binary_path, try the get method
        if not binary_path and hasattr(state, 'get'):
            binary_path = state.get("binary_path")
            print("[DEBUG] binary_path via get():", binary_path)
    
    print(f"[DEBUG] Final binary_path: {binary_path}")
    
    if not binary_path:
        return {"status": "error", "message": "No binary_path found in request or session state."}
    try:
        # This only demonstrates the idea; in production use Cuckoo REST API
        # Try to run in firejail or return a placeholder
        proc = subprocess.run(["firejail", "--quiet", binary_path], capture_output=True, text=True, timeout=60)
        return {"status": "success", "report": "Sandbox run completed (firejail)."}
    except Exception as e:
        return {"status": "error", "message": f"sandbox execution failed: {e}"}
