'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useState, useEffect } from 'react';

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
  status: 'online' | 'busy' | 'offline' | 'error';
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
  status: 'running' | 'completed' | 'failed';
  executionTime?: number;
  result?: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'memory-analyzer',
      name: 'Memory Analyzer',
      type: 'analysis',
      status: 'busy',
      lastActivity: 'Now',
      currentTask: 'Analyzing memory_dump_2024.mem',
      metrics: {
        cpuUsage: 78,
        memoryUsage: 1024,
        tasksCompleted: 156,
        averageExecutionTime: 45.2,
        successRate: 98.5
      },
      capabilities: ['Volatility3', 'Process Analysis', 'Malware Detection', 'Memory Forensics'],
      version: '2.1.3',
      uptime: 168.5
    },
    {
      id: 'disk-analyzer',
      name: 'Disk Analyzer',
      type: 'analysis',
      status: 'online',
      lastActivity: '2 min ago',
      metrics: {
        cpuUsage: 12,
        memoryUsage: 512,
        tasksCompleted: 89,
        averageExecutionTime: 89.7,
        successRate: 95.8
      },
      capabilities: ['File System Analysis', 'Timeline Creation', 'Deleted File Recovery', 'Disk Imaging'],
      version: '1.9.2',
      uptime: 72.3
    },
    {
      id: 'network-analyzer',
      name: 'Network Analyzer',
      type: 'analysis',
      status: 'busy',
      lastActivity: 'Now',
      currentTask: 'Processing PCAP files',
      metrics: {
        cpuUsage: 65,
        memoryUsage: 768,
        tasksCompleted: 234,
        averageExecutionTime: 23.1,
        successRate: 97.2
      },
      capabilities: ['PCAP Analysis', 'Protocol Decoding', 'IoC Extraction', 'Traffic Analysis'],
      version: '3.0.1',
      uptime: 201.7
    },
    {
      id: 'binary-analyzer',
      name: 'Binary Analyzer',
      type: 'analysis',
      status: 'online',
      lastActivity: '5 min ago',
      metrics: {
        cpuUsage: 8,
        memoryUsage: 256,
        tasksCompleted: 67,
        averageExecutionTime: 67.8,
        successRate: 94.1
      },
      capabilities: ['Static Analysis', 'Dynamic Analysis', 'Malware Detection', 'Reverse Engineering'],
      version: '2.5.0',
      uptime: 96.2
    },
    {
      id: 'timeline-analyzer',
      name: 'Timeline Analyzer',
      type: 'correlation',
      status: 'online',
      lastActivity: '1 min ago',
      metrics: {
        cpuUsage: 15,
        memoryUsage: 384,
        tasksCompleted: 124,
        averageExecutionTime: 12.5,
        successRate: 99.1
      },
      capabilities: ['Event Correlation', 'Timeline Creation', 'Pattern Analysis', 'Chronological Reconstruction'],
      version: '1.7.4',
      uptime: 145.8
    },
    {
      id: 'sandbox-agent',
      name: 'Sandbox Agent',
      type: 'execution',
      status: 'busy',
      lastActivity: 'Now',
      currentTask: 'Executing malware sample in isolated environment',
      metrics: {
        cpuUsage: 92,
        memoryUsage: 2048,
        tasksCompleted: 45,
        averageExecutionTime: 180.2,
        successRate: 91.7
      },
      capabilities: ['Safe Execution', 'Behavior Monitoring', 'API Logging', 'Dynamic Analysis'],
      version: '1.4.1',
      uptime: 48.6
    },
    {
      id: 'recon-agent',
      name: 'Reconnaissance Agent',
      type: 'intelligence',
      status: 'online',
      lastActivity: '3 min ago',
      metrics: {
        cpuUsage: 5,
        memoryUsage: 128,
        tasksCompleted: 312,
        averageExecutionTime: 8.9,
        successRate: 96.8
      },
      capabilities: ['OSINT Collection', 'Threat Intelligence', 'IoC Enrichment', 'Attribution Analysis'],
      version: '2.2.6',
      uptime: 312.1
    },
    {
      id: 'user-profiler',
      name: 'User Profiler',
      type: 'behavioral',
      status: 'online',
      lastActivity: '7 min ago',
      metrics: {
        cpuUsage: 18,
        memoryUsage: 340,
        tasksCompleted: 78,
        averageExecutionTime: 34.7,
        successRate: 97.4
      },
      capabilities: ['Behavior Analysis', 'Activity Profiling', 'Anomaly Detection', 'Risk Assessment'],
      version: '1.3.8',
      uptime: 89.4
    },
    {
      id: 'live-response',
      name: 'Live Response Agent',
      type: 'response',
      status: 'error',
      lastActivity: '15 min ago',
      metrics: {
        cpuUsage: 0,
        memoryUsage: 64,
        tasksCompleted: 23,
        averageExecutionTime: 15.6,
        successRate: 87.3
      },
      capabilities: ['Real-time Collection', 'Incident Response', 'Remote Execution', 'Live Monitoring'],
      version: '1.1.2',
      uptime: 0
    }
  ]);

  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([
    {
      id: '1',
      agentName: 'Memory Analyzer',
      taskType: 'Memory Analysis',
      startTime: '2024-09-14T14:30:00Z',
      endTime: '2024-09-14T14:31:45Z',
      status: 'completed',
      executionTime: 105,
      result: 'Malware detected: Conti ransomware variant'
    },
    {
      id: '2',
      agentName: 'Network Analyzer',
      taskType: 'PCAP Analysis',
      startTime: '2024-09-14T14:25:00Z',
      endTime: '2024-09-14T14:25:23Z',
      status: 'completed',
      executionTime: 23,
      result: 'Suspicious network activity detected'
    },
    {
      id: '3',
      agentName: 'Sandbox Agent',
      taskType: 'Malware Execution',
      startTime: '2024-09-14T14:20:00Z',
      status: 'running',
      result: 'In progress...'
    },
    {
      id: '4',
      agentName: 'Live Response Agent',
      taskType: 'System Collection',
      startTime: '2024-09-14T14:15:00Z',
      status: 'failed',
      result: 'Connection timeout'
    }
  ]);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Fetch agents data from backend
  useEffect(() => {
    const fetchAgents = async () => {
      const token = localStorage.getItem('aegis_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/agents/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Transform backend data to frontend format
          const transformedAgents = data.agents?.map((agent: {
            id: string;
            name: string;
            type?: string;
            status: string;
            last_activity?: string;
            current_task?: string;
            capabilities?: string[];
            version?: string;
            metrics?: Record<string, unknown>;
          }) => ({
            id: agent.id,
            name: agent.name,
            type: agent.type || 'analysis',
            status: agent.status,
            lastActivity: agent.last_activity || new Date().toISOString(),
            currentTask: agent.current_task,
            metrics: {
              cpuUsage: agent.metrics?.cpu_usage || 0,
              memoryUsage: agent.metrics?.memory_usage || 0,
              tasksCompleted: agent.metrics?.tasks_completed || 0,
              averageExecutionTime: agent.metrics?.avg_execution_time || 0,
              successRate: agent.metrics?.success_rate || 0
            },
            capabilities: agent.capabilities || [],
            version: agent.version || '1.0.0',
            uptime: agent.metrics?.uptime || 0
          })) || [];

          if (transformedAgents.length > 0) {
            setAgents(transformedAgents);
          }
        } else if (response.status === 401) {
          localStorage.removeItem('aegis_token');
          window.location.href = '/auth/login';
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
        // Keep using mock data on error
      }
    };

    fetchAgents();
    
    // Refresh agents data every 30 seconds
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'busy':
        return '🟡';
      case 'offline':
        return '⚪';
      case 'error':
        return '🔴';
      default:
        return '⚫';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatUptime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const totalAgents = agents.length;
  const onlineAgents = agents.filter(a => a.status === 'online' || a.status === 'busy').length;
  const busyAgents = agents.filter(a => a.status === 'busy').length;
  const errorAgents = agents.filter(a => a.status === 'error').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Agent Status</h1>
          <p className="text-slate-600 mt-1">Monitor and manage forensic analysis agents</p>
        </div>

        {/* Agent Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Agents</p>
                <p className="text-2xl font-bold text-slate-900">{totalAgents}</p>
              </div>
              <div className="text-3xl">🤖</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Online</p>
                <p className="text-2xl font-bold text-slate-900">{onlineAgents}</p>
              </div>
              <div className="text-3xl">🟢</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Busy</p>
                <p className="text-2xl font-bold text-slate-900">{busyAgents}</p>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Errors</p>
                <p className="text-2xl font-bold text-slate-900">{errorAgents}</p>
              </div>
              <div className="text-3xl">🚨</div>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              className="bg-white rounded-lg shadow-md border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedAgent(agent)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getStatusIcon(agent.status)}</span>
                      <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                      <span className="text-sm text-slate-600">v{agent.version}</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {agent.currentTask ? agent.currentTask : `Last activity: ${agent.lastActivity}`}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">CPU Usage</p>
                    <p className="text-lg font-semibold text-slate-900">{agent.metrics.cpuUsage}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Memory</p>
                    <p className="text-lg font-semibold text-slate-900">{agent.metrics.memoryUsage}MB</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Tasks Done</p>
                    <p className="text-lg font-semibold text-slate-900">{agent.metrics.tasksCompleted}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Success Rate</p>
                    <p className="text-lg font-semibold text-slate-900">{agent.metrics.successRate}%</p>
                  </div>
                </div>

                {/* Progress bars for busy agents */}
                {agent.status === 'busy' && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="animate-pulse-soft">⚡</div>
                      <span className="text-sm text-slate-600">Processing...</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                )}

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((capability, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-700">
                      {capability}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-700">
                      +{agent.capabilities.length - 3}
                    </span>
                  )}
                </div>

                {/* Uptime */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                  <span className="text-xs text-slate-500">Uptime: {formatUptime(agent.uptime)}</span>
                  <span className="text-xs text-slate-500">Avg: {agent.metrics.averageExecutionTime}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Task History */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Task Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {taskHistory.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900">{task.agentName}</span>
                      <span className="text-sm text-slate-600">{task.taskType}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTaskStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <span>Started: {formatDate(task.startTime)}</span>
                      {task.endTime && <span>Ended: {formatDate(task.endTime)}</span>}
                      {task.executionTime && <span>Duration: {task.executionTime}s</span>}
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{task.result}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{selectedAgent.name} Details</h2>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-slate-900 mb-3">Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getStatusIcon(selectedAgent.status)}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedAgent.status)}`}>
                        {selectedAgent.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">Version: {selectedAgent.version}</p>
                    <p className="text-sm text-slate-600">Type: {selectedAgent.type}</p>
                    <p className="text-sm text-slate-600">Uptime: {formatUptime(selectedAgent.uptime)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-slate-900 mb-3">Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">CPU Usage:</span>
                      <span className="text-sm font-medium">{selectedAgent.metrics.cpuUsage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Memory Usage:</span>
                      <span className="text-sm font-medium">{selectedAgent.metrics.memoryUsage}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Success Rate:</span>
                      <span className="text-sm font-medium">{selectedAgent.metrics.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Avg Execution:</span>
                      <span className="text-sm font-medium">{selectedAgent.metrics.averageExecutionTime}s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <h3 className="text-md font-medium text-slate-900 mb-3">Capabilities</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((capability, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-800">
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              {/* Current Task */}
              {selectedAgent.currentTask && (
                <div>
                  <h3 className="text-md font-medium text-slate-900 mb-3">Current Task</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-slate-700">{selectedAgent.currentTask}</p>
                    <div className="mt-2">
                      <div className="w-full bg-yellow-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  Restart Agent
                </button>
                <button className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700">
                  View Logs
                </button>
                <button className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-300">
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
