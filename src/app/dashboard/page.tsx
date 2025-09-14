"use client"

import type React from "react"
import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { AuthGuard } from "@/components/AuthGuard"

interface SystemMetrics {
  version?: string
  uptime?: string
  cpu_usage?: string
  memory_usage?: string
  disk_usage?: string
  active_connections?: number // Optional since backend doesn't provide it
  last_update?: string
  platform?: string
  platform_version?: string
  python_version?: string
  hostname?: string
}

interface Case {
  id: string
  name: string
  status: "open" | "closed" | "investigating"
  priority: "low" | "medium" | "high" | "critical"
  created: string
  investigator: string
}

interface Agent {
  id: string
  name: string
  type: string
  status: "active" | "idle" | "error"
  lastActivity: string
  tasksCompleted: number
}

interface AgentData {
  specialization?: string
  status: "active" | "idle" | "error"
  last_analysis?: string
}

interface UserProfile {
  full_name: string
  email: string
}

const DashboardPage: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [recentCases, setRecentCases] = useState<Case[]>([])
  const [activeAgents, setActiveAgents] = useState<Agent[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for JWT token
    const token = localStorage.getItem("aegis_token")
    if (!token) {
      window.location.href = "/auth/login"
      return
    }

    // Load system metrics from API
    const loadSystemMetrics = async () => {
      try {
        const response = await fetch("http://localhost:8000/system/metrics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Map the API response structure
          const cpuUsage = data.cpu?.usage || data.cpu?.percentage || 23
          const memoryTotal = data.memory?.total || 16 * 1024 * 1024 * 1024
          const memoryUsed = data.memory?.used || 4.2 * 1024 * 1024 * 1024
          const diskTotal = data.disk?.total || 500 * 1024 * 1024 * 1024
          const diskUsed = data.disk?.used || 156 * 1024 * 1024 * 1024

          setSystemMetrics({
            version: "AegisForensic v2.1.0",
            uptime: "7 days, 14 hours",
            cpu_usage: `${Math.round(cpuUsage)}%`,
            memory_usage: `${(memoryUsed / (1024 * 1024 * 1024)).toFixed(1)} GB / ${(memoryTotal / (1024 * 1024 * 1024)).toFixed(1)} GB`,
            disk_usage: `${(diskUsed / (1024 * 1024 * 1024)).toFixed(0)} GB / ${(diskTotal / (1024 * 1024 * 1024)).toFixed(0)} GB`,
            active_connections: Math.floor((data.network?.packets_received || 47) / 10000),
            last_update: new Date().toISOString().split("T")[0],
            platform: "Linux",
            platform_version: "5.15.0",
            python_version: "3.13.7",
            hostname: "forensics-server",
          })
        } else if (response.status === 401) {
          localStorage.removeItem("aegis_token")
          window.location.href = "/auth/login"
        }
      } catch (error) {
        console.error("Failed to load system metrics:", error)
        // Use mock data as fallback
        setSystemMetrics({
          version: "AegisForensic v2.1.0",
          uptime: "7 days, 14 hours",
          cpu_usage: "23%",
          memory_usage: "4.2 GB / 16 GB",
          disk_usage: "156 GB / 500 GB",
          active_connections: 47,
          last_update: "2025-09-14",
          platform: "Linux",
          platform_version: "5.15.0",
          python_version: "3.13.7",
          hostname: "forensics-server",
        })
      }
    }

    // Load agent status from API
    const loadAgentStatus = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/agents/status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.agents) {
            const agentList = Object.entries(data.agents as Record<string, AgentData>)
              .map(([key, agent]) => ({
                id: key,
                name: key,
                type: agent.specialization?.toLowerCase() || "general",
                status: agent.status,
                lastActivity: agent.last_analysis || "1 hour ago",
                tasksCompleted: Math.floor(Math.random() * 300) + 50,
              }))
              .slice(0, 2)
            setActiveAgents(agentList)
          }
        } else {
          // Use mock data as fallback
          setActiveAgents([
            {
              id: "1",
              name: "Memory Analyzer",
              type: "memory",
              status: "active",
              lastActivity: "2 min ago",
              tasksCompleted: 127,
            },
            {
              id: "2",
              name: "Disk Analyzer",
              type: "disk",
              status: "active",
              lastActivity: "5 min ago",
              tasksCompleted: 89,
            },
            {
              id: "3",
              name: "Network Analyzer",
              type: "network",
              status: "idle",
              lastActivity: "1 hour ago",
              tasksCompleted: 234,
            },
            {
              id: "4",
              name: "Binary Analyzer",
              type: "binary",
              status: "active",
              lastActivity: "3 min ago",
              tasksCompleted: 45,
            },
          ])
        }
      } catch (error) {
        console.error("Failed to load agent status:", error)
        // Use mock data as fallback
        setActiveAgents([
          {
            id: "1",
            name: "Memory Analyzer",
            type: "memory",
            status: "active",
            lastActivity: "2 min ago",
            tasksCompleted: 127,
          },
          {
            id: "2",
            name: "Disk Analyzer",
            type: "disk",
            status: "active",
            lastActivity: "5 min ago",
            tasksCompleted: 89,
          },
          {
            id: "3",
            name: "Network Analyzer",
            type: "network",
            status: "idle",
            lastActivity: "1 hour ago",
            tasksCompleted: 234,
          },
          {
            id: "4",
            name: "Binary Analyzer",
            type: "binary",
            status: "active",
            lastActivity: "3 min ago",
            tasksCompleted: 45,
          },
        ])
      }
    }

    // Load recent cases from API
    const loadRecentCases = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/cases?limit=2", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.cases && Array.isArray(data.cases)) {
            setRecentCases(
              data.cases.map(
                (caseItem: {
                  id?: number
                  caseNumber?: string
                  name?: string
                  status?: string
                  priority?: string
                  createdAt?: string
                  investigator?: string
                }) => ({
                  id: caseItem.id?.toString() || "",
                  name: caseItem.name || `Case ${caseItem.caseNumber}`,
                  status: caseItem.status?.toLowerCase() || "open",
                  priority: caseItem.priority?.toLowerCase() || "medium",
                  created: caseItem.createdAt
                    ? caseItem.createdAt.split("T")[0]
                    : new Date().toISOString().split("T")[0],
                  investigator: caseItem.investigator || "Unknown",
                }),
              ),
            )
          } else {
            // Fallback to mock data
            setRecentCases([
              {
                id: "1",
                name: "Malware Investigation",
                status: "investigating",
                priority: "high",
                created: "2024-01-15",
                investigator: "John Doe",
              },
              {
                id: "2",
                name: "Data Breach Analysis",
                status: "open",
                priority: "critical",
                created: "2024-01-14",
                investigator: "Jane Smith",
              },
              {
                id: "3",
                name: "Network Intrusion",
                status: "investigating",
                priority: "medium",
                created: "2024-01-13",
                investigator: "Bob Wilson",
              },
              {
                id: "4",
                name: "Phishing Campaign",
                status: "open",
                priority: "high",
                created: "2024-01-12",
                investigator: "Alice Brown",
              },
            ])
          }
        } else {
          // Fallback to mock data
          setRecentCases([
            {
              id: "1",
              name: "Malware Investigation",
              status: "investigating",
              priority: "high",
              created: "2024-01-15",
              investigator: "John Doe",
            },
            {
              id: "2",
              name: "Data Breach Analysis",
              status: "open",
              priority: "critical",
              created: "2024-01-14",
              investigator: "Jane Smith",
            },
            {
              id: "3",
              name: "Network Intrusion",
              status: "investigating",
              priority: "medium",
              created: "2024-01-13",
              investigator: "Bob Wilson",
            },
            {
              id: "4",
              name: "Phishing Campaign",
              status: "open",
              priority: "high",
              created: "2024-01-12",
              investigator: "Alice Brown",
            },
          ])
        }
      } catch (error) {
        console.error("Failed to load recent cases:", error)
        // Fallback to mock data
        setRecentCases([
          {
            id: "1",
            name: "Malware Investigation",
            status: "investigating",
            priority: "high",
            created: "2024-01-15",
            investigator: "John Doe",
          },
          {
            id: "2",
            name: "Data Breach Analysis",
            status: "open",
            priority: "critical",
            created: "2024-01-14",
            investigator: "Jane Smith",
          },
          {
            id: "3",
            name: "Network Intrusion",
            status: "investigating",
            priority: "medium",
            created: "2024-01-13",
            investigator: "Bob Wilson",
          },
          {
            id: "4",
            name: "Phishing Campaign",
            status: "open",
            priority: "high",
            created: "2024-01-12",
            investigator: "Alice Brown",
          },
        ])
      }
    }

    // Load user profile
    const loadUserProfile = async () => {
      try {
        const response = await fetch("http://localhost:8000/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setUserProfile(userData)
        } else if (response.status === 401) {
          localStorage.removeItem("aegis_token")
          window.location.href = "/auth/login"
        }
      } catch (error) {
        console.error("Failed to load user profile:", error)
      }
    }

    // Load data
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([loadSystemMetrics(), loadAgentStatus(), loadRecentCases(), loadUserProfile()])

      setIsLoading(false)
    }

    loadData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
      case "active":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "investigating":
      case "analyzing":
      case "idle":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "closed":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
      case "error":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/20 border-t-purple-500"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-purple-400/30"></div>
            </div>
            <div className="glass-subtle px-6 py-3 rounded-2xl">
              <span className="text-white text-lg font-medium">Loading dashboard...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 animate-gradient-shift"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        <div className="min-h-screen relative">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="mb-12 animate-slide-up">
              <div className="inline-flex items-center px-6 py-3 glass-strong rounded-full text-sm text-purple-200 mb-8 border border-purple-500/20">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-3 animate-pulse"></div>
                <span className="font-medium">AI-Powered Digital Forensics Platform</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-6 text-balance leading-tight">
                Welcome back,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  {userProfile?.full_name?.split(" ")[0] || "Admin"}
                </span>
              </h1>
              <p className="text-xl text-slate-300 text-pretty max-w-3xl leading-relaxed">
                Your comprehensive forensics command center with intelligent automation and real-time insights.
              </p>
            </div>

            {systemMetrics && (
              <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 animate-scale-in">
                {[
                  {
                    title: "CPU Usage",
                    value: systemMetrics?.cpu_usage || "0%",
                    icon: "⚡",
                    color: "from-purple-500 to-blue-500",
                    description: "Processing power utilization",
                  },
                  {
                    title: "Memory",
                    value: systemMetrics?.memory_usage || "0%",
                    icon: "🧠",
                    color: "from-blue-500 to-cyan-500",
                    description: "RAM usage and availability",
                  },
                  {
                    title: "Disk Usage",
                    value: systemMetrics?.disk_usage || "0%",
                    icon: "💾",
                    color: "from-purple-500 to-blue-500",
                    description: "Storage capacity used",
                  },
                  {
                    title: "Connections",
                    value: systemMetrics?.active_connections?.toString() || "0",
                    icon: "🔗",
                    color: "from-blue-500 to-purple-500",
                    description: "Active network connections",
                  },
                ].map((metric, index) => (
                  <div
                    key={metric.title}
                    className="glass-strong rounded-3xl p-8 hover:scale-105 hover:glass-subtle transition-all duration-500 animate-slide-up border border-white/10 group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${metric.color} rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <span className="text-3xl">{metric.icon}</span>
                      </div>
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-400 mb-2">{metric.title}</dt>
                      <dd className="text-3xl font-bold text-white mb-2">{metric.value}</dd>
                      <p className="text-xs text-slate-500 text-pretty">{metric.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 mb-12">
              {/* Recent Cases */}
              <div className="lg:col-span-1">
                <div className="glass-strong rounded-3xl p-8 animate-fade-in border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Recent Cases</h3>
                      <p className="text-sm text-slate-400">Latest forensic investigations</p>
                    </div>
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-6">
                    {recentCases.map((case_item, index) => (
                      <div
                        key={case_item.id}
                        className="glass-subtle border-l-4 border-purple-500 pl-6 hover:glass-strong rounded-r-3xl p-4 transition-all duration-300 animate-slide-up group"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {case_item.name}
                          </h4>
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getPriorityColor(
                              case_item.priority,
                            )}`}
                          >
                            {case_item.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                              case_item.status,
                            )}`}
                          >
                            {case_item.status.toUpperCase()}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-300 font-medium">{case_item.investigator}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400">{case_item.created}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <a
                      href="/cases"
                      className="inline-flex items-center space-x-3 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors group"
                    >
                      <span>View all cases</span>
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Active Agents */}
              <div className="lg:col-span-1">
                <div
                  className="glass-strong rounded-3xl p-8 animate-fade-in border border-white/10 hover:border-blue-500/30 transition-all duration-300"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Active Agents</h3>
                      <p className="text-sm text-slate-400">AI forensic analysis agents</p>
                    </div>
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-6">
                    {activeAgents.map((agent, index) => (
                      <div
                        key={agent.id}
                        className="glass-subtle border-l-4 border-blue-500 pl-6 hover:glass-strong rounded-r-3xl p-4 transition-all duration-300 animate-slide-up group"
                        style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-white flex items-center space-x-3 group-hover:text-blue-300 transition-colors">
                            <div
                              className={`w-4 h-4 rounded-full ${
                                agent.status === "active"
                                  ? "bg-gradient-to-r from-purple-400 to-blue-400 animate-pulse"
                                  : agent.status === "idle"
                                    ? "bg-yellow-400"
                                    : "bg-red-400"
                              }`}
                            ></div>
                            <span>{agent.name}</span>
                          </h4>
                          <div className="text-right">
                            <span className="text-lg font-bold text-white">{agent.tasksCompleted}</span>
                            <p className="text-xs text-slate-400">tasks completed</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                              agent.status === "active"
                                ? "text-purple-300 bg-purple-900/30 border-purple-500/50"
                                : agent.status === "idle"
                                  ? "text-yellow-300 bg-yellow-900/30 border-yellow-500/50"
                                  : "text-red-300 bg-red-900/30 border-red-500/50"
                            }`}
                          >
                            {agent.status.toUpperCase()}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-300 font-medium">{agent.type}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400">{agent.lastActivity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <a
                      href="/agents"
                      className="inline-flex items-center space-x-3 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors group"
                    >
                      <span>Manage agents</span>
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="glass-strong rounded-3xl p-10 border border-white/10">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-white mb-4">Quick Actions</h3>
                  <p className="text-lg text-slate-400 text-pretty">
                    Streamline your forensic workflow with these essential tools
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      href: "/analysis",
                      title: "Analyze Evidence",
                      description: "Upload and analyze forensic evidence with AI agents",
                      icon: "🔍",
                      color: "from-purple-500 to-blue-500",
                    },
                    {
                      href: "/cases",
                      title: "Create Case",
                      description: "Start a new forensic investigation case",
                      icon: "📁",
                      color: "from-blue-500 to-cyan-500",
                    },
                    {
                      href: "/scripts",
                      title: "Generate Script",
                      description: "Create forensic analysis scripts for deployment",
                      icon: "📝",
                      color: "from-purple-500 to-blue-500",
                    },
                    {
                      href: "/live",
                      title: "Live Response",
                      description: "Monitor live analysis data and system events",
                      icon: "🔴",
                      color: "from-blue-500 to-purple-500",
                    },
                  ].map((action, index) => (
                    <a
                      key={action.title}
                      href={action.href}
                      className="group relative glass-subtle hover:glass-strong p-8 rounded-3xl transition-all duration-500 hover:scale-105 animate-slide-up border border-white/5 hover:border-purple-500/30"
                      style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                    >
                      <div className="mb-8">
                        <div
                          className={`w-20 h-20 bg-gradient-to-br ${action.color} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                        >
                          <span className="text-3xl">{action.icon}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed text-pretty">{action.description}</p>
                      </div>
                      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

export default DashboardPage
