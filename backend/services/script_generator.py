"""
Script Generation Service for Aegis    def _get_file_extension(self, os_type: str) -> str:
        
        Get the appropriate file extension for the operating system
        
        extensions = {
            "linux": ".py",
            "windows": ".ps1",
            "macos": ".py"
        }
        return extensions.get(os_type, ".txt")enerates platform-specific live analysis scripts with configurable parameters
"""

import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from schemas.script_config import (
    ScriptConfig, 
    ScriptGenerationRequest, 
    ScriptGenerationResponse,
    OperatingSystem,
    AnalysisType
)


class ScriptGenerator:
    """Service for generating platform-specific forensic analysis scripts"""
    
    def __init__(self, templates_dir: str = "templates"):
        self.templates_dir = Path(templates_dir)
        self.template_map = {
            "linux": "linux_template.py",
            "windows": "windows_template.ps1", 
            "macos": "macos_template.py"
        }
        
    def _load_template(self, os_type: str) -> str:
        """Load the template file for the specified operating system"""
        template_file = self.templates_dir / self.template_map[os_type]
        
        if not template_file.exists():
            raise FileNotFoundError(f"Template file not found: {template_file}")
        
        return template_file.read_text(encoding='utf-8')
    
    def _get_file_extension(self, os_type: str) -> str:
        """Get the appropriate file extension for the operating system"""
        extensions = {
            "linux": ".py",
            "windows": ".ps1",
            "macos": ".py"
        }
        return extensions.get(os_type, ".txt")
    
    def _generate_filename(self, config: ScriptConfig, custom_name: Optional[str] = None) -> str:
        """Generate an appropriate filename for the script"""
        if custom_name:
            return custom_name
        
        extension = self._get_file_extension(config.os)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        return f"aegis_forensics_{config.os}_{config.analysis_type}_{timestamp}{extension}"
    
    def _format_python_value(self, value: Any) -> str:
        """Format a Python value for template substitution"""
        if isinstance(value, str):
            if value.lower() in ['null', 'none']:
                return "None"
            return f'"{value}"'
        elif isinstance(value, bool):
            return str(value)
        elif isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, dict):
            if not value:
                return "None"
            return json.dumps(value)
        elif isinstance(value, list):
            return json.dumps(value)
        elif value is None:
            return "None"
        else:
            return f'"{str(value)}"'
    
    def _format_powershell_value(self, value: Any) -> str:
        """Format a PowerShell value for template substitution"""
        if isinstance(value, str):
            if value.lower() in ['null', 'none']:
                return "$null"
            return f'"{value}"'
        elif isinstance(value, bool):
            return "$true" if value else "$false"
        elif isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, dict):
            if not value:
                return "$null"
            # Convert to PowerShell hashtable format
            items = []
            for k, v in value.items():
                items.append(f'"{k}" = {self._format_powershell_value(v)}')
            return "@{" + "; ".join(items) + "}"
        elif isinstance(value, list):
            if not value:
                return "@()"
            items = [self._format_powershell_value(item) for item in value]
            return "@(" + ", ".join(items) + ")"
        elif value is None:
            return "$null"
        else:
            return f'"{str(value)}"'
    
    def _substitute_template_vars(self, template: str, config: ScriptConfig) -> str:
        """Substitute template variables with actual configuration values"""
        # Determine format function based on OS type
        if config.os == "windows":
            format_func = self._format_powershell_value
        else:  # Linux/macOS (Python scripts)
            format_func = self._format_python_value
        
        # Build substitution dictionary
        substitutions = {
            "SERVER_HOST": format_func(config.server.host),
            "SERVER_PORT": format_func(config.server.port),
            "USE_HTTPS": format_func(config.server.use_https),
            "BASE_URL": format_func(config.server.base_url),
            "API_KEY": format_func(config.server.api_key),
            "TIMEOUT_SECONDS": format_func(config.server.timeout_seconds),
            "ANALYSIS_TYPE": format_func(config.analysis_type),
            "INCLUDE_SYSTEM_INFO": format_func(config.include_system_info),
            "INCLUDE_ENVIRONMENT": format_func(config.include_environment),
            "STEALTH_MODE": format_func(config.stealth_mode),
            "BURST_ENABLED": format_func(config.burst.enabled),
            "BURST_INTERVAL": format_func(config.burst.interval_seconds),
            "BURST_COUNT": format_func(config.burst.burst_count),
            "BATCH_SIZE_KB": format_func(config.burst.batch_size_kb),
            "CUSTOM_HEADERS": format_func(getattr(config, 'custom_headers', {})),
            "GENERATION_TIME": format_func(datetime.now().isoformat())
        }
        
        # Perform substitutions
        result = template
        for placeholder, value in substitutions.items():
            result = result.replace(f"{{{{{placeholder}}}}}", str(value))
        
        return result
    
    def _get_dependencies(self, config: ScriptConfig) -> List[str]:
        """Get list of dependencies required for the script"""
        common_deps = ["requests"]
        
        os_deps = {
            "linux": ["subprocess", "json", "time", "uuid", "socket", "platform", "logging"],
            "windows": ["PowerShell 3.0+"],
            "macos": ["subprocess", "json", "time", "uuid", "socket", "platform", "logging"]
        }
        
        return common_deps + os_deps.get(config.os, [])
    
    def _get_usage_instructions(self, config: ScriptConfig, filename: str) -> str:
        """Generate usage instructions for the script"""        
        if config.os == "windows":
            return f"""
Usage Instructions for Windows:

1. Save the script as '{filename}'
2. Open PowerShell as Administrator (recommended)
3. Set execution policy if needed: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
4. Run the script: .\\{filename}
5. For silent mode: .\\{filename} -Silent

The script will collect {config.analysis_type} data and send it to {config.server.base_url} in {config.burst.burst_count} burst(s).

Requirements:
- PowerShell 3.0 or later
- Internet connectivity to reach the target server
- Administrator privileges (recommended for complete data collection)
"""
        else:  # Linux/macOS
            return f"""
Usage Instructions for {config.os.title()}:

1. Save the script as '{filename}'
2. Make it executable: chmod +x {filename}
3. Install dependencies: pip3 install requests
4. Run the script: python3 {filename} or ./{filename}

The script will collect {config.analysis_type} data and send it to {config.server.base_url} in {config.burst.burst_count} burst(s).

Requirements:
- Python 3.6 or later
- pip3 for installing dependencies
- Internet connectivity to reach the target server
- Appropriate permissions for data collection (some features may require sudo)
"""
    
    def _get_platform_notes(self, config: ScriptConfig) -> Optional[str]:
        """Get platform-specific notes and warnings"""
        notes = {
            "windows": """
Platform Notes for Windows:
- Registry analysis requires Administrator privileges
- Some network commands may need elevated permissions
- Windows Defender may flag the script - add exclusions if needed
- Script supports Windows 7/Server 2008 R2 and later
""",
            "linux": """
Platform Notes for Linux:
- Some system information requires root privileges
- Memory analysis may be limited for non-owned processes
- Network analysis benefits from elevated permissions
- Tested on Ubuntu, CentOS, and Debian distributions
""",
            "macos": """
Platform Notes for macOS:
- Some commands may require sudo privileges
- System logs access may be restricted on newer macOS versions
- Hardware profiling requires system_profiler access
- Tested on macOS 10.14 (Mojave) and later
"""
        }
        
        return notes.get(config.os)
    
    def generate_script(self, request: ScriptGenerationRequest) -> ScriptGenerationResponse:
        """Generate a forensic analysis script based on the provided configuration"""
        config = request.config
        
        # Load the appropriate template
        template = self._load_template(config.os)
        
        # Substitute template variables
        script_content = self._substitute_template_vars(template, config)
        
        # Generate filename
        filename = self._generate_filename(config, request.script_name)
        
        # Get dependencies and usage info
        dependencies = self._get_dependencies(config)
        usage_instructions = self._get_usage_instructions(config, filename)
        platform_notes = self._get_platform_notes(config)
        
        return ScriptGenerationResponse(
            script_content=script_content,
            filename=filename,
            config_used=config,
            dependencies=dependencies,
            usage_instructions=usage_instructions,
            platform_notes=platform_notes
        )
    
    def validate_config(self, config: ScriptConfig) -> List[str]:
        """Validate configuration and return list of warnings/errors"""
        warnings = []
        
        # Check if template exists
        template_file = self.templates_dir / self.template_map[config.os]
        if not template_file.exists():
            warnings.append(f"Template file not found for {config.os}: {template_file}")
        
        # Check analysis type compatibility
        if config.analysis_type == "registry" and config.os != "windows":
            warnings.append("Registry analysis is only available on Windows")
        
        # Check burst configuration
        if config.burst.enabled:
            if config.burst.burst_count > 50:
                warnings.append("High burst count may impact system performance")
            if config.burst.interval_seconds < 5:
                warnings.append("Very short burst intervals may overload the target server")
        
        # Check server configuration
        if config.server.host in ["localhost", "127.0.0.1"] and config.server.use_https:
            warnings.append("HTTPS with localhost may require certificate configuration")
        
        return warnings
