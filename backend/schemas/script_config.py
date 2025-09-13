"""
Script Generation Configuration Models for Aegis Forensics
"""
from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator, HttpUrl
import ipaddress


class OperatingSystem(str, Enum):
    """Supported operating systems for script generation"""
    WINDOWS = "windows"
    LINUX = "linux"
    MACOS = "macos"


class AnalysisType(str, Enum):
    """Types of forensic analysis available"""
    MEMORY = "memory"
    NETWORK = "network"
    DISK = "disk"
    COMPREHENSIVE = "comprehensive"
    PROCESSES = "processes"
    REGISTRY = "registry"  # Windows only
    LOGS = "logs"


class BurstMode(BaseModel):
    """Configuration for burst streaming"""
    enabled: bool = True
    interval_seconds: int = Field(default=30, ge=1, le=3600, description="Seconds between bursts")
    burst_count: int = Field(default=5, ge=1, le=100, description="Number of bursts to send")
    batch_size_kb: int = Field(default=50, ge=1, le=1000, description="Target size per burst in KB")


class ServerConfig(BaseModel):
    """Server connection configuration"""
    host: str = Field(default="localhost", description="Server hostname or IP address")
    port: int = Field(default=8000, ge=1, le=65535, description="Server port")
    use_https: bool = Field(default=False, description="Use HTTPS instead of HTTP")
    api_key: Optional[str] = Field(default=None, description="Optional API key for authentication")
    timeout_seconds: int = Field(default=30, ge=5, le=300, description="Request timeout in seconds")

    @validator('host')
    def validate_host(cls, v):
        """Validate host is either a valid hostname or IP address"""
        if v in ['localhost', '127.0.0.1', '::1']:
            return v
        
        # Try to parse as IP address
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            pass
        
        # Basic hostname validation
        if not v or len(v) > 253:
            raise ValueError('Invalid hostname')
        
        # Allow basic hostnames and FQDNs
        import re
        if not re.match(r'^[a-zA-Z0-9]([a-zA-Z0-9\-\.]*[a-zA-Z0-9])?$', v):
            raise ValueError('Invalid hostname format')
        
        return v

    @property
    def base_url(self) -> str:
        """Get the base URL for API requests"""
        protocol = "https" if self.use_https else "http"
        return f"{protocol}://{self.host}:{self.port}"


class ScriptConfig(BaseModel):
    """Complete configuration for script generation"""
    os: OperatingSystem
    analysis_type: AnalysisType
    server: ServerConfig
    burst: BurstMode = BurstMode()
    include_system_info: bool = Field(default=True, description="Include system information in dumps")
    include_environment: bool = Field(default=True, description="Include environment variables")
    stealth_mode: bool = Field(default=False, description="Run with minimal output")
    custom_headers: Optional[Dict[str, str]] = Field(default=None, description="Custom HTTP headers")

    @validator('analysis_type')
    def validate_analysis_type_for_os(cls, v, values):
        """Validate analysis type is supported on target OS"""
        if 'os' in values:
            os_val = values['os']
            
            # Registry analysis is Windows-only
            if v == AnalysisType.REGISTRY and os_val != OperatingSystem.WINDOWS:
                raise ValueError('Registry analysis is only available on Windows')
        
        return v

    class Config:
        """Pydantic configuration"""
        use_enum_values = True


class ScriptGenerationRequest(BaseModel):
    """Request model for script generation"""
    config: ScriptConfig
    script_name: Optional[str] = Field(default=None, description="Custom script filename")
    include_dependencies: bool = Field(default=True, description="Include dependency installation commands")

    @validator('script_name')
    def validate_script_name(cls, v):
        """Validate script name if provided"""
        if v is not None:
            import re
            if not re.match(r'^[a-zA-Z0-9_\-\.]+$', v):
                raise ValueError('Script name can only contain alphanumeric characters, underscores, hyphens, and dots')
            
            # Ensure appropriate extension
            if not v.endswith(('.py', '.ps1', '.sh', '.bat')):
                raise ValueError('Script name must have appropriate extension (.py, .ps1, .sh, .bat)')
        
        return v


class ScriptGenerationResponse(BaseModel):
    """Response model for script generation"""
    script_content: str = Field(description="Generated script content")
    filename: str = Field(description="Suggested filename for the script")
    config_used: ScriptConfig = Field(description="Configuration used to generate the script")
    dependencies: List[str] = Field(description="List of required dependencies")
    usage_instructions: str = Field(description="Instructions for running the script")
    platform_notes: Optional[str] = Field(default=None, description="Platform-specific notes")
