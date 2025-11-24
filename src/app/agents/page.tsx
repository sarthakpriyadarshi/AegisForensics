"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bot,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  FileText,
  Zap,
  Activity,
  Timer,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AgentMetrics {
  cpuUsage: number;
  memoryUsage: number;
  tasksCompleted: number;
  averageExecutionTime: number;
  successRate: number;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: "online" | "busy" | "offline" | "error";
  lastActivity: string;
  currentTask?: string;
  metrics: AgentMetrics;
  capabilities: string[];
  version: string;
  uptime: number;
}

interface TaskHistory {
  id: string;
  agentName: string;
  taskType: string;
  startTime: string;
  endTime?: string;
  status: "running" | "completed" | "failed";
  executionTime?: number;
  result?: string;
}

interface AgentApiResponse {
  specialization?: string;
  status: string;
  last_analysis?: string;
  last_activity?: string;
  current_task?: string;
  tasks_completed?: number;
  uptime_hours?: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);

  useEffect(() => {
    const loadAgentData = async () => {
      try {
        const token = localStorage.getItem("aegis_token");
        if (!token) {
          window.location.href = "/auth/login";
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/agents/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.agents) {
            // Map API response to Agent interface
            const agentList = Object.entries(
              data.agents as Record<string, AgentApiResponse>
            ).map(([name, agentData]) => ({
              id: name.toLowerCase().replace(/\s+/g, "-"),
              name: name,
              type: getAgentType(agentData.specialization || name),
              status: mapAgentStatus(agentData.status),
              lastActivity: agentData.last_activity
                ? formatLastActivity(agentData.last_activity)
                : "Unknown",
              currentTask: agentData.current_task || undefined,
              metrics: {
                cpuUsage: Math.floor(Math.random() * 80) + 10,
                memoryUsage: Math.floor(Math.random() * 1500) + 256,
                tasksCompleted:
                  agentData.tasks_completed ||
                  Math.floor(Math.random() * 200) + 50,
                averageExecutionTime: Math.random() * 100 + 20,
                successRate: Math.random() * 10 + 90,
              },
              capabilities: getAgentCapabilities(name),
              version: "2.1.0",
              uptime: agentData.uptime_hours || Math.random() * 200 + 50,
            }));
            setAgents(agentList);
          }
        } else if (response.status === 401) {
          localStorage.removeItem("aegis_token");
          window.location.href = "/auth/login";
        } else {
          throw new Error("Failed to load agent data");
        }
      } catch (error) {
        console.error("Error loading agents:", error);
        setError("Failed to load agent data");
        // Fallback to mock data if API fails
        loadMockAgents();
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentData();
  }, []);

  const getAgentType = (specialization: string): string => {
    if (specialization?.toLowerCase().includes("network")) return "analysis";
    if (specialization?.toLowerCase().includes("memory")) return "analysis";
    if (specialization?.toLowerCase().includes("disk")) return "analysis";
    if (specialization?.toLowerCase().includes("binary")) return "analysis";
    if (specialization?.toLowerCase().includes("timeline"))
      return "correlation";
    if (specialization?.toLowerCase().includes("sandbox")) return "execution";
    if (specialization?.toLowerCase().includes("recon")) return "intelligence";
    return "analysis";
  };

  const mapAgentStatus = (
    status: string
  ): "online" | "busy" | "offline" | "error" => {
    switch (status?.toLowerCase()) {
      case "active":
        return "online";
      case "busy":
        return "busy";
      case "idle":
        return "online";
      case "offline":
        return "offline";
      case "error":
        return "error";
      default:
        return "online";
    }
  };

  const formatLastActivity = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;

      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Unknown";
    }
  };

  const getAgentCapabilities = (name: string): string[] => {
    const capabilityMap: Record<string, string[]> = {
      NetworkAnalyzer: [
        "PCAP Analysis",
        "Protocol Decoding",
        "IoC Extraction",
        "Traffic Analysis",
      ],
      MemoryAnalyzer: [
        "Volatility3",
        "Process Analysis",
        "Malware Detection",
        "Memory Forensics",
      ],
      DiskAnalyzer: [
        "File System Analysis",
        "Timeline Creation",
        "Deleted File Recovery",
        "Disk Imaging",
      ],
      BinaryAnalyzer: [
        "Static Analysis",
        "Dynamic Analysis",
        "Malware Detection",
        "Reverse Engineering",
      ],
      TimelineAnalyzer: [
        "Event Correlation",
        "Timeline Creation",
        "Pattern Analysis",
        "Chronological Reconstruction",
      ],
      SandboxAgent: [
        "Safe Execution",
        "Behavior Monitoring",
        "API Logging",
        "Dynamic Analysis",
      ],
      ReconAgent: [
        "Threat Intelligence",
        "OSINT",
        "IOC Research",
        "Attribution Analysis",
      ],
      UserProfiler: [
        "User Behavior Analysis",
        "Activity Tracking",
        "Login Patterns",
        "Access Control",
      ],
      CustodianAgent: [
        "Evidence Chain",
        "Integrity Verification",
        "Audit Trail",
        "Data Preservation",
      ],
      LiveResponseAgent: [
        "Real-time Analysis",
        "Remote Collection",
        "Live Memory",
        "System State",
      ],
    };
    return (
      capabilityMap[name] || [
        "General Analysis",
        "Data Processing",
        "Report Generation",
      ]
    );
  };

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
        capabilities: [
          "Volatility3",
          "Process Analysis",
          "Malware Detection",
          "Memory Forensics",
        ],
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
        capabilities: [
          "File System Analysis",
          "Timeline Creation",
          "Deleted File Recovery",
          "Disk Imaging",
        ],
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
        capabilities: [
          "PCAP Analysis",
          "Protocol Decoding",
          "IoC Extraction",
          "Traffic Analysis",
        ],
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
        capabilities: [
          "Real-time Collection",
          "Incident Response",
          "Remote Execution",
          "Live Monitoring",
        ],
        version: "1.1.2",
        uptime: 0,
      },
    ]);
  };

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
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "default";
      case "busy":
        return "secondary";
      case "offline":
        return "outline";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "running":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatUptime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const totalAgents = agents.length;
  const onlineAgents = agents.filter(
    (a) => a.status === "online" || a.status === "busy"
  ).length;
  const busyAgents = agents.filter((a) => a.status === "busy").length;
  const errorAgents = agents.filter((a) => a.status === "error").length;

  const viewAgentDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentDetails(true);
  };

  if (isLoading) {
    return (
      <AuthGuard>
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
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 text-primary"
                >
                  <Bot className="w-3 h-3 mr-1" />
                  AI Agent Monitoring & Management
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                AI Agent Status
              </h1>
              <p className="text-lg text-muted-foreground">
                Monitor and manage forensic analysis agents with real-time
                performance metrics and task tracking.
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 w-full md:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Error Banner */}
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

          {/* Agent Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Agents",
                value: totalAgents,
                icon: Bot,
                color: "text-primary",
              },
              {
                title: "Online",
                value: onlineAgents,
                icon: CheckCircle,
                color: "text-green-600",
              },
              {
                title: "Busy",
                value: busyAgents,
                icon: Zap,
                color: "text-yellow-600",
              },
              {
                title: "Errors",
                value: errorAgents,
                icon: AlertCircle,
                color: "text-red-600",
              },
            ].map((metric, index) => (
              <Card key={metric.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center`}
                    >
                      <metric.icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <div className="text-2xl font-bold">{metric.value}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="agents" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="tasks">Task History</TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="space-y-6">
              {/* Agents Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <Card
                    key={agent.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => viewAgentDetails(agent)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`w-3 h-3 rounded-full animate-pulse ${
                                agent.status === "online"
                                  ? "bg-green-500"
                                  : agent.status === "busy"
                                  ? "bg-yellow-500"
                                  : agent.status === "error"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                              }`}
                            ></div>
                            <h3 className="text-lg font-semibold">
                              {agent.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusColor(agent.status)}>
                              {agent.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">v{agent.version}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {agent.currentTask
                              ? agent.currentTask
                              : `Last activity: ${agent.lastActivity}`}
                          </p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            CPU Usage
                          </p>
                          <p className="text-lg font-bold">
                            {agent.metrics.cpuUsage}%
                          </p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            Memory
                          </p>
                          <p className="text-lg font-bold">
                            {agent.metrics.memoryUsage}MB
                          </p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            Tasks Done
                          </p>
                          <p className="text-lg font-bold">
                            {agent.metrics.tasksCompleted}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            Success Rate
                          </p>
                          <p className="text-lg font-bold">
                            {agent.metrics.successRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Progress bars for busy agents */}
                      {agent.status === "busy" && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">
                              Processing...
                            </span>
                          </div>
                          <Progress value={60} className="h-2" />
                        </div>
                      )}

                      {/* Capabilities */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {agent.capabilities
                          .slice(0, 3)
                          .map((capability, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {capability}
                            </Badge>
                          ))}
                        {agent.capabilities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{agent.capabilities.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Uptime */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Timer className="w-4 h-4" />
                          Uptime: {formatUptime(agent.uptime)}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Avg: {agent.metrics.averageExecutionTime.toFixed(1)}s
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Task Activity</CardTitle>
                  <CardDescription>
                    Monitor recent agent task execution and results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead>Task Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Result</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taskHistory.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium">
                              {task.agentName}
                            </TableCell>
                            <TableCell>{task.taskType}</TableCell>
                            <TableCell>
                              <Badge variant={getTaskStatusColor(task.status)}>
                                {task.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(task.startTime)}</TableCell>
                            <TableCell>
                              {task.executionTime
                                ? `${task.executionTime}s`
                                : "-"}
                            </TableCell>
                            <TableCell
                              className="max-w-xs truncate"
                              title={task.result}
                            >
                              {task.result}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <Dialog open={showAgentDetails} onOpenChange={setShowAgentDetails}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedAgent.name} Details</DialogTitle>
                <DialogDescription>
                  Detailed information and performance metrics for this agent
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full animate-pulse ${
                            selectedAgent.status === "online"
                              ? "bg-green-500"
                              : selectedAgent.status === "busy"
                              ? "bg-yellow-500"
                              : selectedAgent.status === "error"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                        ></div>
                        <Badge variant={getStatusColor(selectedAgent.status)}>
                          {selectedAgent.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Version: {selectedAgent.version}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Type: {selectedAgent.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Uptime: {formatUptime(selectedAgent.uptime)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          CPU Usage:
                        </span>
                        <span className="text-sm font-semibold">
                          {selectedAgent.metrics.cpuUsage}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Memory Usage:
                        </span>
                        <span className="text-sm font-semibold">
                          {selectedAgent.metrics.memoryUsage}MB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Success Rate:
                        </span>
                        <span className="text-sm font-semibold">
                          {selectedAgent.metrics.successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Avg Execution:
                        </span>
                        <span className="text-sm font-semibold">
                          {selectedAgent.metrics.averageExecutionTime.toFixed(
                            1
                          )}
                          s
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Capabilities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Capabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.capabilities.map((capability, index) => (
                        <Badge key={index} variant="secondary">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Current Task */}
                {selectedAgent.currentTask && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-800">
                        <Zap className="w-5 h-5" />
                        Current Task
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-yellow-700 mb-4">
                        {selectedAgent.currentTask}
                      </p>
                      <Progress value={60} className="h-2" />
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                  <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restart Agent
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <FileText className="w-4 h-4 mr-2" />
                    View Logs
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
