'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthGuard } from '@/components/AuthGuard';

interface SystemMetrics {
  version: string;
  uptime: string;
  cpu_usage: string;
  memory_usage: string;
  disk_usage: string;
  active_connections: number;
  last_update: string;
  platform: string;
  platform_version: string;
  python_version: string;
  hostname: string;
}

interface Case {
  id: string;
  name: string;
  status: 'open' | 'closed' | 'investigating';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created: string;
  investigator: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error';
  lastActivity: string;
  tasksCompleted: number;
}

interface Activity {
  id: string;
  type: 'analysis' | 'case' | 'alert' | 'system';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

const DashboardPage: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [activeAgents, setActiveAgents] = useState<Agent[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for JWT token
    const token = localStorage.getItem('aegis_token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    // Load system metrics from API
    const loadSystemMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/system/info', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSystemMetrics(data);
        } else if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('aegis_token');
          window.location.href = '/auth/login';
        }
      } catch (error) {
        console.error('Failed to load system metrics:', error);
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
          hostname: "forensics-server"
        });
      }
    };

    // Load agent status from API
    const loadAgentStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/agents/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.agents) {
            const agentList = Object.entries(data.agents).map(([key, agent]: [string, any]) => ({
              id: key,
              name: key,
              type: agent.specialization?.toLowerCase() || 'general',
              status: agent.status,
              lastActivity: agent.last_analysis || '1 hour ago',
              tasksCompleted: Math.floor(Math.random() * 300) + 50
            }));
            setActiveAgents(agentList);
          }
        } else {
          // Use mock data as fallback
          setActiveAgents([
            { id: '1', name: 'Memory Analyzer', type: 'memory', status: 'active', lastActivity: '2 min ago', tasksCompleted: 127 },
            { id: '2', name: 'Disk Analyzer', type: 'disk', status: 'active', lastActivity: '5 min ago', tasksCompleted: 89 },
            { id: '3', name: 'Network Analyzer', type: 'network', status: 'idle', lastActivity: '1 hour ago', tasksCompleted: 234 },
            { id: '4', name: 'Binary Analyzer', type: 'binary', status: 'active', lastActivity: '3 min ago', tasksCompleted: 45 }
          ]);
        }
      } catch (error) {
        console.error('Failed to load agent status:', error);
        // Use mock data as fallback
        setActiveAgents([
          { id: '1', name: 'Memory Analyzer', type: 'memory', status: 'active', lastActivity: '2 min ago', tasksCompleted: 127 },
          { id: '2', name: 'Disk Analyzer', type: 'disk', status: 'active', lastActivity: '5 min ago', tasksCompleted: 89 },
          { id: '3', name: 'Network Analyzer', type: 'network', status: 'idle', lastActivity: '1 hour ago', tasksCompleted: 234 },
          { id: '4', name: 'Binary Analyzer', type: 'binary', status: 'active', lastActivity: '3 min ago', tasksCompleted: 45 }
        ]);
      }
    };

    // Load data
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadSystemMetrics(), loadAgentStatus()]);
      
      // Mock cases and activities
      setRecentCases([
        { id: '1', name: 'Malware Investigation', status: 'investigating', priority: 'high', created: '2024-01-15', investigator: 'John Doe' },
        { id: '2', name: 'Data Breach Analysis', status: 'open', priority: 'critical', created: '2024-01-14', investigator: 'Jane Smith' },
        { id: '3', name: 'Network Intrusion', status: 'investigating', priority: 'medium', created: '2024-01-13', investigator: 'Bob Wilson' }
      ]);

      setRecentActivity([
        { id: '1', type: 'analysis', message: 'Memory dump analysis completed for Case #2025-001', timestamp: '2 min ago', severity: 'success' },
        { id: '2', type: 'alert', message: 'Suspicious network traffic detected', timestamp: '5 min ago', severity: 'warning' },
        { id: '3', type: 'case', message: 'New case created: Malware Investigation', timestamp: '10 min ago', severity: 'info' },
        { id: '4', type: 'system', message: 'Backup completed successfully', timestamp: '1 hour ago', severity: 'success' },
        { id: '5', type: 'analysis', message: 'Binary analysis failed - file corrupted', timestamp: '2 hours ago', severity: 'error' }
      ]);

      setIsLoading(false);
    };

    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': case 'active': return 'bg-green-100 text-green-800';
      case 'investigating': case 'idle': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'analysis': return '🔍';
      case 'case': return '📁';
      case 'alert': return '⚠️';
      case 'system': return '⚙️';
      default: return '📝';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome to Aegis Forensics - Your AI-powered digital forensics platform
            </p>
          </div>

          {/* System Metrics */}
          {systemMetrics && (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white">
                      ⚡
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">CPU Usage</dt>
                      <dd className="text-lg font-medium text-gray-900">{systemMetrics.cpu_usage}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500 text-white">
                      🧠
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Memory</dt>
                      <dd className="text-lg font-medium text-gray-900">{systemMetrics.memory_usage}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500 text-white">
                      💾
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Disk Usage</dt>
                      <dd className="text-lg font-medium text-gray-900">{systemMetrics.disk_usage}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-white">
                      🔗
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Connections</dt>
                      <dd className="text-lg font-medium text-gray-900">{systemMetrics.active_connections}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Recent Cases */}
            <div className="lg:col-span-1">
              <div className="rounded-lg bg-white shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Cases</h3>
                  <div className="space-y-4">
                    {recentCases.map((case_item) => (
                      <div key={case_item.id} className="border-l-4 border-blue-400 pl-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{case_item.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(case_item.priority)}`}>
                            {case_item.priority}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_item.status)}`}>
                            {case_item.status}
                          </span>
                          <span>•</span>
                          <span>{case_item.investigator}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <a href="/cases" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      View all cases →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Agents */}
            <div className="lg:col-span-1">
              <div className="rounded-lg bg-white shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Active Agents</h3>
                  <div className="space-y-4">
                    {activeAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            agent.status === 'active' ? 'bg-green-400' : 
                            agent.status === 'idle' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                            <p className="text-xs text-gray-500">{agent.lastActivity}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{agent.tasksCompleted}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <a href="/agents" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Manage agents →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-1">
              <div className="rounded-lg bg-white shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <span className="text-lg">{getActivityIcon(activity.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className={`text-xs ${getSeverityColor(activity.severity)}`}>
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <a href="/system" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      View system logs →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <div className="rounded-lg bg-white shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <a
                  href="/analysis"
                  className="relative group bg-blue-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 hover:bg-blue-100 transition-colors rounded-lg"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-blue-600 text-white">
                      🔍
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Analyze Evidence
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Upload and analyze forensic evidence with AI agents
                    </p>
                  </div>
                </a>

                <a
                  href="/cases"
                  className="relative group bg-green-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 hover:bg-green-100 transition-colors rounded-lg"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-green-600 text-white">
                      📁
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Create Case
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Start a new forensic investigation case
                    </p>
                  </div>
                </a>

                <a
                  href="/scripts"
                  className="relative group bg-purple-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 hover:bg-purple-100 transition-colors rounded-lg"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-purple-600 text-white">
                      📝
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Generate Script
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Create forensic analysis scripts for deployment
                    </p>
                  </div>
                </a>

                <a
                  href="/live"
                  className="relative group bg-red-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-red-500 hover:bg-red-100 transition-colors rounded-lg"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-red-600 text-white">
                      🔴
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Live Response
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Monitor live analysis data and system events
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </AuthGuard>
  );
};

export default DashboardPage;
