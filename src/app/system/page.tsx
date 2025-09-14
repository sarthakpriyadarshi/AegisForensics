'use client'

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/AuthGuard'

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
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
  const token = localStorage.getItem('aegis_token')
  if (!token) {
    throw new Error('No authentication token found')
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  try {
    const [metricsRes, infoRes, processesRes] = await Promise.all([
      fetch('http://localhost:8000/system/metrics', { headers }),
      fetch('http://localhost:8000/system/info', { headers }),
      fetch('http://localhost:8000/system/processes', { headers })
    ])

    if (!metricsRes.ok || !infoRes.ok || !processesRes.ok) {
      throw new Error('Failed to fetch system data')
    }

    const [metrics, info, processes] = await Promise.all([
      metricsRes.json(),
      infoRes.json(),
      processesRes.json()
    ])

    return { metrics, info, processes }
  } catch (error) {
    console.error('Error fetching system data:', error)
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
  const [activeTab, setActiveTab] = useState('overview')

  const loadSystemData = async () => {
    try {
      setError(null)
      const data = await fetchSystemData()
      setSystemMetrics(data.metrics)
      setSystemInfo(data.info)
      setProcesses(data.processes)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system data')
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading system information...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading System Data</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadSystemData}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">System Monitor</h1>
          <p className="text-gray-600 mt-2">Real-time system monitoring and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={loadSystemData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'processes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">CPU Usage</h3>
                <span className="text-2xl">💻</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{systemMetrics?.cpu.usage.toFixed(1)}%</div>
                <p className="text-xs text-gray-500">
                  {systemMetrics?.cpu.cores} cores @ {systemMetrics?.cpu.frequency.toFixed(0)} MHz
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${systemMetrics?.cpu.usage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Memory Usage</h3>
                <span className="text-2xl">🧠</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{systemMetrics?.memory.percentage.toFixed(1)}%</div>
                <p className="text-xs text-gray-500">
                  {formatBytes(systemMetrics?.memory.used || 0)} / {formatBytes(systemMetrics?.memory.total || 0)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all" 
                    style={{ width: `${systemMetrics?.memory.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Disk Usage</h3>
                <span className="text-2xl">💾</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{systemMetrics?.disk.percentage.toFixed(1)}%</div>
                <p className="text-xs text-gray-500">
                  {formatBytes(systemMetrics?.disk.used || 0)} / {formatBytes(systemMetrics?.disk.total || 0)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all" 
                    style={{ width: `${systemMetrics?.disk.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Network</h3>
                <span className="text-2xl">🌐</span>
              </div>
              <div className="mt-2">
                <div className="text-sm font-bold">
                  ↓ {formatBytes(systemMetrics?.network.bytes_received || 0)}
                </div>
                <div className="text-sm font-bold">
                  ↑ {formatBytes(systemMetrics?.network.bytes_sent || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {systemMetrics?.network.packets_received} / {systemMetrics?.network.packets_sent} packets
                </p>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium">Version:</span>
                <p className="text-sm text-gray-600">{systemInfo?.version}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Hostname:</span>
                <p className="text-sm text-gray-600">{systemInfo?.hostname}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Platform:</span>
                <p className="text-sm text-gray-600">{systemInfo?.platform}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Architecture:</span>
                <p className="text-sm text-gray-600">{systemInfo?.architecture}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Python Version:</span>
                <p className="text-sm text-gray-600">{systemInfo?.python_version}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Uptime:</span>
                <p className="text-sm text-gray-600">{formatUptime(systemInfo?.uptime || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processes Tab */}
      {activeTab === 'processes' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Running Processes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">PID</th>
                    <th className="text-left p-2">Process Name</th>
                    <th className="text-left p-2">CPU %</th>
                    <th className="text-left p-2">Memory %</th>
                    <th className="text-left p-2">Memory (MB)</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((process) => (
                    <tr key={process.pid} className="border-b hover:bg-gray-50">
                      <td className="p-2">{process.pid}</td>
                      <td className="p-2 font-medium">{process.name}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          process.cpu_percent > 50 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {process.cpu_percent}%
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          process.memory_percent > 50 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {process.memory_percent}%
                        </span>
                      </td>
                      <td className="p-2">{process.memory_mb.toFixed(1)} MB</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          process.status === 'running' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
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
    </AuthGuard>
  )
}
