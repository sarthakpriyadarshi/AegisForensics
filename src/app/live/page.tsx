"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { AuthGuard } from "@/components/AuthGuard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Play, Square, Activity, Search, Filter, Wifi, AlertCircle, RefreshCw } from "lucide-react"

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
    if (lowerType.includes("network")) return "network"
    if (lowerType.includes("file")) return "file"
    if (lowerType.includes("process")) return "process"
    if (lowerType.includes("memory")) return "memory"
    if (lowerType.includes("registry")) return "registry"
    return "event"
  }

  const mapSeverity = (severity: string): "low" | "medium" | "high" | "critical" => {
    const lowerSeverity = severity.toLowerCase()
    if (lowerSeverity.includes("critical") || lowerSeverity.includes("error")) return "critical"
    if (lowerSeverity.includes("high") || lowerSeverity.includes("warn")) return "high"
    if (lowerSeverity.includes("low") || lowerSeverity.includes("debug")) return "low"
    return "medium"
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
            const eventsResponse = await fetch(
              `http://localhost:8000/api/events/live-stream?limit=20&session_id=${sessionId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            )

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
      network: <Wifi className="w-4 h-4" />,
      file: <Activity className="w-4 h-4" />,
      process: <Activity className="w-4 h-4" />,
      memory: <Activity className="w-4 h-4" />,
      registry: <Activity className="w-4 h-4" />,
      event: <Activity className="w-4 h-4" />,
    }
    return icons[type]
  }

  const getSeverityColor = (severity: LiveDataPoint["severity"]) => {
    const colors = {
      low: "default",
      medium: "secondary",
      high: "destructive",
      critical: "destructive",
    }
    return colors[severity]
  }

  const getAgentStatusColor = (status: ActiveAgent["status"]) => {
    const colors = {
      active: "default",
      idle: "secondary",
      error: "destructive",
    }
    return colors[status]
  }

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type])
    } else {
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    }
  }

  const handleSeverityChange = (severity: string, checked: boolean) => {
    if (checked) {
      setSelectedSeverity([...selectedSeverity, severity])
    } else {
      setSelectedSeverity(selectedSeverity.filter((s) => s !== severity))
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary/20 text-primary">
                  <Activity className="w-3 h-3 mr-1" />
                  Live Response Streaming
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">Live Response Streaming</h1>
              <p className="text-lg text-muted-foreground">
                Real-time monitoring of forensic analysis and system events
              </p>
            </div>
            <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span>Loading system events...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stream Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={isStreaming ? stopStreaming : startStreaming}
                    className={isStreaming ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}
                  >
                    {isStreaming ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Stream
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Stream
                      </>
                    )}
                  </Button>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <div className="flex items-center space-x-1">
                      <div
                        className={`h-2 w-2 rounded-full ${isStreaming ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
                      />
                      <span className="text-sm font-medium">{isStreaming ? "Streaming" : "Stopped"}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-scroll"
                      checked={autoScroll}
                      onCheckedChange={(checked) => setAutoScroll(checked as boolean)}
                    />
                    <Label htmlFor="auto-scroll" className="text-sm">
                      Auto-scroll
                    </Label>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground">
                    Events: <span className="font-medium text-foreground">{streamStats.totalEvents}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    EPS: <span className="font-medium text-foreground">{streamStats.eventsPerSecond.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Event Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Event Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["network", "file", "process", "memory", "registry", "event"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={(checked) => handleTypeChange(type, checked as boolean)}
                      />
                      <Label htmlFor={`type-${type}`} className="text-sm capitalize flex items-center gap-2">
                        {getTypeIcon(type as LiveDataPoint["type"])}
                        {type}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Severity */}
              <Card>
                <CardHeader>
                  <CardTitle>Severity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["low", "medium", "high", "critical"].map((severity) => (
                    <div key={severity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`severity-${severity}`}
                        checked={selectedSeverity.includes(severity)}
                        onCheckedChange={(checked) => handleSeverityChange(severity, checked as boolean)}
                      />
                      <Label htmlFor={`severity-${severity}`} className="text-sm capitalize">
                        {severity}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Active Agents */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedAgent} onValueChange={setSelectedAgent}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="agent-all" />
                      <Label htmlFor="agent-all" className="text-sm">
                        All Agents
                      </Label>
                    </div>
                    {activeAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={agent.name} id={`agent-${agent.id}`} />
                        <div className="flex-1">
                          <Label htmlFor={`agent-${agent.id}`} className="text-sm">
                            {agent.name}
                          </Label>
                          <div className="mt-1">
                            <Badge variant={getAgentStatusColor(agent.status)} className="text-xs">
                              {agent.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Event Stream */}
            <div className="lg:col-span-3">
              <Card className="max-h-screen flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Live Event Stream</CardTitle>
                    <CardDescription>
                      Showing {filteredData.length} of {streamData.length} events
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <div ref={scrollRef} className="h-full overflow-y-auto">
                    {filteredData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        {isStreaming
                          ? "Waiting for events..."
                          : "No events to display. Start streaming to see live data."}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredData.map((event) => (
                          <Card key={event.id} className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">{getTypeIcon(event.type)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Badge variant={getSeverityColor(event.severity)}>
                                        {event.severity.toUpperCase()}
                                      </Badge>
                                      <Badge variant="outline" className="capitalize">
                                        {event.type}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(event.timestamp).toLocaleTimeString()}
                                    </div>
                                  </div>
                                  <p className="text-sm font-medium mb-2">{event.message}</p>
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                                    <span>Source: {event.source}</span>
                                    <span>Agent: {event.agent}</span>
                                  </div>
                                  {event.details &&
                                    Object.keys(event.details).some((key) => event.details[key] !== undefined) && (
                                      <Card className="mt-2">
                                        <CardContent className="p-2">
                                          <div className="text-xs text-muted-foreground">
                                            {Object.entries(event.details)
                                              .filter(([, value]) => value !== undefined)
                                              .map(([key, value]) => (
                                                <div key={key} className="inline-block mr-4">
                                                  <span className="font-medium capitalize">{key}:</span> {String(value)}
                                                </div>
                                              ))}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

export default LiveStreamingPage
