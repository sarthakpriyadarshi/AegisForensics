# tools/binary_tools.py
import subprocess
import re
from google.adk.tools import ToolContext

def analyze_binary(tool_context: ToolContext) -> dict:
    """
    Analyze a binary file by extracting strings and running rabin2 if available.
    
    First tries to get binary_path from the user's request text,
    then falls back to tool_context state.
    """
    binary_path = None
    
    # Try to extract binary path from user content
    if hasattr(tool_context, 'user_content') and tool_context.user_content:
        # Look for file paths in the user content
        content = str(tool_context.user_content)
        print(f"[DEBUG] User content: {content}")
        
        # Try to find paths like '/tmp/xxx_file.exe' or similar
        path_patterns = [
            r"'([^']+\.exe)'",  # Paths in single quotes ending with .exe
            r'"([^"]+\.exe)"',  # Paths in double quotes ending with .exe
            r'(\S+\.exe)',      # Any non-whitespace sequence ending with .exe
            r'(\S*/tmp/\S+)',   # Any path starting with /tmp/
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
        print("[DEBUG] State _value:", state._value if hasattr(state, '_value') else 'No _value')
        print("[DEBUG] State _delta:", state._delta if hasattr(state, '_delta') else 'No _delta')
        print("[DEBUG] State to_dict():", state.to_dict() if hasattr(state, 'to_dict') else 'No to_dict')
        
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
        # run comprehensive binary analysis
        analysis_results = {}
        
        # 1. Basic file information
        try:
            file_proc = subprocess.run(["file", binary_path], capture_output=True, text=True, timeout=10)
            analysis_results["file_info"] = file_proc.stdout.strip() if file_proc.stdout else "Unknown file type"
        except:
            analysis_results["file_info"] = "File command failed"
        
        # 2. Strings analysis
        try:
            strings_proc = subprocess.run(["strings", binary_path], capture_output=True, text=True, timeout=30)
            analysis_results["strings_sample"] = strings_proc.stdout[:3000] if strings_proc.stdout else "No strings found"
        except:
            analysis_results["strings_sample"] = "Strings analysis failed"
        
        # 3. Binary information (rabin2)
        try:
            rabin_proc = subprocess.run(["rabin2", "-I", binary_path], capture_output=True, text=True, timeout=20)
            analysis_results["binary_info"] = rabin_proc.stdout if rabin_proc.stdout else "No binary info available"
        except:
            analysis_results["binary_info"] = "rabin2 not available"
        
        # 4. Import analysis
        try:
            imports_proc = subprocess.run(["rabin2", "-i", binary_path], capture_output=True, text=True, timeout=20)
            analysis_results["imports"] = imports_proc.stdout if imports_proc.stdout else "No imports found"
        except:
            analysis_results["imports"] = "Import analysis failed"
        
        # 5. Sections analysis
        try:
            sections_proc = subprocess.run(["rabin2", "-S", binary_path], capture_output=True, text=True, timeout=20)
            analysis_results["sections"] = sections_proc.stdout if sections_proc.stdout else "No sections found"
        except:
            analysis_results["sections"] = "Sections analysis failed"
        
        # 6. Entropy analysis
        try:
            entropy_proc = subprocess.run(["rabin2", "-I", binary_path], capture_output=True, text=True, timeout=20)
            analysis_results["entropy_info"] = entropy_proc.stdout if entropy_proc.stdout else "No entropy data"
        except:
            analysis_results["entropy_info"] = "Entropy analysis failed"
        
        return {"status": "success", "report": analysis_results, "analyzed_file": binary_path}
    except Exception as e:
        return {"status": "error", "message": str(e)}
