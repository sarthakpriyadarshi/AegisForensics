# agents/forensic_orchestrator.py
import os
from dotenv import load_dotenv
from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool

from agents.memory_analyzer import memory_agent
from agents.disk_analyzer import disk_agent
from agents.binary_analyzer import binary_agent
from agents.network_analyzer import network_agent
from agents.sandbox_agent import sandbox_agent
from agents.timeline_agent import timeline_agent
from agents.custodian_agent import custodian_agent
from agents.recon_agent import recon_agent
from agents.user_profiler_agent import user_profiler_agent
from agents.live_response_agent import live_response_agent

load_dotenv()

FORGE_MODEL = os.getenv("MODEL_GEMINI", "gemini-2.5-pro")

forensic_orchestrator = LlmAgent(
    name="ForensicOrchestrator",
    model=FORGE_MODEL,
    instruction=(
        "You are the Forensic Orchestrator. When analyzing files, you must call the appropriate specialist agent AND ensure they use their tools to produce actual forensic analysis.\n\n"
        "For PCAP files: Call NetworkAnalyzer and verify it executes analyze_network tool to extract real network data.\n"
        "For binary/executable files (.exe, .dll, .bin, .so): Call BinaryAnalyzer and verify it executes binary analysis tools.\n"
        "For memory dumps (.lime, .raw, .mem): Call MemoryAnalyzer and verify it executes memory analysis tools.\n"
        "For disk images (.img, .dd, .ewf, .aff): Call DiskAnalyzer and verify it executes disk analysis tools.\n"
        "For log files (.log, .txt, .csv, .evtx): Call UserProfilerAgent and verify it executes log analysis tools.\n\n"
        "CRITICAL: Do not accept generic responses from agents. Demand they execute their specific analysis tools and provide concrete technical details like packet counts, IP addresses, file hashes, process names, etc.\n\n"
        "If an agent returns generic analysis without tool execution, call it again with explicit tool execution requirements."
    ),
    # Provide the subordinate agents as AgentTools so this agent can call them.
    tools=[
        AgentTool(agent=memory_agent),
        AgentTool(agent=disk_agent),
        AgentTool(agent=binary_agent),
        AgentTool(agent=network_agent),
        AgentTool(agent=sandbox_agent),
        AgentTool(agent=timeline_agent),
        AgentTool(agent=custodian_agent),
        AgentTool(agent=recon_agent),
        AgentTool(agent=user_profiler_agent),
        AgentTool(agent=live_response_agent)
    ]
)

# Export alias for main.py
ForensicOrchestrator = forensic_orchestrator
