# Agents Documentation

The `agents/` directory contains specialized AI forensic analysts, each designed to handle specific aspects of digital forensics investigations. These agents work together under the coordination of the ForensicOrchestrator to provide comprehensive analysis capabilities.

## 🧠 Agent Architecture

Each agent is built using Google's AI Development Kit (ADK) and follows a consistent pattern:
- **Specialized Instructions**: Domain-specific forensic knowledge
- **Tool Integration**: Access to relevant analysis tools
- **JSON Response Format**: Standardized output for integration
- **Error Handling**: Robust error management and fallback strategies

## 📋 Agent Catalog

### 1. ForensicOrchestrator
**File:** `forensic_orchestrator.py`

**Purpose:** Central coordinator that routes analysis requests to appropriate specialist agents based on file type and analysis requirements.

**Capabilities:**
- Intelligent agent selection and routing
- Multi-agent coordination for complex analyses
- Result aggregation and synthesis
- Quality control and validation

**When to Use:**
- Complex multi-stage analyses
- Unknown file types requiring classification
- Comprehensive forensic investigations
- Integration with multiple analysis tools

**Example Usage:**
```python
# Orchestrator automatically selects appropriate agents
result = orchestrator.analyze(file_path, analysis_type="comprehensive")
```

---

### 2. MemoryAnalyzer
**File:** `memory_analyzer.py`

**Purpose:** Specialized in memory forensics, analyzing both memory dumps and live memory data for security indicators.

**Capabilities:**
- Memory dump analysis using volatility3
- Live memory data interpretation
- Process injection detection
- Rootkit and malware identification
- Network connection analysis from memory
- Timeline reconstruction from memory artifacts

**Supported Formats:**
- `.mem` (Raw memory dumps)
- `.lime` (Linux Memory Extractor)
- `.raw` (Raw memory images)
- Live memory data streams

**Analysis Features:**
- Running process enumeration
- DLL/module analysis
- Network connection mapping
- Registry activity detection
- Hidden process identification
- Memory-resident malware detection

**Response Format:**
```json
{
  "verdict": "MALICIOUS|SUSPICIOUS|BENIGN",
  "severity": "Critical|High|Medium|Low",
  "confidence": "High|Medium|Low",
  "findings": [
    {
      "category": "Process Analysis",
      "description": "Suspicious process injection detected",
      "severity": "High",
      "evidence": "Process svchost.exe PID:1234 injected into explorer.exe"
    }
  ],
  "technical_details": {
    "total_processes": "156",
    "active_connections": "23",
    "suspicious_processes": ["malware.exe", "suspicious.dll"]
  }
}
```

---

### 3. DiskAnalyzer
**File:** `disk_analyzer.py`

**Purpose:** Comprehensive disk forensics including file system analysis, deleted file recovery, and storage device examination.

**Capabilities:**
- File system analysis (NTFS, EXT4, FAT32, etc.)
- Deleted file recovery and analysis
- Metadata extraction and timeline creation
- Hidden data detection
- Partition analysis
- Master File Table (MFT) analysis

**Supported Formats:**
- `.img` (Disk images)
- `.dd` (Raw disk dumps)
- `.ewf` (Expert Witness Format)
- `.aff` (Advanced Forensic Format)
- `.vmdk` (VMware disk images)

**Analysis Features:**
- File signature verification
- Timestamp analysis
- File carving and recovery
- Registry hive analysis
- Log file examination
- Artifact extraction

**Key Functions:**
- Timeline reconstruction
- Evidence preservation
- Chain of custody maintenance
- Hash verification
- Steganography detection

---

### 4. NetworkAnalyzer
**File:** `network_analyzer.py`

**Purpose:** Network traffic analysis and protocol examination for detecting malicious communications and network-based attacks.

**Capabilities:**
- PCAP file analysis
- Protocol dissection (TCP, UDP, HTTP, DNS, etc.)
- Traffic pattern analysis
- Malicious domain detection
- Data exfiltration identification
- Network IoC extraction

**Supported Formats:**
- `.pcap` (Packet capture files)
- `.pcapng` (Next generation packet capture)
- `.cap` (Capture files)
- Live network streams

**Analysis Features:**
- Flow analysis and reconstruction
- DNS query examination
- HTTP/HTTPS traffic analysis
- Encrypted traffic metadata analysis
- Geographic IP analysis
- Bandwidth utilization patterns

**Detection Capabilities:**
- Command and control communications
- Data exfiltration attempts
- Lateral movement indicators
- Port scanning activities
- DNS tunneling
- Suspicious TLS certificates

---

### 5. BinaryAnalyzer
**File:** `binary_analyzer.py`

**Purpose:** Executable file analysis, malware detection, and reverse engineering capabilities for identifying malicious software.

**Capabilities:**
- Static binary analysis
- Dynamic behavior analysis
- Malware family classification
- Packer detection and unpacking
- API call analysis
- String extraction and analysis

**Supported Formats:**
- `.exe` (Windows executables)
- `.dll` (Dynamic Link Libraries)
- `.so` (Shared objects - Linux)
- `.bin` (Binary files)
- `.app` (macOS applications)

**Analysis Techniques:**
- PE/ELF header analysis
- Import/export table examination
- Entropy analysis for packing detection
- Signature-based detection
- Behavioral pattern analysis
- Code flow analysis

**Security Features:**
- Sandbox execution environment
- Safe analysis container
- Automated detonation
- IoC extraction
- Family attribution

---

### 6. TimelineAnalyzer
**File:** `timeline_agent.py`

**Purpose:** Temporal analysis and event correlation to reconstruct incident timelines and identify attack sequences.

**Capabilities:**
- Multi-source timeline creation
- Event correlation and clustering
- Temporal pattern analysis
- Attack sequence reconstruction
- Anomaly detection in timelines
- Evidence synchronization

**Data Sources:**
- File system timestamps
- Log file entries
- Registry modifications
- Network connection logs
- Process execution records
- Memory artifacts

**Analysis Features:**
- Chronological event ordering
- Gap analysis and detection
- Event significance scoring
- Pattern recognition
- Causal relationship identification
- Timeline visualization data

---

### 7. UserProfiler
**File:** `user_profiler_agent.py`

**Purpose:** User behavior analysis and activity profiling to identify anomalous user actions and insider threats.

**Capabilities:**
- User activity pattern analysis
- Behavioral baseline establishment
- Anomaly detection in user actions
- Access pattern analysis
- Privilege escalation detection
- Insider threat identification

**Analysis Areas:**
- Login/logout patterns
- File access behaviors
- Application usage patterns
- Network access patterns
- Administrative actions
- Data access patterns

**Behavioral Indicators:**
- Unusual access times
- Abnormal data volumes
- Privilege misuse
- Lateral movement
- Data exfiltration patterns
- Social engineering indicators

---

### 8. SandboxAgent
**File:** `sandbox_agent.py`

**Purpose:** Controlled malware execution and behavior analysis in isolated environments for safe malware research.

**Capabilities:**
- Isolated execution environment
- Real-time behavior monitoring
- Network traffic capture
- File system monitoring
- Registry change tracking
- API call logging

**Safety Features:**
- Complete network isolation
- Snapshot and rollback capability
- Resource limitation
- Automated analysis termination
- Secure evidence collection
- Contamination prevention

**Analysis Outputs:**
- Behavioral reports
- Network indicators
- File modifications
- Registry changes
- API interactions
- Performance metrics

---

### 9. ReconAgent
**File:** `recon_agent.py`

**Purpose:** Open Source Intelligence (OSINT) gathering and threat intelligence correlation for enhanced context.

**Capabilities:**
- Threat intelligence lookup
- IoC reputation checking
- Domain/IP intelligence gathering
- Malware family attribution
- Campaign correlation
- Threat actor profiling

**Intelligence Sources:**
- Public threat feeds
- Reputation databases
- Malware family databases
- Campaign tracking systems
- Attribution intelligence
- Geolocation services

**Correlation Features:**
- Multi-source data fusion
- Confidence scoring
- Historical analysis
- Trend identification
- Threat landscape context
- Strategic intelligence

---

### 10. CustodianAgent
**File:** `custodian_agent.py`

**Purpose:** Evidence integrity, chain of custody maintenance, and forensic documentation management.

**Capabilities:**
- Evidence integrity verification
- Chain of custody tracking
- Documentation generation
- Audit trail maintenance
- Compliance verification
- Report standardization

**Integrity Features:**
- Hash verification
- Digital signatures
- Tamper detection
- Version control
- Access logging
- Modification tracking

**Documentation:**
- Analysis reports
- Chain of custody forms
- Evidence manifests
- Audit logs
- Compliance reports
- Court-ready documentation

---

### 11. LiveResponseAgent
**File:** `live_response_agent.py`

**Purpose:** Real-time incident response and live system analysis for active threat situations.

**Capabilities:**
- Live system analysis
- Real-time threat detection
- Incident response automation
- Evidence preservation
- Containment recommendations
- Rapid triage

**Response Features:**
- Immediate threat assessment
- Containment strategy development
- Evidence collection prioritization
- Communication coordination
- Escalation procedures
- Recovery planning

**Real-time Analysis:**
- Process monitoring
- Network connection tracking
- File system monitoring
- Registry surveillance
- Memory analysis
- Performance monitoring

---

## 🔄 Agent Interaction Patterns

### Orchestrated Analysis
```python
# Multi-agent coordinated analysis
result = orchestrator.analyze(
    file_path="/evidence/memory.mem",
    analysis_type="comprehensive"
)
# Orchestrator routes to MemoryAnalyzer, then correlates with TimelineAnalyzer
```

### Direct Agent Access
```python
# Direct agent invocation for specialized analysis
memory_result = memory_agent.analyze(memory_dump)
network_result = network_agent.analyze(pcap_file)
```

### Agent Chaining
```python
# Sequential agent processing
binary_analysis = binary_agent.analyze(suspicious_exe)
sandbox_analysis = sandbox_agent.execute(suspicious_exe, binary_analysis.iocs)
intel_context = recon_agent.lookup(binary_analysis.indicators)
```

## 🛠️ Adding New Agents

### Agent Template
```python
from google.adk.agents import LlmAgent
from tools.your_tools import your_analysis_function

your_agent = LlmAgent(
    name="YourAnalyzer",
    model="gemini-2.0-flash",
    instruction="""
    You are a specialized forensic analyst for [domain].
    
    RESPONSE FORMAT: Return only JSON without markdown.
    
    ANALYSIS PROCESS:
    1. Use your_analysis_function to examine evidence
    2. Identify [specific indicators]
    3. Assess threat level and confidence
    4. Provide actionable recommendations
    
    JSON Structure:
    {
      "verdict": "MALICIOUS|SUSPICIOUS|BENIGN",
      "severity": "Critical|High|Medium|Low",
      "confidence": "High|Medium|Low",
      "summary": "Brief analysis summary",
      "findings": [...],
      "technical_details": {...},
      "recommendations": [...]
    }
    """,
    tools=[your_analysis_function]
)
```

### Integration Steps
1. **Create Agent File**: Add new agent in `agents/` directory
2. **Implement Tools**: Add supporting functions in `tools/` directory
3. **Register Agent**: Add to `forensic_orchestrator.py`
4. **Update API**: Add new endpoints if needed
5. **Test Integration**: Verify agent functionality
6. **Document Usage**: Update this documentation

## 🔧 Configuration

### Model Configuration
All agents use the `gemini-2.0-flash` model by default. To change:

```python
FORGE_MODEL = "your-preferred-model"
```

### Performance Tuning
- **Timeout Settings**: Adjust analysis timeouts based on file sizes
- **Memory Limits**: Configure memory usage for large file analysis
- **Parallel Processing**: Enable concurrent agent execution
- **Caching**: Implement result caching for repeated analyses

## 📊 Monitoring and Logging

### Agent Performance Metrics
- Analysis completion times
- Success/failure rates
- Resource utilization
- Error patterns
- Queue depths

### Logging Levels
- **DEBUG**: Detailed analysis steps
- **INFO**: Analysis milestones
- **WARNING**: Non-critical issues
- **ERROR**: Analysis failures
- **CRITICAL**: System-level problems

## 🚨 Error Handling

### Common Error Scenarios
1. **File Format Issues**: Unsupported or corrupted files
2. **Resource Constraints**: Memory or disk space limitations
3. **Tool Dependencies**: Missing analysis tools or libraries
4. **Network Issues**: External service unavailability
5. **Model Limits**: Token or rate limiting

### Recovery Strategies
- **Graceful Degradation**: Partial analysis when tools fail
- **Fallback Agents**: Alternative analysis methods
- **Retry Logic**: Automatic retry with backoff
- **User Notification**: Clear error reporting
- **Logging**: Detailed error information for debugging

## 🔒 Security Considerations

### Agent Security
- **Sandboxed Execution**: Isolated analysis environments
- **Input Validation**: Strict file type and size validation
- **Output Sanitization**: Clean response data
- **Access Controls**: Role-based agent access
- **Audit Logging**: Complete action tracking

### Evidence Integrity
- **Hash Verification**: File integrity checking
- **Chain of Custody**: Complete audit trail
- **Tamper Detection**: Modification detection
- **Secure Storage**: Encrypted evidence storage
- **Access Logging**: Complete access tracking

---

## 📚 Additional Resources

- **[Tool Documentation](../tools/README.md)**: Detailed tool specifications
- **[API Reference](../README.md#api-reference)**: Complete API documentation
- **[Database Schema](../database/README.md)**: Data models and relationships
- **[Configuration Guide](../README.md#configuration)**: Setup and tuning
- **[Troubleshooting](../README.md#troubleshooting)**: Common issues and solutions
