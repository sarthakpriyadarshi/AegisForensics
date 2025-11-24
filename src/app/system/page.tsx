"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  RefreshCw,
  Cpu,
  HardDrive,
  Wifi,
  MemoryStick,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Types for our data
interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
  };
  memory: {
    total: number;
    used: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    percentage: number;
  };
  network: {
    bytes_received: number;
    bytes_sent: number;
    packets_received: number;
    packets_sent: number;
  };
}

interface SystemInfo {
  version: string;
  hostname: string;
  platform: string;
  architecture: string;
  python_version: string;
  timezone: string;
  uptime: number;
}

interface Process {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  memory_mb: number;
  status: string;
  started?: string;
}

// Helper function to format bytes
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
};

// Helper function to format uptime
const formatUptime = (hours: number): string => {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  const minutes = Math.floor((hours * 60) % 60);

  if (days > 0) {
    return `${days}d ${remainingHours}h ${minutes}m`;
  } else if (remainingHours > 0) {
    return `${remainingHours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// API functions
const fetchSystemData = async () => {
  const token = localStorage.getItem("aegis_token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const [metricsRes, infoRes, processesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/system/metrics`, { headers }),
      fetch(`${API_BASE_URL}/system/info`, { headers }),
      fetch(`${API_BASE_URL}/system/processes`, { headers }),
    ]);

    if (!metricsRes.ok || !infoRes.ok || !processesRes.ok) {
      throw new Error("Failed to fetch system data");
    }

    const [metrics, info, processes] = await Promise.all([
      metricsRes.json(),
      infoRes.json(),
      processesRes.json(),
    ]);

    return { metrics, info, processes };
  } catch (error) {
    console.error("Error fetching system data:", error);
    throw error;
  }
};

export default function SystemPage() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(
    null
  );
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadSystemData = async () => {
    try {
      setError(null);
      const data = await fetchSystemData();
      setSystemMetrics(data.metrics);
      setSystemInfo(data.info);
      setProcesses(data.processes);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load system data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemData();

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(loadSystemData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
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
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Error Loading System Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={loadSystemData} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
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
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Real-time Monitoring
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                System Monitor
              </h1>
              <p className="text-lg text-muted-foreground">
                Real-time system monitoring and performance metrics with
                intelligent alerts.
              </p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              {lastUpdated && (
                <Card className="hidden md:block">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Last updated
                    </p>
                    <p className="text-sm font-medium">
                      {lastUpdated.toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              )}
              <Button
                onClick={loadSystemData}
                className="bg-primary hover:bg-primary/90 w-full md:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="processes">Processes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* System Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: "CPU Usage",
                    value: `${systemMetrics?.cpu.usage.toFixed(1)}%`,
                    subtitle: `${
                      systemMetrics?.cpu.cores
                    } cores @ ${systemMetrics?.cpu.frequency.toFixed(0)} MHz`,
                    icon: Cpu,
                    progress: systemMetrics?.cpu.usage,
                  },
                  {
                    title: "Memory Usage",
                    value: `${systemMetrics?.memory.percentage.toFixed(1)}%`,
                    subtitle: `${formatBytes(
                      systemMetrics?.memory.used || 0
                    )} / ${formatBytes(systemMetrics?.memory.total || 0)}`,
                    icon: MemoryStick,
                    progress: systemMetrics?.memory.percentage,
                  },
                  {
                    title: "Disk Usage",
                    value: `${systemMetrics?.disk.percentage.toFixed(1)}%`,
                    subtitle: `${formatBytes(
                      systemMetrics?.disk.used || 0
                    )} / ${formatBytes(systemMetrics?.disk.total || 0)}`,
                    icon: HardDrive,
                    progress: systemMetrics?.disk.percentage,
                  },
                  {
                    title: "Network",
                    value: formatBytes(
                      systemMetrics?.network.bytes_received || 0
                    ),
                    subtitle: `↑ ${formatBytes(
                      systemMetrics?.network.bytes_sent || 0
                    )}`,
                    icon: Wifi,
                    progress: 0,
                  },
                ].map((metric, index) => (
                  <Card key={metric.title}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <metric.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {metric.title}
                        </p>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <p className="text-xs text-muted-foreground">
                          {metric.subtitle}
                        </p>
                        {metric.progress !== undefined &&
                          metric.progress > 0 && (
                            <Progress value={metric.progress} className="h-2" />
                          )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { label: "Version", value: systemInfo?.version },
                      { label: "Hostname", value: systemInfo?.hostname },
                      { label: "Platform", value: systemInfo?.platform },
                      {
                        label: "Architecture",
                        value: systemInfo?.architecture,
                      },
                      {
                        label: "Python Version",
                        value: systemInfo?.python_version,
                      },
                      {
                        label: "Uptime",
                        value: formatUptime(systemInfo?.uptime || 0),
                      },
                    ].map((info) => (
                      <div key={info.label} className="space-y-2">
                        <p className="text-sm font-medium text-primary">
                          {info.label}:
                        </p>
                        <p className="font-medium">{info.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="processes">
              <Card>
                <CardHeader>
                  <CardTitle>Running Processes</CardTitle>
                  <CardDescription>
                    System processes and their resource usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PID</TableHead>
                          <TableHead>Process Name</TableHead>
                          <TableHead>CPU %</TableHead>
                          <TableHead>Memory %</TableHead>
                          <TableHead>Memory (MB)</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processes.map((process) => (
                          <TableRow key={process.pid}>
                            <TableCell className="font-mono">
                              {process.pid}
                            </TableCell>
                            <TableCell className="font-medium">
                              {process.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  process.cpu_percent > 50
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {process.cpu_percent}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  process.memory_percent > 50
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {process.memory_percent}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {process.memory_mb.toFixed(1)} MB
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  process.status === "running"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {process.status}
                              </Badge>
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
      </DashboardLayout>
    </AuthGuard>
  );
}
