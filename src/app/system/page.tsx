"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import DashboardLayout from "@/components/DashboardLayout"

// Types for our data
interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    frequency: number
  }
  memory: {
    total: number
    used: number
    percentage: number
  }
  disk: {
    total: number
    used: number
    percentage: number
  }
  network: {
    bytes_received: number
    bytes_sent: number
    packets_received: number
    packets_sent: number
  }
}

interface SystemInfo {
  version: string
  hostname: string
  platform: string
  architecture: string
  python_version: string
  timezone: string
  uptime: number
}

interface Process {
  pid: number
  name: string
  cpu_percent: number
  memory_percent: number
  memory_mb: number
  status: string
  started?: string
}

// Helper function to format bytes
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Helper function to format uptime
const formatUptime = (hours: number): string => {
  const days = Math.floor(hours / 24)
  const remainingHours = Math.floor(hours % 24)
  const minutes = Math.floor((hours * 60) % 60)

  if (days > 0) {
    return `${days}d ${remainingHours}h ${minutes}m`
  } else if (remainingHours > 0) {
    return `${remainingHours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

// API functions
const fetchSystemData = async () => {
  const token = localStorage.getItem("aegis_token")
  if (!token) {
    throw new Error("No authentication token found")
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  try {
    const [metricsRes, infoRes, processesRes] = await Promise.all([
      fetch("http://localhost:8000/system/metrics", { headers }),
      fetch("http://localhost:8000/system/info", { headers }),
      fetch("http://localhost:8000/system/processes", { headers }),
    ])

    if (!metricsRes.ok || !infoRes.ok || !processesRes.ok) {
      throw new Error("Failed to fetch system data")
    }

    const [metrics, info, processes] = await Promise.all([metricsRes.json(), infoRes.json(), processesRes.json()])

    return { metrics, info, processes }
  } catch (error) {
    console.error("Error fetching system data:", error)
    throw error
  }
}

export default function SystemPage() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const loadSystemData = async () => {
    try {
      setError(null)
      const data = await fetchSystemData()
      setSystemMetrics(data.metrics)
      setSystemInfo(data.info)
      setProcesses(data.processes)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load system data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSystemData()

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(loadSystemData, 5000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center glass-strong rounded-3xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-green-100 font-medium text-lg">Initializing Aegis Forensics...</p>
            <p className="text-purple-400 text-sm mt-2">Connecting to secure systems</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="glass-strong p-8 rounded-3xl max-w-md">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading System Data</h2>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={loadSystemData}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            >
              Retry
            </button>
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
                Real-time System Monitoring
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4 text-balance">System Monitor</h1>
                  <p className="text-xl text-slate-300 text-pretty">
                    Real-time system monitoring and performance metrics with intelligent alerts.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {lastUpdated && (
                    <div className="glass-subtle rounded-2xl px-4 py-3">
                      <p className="text-sm text-slate-400 mb-1">Last updated</p>
                      <p className="text-white font-medium">{lastUpdated.toLocaleTimeString()}</p>
                    </div>
                  )}
                  <button
                    onClick={loadSystemData}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 inline-flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="glass-subtle rounded-2xl p-2">
                <nav className="flex space-x-2">
                  {["overview", "processes"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                        activeTab === tab
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                          : "text-slate-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* System Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: "CPU Usage",
                      value: `${systemMetrics?.cpu.usage.toFixed(1)}%`,
                      subtitle: `${systemMetrics?.cpu.cores} cores @ ${systemMetrics?.cpu.frequency.toFixed(0)} MHz`,
                      icon: "💻",
                      color: "from-purple-500 to-blue-500",
                      progress: systemMetrics?.cpu.usage,
                    },
                    {
                      title: "Memory Usage",
                      value: `${systemMetrics?.memory.percentage.toFixed(1)}%`,
                      subtitle: `${formatBytes(systemMetrics?.memory.used || 0)} / ${formatBytes(
                        systemMetrics?.memory.total || 0,
                      )}`,
                      icon: "🧠",
                      color: "from-blue-500 to-cyan-500",
                      progress: systemMetrics?.memory.percentage,
                    },
                    {
                      title: "Disk Usage",
                      value: `${systemMetrics?.disk.percentage.toFixed(1)}%`,
                      subtitle: `${formatBytes(systemMetrics?.disk.used || 0)} / ${formatBytes(
                        systemMetrics?.disk.total || 0,
                      )}`,
                      icon: "💾",
                      color: "from-purple-500 to-blue-500",
                      progress: systemMetrics?.disk.percentage,
                    },
                    {
                      title: "Network",
                      value: formatBytes(systemMetrics?.network.bytes_received || 0),
                      subtitle: `↑ ${formatBytes(systemMetrics?.network.bytes_sent || 0)}`,
                      icon: "🌐",
                      color: "from-blue-500 to-purple-500",
                      progress: 0,
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
                        <h3 className="text-sm font-medium text-slate-400 mb-2">{metric.title}</h3>
                        <div className="text-2xl font-bold text-white mb-2">{metric.value}</div>
                        <p className="text-xs text-slate-500 mb-3">{metric.subtitle}</p>
                        {metric.progress !== undefined && metric.progress > 0 && (
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className={`bg-gradient-to-r ${metric.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${metric.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* System Information */}
                <div className="glass-strong rounded-3xl p-8 animate-fade-in">
                  <h3 className="text-2xl font-bold text-white mb-6">System Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { label: "Version", value: systemInfo?.version },
                      { label: "Hostname", value: systemInfo?.hostname },
                      { label: "Platform", value: systemInfo?.platform },
                      { label: "Architecture", value: systemInfo?.architecture },
                      { label: "Python Version", value: systemInfo?.python_version },
                      { label: "Uptime", value: formatUptime(systemInfo?.uptime || 0) },
                    ].map((info, index) => (
                      <div
                        key={info.label}
                        className="glass-subtle rounded-2xl p-4 animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <span className="text-sm font-semibold text-purple-300 block mb-2">{info.label}:</span>
                        <p className="text-white font-medium">{info.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Processes Tab */}
            {activeTab === "processes" && (
              <div className="glass-strong rounded-3xl overflow-hidden animate-fade-in">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Running Processes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-4 text-slate-300 font-semibold">PID</th>
                          <th className="text-left p-4 text-slate-300 font-semibold">Process Name</th>
                          <th className="text-left p-4 text-slate-300 font-semibold">CPU %</th>
                          <th className="text-left p-4 text-slate-300 font-semibold">Memory %</th>
                          <th className="text-left p-4 text-slate-300 font-semibold">Memory (MB)</th>
                          <th className="text-left p-4 text-slate-300 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processes.map((process, index) => (
                          <tr
                            key={process.pid}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors animate-slide-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <td className="p-4 text-slate-300">{process.pid}</td>
                            <td className="p-4 font-medium text-white">{process.name}</td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                  process.cpu_percent > 50
                                    ? "bg-red-500/20 text-red-300 border-red-500/30"
                                    : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                }`}
                              >
                                {process.cpu_percent}%
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                  process.memory_percent > 50
                                    ? "bg-red-500/20 text-red-300 border-red-500/30"
                                    : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                }`}
                              >
                                {process.memory_percent}%
                              </span>
                            </td>
                            <td className="p-4 text-slate-300">{process.memory_mb.toFixed(1)} MB</td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                  process.status === "running"
                                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                    : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                }`}
                              >
                                {process.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
