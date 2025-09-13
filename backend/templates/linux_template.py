#!/usr/bin/env python3
"""
Aegis Forensics - Linux Live Analysis Script
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
    
    # Add CPU and memory info
    try:
        # CPU info
        cpu_info = run_command("cat /proc/cpuinfo | grep 'model name' | head -1")
        if cpu_info["success"]:
            system_info["cpu"] = cpu_info["stdout"].split(":")[1].strip() if ":" in cpu_info["stdout"] else "unknown"
        
        # Memory info
        mem_info = run_command("free -h")
        if mem_info["success"]:
            system_info["memory"] = mem_info["stdout"]
        
        # Disk usage
        disk_info = run_command("df -h")
        if disk_info["success"]:
            system_info["disk_usage"] = disk_info["stdout"]
        
        # Network interfaces
        net_info = run_command("ip addr show")
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
    """Collect memory-related information in a format suitable for forensic analysis"""
    data = {"memory_analysis": {}}
    
    # Get system memory statistics
    meminfo = run_command("cat /proc/meminfo")
    total_memory = "Unknown"
    available_memory = "Unknown"
    if meminfo["success"]:
        for line in meminfo["stdout"].split('\n'):
            if line.startswith('MemTotal:'):
                total_memory = line.split()[1] + " kB"
            elif line.startswith('MemAvailable:'):
                available_memory = line.split()[1] + " kB"
    
    # Running processes in volatility-like format
    processes = run_command("ps -eo pid,ppid,comm,etime,cmd --no-headers")
    process_list = []
    if processes["success"]:
        for line in processes["stdout"].split('\n')[:50]:  # Limit to first 50 processes
            if line.strip():
                parts = line.strip().split(None, 4)
                if len(parts) >= 4:
                    process_list.append({
                        "pid": parts[0],
                        "ppid": parts[1], 
                        "name": parts[2],
                        "runtime": parts[3],
                        "cmdline": parts[4] if len(parts) > 4 else parts[2]
                    })
    
    # Network connections
    connections = run_command("ss -tulpn")
    network_connections = []
    if connections["success"]:
        for line in connections["stdout"].split('\n')[1:]:  # Skip header
            if line.strip() and ('LISTEN' in line or 'ESTAB' in line):
                network_connections.append(line.strip())
    
    # Loaded kernel modules
    modules = run_command("lsmod")
    loaded_modules = []
    if modules["success"]:
        for line in modules["stdout"].split('\n')[1:]:  # Skip header
            if line.strip():
                loaded_modules.append(line.strip().split()[0])
    
    # Open files and handles
    open_files = run_command("lsof -n | head -100")
    file_handles = []
    if open_files["success"]:
        for line in open_files["stdout"].split('\n')[1:]:  # Skip header
            if line.strip():
                file_handles.append(line.strip())
    
    # Memory mapping information
    maps_data = []
    try:
        # Get memory maps for key processes
        key_processes = run_command("ps -eo pid,comm --no-headers | grep -E '(systemd|init|kthreadd|bash|ssh|python)' | head -10")
        if key_processes["success"]:
            for line in key_processes["stdout"].split('\n'):
                if line.strip():
                    pid = line.strip().split()[0]
                    maps_file = f"/proc/{pid}/maps"
                    if os.path.exists(maps_file):
                        maps_cmd = run_command(f"head -20 {maps_file}")
                        if maps_cmd["success"]:
                            maps_data.append({
                                "pid": pid,
                                "process": line.strip().split()[1] if len(line.strip().split()) > 1 else "unknown",
                                "memory_regions": maps_cmd["stdout"]
                            })
    except Exception as e:
        logger.warning(f"Failed to collect memory maps: {e}")
    
    # Structure data in a forensically meaningful way
    data["memory_analysis"] = {
        "system_info": {
            "total_memory": total_memory,
            "available_memory": available_memory,
            "timestamp": datetime.now().isoformat()
        },
        "process_analysis": {
            "total_processes": len(process_list),
            "running_processes": process_list[:30],  # Top 30 processes
            "suspicious_indicators": []
        },
        "network_analysis": {
            "active_connections": network_connections[:20],  # Top 20 connections
            "connection_count": len(network_connections)
        },
        "module_analysis": {
            "loaded_modules": loaded_modules[:50],  # Top 50 modules
            "module_count": len(loaded_modules)
        },
        "handle_analysis": {
            "open_files": file_handles[:30],  # Top 30 file handles
            "handle_count": len(file_handles)
        },
        "memory_regions": maps_data
    }
    
    # Add some basic anomaly detection
    suspicious_processes = []
    for proc in process_list:
        # Flag processes with suspicious characteristics
        if any(keyword in proc["cmdline"].lower() for keyword in ["wget", "curl", "nc", "netcat", "/tmp/", "base64"]):
            suspicious_processes.append(proc)
    
    data["memory_analysis"]["process_analysis"]["suspicious_indicators"] = suspicious_processes
    
    return data

def collect_network_data() -> Dict[str, Any]:
    """Collect network-related information"""
    data = {"network_analysis": {}}
    
    # Active connections
    connections = run_command("ss -tuln")
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
    route = run_command("ip route")
    if route["success"]:
        data["network_analysis"]["routing_table"] = route["stdout"]
    
    # DNS configuration
    dns = run_command("cat /etc/resolv.conf")
    if dns["success"]:
        data["network_analysis"]["dns_config"] = dns["stdout"]
    
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
    processes = run_command("ps auxf")
    if processes["success"]:
        data["process_analysis"]["process_tree"] = processes["stdout"]
    
    # Running services
    services = run_command("systemctl list-units --type=service --state=running")
    if services["success"]:
        data["process_analysis"]["running_services"] = services["stdout"]
    
    # Loaded modules
    modules = run_command("lsmod")
    if modules["success"]:
        data["process_analysis"]["loaded_modules"] = modules["stdout"]
    
    return data

def collect_logs_data() -> Dict[str, Any]:
    """Collect system log information"""
    data = {"logs_analysis": {}}
    
    # Recent auth logs
    auth_logs = run_command("tail -100 /var/log/auth.log 2>/dev/null || tail -100 /var/log/secure 2>/dev/null")
    if auth_logs["success"]:
        data["logs_analysis"]["auth_logs"] = auth_logs["stdout"]
    
    # Recent syslog
    sys_logs = run_command("tail -100 /var/log/syslog 2>/dev/null || tail -100 /var/log/messages 2>/dev/null")
    if sys_logs["success"]:
        data["logs_analysis"]["system_logs"] = sys_logs["stdout"]
    
    # Recent kernel messages
    dmesg = run_command("dmesg | tail -50")
    if dmesg["success"]:
        data["logs_analysis"]["kernel_messages"] = dmesg["stdout"]
    
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
        "User-Agent": f"AegisForensics-Linux-{CONFIG['analysis']['type']}/1.0"
    }
    
    # Add API key if configured
    if CONFIG["server"]["api_key"]:
        headers["Authorization"] = f"Bearer {CONFIG['server']['api_key']}"
    
    # Add custom headers
    if CONFIG["custom_headers"]:
        headers.update(CONFIG["custom_headers"])
    
    payload = {
        "burst_id": burst_id,
        "platform": "linux",
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
                logger.info(f"✅ Burst {burst_id} sent successfully")
                logger.info(f"Data sent: " + response.text);
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
        burst_id = f"linux-{CONFIG['analysis']['type']}-{uuid.uuid4().hex[:8]}"
        
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
