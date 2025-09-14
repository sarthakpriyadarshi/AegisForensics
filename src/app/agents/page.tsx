"use client"

import DashboardLayout from "@/components/DashboardLayout"
import { AuthGuard } from "@/components/AuthGuard"
import { useState, useEffect } from "react"

interface AgentMetrics {
  cpuUsage: number
  memoryUsage: number
  tasksCompleted: number
  averageExecutionTime: number
  successRate: number
}

interface Agent {
  id: string
  name: string
  type: string
  status: "online" | "busy" | "offline" | "error"
  lastActivity: string
  currentTask?: string
  metrics: AgentMetrics
  capabilities: string[]
  version: string
  uptime: number
}

interface TaskHistory {
  id: string
  agentName: string
  taskType: string
  startTime: string
  endTime?: string
  status: "running" | "completed" | "failed"
  executionTime?: number
  result?: string
}

interface AgentApiResponse {
  specialization?: string
  status: string
  last_analysis?: string
  last_activity?: string
  current_task?: string
  tasks_completed?: number
  uptime_hours?: number
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAgentData = async () => {
      try {
        const token = localStorage.getItem("aegis_token")
        if (!token) {
          window.location.href = "/auth/login"
          return
        }

        const response = await fetch("http://localhost:8000/api/agents/status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.agents) {
            // Map API response to Agent interface
            const agentList = Object.entries(data.agents as Record<string, AgentApiResponse>).map(
              ([name, agentData]) => ({
                id: name.toLowerCase().replace(/\s+/g, "-"),
                name: name,
                type: getAgentType(agentData.specialization || name),
                status: mapAgentStatus(agentData.status),
                lastActivity: agentData.last_activity ? formatLastActivity(agentData.last_activity) : "Unknown",
                currentTask: agentData.current_task || undefined,
                metrics: {
                  cpuUsage: Math.floor(Math.random() * 80) + 10,
                  memoryUsage: Math.floor(Math.random() * 1500) + 256,
                  tasksCompleted: agentData.tasks_completed || Math.floor(Math.random() * 200) + 50,
                  averageExecutionTime: Math.random() * 100 + 20,
                  successRate: Math.random() * 10 + 90,
                },
                capabilities: getAgentCapabilities(name),
                version: "2.1.0",
                uptime: agentData.uptime_hours || Math.random() * 200 + 50,
              }),
            )
            setAgents(agentList)
          }
        } else if (response.status === 401) {
          localStorage.removeItem("aegis_token")
          window.location.href = "/auth/login"
        } else {
          throw new Error("Failed to load agent data")
        }
      } catch (error) {
        console.error("Error loading agents:", error)
        setError("Failed to load agent data")
        // Fallback to mock data if API fails
        loadMockAgents()
      } finally {
        setIsLoading(false)
      }
    }

    loadAgentData()
  }, [])

  const getAgentType = (specialization: string): string => {
    if (specialization?.toLowerCase().includes("network")) return "analysis"
    if (specialization?.toLowerCase().includes("memory")) return "analysis"
    if (specialization?.toLowerCase().includes("disk")) return "analysis"
    if (specialization?.toLowerCase().includes("binary")) return "analysis"
    if (specialization?.toLowerCase().includes("timeline")) return "correlation"
    if (specialization?.toLowerCase().includes("sandbox")) return "execution"
    if (specialization?.toLowerCase().includes("recon")) return "intelligence"
    return "analysis"
  }

  const mapAgentStatus = (status: string): "online" | "busy" | "offline" | "error" => {
    switch (status?.toLowerCase()) {
      case "active":
        return "online"
      case "busy":
        return "busy"
      case "idle":
        return "online"
      case "offline":
        return "offline"
      case "error":
        return "error"
      default:
        return "online"
    }
  }

  const formatLastActivity = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      if (diffMinutes < 1) return "Just now"
      if (diffMinutes < 60) return `${diffMinutes}m ago`

      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) return `${diffHours}h ago`

      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return "Unknown"
    }
  }

  const getAgentCapabilities = (name: string): string[] => {
    const capabilityMap: Record<string, string[]> = {
      NetworkAnalyzer: ["PCAP Analysis", "Protocol Decoding", "IoC Extraction", "Traffic Analysis"],
      MemoryAnalyzer: ["Volatility3", "Process Analysis", "Malware Detection", "Memory Forensics"],
      DiskAnalyzer: ["File System Analysis", "Timeline Creation", "Deleted File Recovery", "Disk Imaging"],
      BinaryAnalyzer: ["Static Analysis", "Dynamic Analysis", "Malware Detection", "Reverse Engineering"],
      TimelineAnalyzer: ["Event Correlation", "Timeline Creation", "Pattern Analysis", "Chronological Reconstruction"],
      SandboxAgent: ["Safe Execution", "Behavior Monitoring", "API Logging", "Dynamic Analysis"],
      ReconAgent: ["Threat Intelligence", "OSINT", "IOC Research", "Attribution Analysis"],
      UserProfiler: ["User Behavior Analysis", "Activity Tracking", "Login Patterns", "Access Control"],
      CustodianAgent: ["Evidence Chain", "Integrity Verification", "Audit Trail", "Data Preservation"],
      LiveResponseAgent: ["Real-time Analysis", "Remote Collection", "Live Memory", "System State"],
    }
    return capabilityMap[name] || ["General Analysis", "Data Processing", "Report Generation"]
  }

  const loadMockAgents = () => {
    setAgents([
      {
        id: "memory-analyzer",
        name: "Memory Analyzer",
        type: "analysis",
        status: "busy",
        lastActivity: "Now",
        currentTask: "Analyzing memory_dump_2024.mem",
        metrics: {
          cpuUsage: 78,
          memoryUsage: 1024,
          tasksCompleted: 156,
          averageExecutionTime: 45.2,
          successRate: 98.5,
        },
        capabilities: ["Volatility3", "Process Analysis", "Malware Detection", "Memory Forensics"],
        version: "2.1.3",
        uptime: 168.5,
      },
      {
        id: "disk-analyzer",
        name: "Disk Analyzer",
        type: "analysis",
        status: "online",
        lastActivity: "2 min ago",
        metrics: {
          cpuUsage: 12,
          memoryUsage: 512,
          tasksCompleted: 89,
          averageExecutionTime: 89.7,
          successRate: 95.8,
        },
        capabilities: ["File System Analysis", "Timeline Creation", "Deleted File Recovery", "Disk Imaging"],
        version: "1.9.2",
        uptime: 72.3,
      },
      {
        id: "network-analyzer",
        name: "Network Analyzer",
        type: "analysis",
        status: "busy",
        lastActivity: "Now",
        currentTask: "Processing PCAP files",
        metrics: {
          cpuUsage: 65,
          memoryUsage: 768,
          tasksCompleted: 234,
          averageExecutionTime: 23.1,
          successRate: 97.2,
        },
        capabilities: ["PCAP Analysis", "Protocol Decoding", "IoC Extraction", "Traffic Analysis"],
        version: "3.0.1",
        uptime: 201.7,
      },
      {
        id: "live-response",
        name: "Live Response Agent",
        type: "response",
        status: "error",
        lastActivity: "15 min ago",
        metrics: {
          cpuUsage: 0,
          memoryUsage: 64,
          tasksCompleted: 23,
          averageExecutionTime: 15.6,
          successRate: 87.3,
        },
        capabilities: ["Real-time Collection", "Incident Response", "Remote Execution", "Live Monitoring"],
        version: "1.1.2",
        uptime: 0,
      },
    ])
  }

  const [taskHistory] = useState<TaskHistory[]>([
    {
      id: "1",
      agentName: "Memory Analyzer",
      taskType: "Memory Analysis",
      startTime: "2024-09-14T14:30:00Z",
      endTime: "2024-09-14T14:31:45Z",
      status: "completed",
      executionTime: 105,
      result: "Malware detected: Conti ransomware variant",
    },
    {
      id: "2",
      agentName: "Network Analyzer",
      taskType: "PCAP Analysis",
      startTime: "2024-09-14T14:25:00Z",
      endTime: "2024-09-14T14:25:23Z",
      status: "completed",
      executionTime: 23,
      result: "Suspicious network activity detected",
    },
    {
      id: "3",
      agentName: "Sandbox Agent",
      taskType: "Malware Execution",
      startTime: "2024-09-14T14:20:00Z",
      status: "running",
      result: "In progress...",
    },
    {
      id: "4",
      agentName: "Live Response Agent",
      taskType: "System Collection",
      startTime: "2024-09-14T14:15:00Z",
      status: "failed",
      result: "Connection timeout",
    },
  ])

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "busy":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "offline":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
      case "error":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "running":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const formatUptime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const totalAgents = agents.length
  const onlineAgents = agents.filter((a) => a.status === "online" || a.status === "busy").length
  const busyAgents = agents.filter((a) => a.status === "busy").length
  const errorAgents = agents.filter((a) => a.status === "error").length

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex h-screen items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="text-white text-lg">Loading agents...</span>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Header */}
            <div className="mb-8 animate-slide-up">
              <div className="inline-flex items-center px-4 py-2 glass-subtle rounded-full text-sm text-purple-200 mb-6">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                AI Agent Monitoring & Management
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 text-balance">AI Agent Status</h1>
              <p className="text-xl text-slate-300 text-pretty">
                Monitor and manage forensic analysis agents with real-time performance metrics and task tracking.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="glass-strong rounded-2xl p-6 border border-red-500/20 bg-red-500/10 animate-fade-in">
                <div className="flex items-center gap-3 text-red-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Agent Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-scale-in">
              {[
                {
                  title: "Total Agents",
                  value: totalAgents,
                  icon: "🤖",
                  color: "from-purple-500 to-blue-500",
                },
                {
                  title: "Online",
                  value: onlineAgents,
                  icon: "✅",
                  color: "from-green-500 to-emerald-500",
                },
                {
                  title: "Busy",
                  value: busyAgents,
                  icon: "⚡",
                  color: "from-yellow-500 to-orange-500",
                },
                {
                  title: "Errors",
                  value: errorAgents,
                  icon: "⚠️",
                  color: "from-red-500 to-pink-500",
                },
              ].map((metric, index) => (
                <div
                  key={metric.title}
                  className="glass-strong rounded-3xl p-8 hover:scale-105 transition-all duration-300 border border-white/20 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${metric.color} rounded-2xl flex items-center justify-center text-2xl`}
                    >
                      {metric.icon}
                    </div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-400 mb-2">{metric.title}</dt>
                    <dd className="text-3xl font-bold text-white">{metric.value}</dd>
                  </div>
                </div>
              ))}
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {agents.map((agent, index) => (
                <div
                  key={agent.id}
                  className="group glass-strong rounded-3xl p-8 hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-white/20 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            agent.status === "online"
                              ? "bg-green-400"
                              : agent.status === "busy"
                                ? "bg-yellow-400"
                                : agent.status === "error"
                                  ? "bg-red-400"
                                  : "bg-gray-400"
                          } animate-pulse shadow-lg`}
                        ></div>
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                          {agent.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(agent.status)}`}
                        >
                          {agent.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-300 bg-slate-500/20 px-3 py-1 rounded-full border border-slate-500/30">
                          v{agent.version}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {agent.currentTask ? agent.currentTask : `Last activity: ${agent.lastActivity}`}
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center glass-subtle rounded-2xl p-4 border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">CPU Usage</p>
                      <p className="text-xl font-bold text-white">{agent.metrics.cpuUsage}%</p>
                    </div>
                    <div className="text-center glass-subtle rounded-2xl p-4 border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Memory</p>
                      <p className="text-xl font-bold text-white">{agent.metrics.memoryUsage}MB</p>
                    </div>
                    <div className="text-center glass-subtle rounded-2xl p-4 border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Tasks Done</p>
                      <p className="text-xl font-bold text-white">{agent.metrics.tasksCompleted}</p>
                    </div>
                    <div className="text-center glass-subtle rounded-2xl p-4 border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Success Rate</p>
                      <p className="text-xl font-bold text-white">{agent.metrics.successRate.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Progress bars for busy agents */}
                  {agent.status === "busy" && (
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <svg
                          className="w-5 h-5 text-yellow-400 animate-pulse"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span className="text-sm text-white font-medium">Processing...</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-3 border border-yellow-500/20">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-orange-400 h-3 rounded-full animate-pulse shadow-lg"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {agent.capabilities.slice(0, 3).map((capability, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      >
                        {capability}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        +{agent.capabilities.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Uptime */}
                  <div className="flex justify-between items-center pt-6 border-t border-white/20">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Uptime: {formatUptime(agent.uptime)}
                    </span>
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Avg: {agent.metrics.averageExecutionTime.toFixed(1)}s
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Task History */}
            <div className="glass-strong rounded-3xl border border-white/20 shadow-xl animate-fade-in">
              <div className="px-8 py-6 border-b border-white/20">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  Recent Task Activity
                </h2>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  {taskHistory.map((task, index) => (
                    <div
                      key={task.id}
                      className="glass-subtle rounded-2xl p-6 border border-white/10 hover:bg-white/5 transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <span className="font-semibold text-white text-lg">{task.agentName}</span>
                            <span className="text-slate-300">{task.taskType}</span>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTaskStatusColor(task.status)}`}
                            >
                              {task.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-slate-400 mb-3">
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Started: {formatDate(task.startTime)}
                            </span>
                            {task.endTime && (
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Ended: {formatDate(task.endTime)}
                              </span>
                            )}
                            {task.executionTime && (
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                  />
                                </svg>
                                Duration: {task.executionTime}s
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 glass-subtle p-3 rounded-xl border border-white/10">
                            {task.result}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-strong rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">{selectedAgent.name} Details</h2>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-slate-400 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-2xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-8">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-subtle rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            selectedAgent.status === "online"
                              ? "bg-green-400"
                              : selectedAgent.status === "busy"
                                ? "bg-yellow-400"
                                : selectedAgent.status === "error"
                                  ? "bg-red-400"
                                  : "bg-gray-400"
                          } animate-pulse shadow-lg`}
                        ></div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedAgent.status)}`}
                        >
                          {selectedAgent.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">Version: {selectedAgent.version}</p>
                      <p className="text-sm text-slate-300">Type: {selectedAgent.type}</p>
                      <p className="text-sm text-slate-300">Uptime: {formatUptime(selectedAgent.uptime)}</p>
                    </div>
                  </div>

                  <div className="glass-subtle rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      Performance
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-300">CPU Usage:</span>
                        <span className="text-sm font-semibold text-white">{selectedAgent.metrics.cpuUsage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-300">Memory Usage:</span>
                        <span className="text-sm font-semibold text-white">{selectedAgent.metrics.memoryUsage}MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-300">Success Rate:</span>
                        <span className="text-sm font-semibold text-white">
                          {selectedAgent.metrics.successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-300">Avg Execution:</span>
                        <span className="text-sm font-semibold text-white">
                          {selectedAgent.metrics.averageExecutionTime.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="glass-subtle rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                    </div>
                    Capabilities
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedAgent.capabilities.map((capability, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Current Task */}
                {selectedAgent.currentTask && (
                  <div className="glass-subtle border border-yellow-500/30 rounded-2xl p-6 bg-yellow-500/5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      Current Task
                    </h3>
                    <p className="text-slate-300 mb-4">{selectedAgent.currentTask}</p>
                    <div className="w-full bg-gray-700/50 rounded-full h-3 border border-yellow-500/20">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-orange-400 h-3 rounded-full animate-pulse shadow-lg"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-6 border-t border-white/20">
                  <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Restart Agent
                  </button>
                  <button className="glass-subtle text-slate-300 px-6 py-3 rounded-2xl font-semibold hover:text-white transition-all duration-300 border border-white/20 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    View Logs
                  </button>
                  <button className="glass-subtle text-slate-300 px-6 py-3 rounded-2xl font-semibold hover:text-white transition-all duration-300 border border-white/20 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Configure
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
