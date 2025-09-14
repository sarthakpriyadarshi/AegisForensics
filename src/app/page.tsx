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
  active_connections: number
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

interface Activity {
  id: string
  type: "analysis" | "case" | "alert" | "system"
  message: string
  timestamp: string
  severity: "info" | "warning" | "error" | "success"
}

const DashboardPage: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [recentCases, setRecentCases] = useState<Case[]>([])
  const [activeAgents, setActiveAgents] = useState<Agent[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
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
        const response = await fetch("http://localhost:8000/system/info", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSystemMetrics(data)
        } else if (response.status === 401) {
          // Token expired or invalid
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
            const agentList = Object.entries(data.agents).map(([key, agent]: [string, any]) => ({
              id: key,
              name: key,
              type: agent.specialization?.toLowerCase() || "general",
              status: agent.status,
              lastActivity: agent.last_analysis || "1 hour ago",
              tasksCompleted: Math.floor(Math.random() * 300) + 50,
            }))
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

    // Load data
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([loadSystemMetrics(), loadAgentStatus()])

      // Mock cases and activities
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
      ])

      setRecentActivity([
        {
          id: "1",
          type: "analysis",
          message: "Memory dump analysis completed for Case #2025-001",
          timestamp: "2 min ago",
          severity: "success",
        },
        {
          id: "2",
          type: "alert",
          message: "Suspicious network traffic detected",
          timestamp: "5 min ago",
          severity: "warning",
        },
        {
          id: "3",
          type: "case",
          message: "New case created: Malware Investigation",
          timestamp: "10 min ago",
          severity: "info",
        },
        {
          id: "4",
          type: "system",
          message: "Backup completed successfully",
          timestamp: "1 hour ago",
          severity: "success",
        },
        {
          id: "5",
          type: "analysis",
          message: "Binary analysis failed - file corrupted",
          timestamp: "2 hours ago",
          severity: "error",
        },
      ])

      setIsLoading(false)
    }

    loadData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "active":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30"
      case "investigating":
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
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "low":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "text-purple-400"
      case "warning":
        return "text-yellow-400"
      case "error":
        return "text-red-400"
      default:
        return "text-slate-400"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "analysis":
        return (
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )
      case "case":
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        )
      case "alert":
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        )
      case "system":
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
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
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                AI-Powered Digital Forensics Platform
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 text-balance">Welcome back, Admin</h1>
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
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    ),
                    color: "from-purple-500 to-blue-500",
                  },
                  {
                    title: "Memory",
                    value: systemMetrics.memory_usage,
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                    ),
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    title: "Disk Usage",
                    value: systemMetrics.disk_usage,
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                        />
                      </svg>
                    ),
                    color: "from-cyan-500 to-teal-500",
                  },
                  {
                    title: "Connections",
                    value: systemMetrics.active_connections.toString(),
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    ),
                    color: "from-teal-500 to-green-500",
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
                        {metric.icon}
                      </div>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
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
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
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
                        className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-all duration-300 animate-slide-up"
                        style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              agent.status === "active"
                                ? "bg-green-400 animate-pulse"
                                : agent.status === "idle"
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                            }`}
                          ></div>
                          <div>
                            <p className="text-sm font-semibold text-white">{agent.name}</p>
                            <p className="text-xs text-slate-400">{agent.lastActivity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-slate-300">{agent.tasksCompleted}</span>
                          <p className="text-xs text-slate-500">tasks</p>
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

              {/* Recent Activity */}
              <div className="lg:col-span-1">
                <div className="glass-strong rounded-3xl p-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex space-x-3 p-3 hover:bg-white/5 rounded-2xl transition-all duration-300 animate-slide-up"
                        style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                      >
                        <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white leading-relaxed">{activity.message}</p>
                          <p className={`text-xs font-medium ${getSeverityColor(activity.severity)}`}>
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <a
                      href="/system"
                      className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center space-x-2"
                    >
                      <span>View system logs</span>
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
                      icon: (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      ),
                      color: "from-purple-500 to-blue-500",
                    },
                    {
                      href: "/cases",
                      title: "Create Case",
                      description: "Start a new forensic investigation case",
                      icon: (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                      ),
                      color: "from-blue-500 to-cyan-500",
                    },
                    {
                      href: "/scripts",
                      title: "Generate Script",
                      description: "Create forensic analysis scripts for deployment",
                      icon: (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                      ),
                      color: "from-cyan-500 to-teal-500",
                    },
                    {
                      href: "/live",
                      title: "Live Response",
                      description: "Monitor live analysis data and system events",
                      icon: (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      ),
                      color: "from-teal-500 to-green-500",
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
                          {action.icon}
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
