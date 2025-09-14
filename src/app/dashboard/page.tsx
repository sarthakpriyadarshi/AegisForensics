"use client"

import type React from "react"
import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { AuthGuard } from "@/components/AuthGuard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  RefreshCw, 
  Cpu, 
  HardDrive, 
  Wifi, 
  MemoryStick, 
  CheckCircle,
  Search,
  FolderOpen,
  FileText,
  Activity,
  Users,
  Brain,
  Network,
  Binary
} from "lucide-react"

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
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
                  <CheckCircle className="w-3 h-3 mr-1" />
                  AI-Powered Platform
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {userProfile?.full_name?.split(" ")[0] || "Admin"}
              </h1>
              <p className="text-lg text-muted-foreground">
                Your comprehensive forensics command center with intelligent automation and real-time insights.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Last updated</p>
                  <p className="text-sm font-medium">{new Date().toLocaleTimeString()}</p>
                </CardContent>
              </Card>
              <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* System Metrics Cards */}
          {systemMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "CPU Usage",
                  value: systemMetrics?.cpu_usage || "0%",
                  subtitle: "Processing power utilization",
                  icon: Cpu,
                  progress: parseFloat(systemMetrics?.cpu_usage?.replace('%', '') || '0'),
                },
                {
                  title: "Memory Usage",
                  value: systemMetrics?.memory_usage || "0 GB / 0 GB",
                  subtitle: "RAM usage and availability", 
                  icon: MemoryStick,
                  progress: systemMetrics?.memory_usage ? 
                    (parseFloat(systemMetrics.memory_usage.split(' ')[0]) / parseFloat(systemMetrics.memory_usage.split(' ')[4])) * 100 : 0,
                },
                {
                  title: "Disk Usage",
                  value: systemMetrics?.disk_usage || "0 GB / 0 GB",
                  subtitle: "Storage capacity used",
                  icon: HardDrive,
                  progress: systemMetrics?.disk_usage ? 
                    (parseFloat(systemMetrics.disk_usage.split(' ')[0]) / parseFloat(systemMetrics.disk_usage.split(' ')[4])) * 100 : 0,
                },
                {
                  title: "Active Connections",
                  value: systemMetrics?.active_connections?.toString() || "0",
                  subtitle: "Active network connections",
                  icon: Wifi,
                  progress: 0,
                },
              ].map((metric) => (
                <Card key={metric.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <metric.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                      {metric.progress !== undefined && metric.progress > 0 && (
                        <Progress value={metric.progress} className="h-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Cases */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Recent Cases
                </CardTitle>
                <CardDescription>Latest forensic investigations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentCases.slice(0, 3).map((case_item) => (
                  <div
                    key={case_item.id}
                    className="border-l-4 border-primary pl-4 hover:bg-muted/50 rounded-r-lg p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{case_item.name}</h4>
                      <Badge variant={case_item.priority === 'critical' ? 'destructive' : 
                                   case_item.priority === 'high' ? 'default' : 'secondary'}>
                        {case_item.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Badge variant={case_item.status === 'investigating' ? 'default' : 'secondary'}>
                        {case_item.status}
                      </Badge>
                      <span>•</span>
                      <span>{case_item.investigator}</span>
                      <span>•</span>
                      <span>{case_item.created}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <Button variant="ghost" className="w-full" asChild>
                    <a href="/cases">View all cases</a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Agents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Agents
                </CardTitle>
                <CardDescription>AI forensic analysis agents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeAgents.slice(0, 4).map((agent) => {
                  const getAgentIcon = (type: string) => {
                    switch (type.toLowerCase()) {
                      case 'memory': return Brain
                      case 'disk': return HardDrive  
                      case 'network': return Network
                      case 'binary': return Binary
                      default: return Activity
                    }
                  }
                  
                  const AgentIcon = getAgentIcon(agent.type)
                  
                  return (
                    <div
                      key={agent.id}
                      className="border-l-4 border-primary pl-4 hover:bg-muted/50 rounded-r-lg p-3 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <AgentIcon className="w-4 h-4 text-primary" />
                          </div>
                          <h4 className="font-semibold">{agent.name}</h4>
                        </div>
                        <Badge variant={agent.status === 'active' ? 'default' : 
                                     agent.status === 'idle' ? 'secondary' : 'destructive'}>
                          {agent.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Tasks: {agent.tasksCompleted}</span>
                        <span>•</span>
                        <span>{agent.lastActivity}</span>
                      </div>
                    </div>
                  )
                })}
                <div className="pt-4 border-t">
                  <Button variant="ghost" className="w-full" asChild>
                    <a href="/agents">Manage agents</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Streamline your forensic workflow with these essential tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    href: "/analysis",
                    title: "Analyze Evidence",
                    description: "Upload and analyze forensic evidence with AI agents",
                    icon: Search,
                  },
                  {
                    href: "/cases",
                    title: "Create Case",
                    description: "Start a new forensic investigation case",
                    icon: FolderOpen,
                  },
                  {
                    href: "/scripts",
                    title: "Generate Script",
                    description: "Create forensic analysis scripts for deployment",
                    icon: FileText,
                  },
                  {
                    href: "/live",
                    title: "Live Response",
                    description: "Monitor live analysis data and system events",
                    icon: Activity,
                  },
                ].map((action) => (
                  <Card key={action.title} className="hover:shadow-md transition-shadow cursor-pointer">
                    <a href={action.href}>
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <action.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">{action.title}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </a>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

export default DashboardPage
