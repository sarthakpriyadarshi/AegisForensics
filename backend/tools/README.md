# Tools Documentation

The `tools/` directory contains the core analysis functions and utilities that power the AI agents. These tools provide the actual forensic analysis capabilities, from memory dump processing to network traffic analysis.

## 🔧 Tool Architecture

Each tool module follows a consistent pattern:
- **Function-based Design**: Discrete analysis functions for specific tasks
- **Google ADK Integration**: Compatible with AI agent framework
- **Error Handling**: Robust error management and logging
- **Standardized I/O**: Consistent input/output formats
- **Tool Context**: Access to session state and user content

## 📋 Tool Catalog

### 1. Memory Analysis Tools
**File:** `memory_tools.py`

**Purpose:** Memory forensics and analysis functions for both dump files and live memory data.

#### Primary Functions

##### `analyze_memory(tool_context: ToolContext) -> dict`
**Description:** Main memory analysis function that processes memory dumps using volatility3 or analyzes live memory data.

**Parameters:**
- `tool_context`: Contains memory dump path or live memory data

**Return Format:**
```python
{
    "status": "success|error",
    "report": "volatility3 output or live analysis results",
    "message": "error description if failed"
}
```

**Capabilities:**
- **Memory Dump Analysis**: 
  - Process enumeration (`windows.pslist`, `linux.pslist`)
  - Network connections (`windows.netstat`, `linux.netstat`)
  - Loaded modules (`windows.modules`, `linux.lsmod`)
  - Registry analysis (`windows.registry.*`)
  - Malware detection (`windows.malfind`, `linux.malfind`)

- **Live Memory Analysis**:
  - Real-time process monitoring
  - Memory usage patterns
  - Network connection tracking
  - Running service analysis
  - System performance metrics

**Usage Example:**
```python
from tools.memory_tools import analyze_memory

# For memory dumps
tool_context.state["memory_path"] = "/path/to/memory.mem"
result = analyze_memory(tool_context)

# For live analysis (automatically detected)
result = analyze_memory(tool_context)
```

**Supported Formats:**
- `.mem` (Raw memory dumps)
- `.lime` (Linux Memory Extractor)
- `.raw` (Raw memory images)
- Live memory data streams

**Dependencies:**
- `volatility3` (for memory dump analysis)
- `psutil` (for live system analysis)
- `subprocess` (for system command execution)

---

### 2. Disk Analysis Tools
**File:** `disk_tools.py`

**Purpose:** Disk forensics and file system analysis tools.

#### Primary Functions

##### `analyze_disk_image(tool_context: ToolContext) -> dict`
**Description:** Comprehensive disk image analysis including file system examination and artifact extraction.

**Parameters:**
- `tool_context`: Contains disk image path and analysis parameters

**Capabilities:**
- **File System Analysis**:
  - Partition table examination
  - File system structure analysis
  - Metadata extraction
  - Deleted file recovery
  - Timeline creation

- **Artifact Extraction**:
  - Browser history and cache
  - Registry hives (Windows)
  - Log files analysis
  - Email artifacts
  - Document metadata

**Usage Example:**
```python
from tools.disk_tools import analyze_disk_image

tool_context.state["disk_path"] = "/path/to/disk.img"
result = analyze_disk_image(tool_context)
```

##### `extract_file_timeline(disk_path: str) -> dict`
**Description:** Creates detailed timeline of file system activities.

**Features:**
- MAC time analysis (Modified, Accessed, Created)
- File signature verification
- Hidden file detection
- Slack space analysis

---

### 3. Network Analysis Tools
**File:** `network_tools.py`

**Purpose:** Network traffic analysis and protocol examination tools.

#### Primary Functions

##### `analyze_network(tool_context: ToolContext) -> dict`
**Description:** Comprehensive network traffic analysis for PCAP files and live network data.

**Parameters:**
- `tool_context`: Contains PCAP file path or network configuration

**Capabilities:**
- **Protocol Analysis**:
  - TCP/UDP stream reconstruction
  - HTTP/HTTPS traffic analysis
  - DNS query examination
  - Email protocol analysis (SMTP, POP3, IMAP)
  - FTP session reconstruction

- **Security Analysis**:
  - Malicious domain detection
  - Port scan identification
  - Data exfiltration detection
  - C&C communication analysis
  - Encrypted traffic metadata

**Usage Example:**
```python
from tools.network_tools import analyze_network

tool_context.state["pcap_path"] = "/path/to/capture.pcap"
result = analyze_network(tool_context)
```

##### `extract_network_indicators(pcap_path: str) -> dict`
**Description:** Extracts IoCs and threat indicators from network traffic.

**Indicators:**
- Suspicious IP addresses
- Malicious domains
- Unusual ports
- Data transfer patterns
- Geographic anomalies

---

### 4. Binary Analysis Tools
**File:** `binary_tools.py`

**Purpose:** Executable file analysis and malware detection tools.

#### Primary Functions

##### `analyze_binary(tool_context: ToolContext) -> dict`
**Description:** Static and dynamic binary analysis for malware detection.

**Parameters:**
- `tool_context`: Contains binary file path and analysis options

**Capabilities:**
- **Static Analysis**:
  - PE/ELF header parsing
  - Import/export table analysis
  - String extraction
  - Entropy analysis
  - Signature detection

- **Dynamic Analysis**:
  - Behavior monitoring
  - API call tracking
  - Network activity monitoring
  - File system modifications
  - Registry changes

**Usage Example:**
```python
from tools.binary_tools import analyze_binary

tool_context.state["binary_path"] = "/path/to/suspicious.exe"
result = analyze_binary(tool_context)
```

##### `extract_strings(binary_path: str) -> list`
**Description:** Extracts readable strings from binary files.

##### `calculate_entropy(binary_path: str) -> float`
**Description:** Calculates file entropy to detect packing/encryption.

---

### 5. Timeline Analysis Tools
**File:** `timeline_tools.py`

**Purpose:** Temporal analysis and event correlation tools.

#### Primary Functions

##### `create_timeline(tool_context: ToolContext) -> dict`
**Description:** Creates comprehensive timeline from multiple data sources.

**Data Sources:**
- File system timestamps
- Log file entries
- Registry modifications
- Network connections
- Process execution records

**Features:**
- Multi-source correlation
- Gap analysis
- Pattern detection
- Anomaly identification
- Event clustering

**Usage Example:**
```python
from tools.timeline_tools import create_timeline

tool_context.state["data_sources"] = [
    "/path/to/filesystem.timeline",
    "/path/to/system.log",
    "/path/to/registry.hive"
]
result = create_timeline(tool_context)
```

---

### 6. User Profile Analysis Tools
**File:** `user_profile_tools.py`

**Purpose:** User behavior analysis and activity profiling tools.

#### Primary Functions

##### `analyze_user_behavior(tool_context: ToolContext) -> dict`
**Description:** Analyzes user activity patterns for anomaly detection.

**Analysis Areas:**
- Login patterns
- File access behaviors
- Application usage
- Network activity
- Privilege usage

**Features:**
- Baseline establishment
- Anomaly detection
- Risk scoring
- Behavior clustering
- Trend analysis

**Usage Example:**
```python
from tools.user_profile_tools import analyze_user_behavior

tool_context.state["user_data"] = {
    "logs": "/path/to/user.logs",
    "activity": "/path/to/activity.json"
}
result = analyze_user_behavior(tool_context)
```

---

### 7. Sandbox Analysis Tools
**File:** `sandbox_tools.py`

**Purpose:** Safe malware execution and behavior analysis tools.

#### Primary Functions

##### `execute_in_sandbox(tool_context: ToolContext) -> dict`
**Description:** Executes suspicious files in isolated environment.

**Safety Features:**
- Network isolation
- File system containment
- Process monitoring
- Resource limitation
- Automatic termination

**Monitoring Capabilities:**
- API call logging
- Network connection attempts
- File modifications
- Registry changes
- Process creation

**Usage Example:**
```python
from tools.sandbox_tools import execute_in_sandbox

tool_context.state["executable"] = "/path/to/malware.exe"
tool_context.state["timeout"] = 300  # 5 minutes
result = execute_in_sandbox(tool_context)
```

---

### 8. Reconnaissance Tools
**File:** `recon_tools.py`

**Purpose:** OSINT gathering and threat intelligence tools.

#### Primary Functions

##### `gather_intelligence(tool_context: ToolContext) -> dict`
**Description:** Collects threat intelligence and reputation data.

**Intelligence Sources:**
- Domain reputation services
- IP geolocation databases
- Malware family databases
- Threat feed aggregators
- Social media intelligence

**Capabilities:**
- IoC reputation lookup
- Threat actor attribution
- Campaign correlation
- Geographic analysis
- Historical analysis

**Usage Example:**
```python
from tools.recon_tools import gather_intelligence

tool_context.state["indicators"] = [
    "malicious-domain.com",
    "192.168.1.100",
    "sha256:abc123..."
]
result = gather_intelligence(tool_context)
```

---

### 9. Custodian Tools
**File:** `custodian_tools.py`

**Purpose:** Evidence integrity and chain of custody tools.

#### Primary Functions

##### `verify_evidence_integrity(tool_context: ToolContext) -> dict`
**Description:** Verifies evidence integrity using cryptographic hashes.

**Features:**
- Multi-algorithm hashing (MD5, SHA1, SHA256, SHA512)
- Digital signature verification
- Tamper detection
- Chain of custody tracking

##### `generate_custody_report(tool_context: ToolContext) -> dict`
**Description:** Creates comprehensive chain of custody documentation.

**Usage Example:**
```python
from tools.custodian_tools import verify_evidence_integrity

tool_context.state["evidence_path"] = "/path/to/evidence.dd"
result = verify_evidence_integrity(tool_context)
```

---

### 10. Live Response Tools
**File:** `live_response_tools.py`

**Purpose:** Real-time system analysis and incident response tools.

#### Primary Functions

##### `collect_live_data(tool_context: ToolContext) -> dict`
**Description:** Collects real-time system data for analysis.

**Data Collection:**
- Running processes
- Network connections
- Open files
- System performance
- Security events

**Response Capabilities:**
- Threat assessment
- Containment recommendations
- Evidence preservation
- Incident documentation

**Usage Example:**
```python
from tools.live_response_tools import collect_live_data

result = collect_live_data(tool_context)
```

---

## 🔄 Tool Integration Patterns

### Agent-Tool Binding
```python
from google.adk.agents import LlmAgent
from tools.memory_tools import analyze_memory

memory_agent = LlmAgent(
    name="MemoryAnalyzer",
    model="gemini-2.0-flash",
    instruction="...",
    tools=[analyze_memory]  # Tool binding
)
```

### Multi-Tool Agents
```python
disk_agent = LlmAgent(
    name="DiskAnalyzer",
    tools=[
        analyze_disk_image,
        extract_file_timeline,
        verify_evidence_integrity
    ]
)
```

### Tool Chaining
```python
# Sequential tool execution
binary_result = analyze_binary(tool_context)
sandbox_result = execute_in_sandbox(tool_context)
intel_result = gather_intelligence(tool_context)
```

## 🛠️ Adding New Tools

### Tool Template
```python
from google.adk.tools import ToolContext
import logging

def your_analysis_function(tool_context: ToolContext) -> dict:
    """
    Your custom analysis function.
    
    Args:
        tool_context: Contains user content, session state, and context
        
    Returns:
        dict: Standardized analysis results
    """
    try:
        # Extract parameters from tool_context
        file_path = tool_context.state.get("file_path")
        
        if not file_path:
            return {"status": "error", "message": "No file path provided"}
        
        # Perform your analysis
        results = perform_analysis(file_path)
        
        return {
            "status": "success",
            "analysis_type": "your_analysis",
            "results": results,
            "metadata": {
                "file_path": file_path,
                "analysis_time": "...",
                "tool_version": "1.0.0"
            }
        }
        
    except Exception as e:
        logging.error(f"Analysis failed: {e}")
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }

def perform_analysis(file_path: str):
    """Your custom analysis logic here"""
    pass
```

### Integration Steps
1. **Create Tool Function**: Add function to appropriate tools file
2. **Define Parameters**: Specify required tool_context state
3. **Implement Logic**: Add analysis functionality
4. **Handle Errors**: Implement robust error handling
5. **Document Usage**: Add function documentation
6. **Test Function**: Verify functionality independently
7. **Bind to Agent**: Add tool to relevant agent

## 📊 Tool Context Usage

### Accessing User Content
```python
def analyze_with_context(tool_context: ToolContext) -> dict:
    # Access user's message content
    user_content = tool_context.user_content
    
    # Extract file paths from user message
    import re
    file_matches = re.findall(r'(\S+\.mem)', str(user_content))
```

### Managing Session State
```python
def stateful_analysis(tool_context: ToolContext) -> dict:
    # Get state
    state = tool_context.state
    
    # Store analysis results
    state["analysis_results"] = results
    
    # Use previous results
    previous_analysis = state.get("previous_analysis", {})
```

### Error Context
```python
def robust_analysis(tool_context: ToolContext) -> dict:
    try:
        # Analysis logic
        return {"status": "success", "results": results}
    except FileNotFoundError as e:
        return {
            "status": "error",
            "error_type": "file_not_found",
            "message": f"File not found: {e}",
            "context": {
                "user_content": str(tool_context.user_content),
                "state_keys": list(tool_context.state.keys())
            }
        }
```

## 🔧 Configuration and Dependencies

### External Tool Dependencies
```python
# Common forensic tools used by functions
TOOL_DEPENDENCIES = {
    "volatility3": "Memory analysis",
    "sleuthkit": "File system analysis", 
    "binwalk": "Binary analysis",
    "wireshark/tshark": "Network analysis",
    "yara": "Malware detection",
    "ssdeep": "Fuzzy hashing",
    "exiftool": "Metadata extraction"
}
```

### Installation Verification
```python
def check_tool_availability():
    """Verify required tools are installed"""
    import shutil
    
    required_tools = ["volatility3", "tshark", "strings"]
    missing_tools = []
    
    for tool in required_tools:
        if not shutil.which(tool):
            missing_tools.append(tool)
    
    return missing_tools
```

## 📈 Performance Optimization

### Caching Strategies
```python
import functools
import hashlib

@functools.lru_cache(maxsize=128)
def cached_hash_analysis(file_path: str, algorithm: str):
    """Cache expensive hash calculations"""
    pass

def smart_caching(tool_context: ToolContext):
    """Context-aware caching"""
    file_path = tool_context.state.get("file_path")
    file_hash = hashlib.sha256(open(file_path, 'rb').read()).hexdigest()
    
    cache_key = f"{file_path}:{file_hash}"
    # Check cache for previous analysis
```

### Parallel Processing
```python
import concurrent.futures
import multiprocessing

def parallel_analysis(file_list: list) -> dict:
    """Process multiple files in parallel"""
    with concurrent.futures.ProcessPoolExecutor(
        max_workers=multiprocessing.cpu_count()
    ) as executor:
        futures = {
            executor.submit(analyze_file, file_path): file_path 
            for file_path in file_list
        }
        
        results = {}
        for future in concurrent.futures.as_completed(futures):
            file_path = futures[future]
            results[file_path] = future.result()
        
        return results
```

## 🔒 Security Considerations

### Input Validation
```python
def secure_file_analysis(tool_context: ToolContext) -> dict:
    """Secure file analysis with validation"""
    file_path = tool_context.state.get("file_path")
    
    # Validate file path
    if not file_path or ".." in file_path:
        return {"status": "error", "message": "Invalid file path"}
    
    # Check file size limits
    import os
    if os.path.getsize(file_path) > MAX_FILE_SIZE:
        return {"status": "error", "message": "File too large"}
    
    # Validate file type
    allowed_types = ['.mem', '.pcap', '.exe', '.dll']
    if not any(file_path.endswith(ext) for ext in allowed_types):
        return {"status": "error", "message": "Unsupported file type"}
```

### Sandboxing
```python
def sandboxed_execution(command: list, timeout: int = 300):
    """Execute commands in restricted environment"""
    import subprocess
    import tempfile
    import os
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Set restricted environment
        env = os.environ.copy()
        env["HOME"] = temp_dir
        env["TMPDIR"] = temp_dir
        
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=env,
                cwd=temp_dir
            )
            return result
        except subprocess.TimeoutExpired:
            return {"error": "Analysis timeout"}
```

## 📚 Testing and Validation

### Unit Testing Template
```python
import unittest
from unittest.mock import Mock, patch
from tools.your_tools import your_analysis_function

class TestYourAnalysisFunction(unittest.TestCase):
    def setUp(self):
        self.tool_context = Mock()
        self.tool_context.state = {}
        self.tool_context.user_content = ""
    
    def test_successful_analysis(self):
        """Test successful analysis flow"""
        self.tool_context.state["file_path"] = "/test/file.mem"
        
        with patch('tools.your_tools.perform_analysis') as mock_analysis:
            mock_analysis.return_value = {"findings": []}
            
            result = your_analysis_function(self.tool_context)
            
            self.assertEqual(result["status"], "success")
            mock_analysis.assert_called_once()
    
    def test_missing_file_path(self):
        """Test error handling for missing file path"""
        result = your_analysis_function(self.tool_context)
        
        self.assertEqual(result["status"], "error")
        self.assertIn("file path", result["message"])
```

### Integration Testing
```python
def test_tool_integration():
    """Test tool integration with actual agents"""
    from agents.memory_analyzer import memory_agent
    
    # Test with sample data
    test_context = create_test_context()
    result = memory_agent.analyze("Test memory analysis", test_context)
    
    assert result is not None
    assert "verdict" in result
```

## 📋 Logging and Debugging

### Logging Configuration
```python
import logging

# Configure tool-specific logging
tool_logger = logging.getLogger("aegis.tools")
tool_logger.setLevel(logging.DEBUG)

def debug_analysis(tool_context: ToolContext) -> dict:
    """Analysis with detailed logging"""
    tool_logger.info("Starting analysis")
    tool_logger.debug(f"Tool context state: {tool_context.state}")
    
    try:
        results = perform_analysis()
        tool_logger.info("Analysis completed successfully")
        return results
    except Exception as e:
        tool_logger.error(f"Analysis failed: {e}", exc_info=True)
        raise
```

### Debug Helpers
```python
def dump_tool_context(tool_context: ToolContext):
    """Debug helper to examine tool context"""
    print("=== Tool Context Debug ===")
    print(f"User Content: {tool_context.user_content}")
    print(f"State Keys: {list(tool_context.state.keys())}")
    print(f"State Values: {tool_context.state}")
    print("========================")
```

---

## 📚 Additional Resources

- **[Agent Documentation](../agents/README.md)**: How agents use tools
- **[API Reference](../README.md#api-reference)**: REST API endpoints
- **[Database Schema](../database/README.md)**: Data storage models
- **[Configuration Guide](../README.md#configuration)**: System setup
- **[Troubleshooting](../README.md#troubleshooting)**: Common issues
