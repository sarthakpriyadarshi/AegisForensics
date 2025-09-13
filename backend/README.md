# Aegis Forensics

<img src="../assets/aegis-logo.png" align="left" width="220"/>

### `Aegis Forensics

 is an Agentic AI Based digital forensics platform that provides comprehensive analysis capabilities for cybersecurity investigations. Built with cutting-edge AI agents and modern web technologies, it offers automated forensic analysis, live system monitoring, and intelligent threat detection.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](https://github.com/sarthakpriyadarshi/AegisForensics)




<hr>

## 🚀 Features

### Core Capabilities
- **AI-Powered Analysis**: Advanced AI agents specialized in different forensic domains
- **JWT Authentication**: Secure bearer token authentication with password policies
- **Single Admin User**: One admin user system with 90-day password rotation
- **System Monitoring**: Real-time system information and health monitoring
- **Automated Backups**: Manual and automatic backup functionality
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
cd backend
uv run main.py
# or
python main.py
```

6. **Initial Setup**
- First, create an admin user at: http://localhost:8000/auth/setup-admin
- Then login to get JWT token: http://localhost:8000/auth/login
- Use the JWT token for all subsequent API calls

7. **Access the Platform**
- Root Status: http://localhost:8000/
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

---
### Basic Setups

1. **Configure Environment Variables**
```bash
# Create .env file
cp .env.sample .env

# Edit .env and add your configuration
GOOGLE_API_KEY=your_google_api_key_here
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

2. **Database Initialization**
The database will be automatically created when you start the server for the first time. The system uses SQLite by default and will create the file `aegis_forensics.db` in the backend directory.

3. **Start the Server**
 <hr>

## 📡 API Reference

### Base URL
```
http://localhost:8000
```

### Authentication
**JWT Bearer Token Required for all endpoints except initial admin setup**

```bash
# Login to get JWT token
curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@company.com", "password": "your_password"}'

# Use JWT token for authenticated requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:8000/api/endpoint
```

### Core Endpoints

#### 0. Admin Setup (First Time Only)
**Create the initial admin user - only available when no admin exists**

```bash
# Create admin user (first time setup)
curl -X POST "http://localhost:8000/auth/setup-admin" \
     -H "Content-Type: application/json" \
     -d '{
       "full_name": "John Doe",
       "email": "admin@company.com",
       "organization": "Cybersecurity Corp",
       "timezone": "UTC",
       "password": "secure_password_123",
       "avatar_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
     }'
```

**Expected Output:**
```json
```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "admin@company.com", 
  "organization": "Cybersecurity Corp",
  "timezone": "UTC",
  "is_admin": true,
  "is_active": true,
  "last_password_change": "2024-01-01T12:00:00",
  "avatar_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```
```

#### 0.1. Authentication
**Login and user management**

```bash
# Login to get JWT token
curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@company.com",
       "password": "secure_password_123"
     }'

# Get current user info
curl -X GET "http://localhost:8000/auth/me" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update user profile (including avatar)
curl -X PUT "http://localhost:8000/auth/profile" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "full_name": "John Smith",
       "organization": "Updated Corp",
       "timezone": "EST",
       "avatar_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
     }'

# Change password
curl -X POST "http://localhost:8000/auth/change-password" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "current_password": "old_password",
       "new_password": "new_secure_password"
     }'

# Check password status
curl -X GET "http://localhost:8000/auth/password-status" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Login Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

#### 0.2. System Information
**Get comprehensive system status and create backups**

```bash
# Get system information
curl -X GET "http://localhost:8000/system/info" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create manual backup
curl -X POST "http://localhost:8000/system/backup" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "backup_name": "incident_backup_2025",
       "include_logs": true,
       "include_database": true
     }'

# List all backups
curl -X GET "http://localhost:8000/system/backups" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Delete a backup
curl -X DELETE "http://localhost:8000/system/backup/backup_name" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**System Info Response:**
```json
{
  "version": "AegisForensic v2.1.0",
  "uptime": "7 days, 14 hours",
  "cpu_usage": "23%",
  "memory_usage": "4.2 GB / 16 GB",
  "disk_usage": "156 GB / 500 GB",
  "active_connections": 47,
  "last_update": "2025-09-14",
  "platform": "Linux",
  "platform_version": "5.15.0",
  "python_version": "3.13.7",
  "hostname": "forensics-server"
}
```

**Backup Response:**
```json
{
  "backup_id": "550e8400-e29b-41d4-a716-446655440000",
  "backup_name": "incident_backup_2025",
  "backup_path": "/home/user/aegis-forensics/backend/backups/incident_backup_2025.zip",
  "created_at": "2025-09-14T10:30:00Z",
  "size_mb": 125.4,
  "status": "completed"
}
```

#### 1. File Analysis
**Upload and analyze forensic files**

```bash
# Upload file for analysis (requires authentication)
curl -X POST "http://localhost:8000/analyze/uploadfile/" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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
# Receive live analysis data (requires authentication)
curl -X POST "http://localhost:8000/api/stream/live-analysis" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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
# Generate forensic script (requires authentication)
curl -X POST "http://localhost:8000/api/scripts/generate" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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
# Download script directly (requires authentication)
curl -X POST "http://localhost:8000/api/scripts/download" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"config": {...}}' \
     --output forensic_script.py
```

#### 5. Agent Status
**Check the status of all forensic agents**

```bash
# Get agent status (requires authentication)
curl -X GET "http://localhost:8000/api/agents/status" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
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
# List cases (requires authentication)
curl -X GET "http://localhost:8000/api/cases" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create new case (requires authentication)
curl -X POST "http://localhost:8000/api/cases" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "case_name": "Incident-2025-001",
       "description": "Suspected malware infection",
       "investigator": "John Doe"
     }'
```

#### 7. Health Check & Root Endpoint
**System health and initial setup status**

```bash
# Root endpoint - shows setup status (no auth required)
curl -X GET "http://localhost:8000/"

# Health check (no auth required)
curl -X GET "http://localhost:8000/health"
```

**Root Endpoint Response:**
```json
{
  "message": "Aegis Forensics API",
  "version": "2.1.0",
  "admin_setup_required": false,
  "setup_endpoint": null,
  "docs": "/docs",
  "status": "ready"
}
```

**Health Check Response:**
```json
{
  "status": "healthy",
  "version": "2.1.0",
  "uptime": "2h 30m 45s",
  "database": "connected",
  "ai_agents": "operational"
}
```

---

## 🔐 Authentication & Security

### Initial Setup Flow
1. **First Time Setup**: When no admin user exists, only the `/auth/setup-admin` endpoint is accessible
2. **Admin Creation**: Create the single admin user with full name, email, organization, and timezone
3. **Login**: Use `/auth/login` to get a JWT token (valid for 24 hours)
4. **Protected Access**: All other endpoints require the JWT token in the Authorization header

### Security Features
- **Single Admin User**: Only one admin user allowed per system
- **JWT Authentication**: Secure bearer token authentication
- **Password Policy**: Passwords must be changed every 90 days
- **Password Expiration**: System blocks access when password expires
- **Secure Storage**: Passwords are hashed using bcrypt
- **Database Security**: Automatic database file creation with integrity checks
- **Backup System**: Manual and automatic backup capabilities

### User Management
- **Password Changes**: Admin can change password via `/auth/change-password`
- **Password Status**: Check password expiration via `/auth/password-status`
- **User Info**: View current user details via `/auth/me`
- **Profile Updates**: Update user information and avatar via `/auth/profile`
- **Avatar Support**: Profile pictures stored as base64 encoded images
- **Session Management**: JWT tokens automatically expire after 24 hours

### Avatar Functionality
- **Format**: Base64 encoded images (JPEG, PNG, GIF supported)
- **Storage**: Images stored directly in database as text
- **Format Example**: `"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."`
- **Size Limit**: Recommended maximum 1MB per image
- **Usage**: Include in user creation or update via `avatar_base64` field
- **Retrieval**: Avatar returned in all user info responses

---

## 📊 System Monitoring

### Real-time System Information
The `/system/info` endpoint provides comprehensive system monitoring:
- **Performance**: CPU usage, memory usage, disk space
- **System**: Uptime, active connections, platform info
- **Application**: Version, last update timestamp
- **Security**: Current user session status

### Backup Management
- **Manual Backups**: Create on-demand backups via `/system/backup`
- **Backup Contents**: Database, logs, configuration files, schemas
- **Backup Storage**: Compressed ZIP archives with metadata
- **Backup Management**: List, download, and delete existing backups

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

# Authentication & Security
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# Database
DATABASE_URL=sqlite:///aegis_forensics.db

# Optional
DEBUG=false
LOG_LEVEL=INFO
API_HOST=0.0.0.0
API_PORT=8000

# CORS Settings
ALLOWED_ORIGINS=*
```

### Performance Tuning
- **Memory**: Minimum 4GB RAM, 8GB+ recommended for large files
- **Storage**: SSD recommended for faster I/O operations
- **CPU**: Multi-core processor for parallel analysis
- **Network**: Stable connection for live analysis scripts

---

## 🔒 Security Considerations

### Best Practices
- **Authentication**: All endpoints require JWT tokens after initial admin setup
- **Password Policy**: Admin password must be changed every 90 days
- Use HTTPS in production environments
- Implement proper API key management for external integrations
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

#### Authentication Issues
```bash
# Check if admin user exists
curl http://localhost:8000/

# If no admin exists, create one
curl -X POST "http://localhost:8000/auth/setup-admin" \
     -H "Content-Type: application/json" \
     -d '{"full_name":"Admin","email":"admin@company.com","organization":"Corp","password":"secure123"}'

# Login to get JWT token
curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@company.com","password":"secure123"}'

# Use token in requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/api/endpoint
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
