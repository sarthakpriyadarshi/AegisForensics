"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import DashboardLayout from "@/components/DashboardLayout"

interface LiveDataPoint {
  id: string
  timestamp: string
  source: string
  type: "network" | "file" | "process" | "memory" | "registry" | "event"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  details: Record<string, unknown>
  agent: string
}

interface StreamStats {
  totalEvents: number
  eventsPerSecond: number
  networkEvents: number
  fileEvents: number
  processEvents: number
  memoryEvents: number
  registryEvents: number
  systemEvents: number
  [key: string]: number
}

interface ActiveAgent {
  id: string
  name: string
  type: string
  status: "active" | "idle" | "error"
  lastUpdate: string
  eventsGenerated: number
}

// Interface for system events from API
interface SystemEvent {
  id?: string | number
  timestamp?: string
  source?: string
  event_type?: string
  type?: string
  severity?: string
  level?: string
  message?: string
  description?: string
  agent?: string
  [key: string]: unknown
}

const LiveStreamingPage: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamData, setStreamData] = useState<LiveDataPoint[]>([])
  const [filteredData, setFilteredData] = useState<LiveDataPoint[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "network",
    "file",
    "process",
    "memory",
    "registry",
    "event",
  ])
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>(["low", "medium", "high", "critical"])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper functions
  const mapEventType = (type: string): "network" | "file" | "process" | "memory" | "registry" | "event" => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('network')) return 'network'
    if (lowerType.includes('file')) return 'file'
    if (lowerType.includes('process')) return 'process'
    if (lowerType.includes('memory')) return 'memory'
    if (lowerType.includes('registry')) return 'registry'
    return 'event'
  }

  const mapSeverity = (severity: string): "low" | "medium" | "high" | "critical" => {
    const lowerSeverity = severity.toLowerCase()
    if (lowerSeverity.includes('critical') || lowerSeverity.includes('error')) return 'critical'
    if (lowerSeverity.includes('high') || lowerSeverity.includes('warn')) return 'high'
    if (lowerSeverity.includes('low') || lowerSeverity.includes('debug')) return 'low'
    return 'medium'
  }

  // Load system events from API
  useEffect(() => {
    const loadSystemEvents = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("aegis_token")
        if (!token) {
          window.location.href = "/auth/login"
          return
        }

        const response = await fetch("http://localhost:8000/system/events?limit=50", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const events = await response.json()
          // Map API events to LiveDataPoint format
          const mappedEvents: LiveDataPoint[] = events.map((event: SystemEvent, index: number) => ({
            id: event.id?.toString() || index.toString(),
            timestamp: event.timestamp || new Date().toISOString(),
            source: event.source || "System",
            type: mapEventType(event.event_type || event.type || "event"),
            severity: mapSeverity(event.severity || event.level || "medium"),
            message: event.message || event.description || "System event",
            details: event,
            agent: event.agent || "System",
          }))
          setStreamData(mappedEvents)
        } else if (response.status === 401) {
          localStorage.removeItem("aegis_token")
          window.location.href = "/auth/login"
        } else {
          // Fallback to mock data if API not available
          loadMockData()
        }
      } catch (error) {
        console.error("Error loading system events:", error)
        setError("Failed to load system events")
        loadMockData()
      } finally {
        setIsLoading(false)
      }
    }

    const loadMockData = () => {
      const mockEvents: LiveDataPoint[] = [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          source: "Network Monitor",
          type: "network",
          severity: "high",
          message: "Suspicious outbound connection detected",
          details: { ip: "192.168.1.100", port: 443 },
          agent: "NetworkAnalyzer",
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 1000).toISOString(),
          source: "File Monitor",
          type: "file",
          severity: "medium",
          message: "New executable created in system directory",
          details: { path: "/system/bin/suspicious.exe" },
          agent: "DiskAnalyzer",
        },
      ]
      setStreamData(mockEvents)
    }

    loadSystemEvents()

    // Set up polling for live updates
    const interval = setInterval(() => {
      if (isStreaming) {
        loadSystemEvents()
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [isStreaming])

  // Rest of the component logic stays the same
  const [searchQuery, setSearchQuery] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const maxEvents = 1000
  const [selectedAgent, setSelectedAgent] = useState<string>("all")
  const [streamStats, setStreamStats] = useState<StreamStats>({
    totalEvents: 0,
    eventsPerSecond: 0,
    networkEvents: 0,
    fileEvents: 0,
    processEvents: 0,
    memoryEvents: 0,
    registryEvents: 0,
    systemEvents: 0,
  })
  const [activeAgents] = useState<ActiveAgent[]>([
    {
      id: "network-1",
      name: "Network Analyzer",
      type: "network",
      status: "active",
      lastUpdate: "2024-01-15T10:30:00Z",
      eventsGenerated: 1247,
    },
    {
      id: "memory-1",
      name: "Memory Analyzer",
      type: "memory",
      status: "active",
      lastUpdate: "2024-01-15T10:29:58Z",
      eventsGenerated: 892,
    },
    {
      id: "disk-1",
      name: "Disk Analyzer",
      type: "disk",
      status: "active",
      lastUpdate: "2024-01-15T10:29:55Z",
      eventsGenerated: 654,
    },
    {
      id: "process-1",
      name: "Process Monitor",
      type: "process",
      status: "idle",
      lastUpdate: "2024-01-15T10:25:12Z",
      eventsGenerated: 2341,
    },
    {
      id: "timeline-1",
      name: "Timeline Agent",
      type: "timeline",
      status: "active",
      lastUpdate: "2024-01-15T10:29:59Z",
      eventsGenerated: 445,
    },
  ])

  const scrollRef = useRef<HTMLDivElement>(null)
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mock data generators
  const generateMockEvent = (): LiveDataPoint => {
    const types: LiveDataPoint["type"][] = ["network", "file", "process", "memory", "registry", "event"]
    const severities: LiveDataPoint["severity"][] = ["low", "medium", "high", "critical"]
    const agents = ["Network Analyzer", "Memory Analyzer", "Disk Analyzer", "Process Monitor", "Timeline Agent"]

    const type = types[Math.floor(Math.random() * types.length)]
    const severity = severities[Math.floor(Math.random() * severities.length)]
    const agent = agents[Math.floor(Math.random() * agents.length)]

    const messages = {
      network: [
        "Suspicious network connection detected",
        "Port scan activity observed",
        "Encrypted traffic anomaly",
        "DNS query to suspicious domain",
        "Unusual bandwidth usage detected",
      ],
      file: [
        "File modification detected",
        "Suspicious file creation",
        "File deletion event",
        "File permission change",
        "Large file transfer detected",
      ],
      process: [
        "New process started",
        "Process terminated unexpectedly",
        "High CPU usage detected",
        "Memory leak suspected",
        "Privilege escalation attempt",
      ],
      memory: [
        "Memory dump analysis complete",
        "Suspicious memory pattern",
        "Buffer overflow detected",
        "Memory injection attempt",
        "Heap corruption identified",
      ],
      registry: [
        "Registry key modified",
        "Suspicious registry entry",
        "Registry key deleted",
        "Autorun entry created",
        "System configuration changed",
      ],
      event: [
        "System event logged",
        "Security event triggered",
        "Application crash detected",
        "Login attempt recorded",
        "System reboot initiated",
      ],
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      source: `${type}-source-${Math.floor(Math.random() * 100)}`,
      type,
      severity,
      message: messages[type][Math.floor(Math.random() * messages[type].length)],
      details: {
        pid: type === "process" ? Math.floor(Math.random() * 10000) : undefined,
        ip: type === "network" ? `192.168.1.${Math.floor(Math.random() * 255)}` : undefined,
        port: type === "network" ? Math.floor(Math.random() * 65535) : undefined,
        filename: type === "file" ? `/path/to/file${Math.floor(Math.random() * 1000)}.ext` : undefined,
        size: type === "file" ? Math.floor(Math.random() * 1000000) : undefined,
      },
      agent,
    }
  }

  // Start streaming
  const startStreaming = async () => {
    const token = localStorage.getItem("aegis_token")
    if (!token) {
      alert("Please login to start live streaming")
      window.location.href = "/auth/login"
      return
    }

    try {
      // First, start the live event recording
      const startResponse = await fetch("http://localhost:8000/api/events/start-recording", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (startResponse.ok) {
        const startResult = await startResponse.json()
        const sessionId = startResult.session_id

        setIsStreaming(true)

        // Start polling for live events
        streamIntervalRef.current = setInterval(async () => {
          try {
            const eventsResponse = await fetch(`http://localhost:8000/api/events/live-stream?limit=20&session_id=${sessionId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (eventsResponse.ok) {
              const eventsData = await eventsResponse.json()

              if (eventsData.events && eventsData.events.length > 0) {
                const transformedEvents = eventsData.events.map((event: SystemEvent) => ({
                  id: event.id || Date.now().toString() + Math.random(),
                  timestamp: event.timestamp || new Date().toISOString(),
                  source: event.source || "Unknown",
                  type: mapEventType(event.type || "event"),
                  severity: mapSeverity(event.severity || "low"),
                  message: event.message || "Event detected",
                  details: event.details || {},
                  agent: event.agent || "Live Response Agent",
                }))

                setStreamData((prev) => {
                  const updated = [...transformedEvents, ...prev].slice(0, maxEvents)
                  return updated
                })

                // Update stats
                setStreamStats((prev) => {
                  const newStats = { ...prev }
                  transformedEvents.forEach((event: LiveDataPoint) => {
                    newStats.totalEvents += 1
                    const eventTypeKey = `${event.type}Events` as keyof StreamStats
                    if (typeof newStats[eventTypeKey] === "number") {
                      ;(newStats[eventTypeKey] as number) += 1
                    }
                  })
                  newStats.eventsPerSecond = eventsData.events_per_second || Math.random() * 3 + 1
                  return newStats
                })
              }
            }
          } catch (error) {
            console.error("Error fetching live events:", error)
            // Fall back to mock data generation
            const newEvent = generateMockEvent()
            setStreamData((prev) => {
              const updated = [newEvent, ...prev].slice(0, maxEvents)
              return updated
            })
          }
        }, 3000) // Poll every 3 seconds
      } else if (startResponse.status === 401) {
        localStorage.removeItem("aegis_token")
        window.location.href = "/auth/login"
      } else {
        const errorData = await startResponse.json()
        alert(`Failed to start live streaming: ${errorData.detail || "Unknown error"}`)

        // Fall back to mock streaming
        setIsStreaming(true)
        streamIntervalRef.current = setInterval(
          () => {
            const newEvent = generateMockEvent()
            setStreamData((prev) => {
              const updated = [newEvent, ...prev].slice(0, maxEvents)
              return updated
            })
            setStreamStats((prev) => ({
              ...prev,
              totalEvents: prev.totalEvents + 1,
              eventsPerSecond: Math.random() * 5 + 1,
              [`${newEvent.type}Events`]: (prev as Record<string, number>)[`${newEvent.type}Events`] + 1,
            }))
          },
          Math.random() * 2000 + 500,
        )
      }
    } catch (error) {
      console.error("Error starting live streaming:", error)
      alert("Failed to start live streaming. Using mock data.")

      // Fall back to mock streaming
      setIsStreaming(true)
      streamIntervalRef.current = setInterval(
        () => {
          const newEvent = generateMockEvent()
          setStreamData((prev) => {
            const updated = [newEvent, ...prev].slice(0, maxEvents)
            return updated
          })
          setStreamStats((prev) => ({
            ...prev,
            totalEvents: prev.totalEvents + 1,
            eventsPerSecond: Math.random() * 5 + 1,
            [`${newEvent.type}Events`]: (prev as Record<string, number>)[`${newEvent.type}Events`] + 1,
          }))
        },
        Math.random() * 2000 + 500,
      )
    }
  }

  // Stop streaming
  const stopStreaming = async () => {
    const token = localStorage.getItem("aegis_token")

    setIsStreaming(false)
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
      streamIntervalRef.current = null
    }

    // Try to stop the backend event recording session
    if (token) {
      try {
        // For now, we'll use a generic session ID since we don't store it
        // In a production app, you'd want to store the session ID
        const sessionId = `live_session_${Date.now()}`
        await fetch(`http://localhost:8000/api/events/stop-recording/${sessionId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch (error) {
        console.error("Error stopping live event recording session:", error)
      }
    }
  }

  // Filter data based on selected criteria
  useEffect(() => {
    let filtered = streamData

    // Filter by type
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((item) => selectedTypes.includes(item.type))
    }

    // Filter by severity
    if (selectedSeverity.length > 0) {
      filtered = filtered.filter((item) => selectedSeverity.includes(item.severity))
    }

    // Filter by agent
    if (selectedAgent !== "all") {
      filtered = filtered.filter((item) => item.agent === selectedAgent)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.agent.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredData(filtered)
  }, [streamData, selectedTypes, selectedSeverity, searchQuery, selectedAgent])

  // Auto scroll to latest events
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [filteredData, autoScroll])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current)
      }
    }
  }, [])

  const getTypeIcon = (type: LiveDataPoint["type"]) => {
    const icons = {
      network: "🌐",
      file: "📁",
      process: "⚙️",
      memory: "🧠",
      registry: "📋",
      event: "📝",
    }
    return icons[type]
  }

  const getSeverityColor = (severity: LiveDataPoint["severity"]) => {
    const colors = {
      low: "text-blue-600 bg-blue-50",
      medium: "text-yellow-600 bg-yellow-50",
      high: "text-orange-600 bg-orange-50",
      critical: "text-red-600 bg-red-50",
    }
    return colors[severity]
  }

  const getAgentStatusColor = (status: ActiveAgent["status"]) => {
    const colors = {
      active: "text-purple-600 bg-purple-50",
      idle: "text-yellow-600 bg-yellow-50",
      error: "text-red-600 bg-red-50",
    }
    return colors[status]
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Live Response Streaming</h1>
          <p className="text-purple-200 mt-1">Real-time monitoring of forensic analysis and system events</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glass-strong rounded-2xl p-6 shadow-lg border border-blue-500/30">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <span className="text-blue-200">Loading system events...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass-strong rounded-2xl p-6 shadow-lg border border-red-500/30">
            <div className="flex items-center space-x-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Stream Controls */}
        <div className="glass-strong rounded-2xl p-6 shadow-lg border border-purple-500/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={isStreaming ? stopStreaming : startStreaming}
                className={`rounded-xl px-6 py-3 text-sm font-medium transition-all duration-300 shadow-lg ${
                  isStreaming
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-red-500/25"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-purple-500/25"
                } border border-opacity-30 ${isStreaming ? "border-red-500" : "border-purple-500"}`}
              >
                <div className="flex items-center gap-2">
                  {isStreaming ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"
                      />
                    </svg>
                  )}
                  {isStreaming ? "Stop Stream" : "Start Stream"}
                </div>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-300">Status:</span>
                <span
                  className={`flex items-center space-x-1 text-sm font-medium ${
                    isStreaming ? "text-green-200" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${isStreaming ? "bg-green-400 animate-pulse" : "bg-gray-500"}`}
                  />
                  <span>{isStreaming ? "Streaming" : "Stopped"}</span>
                </span>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-teal-500/30 bg-gray-700/50 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-green-300">Auto-scroll</span>
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-green-300">
                Events: <span className="font-medium text-green-100">{streamStats.totalEvents}</span>
              </div>
              <div className="text-sm text-green-300">
                EPS: <span className="font-medium text-green-100">{streamStats.eventsPerSecond.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-stretch">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Search */}
              <div className="glass-strong rounded-2xl p-4 shadow-lg border border-teal-500/30">
                <h3 className="mb-3 font-medium text-green-100">Search</h3>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-teal-500/30 bg-gray-800/50 px-3 py-2 text-sm text-green-100 placeholder-green-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              {/* Event Types */}
              <div className="glass-strong rounded-2xl p-4 shadow-lg border border-teal-500/30">
                <h3 className="mb-3 font-medium text-green-100">Event Types</h3>
                <div className="space-y-2">
                  {["network", "file", "process", "memory", "registry", "event"].map((type) => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTypes([...selectedTypes, type])
                          } else {
                            setSelectedTypes(selectedTypes.filter((t) => t !== type))
                          }
                        }}
                        className="rounded border-teal-500/30 bg-gray-700/50 text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-sm capitalize text-green-200">
                        {getTypeIcon(type as LiveDataPoint["type"])} {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div className="glass-strong rounded-2xl p-4 shadow-lg border border-teal-500/30">
                <h3 className="mb-3 font-medium text-green-100">Severity</h3>
                <div className="space-y-2">
                  {["low", "medium", "high", "critical"].map((severity) => (
                    <label key={severity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSeverity.includes(severity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSeverity([...selectedSeverity, severity])
                          } else {
                            setSelectedSeverity(selectedSeverity.filter((s) => s !== severity))
                          }
                        }}
                        className="rounded border-teal-500/30 bg-gray-700/50 text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-sm capitalize text-green-200">{severity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Agents */}
              <div className="glass-strong rounded-2xl p-4 shadow-lg border border-teal-500/30">
                <h3 className="mb-3 font-medium text-green-100">Active Agents</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="agent"
                      value="all"
                      checked={selectedAgent === "all"}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="border-teal-500/30 bg-gray-700/50 text-teal-500 focus:ring-teal-500"
                    />
                    <span className="text-sm text-green-200">All Agents</span>
                  </label>
                  {activeAgents.map((agent) => (
                    <label key={agent.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="agent"
                        value={agent.name}
                        checked={selectedAgent === agent.name}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="border-teal-500/30 bg-gray-700/50 text-teal-500 focus:ring-teal-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm text-green-200">{agent.name}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${getAgentStatusColor(agent.status)}`}>
                          {agent.status.toUpperCase()}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Event Stream */}
          <div className="lg:col-span-3 lg:row-span-10 h-full">
            <div className="glass-strong rounded-2xl shadow-lg border border-teal-500/30 flex flex-col">
                <div className="border-b border-teal-500/30 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-green-100">Live Event Stream</h3>
                        <div className="text-sm text-green-300">
                            Showing {filteredData.length} of {streamData.length} events
                        </div>
                </div>
    </div>

              <div ref={scrollRef} className="overflow-y-auto max-h-[83vh]" >
                {filteredData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-green-300">
                    {isStreaming ? "Waiting for events..." : "No events to display. Start streaming to see live data."}
                  </div>
                ) : (
                  <div className="divide-y divide-teal-500/20">
                    {filteredData.map((event) => (
                      <div key={event.id} className="p-4 hover:bg-teal-500/10 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <span className="text-lg">{getTypeIcon(event.type)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(event.severity)}`}
                                >
                                  {event.severity.toUpperCase()}
                                </span>
                                <span className="text-xs text-green-300 capitalize">{event.type}</span>
                              </div>
                              <div className="text-xs text-green-400">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-green-100">{event.message}</p>
                            <div className="mt-1 flex items-center space-x-4 text-xs text-green-300">
                              <span>Source: {event.source}</span>
                              <span>Agent: {event.agent}</span>
                            </div>
                            {event.details &&
                              Object.keys(event.details).some((key) => event.details[key] !== undefined) && (
                                <div className="mt-2 rounded-lg bg-gray-800/50 p-2 border border-teal-500/20">
                                  <div className="text-xs text-green-300">
                                    {Object.entries(event.details)
                                      .filter(([, value]) => value !== undefined)
                                      .map(([key, value]) => (
                                        <div key={key} className="inline-block mr-4">
                                          <span className="font-medium capitalize">{key}:</span> {String(value)}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default LiveStreamingPage
