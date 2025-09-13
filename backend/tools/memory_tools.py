# tools/memory_tools.py
import subprocess
import re
from google.adk.tools import ToolContext

def analyze_memory(tool_context: ToolContext) -> dict:
    """
    Analyze a memory dump file using volatility3.
    
    First tries to get memory_path from the user's request text,
    then falls back to tool_context state.
    """
    memory_path = None
    
    # Try to extract memory path from user content
    if hasattr(tool_context, 'user_content') and tool_context.user_content:
        content = str(tool_context.user_content)
        print(f"[DEBUG] User content: {content}")
        
        # Try to find memory dump paths
        path_patterns = [
            r"'([^']+\.mem)'",      # Paths in single quotes ending with .mem
            r'"([^"]+\.mem)"',      # Paths in double quotes ending with .mem
            r'(\S+\.mem)',          # Any non-whitespace sequence ending with .mem
            r'(\S+\.lime)',         # Any non-whitespace sequence ending with .lime
            r'(\S+\.raw)',          # Any non-whitespace sequence ending with .raw
            r'(\S*/tmp/\S+)',       # Any path starting with /tmp/
        ]
        
        for pattern in path_patterns:
            matches = re.findall(pattern, content)
            if matches:
                memory_path = matches[0]
                print(f"[DEBUG] Found memory_path in user content: {memory_path}")
                break
    
    # If not found in user content, try tool_context state
    if not memory_path:
        state = tool_context.state
        print("[DEBUG] State type:", type(state))
        
        # Try using to_dict() method
        if hasattr(state, 'to_dict'):
            state_dict = state.to_dict()
            memory_path = state_dict.get("memory_path")
            print("[DEBUG] memory_path from to_dict():", memory_path)
        
        # If still no memory_path, try the get method
        if not memory_path and hasattr(state, 'get'):
            memory_path = state.get("memory_path")
            print("[DEBUG] memory_path via get():", memory_path)
    
    print(f"[DEBUG] Final memory_path: {memory_path}")
    
    if not memory_path:
        return {"status": "error", "message": "No memory_path found in request or session state."}
    try:
        # Example: run vol3 pslist plugin – adjust according to target OS profile
        proc = subprocess.run(["volatility3", "-f", memory_path, "windows.pslist", "--output=json"],
                              capture_output=True, text=True, timeout=300)
        out = proc.stdout or proc.stderr
        return {"status": "success", "report": out}
    except Exception as e:
        return {"status": "error", "message": f"memory analysis failed: {e}"}
