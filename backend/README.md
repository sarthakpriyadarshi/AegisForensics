# Aegis Forensics

<img src="../assets/aegis-logo.png" align="left" width="220"/>

### `Aegis Forensics`

**Aegis Forensics** is an Agentic AI Based digital forensics platform that provides comprehensive analysis capabilities for cybersecurity investigations. Built with cutting-edge AI agents and modern web technologies, it offers automated forensic analysis, live system monitoring, and intelligent threat detection.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](https://github.com/sarthakpriyadarshi/AegisForensics)




<hr>

## 🚀 Features

### Core Capabilities
- **AI-Powered Analysis**: Advanced AI agents specialized in different forensic domains
- **Multi-Platform Support**: Windows, Linux, and macOS forensic analysis
- **Live System Monitoring**: Real-time data collection and analysis
- **Script Generation**: Automated forensic script creation for remote deployment
- **Comprehensive File Support**: Analysis of memory dumps, disk images, network captures, binaries, and logs
- **RESTful API**: Complete API for integration with existing security tools
- **Web Interface**: Interactive dashboard for forensic investigations

### Specialized Analysis Modules
- **Memory Analysis**: RAM dump analysis, process inspection, rootkit detection
- **Disk Forensics**: File system analysis, deleted file recovery, timeline reconstruction
- **Network Analysis**: PCAP analysis, traffic pattern detection, IoC extraction
- **Binary Analysis**: Malware analysis, reverse engineering, behavioral assessment
- **Timeline Analysis**: Event correlation, chronological reconstruction
- **User Profiling**: Behavioral analysis, activity patterns, anomaly detection
- **Live Response**: Real-time system analysis, incident response automation
- **Sandbox Analysis**: Safe malware execution and behavior analysis

---

## 🏗️ Architecture

```
Aegis Forensics
├── 🧠 AI Agents (Specialized Forensic Analysts)
├── 🔧 Tools (Analysis Functions)
├── 📊 Database (Evidence & Case Management)
├── 🌐 API Layer (RESTful Endpoints)
├── 📝 Script Generator (Live Analysis Scripts)
└── 🎯 Orchestrator (Intelligent Routing)
```

### AI Agent Ecosystem
- **ForensicOrchestrator**: Central coordinator for analysis workflows
- **MemoryAnalyzer**: Memory dump and live memory analysis
- **DiskAnalyzer**: Disk image and file system forensics
- **NetworkAnalyzer**: Network traffic and protocol analysis
- **BinaryAnalyzer**: Executable and malware analysis
- **TimelineAnalyzer**: Event timeline reconstruction
- **UserProfiler**: User behavior and activity analysis
- **SandboxAgent**: Controlled malware execution
- **ReconAgent**: Intelligence gathering and OSINT
- **CustodianAgent**: Evidence integrity and chain of custody
- **LiveResponseAgent**: Real-time incident response

---

## 🚦 Quick Start

### Prerequisites
- Python 3.8+
- Virtual environment support
- 4GB+ RAM recommended
- Modern web browser

### Installation

1. **Clone the Repository**
```bash
git clone https://github.com/sarthakpriyadarshi/AegisForensics.git
cd AegisForensics
```

2. **Setup Environment**
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Linux/macOS:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

3. **Configure Environment Variables**
```bash
# Create .env file
cp .env.example .env

# Edit .env and add your Google API key
GOOGLE_API_KEY=your_google_api_key_here
```

4. **Initialize Database**
```bash
python -c "from database.models import init_db; init_db()"
```

5. **Start the Server**
```bash
python main.py
```

6. **Access the Platform**
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Agent Status: http://localhost:8000/api/agents/status

---

## 📡 API Reference

### Base URL
```
http://localhost:8000
```

### Authentication
```bash
# Most endpoints require authentication
curl -H "Authorization: Bearer your_api_key" \
     -H "Content-Type: application/json" \
     http://localhost:8000/api/endpoint
```

### Core Endpoints

#### 1. File Analysis
**Upload and analyze forensic files**

```bash
# Upload file for analysis
curl -X POST "http://localhost:8000/analyze/uploadfile/" \
     -F "file=@evidence.mem" \
     -F "analysis_type=memory"
```

**Expected Input:**
- `file`: Binary file (memory dump, disk image, PCAP, executable, etc.)
- `analysis_type`: `memory|disk|network|binary|comprehensive`

**Expected Output:**
```json
{
  "status": "success",
  "file_id": "uuid-here",
  "analysis": {
    "verdict": "MALICIOUS|SUSPICIOUS|BENIGN",
    "severity": "Critical|High|Medium|Low",
    "confidence": "High|Medium|Low",
    "summary": "Analysis summary",
    "findings": [
      {
        "category": "Process Analysis",
        "description": "Suspicious process detected",
        "severity": "High",
        "evidence": "process_name.exe PID:1234"
      }
    ],
    "technical_details": {
      "file_size": "125MB",
      "file_type": "Memory Dump",
      "analysis_duration": "45.2s"
    },
    "recommendations": [
      "Isolate affected system",
      "Perform deeper memory analysis"
    ]
  }
}
```

#### 2. Live Analysis Stream
**Process live analysis data from generated scripts**

```bash
# Receive live analysis data
curl -X POST "http://localhost:8000/api/stream/live-analysis" \
     -H "Content-Type: application/json" \
     -d '{
       "burst_id": "linux-memory-12345",
       "platform": "linux",
       "analysis_type": "memory",
       "timestamp": "2025-09-13T10:30:00Z",
       "data": {
         "system_info": {...},
         "memory_info": {...},
         "processes": [...]
       }
     }'
```

**Expected Input:**
```json
{
  "burst_id": "string",
  "platform": "linux|windows|macos",
  "analysis_type": "memory|disk|network|comprehensive",
  "timestamp": "ISO-8601 timestamp",
  "data": {
    "system_info": "object",
    "memory_info": "object", 
    "processes": "array",
    "network_connections": "array"
  }
}
```

**Expected Output:**
```json
{
  "status": "success",
  "analysis": {
    "verdict": "BENIGN|SUSPICIOUS|MALICIOUS",
    "severity": "Low|Medium|High|Critical",
    "criticality": "Low|Medium|High|Critical",
    "confidence": "Low|Medium|High",
    "summary": "Live analysis summary",
    "findings": [],
    "technical_details": {},
    "recommendations": []
  }
}
```

#### 3. Script Generation
**Generate platform-specific forensic analysis scripts**

```bash
# Generate forensic script
curl -X POST "http://localhost:8000/api/scripts/generate" \
     -H "Content-Type: application/json" \
     -d '{
       "config": {
         "os": "linux",
         "analysis_type": "memory",
         "server": {
           "host": "forensics.company.com",
           "port": 8000,
           "use_https": true,
           "api_key": "secret123"
         },
         "burst": {
           "enabled": true,
           "interval_seconds": 60,
           "burst_count": 5,
           "batch_size_kb": 100
         },
         "include_system_info": true,
         "include_environment": true,
         "stealth_mode": false
       }
     }'
```

**Expected Input:**
```json
{
  "config": {
    "os": "linux|windows|macos",
    "analysis_type": "memory|disk|network|comprehensive",
    "server": {
      "host": "string",
      "port": "integer",
      "use_https": "boolean", 
      "api_key": "string"
    },
    "burst": {
      "enabled": "boolean",
      "interval_seconds": "integer",
      "burst_count": "integer",
      "batch_size_kb": "integer"
    },
    "include_system_info": "boolean",
    "include_environment": "boolean",
    "stealth_mode": "boolean"
  }
}
```

**Expected Output:**
```json
{
  "script_id": "uuid-here",
  "filename": "aegis_linux_memory_analysis.py",
  "script_content": "#!/usr/bin/env python3\n...",
  "config_summary": {
    "platform": "linux",
    "analysis_type": "memory",
    "server_endpoint": "https://forensics.company.com:8000"
  },
  "deployment_instructions": [
    "Transfer script to target system",
    "Make executable: chmod +x script.py",
    "Run: python3 script.py"
  ]
}
```

#### 4. Script Download
**Download ready-to-deploy forensic scripts**

```bash
# Download script directly
curl -X POST "http://localhost:8000/api/scripts/download" \
     -H "Content-Type: application/json" \
     -d '{"config": {...}}' \
     --output forensic_script.py
```

#### 5. Agent Status
**Check the status of all forensic agents**

```bash
# Get agent status
curl -X GET "http://localhost:8000/api/agents/status"
```

**Expected Output:**
```json
{
  "status": "operational",
  "agents": {
    "MemoryAnalyzer": {
      "status": "active",
      "specialization": "Memory dump analysis",
      "last_analysis": "2025-09-13T10:30:00Z"
    },
    "DiskAnalyzer": {
      "status": "active", 
      "specialization": "Disk image forensics"
    }
  },
  "system_health": {
    "uptime": "2h 30m",
    "memory_usage": "45%",
    "active_analyses": 3
  }
}
```

#### 6. Case Management
**Manage forensic cases and evidence**

```bash
# List cases
curl -X GET "http://localhost:8000/api/cases"

# Create new case
curl -X POST "http://localhost:8000/api/cases" \
     -H "Content-Type: application/json" \
     -d '{
       "case_name": "Incident-2025-001",
       "description": "Suspected malware infection",
       "investigator": "John Doe"
     }'
```

#### 7. Health Check
**System health and status verification**

```bash
# Health check
curl -X GET "http://localhost:8000/health"
```

**Expected Output:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": "2h 30m 45s",
  "database": "connected",
  "ai_agents": "operational"
}
```

---

## 🛠️ Development

### Project Structure
```
AegisForensics/
├── agents/           # AI forensic specialists
├── tools/            # Analysis functions
├── database/         # Data models and utilities  
├── schemas/          # API schemas and validation
├── services/         # Business logic services
├── templates/        # Script generation templates
├── logs/            # Application logs
├── main.py          # FastAPI application
├── requirements.txt # Python dependencies
└── README.md        # This file
```

### Adding New Agents
1. Create agent file in `agents/` directory
2. Implement specialized analysis logic
3. Add corresponding tools in `tools/` directory
4. Register agent in orchestrator
5. Update API documentation

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📁 Module Documentation

Each module has detailed documentation:

- **[Agents](agents/README.md)** - AI forensic specialists and their capabilities
- **[Tools](tools/README.md)** - Core analysis functions and utilities
- **[Database](database/README.md)** - Data models, schemas, and database operations
- **[Schemas](schemas/README.md)** - API validation and data structures
- **[Services](services/README.md)** - Business logic and service implementations
- **[Templates](templates/README.md)** - Script generation templates and examples

---

## ⚙️ Configuration

### Environment Variables
```bash
# Required
GOOGLE_API_KEY=your_google_api_key

# Optional
DEBUG=false
LOG_LEVEL=INFO
DATABASE_URL=sqlite:///aegis_forensics.db
API_HOST=0.0.0.0
API_PORT=8000
```

### Performance Tuning
- **Memory**: Minimum 4GB RAM, 8GB+ recommended for large files
- **Storage**: SSD recommended for faster I/O operations
- **CPU**: Multi-core processor for parallel analysis
- **Network**: Stable connection for live analysis scripts

---

## 🔒 Security Considerations

### Best Practices
- Use HTTPS in production environments
- Implement proper API key management
- Regular security updates and patches
- Secure evidence storage and handling
- Access control and audit logging

### Data Protection
- Evidence integrity verification
- Chain of custody maintenance
- Secure data transmission
- Encrypted storage options

---

## 🐛 Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check port availability
lsof -i :8000

# Kill existing processes
pkill -f "python main.py"

# Restart with debug mode
DEBUG=true python main.py
```

#### API Key Issues
```bash
# Verify API key in environment
echo $GOOGLE_API_KEY

# Check .env file
cat .env | grep GOOGLE_API_KEY
```

#### Memory Analysis Errors
- Ensure sufficient RAM available
- Check file format compatibility
- Verify volatility3 installation (if using memory dumps)

### Getting Help
- Check the [Issues](https://github.com/sarthakpriyadarshi/AegisForensics/issues) page
- Review agent-specific documentation
- Enable debug logging for detailed error information

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Support

- **Documentation**: [Full Documentation](docs/)
- **Issues**: [GitHub Issues](https://github.com/sarthakpriyadarshi/AegisForensics/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sarthakpriyadarshi/AegisForensics/discussions)
- **Email**: support@aegisforensics.com

---

## 🌟 Acknowledgments

- Google AI for powerful language models
- FastAPI for excellent web framework
- Open source forensic tools community
- Cybersecurity research community

---

**Built with ❤️ for the cybersecurity community**
