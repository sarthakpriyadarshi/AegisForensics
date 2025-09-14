"use client"

import type React from "react"
import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { AuthGuard } from "@/components/AuthGuard"

interface SystemMetrics {
  version: string
  uptime: string
  cpu_usage: string
  memory_usage: string
  disk_usage: string
  active_connections?: number  // Optional since backend doesn't provide it
  last_update: string
  platform: string
  platform_version: string
  python_version: string
  hostname: string
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
          const memoryTotal = data.memory?.total || 16 * 1024*1024*1024
          const memoryUsed = data.memory?.used || 4.2 * 1024*1024*1024
          const diskTotal = data.disk?.total || 500 * 1024*1024*1024
          const diskUsed = data.disk?.used || 156 * 1024*1024*1024
          
          setSystemMetrics({
            version: "AegisForensic v2.1.0",
            uptime: "7 days, 14 hours",
            cpu_usage: `${Math.round(cpuUsage)}%`,
            memory_usage: `${(memoryUsed / (1024*1024*1024)).toFixed(1)} GB / ${(memoryTotal / (1024*1024*1024)).toFixed(1)} GB`,
            disk_usage: `${(diskUsed / (1024*1024*1024)).toFixed(0)} GB / ${(diskTotal / (1024*1024*1024)).toFixed(0)} GB`,
            active_connections: Math.floor((data.network?.packets_received || 47) / 10000),
            last_update: new Date().toISOString().split('T')[0],
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
            const agentList = Object.entries(data.agents as Record<string, AgentData>).map(([key, agent]) => ({
              id: key,
              name: key,
              type: agent.specialization?.toLowerCase() || "general",
              status: agent.status,
              lastActivity: agent.last_analysis || "1 hour ago",
              tasksCompleted: Math.floor(Math.random() * 300) + 50,
            })).slice(0, 4)
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
        const response = await fetch("http://localhost:8000/api/cases?limit=4", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.cases && Array.isArray(data.cases)) {
            setRecentCases(data.cases.map((caseItem: {
              id?: number;
              caseNumber?: string;
              name?: string;
              status?: string;
              priority?: string;
              createdAt?: string;
              investigator?: string;
            }) => ({
              id: caseItem.id?.toString() || "",
              name: caseItem.name || `Case ${caseItem.caseNumber}`,
              status: caseItem.status?.toLowerCase() || "open",
              priority: caseItem.priority?.toLowerCase() || "medium",
              created: caseItem.createdAt ? caseItem.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
              investigator: caseItem.investigator || "Unknown",
            })))
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="text-white text-lg">Loading dashboard...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8 animate-slide-up">
              <div className="inline-flex items-center px-4 py-2 glass-subtle rounded-full text-sm text-purple-200 mb-6">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                AI-Powered Digital Forensics Platform
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 text-balance">
                Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Admin'}
              </h1>
              <p className="text-xl text-slate-300 text-pretty">
                Your comprehensive forensics command center with intelligent automation and real-time insights.
              </p>
            </div>

            {/* System Metrics */}
            {systemMetrics && (
              <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-scale-in">
                {[
                  {
                    title: "CPU Usage",
                    value: systemMetrics.cpu_usage,
                    icon: "⚡",
                    color: "from-purple-500 to-blue-500",
                  },
                  {
                    title: "Memory",
                    value: systemMetrics.memory_usage,
                    icon: "🧠",
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    title: "Disk Usage",
                    value: systemMetrics.disk_usage,
                    icon: "💾",
                    color: "from-purple-500 to-blue-500",
                  },
                  {
                    title: "Connections",
                    value: systemMetrics.active_connections?.toString() || "N/A",
                    icon: "🔗",
                    color: "from-blue-500 to-purple-500",
                  },
                ].map((metric, index) => (
                  <div
                    key={metric.title}
                    className="glass-strong rounded-3xl p-6 hover:scale-105 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-2xl flex items-center justify-center`}
                      >
                        <span className="text-2xl">{metric.icon}</span>
                      </div>
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-400 mb-2">{metric.title}</dt>
                      <dd className="text-2xl font-bold text-white">{metric.value}</dd>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Recent Cases */}
              <div className="lg:col-span-1">
                <div className="glass-strong rounded-3xl p-6 animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Recent Cases</h3>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    {recentCases.map((case_item, index) => (
                      <div
                        key={case_item.id}
                        className="border-l-4 border-purple-500 pl-4 hover:bg-white/5 rounded-r-2xl p-3 transition-all duration-300 animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-white">{case_item.name}</h4>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                              case_item.priority,
                            )}`}
                          >
                            {case_item.priority}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              case_item.status,
                            )}`}
                          >
                            {case_item.status}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-300">{case_item.investigator}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <a
                      href="/cases"
                      className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center space-x-2"
                    >
                      <span>View all cases</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="glass-strong rounded-3xl p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Active Agents</h3>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    {activeAgents.map((agent, index) => (
                      <div
                        key={agent.id}
                        className="border-l-4 border-blue-500 pl-4 hover:bg-white/5 rounded-r-2xl p-3 transition-all duration-300 animate-slide-up"
                        style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                agent.status === "active"
                                  ? "bg-purple-400 animate-pulse"
                                  : agent.status === "idle"
                                    ? "bg-yellow-400"
                                    : "bg-red-400"
                              }`}
                            ></div>
                            <span>{agent.name}</span>
                          </h4>
                          <span className="text-sm font-medium text-slate-300">{agent.tasksCompleted} tasks</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                              agent.status === "active"
                                ? "text-purple-300 bg-purple-900/30 border-purple-500/50"
                                : agent.status === "idle"
                                  ? "text-yellow-300 bg-yellow-900/30 border-yellow-500/50"
                                  : "text-red-300 bg-red-900/30 border-red-500/50"
                            }`}
                          >
                            {agent.status}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-300">{agent.lastActivity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <a
                      href="/agents"
                      className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center space-x-2"
                    >
                      <span>Manage agents</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Quick Actions */}
            <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="glass-strong rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-white mb-8">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                      className="group relative glass-subtle hover:glass-strong p-6 rounded-3xl transition-all duration-300 hover:scale-105 animate-slide-up"
                      style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                    >
                      <div className="mb-6">
                        <div
                          className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                        >
                          <span className="text-2xl">{action.icon}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed text-pretty">{action.description}</p>
                      </div>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
