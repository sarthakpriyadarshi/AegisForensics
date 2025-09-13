# tools/network_tools.py
import subprocess
import re
from google.adk.tools import ToolContext

def analyze_network_direct(pcap_path: str) -> dict:
    """
    Direct network analysis function that bypasses the ADK framework.
    Executes tshark commands directly and returns structured results.
    """
    print(f"[DEBUG NETWORK DIRECT] Analyzing PCAP file: {pcap_path}")
    
    try:
        # Check if file exists
        import os
        if not os.path.exists(pcap_path):
            return {
                "status": "error",
                "error_message": f"PCAP file not found at {pcap_path}",
                "raw_data": {},
                "analysis_notes": {}
            }
        
        # Execute tshark commands for analysis
        results = {}
        
        # Get basic statistics
        try:
            stats_cmd = ["tshark", "-r", pcap_path, "-q", "-z", "io,stat,0"]
            stats_result = subprocess.run(stats_cmd, capture_output=True, text=True, timeout=30)
            if stats_result.returncode == 0:
                results["stats"] = stats_result.stdout
        except Exception as e:
            print(f"[DEBUG] Stats command failed: {e}")
        
        # Get protocol hierarchy
        try:
            protocol_cmd = ["tshark", "-r", pcap_path, "-q", "-z", "io,phs"]
            protocol_result = subprocess.run(protocol_cmd, capture_output=True, text=True, timeout=30)
            if protocol_result.returncode == 0:
                results["protocols"] = protocol_result.stdout
        except Exception as e:
            print(f"[DEBUG] Protocol command failed: {e}")
        
        # Get conversations
        try:
            conv_cmd = ["tshark", "-r", pcap_path, "-q", "-z", "conv,ip"]
            conv_result = subprocess.run(conv_cmd, capture_output=True, text=True, timeout=30)
            if conv_result.returncode == 0:
                results["conversations"] = conv_result.stdout
        except Exception as e:
            print(f"[DEBUG] Conversations command failed: {e}")
        
        # Get DNS queries
        try:
            dns_cmd = ["tshark", "-r", pcap_path, "-Y", "dns.qry.name", "-T", "fields", "-e", "dns.qry.name"]
            dns_result = subprocess.run(dns_cmd, capture_output=True, text=True, timeout=30)
            if dns_result.returncode == 0:
                dns_queries = list(set(dns_result.stdout.strip().split('\n'))) if dns_result.stdout.strip() else []
                results["dns_queries"] = dns_queries
        except Exception as e:
            print(f"[DEBUG] DNS command failed: {e}")
        
        # Get HTTP hosts
        try:
            http_cmd = ["tshark", "-r", pcap_path, "-Y", "http.host", "-T", "fields", "-e", "http.host"]
            http_result = subprocess.run(http_cmd, capture_output=True, text=True, timeout=30)
            if http_result.returncode == 0:
                http_hosts = list(set(http_result.stdout.strip().split('\n'))) if http_result.stdout.strip() else []
                results["http_hosts"] = http_hosts
        except Exception as e:
            print(f"[DEBUG] HTTP command failed: {e}")
        
        # Extract packet count and unique IPs
        packet_count = "0"
        unique_ips = []
        
        if "stats" in results:
            # Extract packet count from stats - look for the frames count in the table
            for line in results["stats"].split('\n'):
                if '|' in line and 'Frames' in line and 'Bytes' in line:
                    # This is the header line, skip it
                    continue
                if '|' in line and '<>' in line:
                    # This is the data line: "|    0.0 <> 5091.5 |    982 | 314515 |"
                    parts = [p.strip() for p in line.split('|') if p.strip()]
                    if len(parts) >= 3:
                        try:
                            packet_count = parts[1].strip()  # The frames count
                            print(f"[DEBUG] Extracted packet count: {packet_count}")
                            break
                        except:
                            continue
        
        if "conversations" in results:
            # Extract unique IPs from conversations
            for line in results["conversations"].split('\n'):
                if '<->' in line and not line.startswith('='):
                    parts = line.split()
                    if len(parts) >= 2:
                        ip1, ip2 = parts[0], parts[1].replace('<->', '').strip()
                        if ip1 not in unique_ips and '.' in ip1:
                            unique_ips.append(ip1)
                        if ip2 not in unique_ips and '.' in ip2:
                            unique_ips.append(ip2)
        
        # Analyze for suspicious indicators
        verdict = "BENIGN"
        severity = "Low"
        findings = []
        
        # Check for suspicious DNS queries
        dns_queries = results.get("dns_queries", [])
        suspicious_dns = [q for q in dns_queries if len(q) > 20 or any(c in q for c in ['dga', 'bot', 'malware', 'c2'])]
        
        if suspicious_dns:
            verdict = "SUSPICIOUS"
            severity = "Medium"
            findings.append({
                "category": "DNS Queries",
                "description": f"Detected {len(suspicious_dns)} suspicious DNS queries",
                "severity": "Medium",
                "evidence": f"Suspicious domains: {', '.join(suspicious_dns[:5])}"
            })
        
        # Check for unusual protocols
        protocols = results.get("protocols", "")
        if any(proto in protocols.lower() for proto in ['tor', 'p2p', 'bitcoin']):
            verdict = "SUSPICIOUS" if verdict == "BENIGN" else verdict
            severity = "High" if severity == "Low" else severity
            findings.append({
                "category": "Protocol Analysis",
                "description": "Unusual or suspicious protocols detected",
                "severity": "Medium",
                "evidence": "Protocols include potentially suspicious traffic patterns"
            })
        
        # Basic traffic analysis
        if len(unique_ips) > 50:
            findings.append({
                "category": "IP Traffic",
                "description": f"High number of unique IP addresses ({len(unique_ips)})",
                "severity": "Low",
                "evidence": f"Communication with {len(unique_ips)} unique IP addresses"
            })
        
        # Return raw technical data for agent analysis
        return {
            "status": "success",
            "raw_data": {
                "total_packets": packet_count,
                "capture_duration": "Unknown",  # Could extract from stats if needed
                "unique_ips": unique_ips,
                "dns_queries": dns_queries,
                "http_hosts": results.get("http_hosts", []),
                "protocols_detected": [p.strip() for p in protocols.split('\n') if p.strip() and not p.startswith('=')][:10],
                "conversations": results.get("conversations", ""),
                "tshark_stats": results.get("stats", ""),
                "protocol_hierarchy": results.get("protocols", "")
            },
            "analysis_notes": {
                "suspicious_dns_count": len(suspicious_dns),
                "suspicious_domains": suspicious_dns[:10],
                "high_ip_count": len(unique_ips) > 50,
                "unusual_protocols": any(proto in protocols.lower() for proto in ['tor', 'p2p', 'bitcoin'])
            }
        }
        
    except Exception as e:
        print(f"[ERROR] Network analysis failed: {e}")
        return {
            "status": "error",
            "error_message": str(e),
            "raw_data": {},
            "analysis_notes": {}
        }

def analyze_network(tool_context: ToolContext) -> dict:
    """
    Analyze a PCAP file by extracting network flows and statistics.
    
    First tries to get pcap_path from the user's request text,
    then falls back to tool_context state.
    """
    print(f"[DEBUG NETWORK TOOL] analyze_network called with tool_context: {type(tool_context)}")
    pcap_path = None
    
    # Try to extract PCAP path from user content
    if hasattr(tool_context, 'user_content') and tool_context.user_content:
        content = str(tool_context.user_content)
        print(f"[DEBUG NETWORK TOOL] User content: {content[:200]}...")
        
        # Try to find PCAP paths
        path_patterns = [
            r"'([^']+\.pcap)'",     # Paths in single quotes ending with .pcap
            r'"([^"]+\.pcap)"',     # Paths in double quotes ending with .pcap
            r'(\S+\.pcap)',         # Any non-whitespace sequence ending with .pcap
            r'(\S+\.pcapng)',       # Any non-whitespace sequence ending with .pcapng
            r'(\S*/tmp/\S+)',       # Any path starting with /tmp/
        ]
        
        for pattern in path_patterns:
            matches = re.findall(pattern, content)
            if matches:
                pcap_path = matches[0]
                print(f"[DEBUG] Found pcap_path in user content: {pcap_path}")
                break
    
    # If not found in user content, try tool_context state
    if not pcap_path:
        state = tool_context.state
        print("[DEBUG] State type:", type(state))
        
        # Try using to_dict() method
        if hasattr(state, 'to_dict'):
            state_dict = state.to_dict()
            pcap_path = state_dict.get("pcap_path")
            print("[DEBUG] pcap_path from to_dict():", pcap_path)
        
        # If still no pcap_path, try the get method
        if not pcap_path and hasattr(state, 'get'):
            pcap_path = state.get("pcap_path")
            print("[DEBUG] pcap_path via get():", pcap_path)
    
    print(f"[DEBUG] Final pcap_path: {pcap_path}")
    
    if not pcap_path:
        print(f"[DEBUG NETWORK TOOL] No PCAP path found. Returning error.")
        return {"status": "error", "message": "No pcap_path found in request or session state."}
    
    print(f"[DEBUG NETWORK TOOL] Starting analysis of PCAP file: {pcap_path}")
    
    try:
        # Perform comprehensive network analysis
        analysis_results = {}
        
        # 1. Basic statistics
        print("[DEBUG NETWORK TOOL] Running basic statistics...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-q", "-z", "io,stat,0"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["basic_stats"] = proc.stdout or proc.stderr
        
        # 2. Protocol hierarchy
        print("[DEBUG] Analyzing protocol hierarchy...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-q", "-z", "io,phs"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["protocols"] = proc.stdout or proc.stderr
        
        # 3. Top conversations
        print("[DEBUG] Extracting top conversations...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-q", "-z", "conv,ip"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["conversations"] = proc.stdout or proc.stderr
        
        # 4. DNS queries
        print("[DEBUG] Analyzing DNS queries...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-Y", "dns", "-T", "fields", 
                             "-e", "dns.qry.name", "-e", "dns.resp.addr"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["dns_queries"] = proc.stdout or "No DNS queries found"
        
        # 5. HTTP traffic
        print("[DEBUG] Analyzing HTTP traffic...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-Y", "http", "-T", "fields", 
                             "-e", "http.host", "-e", "http.request.uri", "-e", "http.user_agent"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["http_traffic"] = proc.stdout or "No HTTP traffic found"
        
        # 6. IP traffic analysis
        print("[DEBUG] Analyzing IP traffic patterns...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-T", "fields", "-e", "ip.src", "-e", "ip.dst"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["ip_traffic"] = proc.stdout or "No IP traffic found"
        
        # 7. Port activity analysis
        print("[DEBUG] Analyzing port activity...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-T", "fields", "-e", "tcp.srcport", "-e", "tcp.dstport", "-e", "udp.srcport", "-e", "udp.dstport"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["port_activity"] = proc.stdout or "No port activity found"
        
        # 8. TCP flags analysis
        print("[DEBUG] Analyzing TCP flags...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-Y", "tcp", "-T", "fields", "-e", "tcp.flags"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["tcp_flags"] = proc.stdout or "No TCP traffic found"
        
        # 9. ICMP analysis
        print("[DEBUG] Analyzing ICMP traffic...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-Y", "icmp", "-T", "fields", "-e", "icmp.type", "-e", "icmp.code"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["icmp_traffic"] = proc.stdout or "No ICMP traffic found"
        
        # 10. TLS/SSL analysis
        print("[DEBUG] Analyzing TLS/SSL traffic...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-Y", "tls", "-T", "fields", "-e", "tls.handshake.type", "-e", "tls.handshake.version"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["tls_traffic"] = proc.stdout or "No TLS traffic found"
        
        # 11. Packet size analysis
        print("[DEBUG] Analyzing packet sizes...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-T", "fields", "-e", "frame.len"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["packet_sizes"] = proc.stdout or "No packet size data"
        
        # 12. Time intervals analysis
        print("[DEBUG] Analyzing time intervals...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-T", "fields", "-e", "frame.time_relative"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["time_intervals"] = proc.stdout or "No timing data"
        
        # 13. Unusual ports analysis
        print("[DEBUG] Analyzing unusual ports...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-q", "-z", "endpoints,tcp"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["tcp_endpoints"] = proc.stdout or "No TCP endpoints found"
        
        # 14. UDP endpoints
        print("[DEBUG] Analyzing UDP endpoints...")
        proc = subprocess.run(["tshark", "-r", pcap_path, "-q", "-z", "endpoints,udp"], 
                            capture_output=True, text=True, timeout=120)
        analysis_results["udp_endpoints"] = proc.stdout or "No UDP endpoints found"
        
        return {"status": "success", "report": analysis_results}
        
    except Exception as e:
        return {"status": "error", "message": f"network analysis failed: {e}"}
