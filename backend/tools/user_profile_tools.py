# tools/user_profile_tools.py
import subprocess
from google.adk.tools import ToolContext
import os
import re

def user_profile(tool_context: ToolContext) -> dict:
    """
    Analyze user behavior patterns from log files and user data.
    
    First tries to get user_profile_path from the session state,
    then falls back to extracting paths from user content.
    """
    target_path = None
    
    # Try to get path from session state first
    state = tool_context.state
    print("[DEBUG] State type:", type(state))
    
    # Try using to_dict() method
    if hasattr(state, 'to_dict'):
        state_dict = state.to_dict()
        target_path = state_dict.get("user_profile_path")
        print("[DEBUG] user_profile_path from to_dict():", target_path)
    
    # If still no path, try the get method
    if not target_path and hasattr(state, 'get'):
        target_path = state.get("user_profile_path")
        print("[DEBUG] user_profile_path via get():", target_path)
    
    # If no path from state, try to extract from user content
    if not target_path:
        # Get user content from the conversation context
        user_content = ""
        try:
            # Try to get the user's most recent message content
            # This is where file paths would be mentioned
            if hasattr(tool_context, 'messages') and tool_context.messages:
                user_content = str(tool_context.messages[-1].get('content', ''))
            elif hasattr(tool_context, 'request') and tool_context.request:
                user_content = str(tool_context.request)
            elif hasattr(tool_context, 'user_content') and tool_context.user_content:
                user_content = str(tool_context.user_content)
            else:
                user_content = str(tool_context)
        except:
            user_content = ""
        
        print(f"DEBUG: User profile tool received content: {user_content[:200]}...")
        
        # Extract file paths from user content (for system/user data analysis)
        file_patterns = [
            r'/tmp/[^\s]+',  # Files in /tmp directory
            r'/home/[^\s]+', # Files in home directories
            r'/var/[^\s]+',  # System files in /var
            r'/etc/[^\s]+',  # Configuration files
            r'[^\s]*\.log',  # Log files
            r'[^\s]*\.txt',  # Text files
            r'[^\s]*\.csv',  # CSV files
            r'[^\s]*\.json', # JSON files
        ]
        
        extracted_paths = []
        for pattern in file_patterns:
            matches = re.findall(pattern, user_content)
            extracted_paths.extend(matches)
        
        if extracted_paths:
            print(f"DEBUG: Extracted file paths from user content: {extracted_paths}")
            # Use the first extracted path as primary target
            target_path = extracted_paths[0]
        else:
            target_path = None
    
    print(f"[DEBUG] Final target_path for user profiling: {target_path}")
    
    if target_path:
        # Analyze the specified file/directory for user profiling
        try:
            if os.path.isfile(target_path):
                # Analyze individual file
                result = _analyze_user_file(target_path)
            elif os.path.isdir(target_path):
                # Analyze directory for user artifacts
                result = _analyze_user_directory(target_path)
            else:
                return {"status": "error", "message": f"Path not found: {target_path}"}
            
            result["analyzed_path"] = target_path
            return result
            
        except Exception as e:
            return {"status": "error", "message": f"Analysis failed for {target_path}: {str(e)}"}
    
    # Fallback to generic user profiling if no specific paths provided
    print("DEBUG: No file paths found, performing generic user profiling")
    username = state.get("username", "unknown") if 'state' in locals() else "unknown"
    
    try:
        # Attempt to fetch shell history and browser history (simplified)
        home = os.path.expanduser(f"~{username}")
        bash_hist = os.path.join(home, ".bash_history")
        browser_hist = os.path.join(home, ".mozilla", "firefox")
        hist_sample = ""
        if os.path.exists(bash_hist):
            with open(bash_hist, "r", errors="ignore") as f:
                hist_sample = f.read()[-2000:]
        return {"status": "success", "report": {"bash_history_tail": hist_sample, "username": username}}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def _analyze_user_file(file_path):
    """Analyze a specific file for user profiling information"""
    try:
        stat_info = os.stat(file_path)
        file_size = stat_info.st_size
        
        # Try to read file content for analysis
        content_sample = ""
        if file_size < 1024 * 1024:  # Only read files smaller than 1MB
            try:
                with open(file_path, 'r', errors='ignore') as f:
                    content_sample = f.read()[:1000]  # First 1000 chars
            except:
                content_sample = "Binary or unreadable file"
        
        return {
            "status": "success",
            "report": {
                "file_path": file_path,
                "file_size": file_size,
                "content_sample": content_sample,
                "analysis": "File analyzed for user profiling data"
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def _analyze_user_directory(dir_path):
    """Analyze a directory for user artifacts and profiling data"""
    try:
        files = []
        for root, dirs, filenames in os.walk(dir_path):
            for filename in filenames[:20]:  # Limit to first 20 files
                full_path = os.path.join(root, filename)
                try:
                    stat_info = os.stat(full_path)
                    files.append({
                        "name": filename,
                        "path": full_path,
                        "size": stat_info.st_size
                    })
                except:
                    continue
            if len(files) >= 20:  # Don't analyze too many files
                break
        
        return {
            "status": "success", 
            "report": {
                "directory": dir_path,
                "files_found": len(files),
                "files": files,
                "analysis": "Directory analyzed for user profiling artifacts"
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
