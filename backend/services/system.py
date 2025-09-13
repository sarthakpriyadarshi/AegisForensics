# services/system.py
import os
import psutil
import platform
import shutil
import uuid
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any

class SystemService:
    
    @staticmethod
    def get_system_info() -> Dict[str, Any]:
        """Get comprehensive system information"""
        
        # Get system uptime
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time
        uptime_str = f"{uptime.days} days, {uptime.seconds // 3600} hours"
        
        # Get CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_usage = f"{cpu_percent}%"
        
        # Get memory usage
        memory = psutil.virtual_memory()
        memory_used_gb = memory.used / (1024**3)
        memory_total_gb = memory.total / (1024**3)
        memory_usage = f"{memory_used_gb:.1f} GB / {memory_total_gb:.1f} GB"
        
        # Get disk usage
        disk = psutil.disk_usage('/')
        disk_used_gb = disk.used / (1024**3)
        disk_total_gb = disk.total / (1024**3)
        disk_usage = f"{disk_used_gb:.0f} GB / {disk_total_gb:.0f} GB"
        
        # Get active network connections
        connections = len(psutil.net_connections())
        
        # Get last update time (file modification time of main.py)
        main_py_path = Path(__file__).parent.parent / "main.py"
        if main_py_path.exists():
            last_update = datetime.fromtimestamp(main_py_path.stat().st_mtime)
            last_update_str = last_update.strftime("%Y-%m-%d")
        else:
            last_update_str = "Unknown"
        
        return {
            "version": "AegisForensic v2.1.0",
            "uptime": uptime_str,
            "cpu_usage": cpu_usage,
            "memory_usage": memory_usage,
            "disk_usage": disk_usage,
            "active_connections": connections,
            "last_update": last_update_str,
            "platform": platform.system(),
            "platform_version": platform.release(),
            "python_version": platform.python_version(),
            "hostname": platform.node()
        }
    
    @staticmethod
    def create_backup(backup_name: str = None, include_logs: bool = True, include_database: bool = True) -> Dict[str, Any]:
        """Create a backup of the system"""
        
        # Generate backup ID and name
        backup_id = str(uuid.uuid4())
        if not backup_name:
            backup_name = f"aegis_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Create backup directory
        backup_dir = Path("backups")
        backup_dir.mkdir(exist_ok=True)
        
        backup_file = backup_dir / f"{backup_name}.zip"
        
        try:
            with zipfile.ZipFile(backup_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
                
                # Backup database
                if include_database:
                    db_file = Path("aegis_forensics.db")
                    if db_file.exists():
                        zipf.write(db_file, "database/aegis_forensics.db")
                
                # Backup logs
                if include_logs:
                    logs_dir = Path("logs")
                    if logs_dir.exists():
                        for log_file in logs_dir.glob("*.log"):
                            zipf.write(log_file, f"logs/{log_file.name}")
                
                # Backup configuration files
                config_files = ["pyproject.toml", ".env.sample"]
                for config_file in config_files:
                    config_path = Path(config_file)
                    if config_path.exists():
                        zipf.write(config_path, f"config/{config_file}")
                
                # Backup schemas
                schemas_dir = Path("schemas")
                if schemas_dir.exists():
                    for schema_file in schemas_dir.glob("*.py"):
                        zipf.write(schema_file, f"schemas/{schema_file.name}")
            
            # Get backup size
            backup_size_mb = backup_file.stat().st_size / (1024 * 1024)
            
            return {
                "backup_id": backup_id,
                "backup_name": backup_name,
                "backup_path": str(backup_file.absolute()),
                "created_at": datetime.now().isoformat(),
                "size_mb": round(backup_size_mb, 2),
                "status": "completed"
            }
            
        except Exception as e:
            return {
                "backup_id": backup_id,
                "backup_name": backup_name,
                "backup_path": "",
                "created_at": datetime.now().isoformat(),
                "size_mb": 0,
                "status": f"failed: {str(e)}"
            }
    
    @staticmethod
    def list_backups() -> list:
        """List all available backups"""
        backup_dir = Path("backups")
        if not backup_dir.exists():
            return []
        
        backups = []
        for backup_file in backup_dir.glob("*.zip"):
            stat_info = backup_file.stat()
            backups.append({
                "name": backup_file.stem,
                "path": str(backup_file.absolute()),
                "created_at": datetime.fromtimestamp(stat_info.st_ctime).isoformat(),
                "size_mb": round(stat_info.st_size / (1024 * 1024), 2)
            })
        
        return sorted(backups, key=lambda x: x["created_at"], reverse=True)
    
    @staticmethod
    def delete_backup(backup_name: str) -> bool:
        """Delete a specific backup"""
        backup_file = Path("backups") / f"{backup_name}.zip"
        if backup_file.exists():
            backup_file.unlink()
            return True
        return False
