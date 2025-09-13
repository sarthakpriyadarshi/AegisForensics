#!/usr/bin/env python3
"""
Aegis Forensics - macOS Live Analysis Script
Generated automatically for: {{ANALYSIS_TYPE}} analysis
Target Server: {{SERVER_HOST}}:{{SERVER_PORT}}
Generated on: {{GENERATION_TIME}}
"""

import os
import sys
import json
import time
import uuid
import socket
import platform
import subprocess
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

# Configuration
CONFIG = {
    "server": {
        "host": {{SERVER_HOST}},
        "port": {{SERVER_PORT}},
        "use_https": {{USE_HTTPS}},
        "base_url": {{BASE_URL}},
        "api_key": {{API_KEY}},
        "timeout": {{TIMEOUT_SECONDS}}
    },
    "analysis": {
        "type": {{ANALYSIS_TYPE}},
        "include_system_info": {{INCLUDE_SYSTEM_INFO}},
        "include_environment": {{INCLUDE_ENVIRONMENT}},
        "stealth_mode": {{STEALTH_MODE}}
    },
    "burst": {
        "enabled": {{BURST_ENABLED}},
        "interval_seconds": {{BURST_INTERVAL}},
        "burst_count": {{BURST_COUNT}},
        "batch_size_kb": {{BATCH_SIZE_KB}}
    },
    "custom_headers": {{CUSTOM_HEADERS}}
}

# Setup logging
def setup_logging():
    """Setup logging based on stealth mode"""
    if CONFIG["analysis"]["stealth_mode"]:
        logging.basicConfig(level=logging.ERROR, format='%(message)s')
    else:
        logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')
    return logging.getLogger(__name__)

logger = setup_logging()

def check_dependencies():
    """Check if required dependencies are available"""
    dependencies = ["requests", "subprocess", "json"]
    missing = []
    
    for dep in dependencies:
        try:
            __import__(dep)
        except ImportError:
            missing.append(dep)
    
    if missing:
        logger.error(f"Missing dependencies: {missing}")
        logger.error("Install with: pip3 install " + " ".join(missing))
        return False
    
    return True

def run_command(command: str, shell: bool = True) -> Dict[str, Any]:
    """Execute a system command and return the result"""
    try:
        result = subprocess.run(
            command,
            shell=shell,
            capture_output=True,
            text=True,
            timeout=30
        )
        return {
            "command": command,
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "success": result.returncode == 0
        }
    except subprocess.TimeoutExpired:
        return {
            "command": command,
            "returncode": -1,
            "stdout": "",
            "stderr": "Command timed out",
            "success": False
        }
    except Exception as e:
        return {
            "command": command,
            "returncode": -1,
            "stdout": "",
            "stderr": str(e),
            "success": False
        }

def collect_system_info() -> Dict[str, Any]:
    """Collect basic system information"""
    if not CONFIG["analysis"]["include_system_info"]:
        return {}
    
    system_info = {
        "timestamp": datetime.now().isoformat(),
        "hostname": socket.gethostname(),
        "platform": {
            "system": platform.system(),
            "node": platform.node(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
            "processor": platform.processor(),
            "architecture": platform.architecture()
        },
        "python_version": platform.python_version(),
        "user": os.getenv("USER", "unknown")
    }
    
    # Add macOS specific info
    try:
        # macOS version
        sw_vers = run_command("sw_vers")
        if sw_vers["success"]:
            system_info["macos_version"] = sw_vers["stdout"]
        
        # Hardware info
        hw_info = run_command("system_profiler SPHardwareDataType")
        if hw_info["success"]:
            system_info["hardware"] = hw_info["stdout"]
        
        # Memory info
        mem_info = run_command("vm_stat")
        if mem_info["success"]:
            system_info["memory"] = mem_info["stdout"]
        
        # Disk usage
        disk_info = run_command("df -h")
        if disk_info["success"]:
            system_info["disk_usage"] = disk_info["stdout"]
        
        # Network interfaces
        net_info = run_command("ifconfig")
        if net_info["success"]:
            system_info["network_interfaces"] = net_info["stdout"]
    
    except Exception as e:
        logger.warning(f"Failed to collect extended system info: {e}")
    
    return system_info

def collect_environment_data() -> Dict[str, Any]:
    """Collect environment variables"""
    if not CONFIG["analysis"]["include_environment"]:
        return {}
    
    return {
        "environment_variables": dict(os.environ),
        "path": os.getenv("PATH", "").split(":"),
        "home": os.getenv("HOME", ""),
        "shell": os.getenv("SHELL", ""),
        "pwd": os.getcwd()
    }

def collect_memory_data() -> Dict[str, Any]:
    """Collect memory-related information"""
    data = {"memory_analysis": {}}
    
    # Running processes
    processes = run_command("ps aux")
    if processes["success"]:
        data["memory_analysis"]["processes"] = processes["stdout"]
    
    # Memory pressure
    memory_pressure = run_command("memory_pressure")
    if memory_pressure["success"]:
        data["memory_analysis"]["memory_pressure"] = memory_pressure["stdout"]
    
    # Activity monitor info
    top_output = run_command("top -l 1 -n 10")
    if top_output["success"]:
        data["memory_analysis"]["top_processes"] = top_output["stdout"]
    
    # Kernel extensions
    kextstat = run_command("kextstat")
    if kextstat["success"]:
        data["memory_analysis"]["kernel_extensions"] = kextstat["stdout"]
    
    return data

def collect_network_data() -> Dict[str, Any]:
    """Collect network-related information"""
    data = {"network_analysis": {}}
    
    # Active connections
    connections = run_command("netstat -an")
    if connections["success"]:
        data["network_analysis"]["connections"] = connections["stdout"]
    
    # Network statistics
    netstat = run_command("netstat -i")
    if netstat["success"]:
        data["network_analysis"]["interface_stats"] = netstat["stdout"]
    
    # ARP table
    arp = run_command("arp -a")
    if arp["success"]:
        data["network_analysis"]["arp_table"] = arp["stdout"]
    
    # Routing table
    route = run_command("netstat -rn")
    if route["success"]:
        data["network_analysis"]["routing_table"] = route["stdout"]
    
    # DNS configuration
    dns = run_command("scutil --dns")
    if dns["success"]:
        data["network_analysis"]["dns_config"] = dns["stdout"]
    
    # Network interface details
    ifconfig = run_command("ifconfig -a")
    if ifconfig["success"]:
        data["network_analysis"]["interface_details"] = ifconfig["stdout"]
    
    return data

def collect_disk_data() -> Dict[str, Any]:
    """Collect disk and filesystem information"""
    data = {"disk_analysis": {}}
    
    # Mounted filesystems
    mounts = run_command("mount")
    if mounts["success"]:
        data["disk_analysis"]["mounts"] = mounts["stdout"]
    
    # Disk usage
    df = run_command("df -h")
    if df["success"]:
        data["disk_analysis"]["disk_usage"] = df["stdout"]
    
    # Disk utility info
    diskutil = run_command("diskutil list")
    if diskutil["success"]:
        data["disk_analysis"]["diskutil_list"] = diskutil["stdout"]
    
    # Recent file modifications
    recent_files = run_command("find /tmp /var/tmp -type f -mtime -1 2>/dev/null | head -20")
    if recent_files["success"]:
        data["disk_analysis"]["recent_temp_files"] = recent_files["stdout"]
    
    # Open files
    lsof = run_command("lsof | head -100")
    if lsof["success"]:
        data["disk_analysis"]["open_files"] = lsof["stdout"]
    
    return data

def collect_process_data() -> Dict[str, Any]:
    """Collect detailed process information"""
    data = {"process_analysis": {}}
    
    # Detailed process list
    processes = run_command("ps auxww")
    if processes["success"]:
        data["process_analysis"]["process_list"] = processes["stdout"]
    
    # Launch agents and daemons
    launch_agents = run_command("launchctl list")
    if launch_agents["success"]:
        data["process_analysis"]["launch_agents"] = launch_agents["stdout"]
    
    # Running services
    services = run_command("sudo launchctl list | grep -v '^-'")
    if services["success"]:
        data["process_analysis"]["running_services"] = services["stdout"]
    
    # Kernel extensions
    kextstat = run_command("kextstat")
    if kextstat["success"]:
        data["process_analysis"]["kernel_extensions"] = kextstat["stdout"]
    
    return data

def collect_logs_data() -> Dict[str, Any]:
    """Collect system log information"""
    data = {"logs_analysis": {}}
    
    # System logs using log command
    system_logs = run_command("log show --last 1h --predicate 'eventType == logEvent' | tail -100")
    if system_logs["success"]:
        data["logs_analysis"]["system_logs"] = system_logs["stdout"]
    
    # Security logs
    security_logs = run_command("log show --last 1h --predicate 'category == \"security\"' | tail -50")
    if security_logs["success"]:
        data["logs_analysis"]["security_logs"] = security_logs["stdout"]
    
    # Console logs
    console_logs = run_command("tail -100 /var/log/system.log 2>/dev/null")
    if console_logs["success"]:
        data["logs_analysis"]["console_logs"] = console_logs["stdout"]
    
    # Kernel messages
    kernel_logs = run_command("dmesg | tail -50")
    if kernel_logs["success"]:
        data["logs_analysis"]["kernel_messages"] = kernel_logs["stdout"]
    
    return data

def collect_analysis_data() -> Dict[str, Any]:
    """Collect data based on analysis type"""
    analysis_type = CONFIG["analysis"]["type"]
    
    # Always include basic system info
    data = collect_system_info()
    data.update(collect_environment_data())
    
    # Add analysis-specific data
    if analysis_type == "memory":
        data.update(collect_memory_data())
    elif analysis_type == "network":
        data.update(collect_network_data())
    elif analysis_type == "disk":
        data.update(collect_disk_data())
    elif analysis_type == "processes":
        data.update(collect_process_data())
    elif analysis_type == "logs":
        data.update(collect_logs_data())
    elif analysis_type == "comprehensive":
        # Include all analysis types
        data.update(collect_memory_data())
        data.update(collect_network_data())
        data.update(collect_disk_data())
        data.update(collect_process_data())
        data.update(collect_logs_data())
    
    return data

def send_data_to_server(data: Dict[str, Any], burst_id: str) -> bool:
    """Send collected data to the Aegis Forensics server"""
    url = f"{CONFIG['server']['base_url']}/api/stream/live-analysis"
    
    headers = {
        "Content-Type": "application/json",
        "User-Agent": f"AegisForensics-macOS-{CONFIG['analysis']['type']}/1.0"
    }
    
    # Add API key if configured
    if CONFIG["server"]["api_key"]:
        headers["Authorization"] = f"Bearer {CONFIG['server']['api_key']}"
    
    # Add custom headers
    if CONFIG["custom_headers"]:
        headers.update(CONFIG["custom_headers"])
    
    payload = {
        "burst_id": burst_id,
        "platform": "macos",
        "analysis_type": CONFIG["analysis"]["type"],
        "timestamp": datetime.now().isoformat(),
        "data": data
    }
    
    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=CONFIG["server"]["timeout"]
        )
        
        if response.status_code == 200:
            if not CONFIG["analysis"]["stealth_mode"]:
                logger.info(f"Data sent: " + response.text);
                logger.info(f"✅ Burst {burst_id} sent successfully")
            return True
        else:
            logger.error(f"❌ Server returned status {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Failed to send data: {e}")
        return False

def run_live_analysis():
    """Main function to run live analysis"""
    if not CONFIG["analysis"]["stealth_mode"]:
        logger.info("🚀 Starting Aegis Forensics Live Analysis")
        logger.info(f"📊 Analysis Type: {CONFIG['analysis']['type'].upper()}")
        logger.info(f"🎯 Target Server: {CONFIG['server']['base_url']}")
    
    if not check_dependencies():
        sys.exit(1)
    
    burst_count = CONFIG["burst"]["burst_count"] if CONFIG["burst"]["enabled"] else 1
    interval = CONFIG["burst"]["interval_seconds"] if CONFIG["burst"]["enabled"] else 0
    
    successful_bursts = 0
    
    for i in range(burst_count):
        burst_id = f"macos-{CONFIG['analysis']['type']}-{uuid.uuid4().hex[:8]}"
        
        if not CONFIG["analysis"]["stealth_mode"]:
            logger.info(f"🔍 Collecting data for burst {i+1}/{burst_count} (ID: {burst_id})")
        
        try:
            # Collect analysis data
            data = collect_analysis_data()
            
            # Send to server
            if send_data_to_server(data, burst_id):
                successful_bursts += 1
            
            # Wait between bursts (except for the last one)
            if i < burst_count - 1 and interval > 0:
                if not CONFIG["analysis"]["stealth_mode"]:
                    logger.info(f"⏱️  Waiting {interval} seconds until next burst...")
                time.sleep(interval)
                
        except KeyboardInterrupt:
            logger.info("🛑 Analysis stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Error in burst {i+1}: {e}")
            continue
    
    if not CONFIG["analysis"]["stealth_mode"]:
        logger.info(f"🎉 Analysis completed! {successful_bursts}/{burst_count} bursts sent successfully")

if __name__ == "__main__":
    try:
        run_live_analysis()
    except KeyboardInterrupt:
        logger.info("🛑 Script interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)
