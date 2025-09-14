'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useState } from 'react';

interface SystemInfo {
  version: string;
  hostname: string;
  platform: string;
  architecture: string;
  pythonVersion: string;
  timezone: string;
  uptime: number;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
  };
}

interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'in-progress' | 'failed';
}

interface DatabaseStats {
  totalCases: number;
  totalEvidence: number;
  totalEvents: number;
  databaseSize: number;
  lastBackup: string;
}

export default function SystemPage() {
  const [systemInfo] = useState<SystemInfo>({
    version: 'AegisForensic v2.1.0',
    hostname: 'aegis-forensics-server',
    platform: 'Linux',
    architecture: 'x86_64',
    pythonVersion: '3.11.5',
    timezone: 'UTC+00:00',
    uptime: 168.5
  });

  const [systemMetrics] = useState<SystemMetrics>({
    cpu: {
      usage: 34.2,
      cores: 8,
      frequency: 2400
    },
    memory: {
      total: 16384,
      used: 8192,
      available: 8192,
      percentage: 50.0
    },
    disk: {
      total: 1024000,
      used: 681984,
      free: 342016,
      percentage: 66.6
    },
    network: {
      bytesReceived: 1073741824,
      bytesSent: 536870912,
      packetsReceived: 2048000,
      packetsSent: 1024000
    }
  });

  const [backups] = useState<BackupInfo[]>([
    {
      id: '1',
      filename: 'aegis_backup_2024-09-14_14-30.db',
      size: 104857600,
      createdAt: '2024-09-14T14:30:00Z',
      type: 'manual',
      status: 'completed'
    },
    {
      id: '2',
      filename: 'aegis_backup_2024-09-14_06-00.db',
      size: 104857600,
      createdAt: '2024-09-14T06:00:00Z',
      type: 'automatic',
      status: 'completed'
    },
    {
      id: '3',
      filename: 'aegis_backup_2024-09-13_18-00.db',
      size: 104857600,
      createdAt: '2024-09-13T18:00:00Z',
      type: 'automatic',
      status: 'completed'
    },
    {
      id: '4',
      filename: 'aegis_backup_2024-09-13_06-00.db',
      size: 104857600,
      createdAt: '2024-09-13T06:00:00Z',
      type: 'automatic',
      status: 'failed'
    }
  ]);

  const [databaseStats] = useState<DatabaseStats>({
    totalCases: 12,
    totalEvidence: 247,
    totalEvents: 1856,
    databaseSize: 104857600,
    lastBackup: '2024-09-14T14:30:00Z'
  });

  const [showBackupModal, setShowBackupModal] = useState(false);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.floor((hours % 1) * 60);
    return `${days}d ${remainingHours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'automatic':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Monitor</h1>
            <p className="text-slate-600 mt-1">Monitor system health, performance, and manage backups</p>
          </div>
          <button
            onClick={() => setShowBackupModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="text-lg">💾</span>
            Create Backup
          </button>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-600">Version</p>
              <p className="text-lg text-slate-900">{systemInfo.version}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Hostname</p>
              <p className="text-lg text-slate-900">{systemInfo.hostname}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Platform</p>
              <p className="text-lg text-slate-900">{systemInfo.platform} {systemInfo.architecture}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Python Version</p>
              <p className="text-lg text-slate-900">{systemInfo.pythonVersion}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Timezone</p>
              <p className="text-lg text-slate-900">{systemInfo.timezone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Uptime</p>
              <p className="text-lg text-slate-900">{formatUptime(systemInfo.uptime)}</p>
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU Usage */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-slate-900">CPU Usage</h3>
              <span className="text-2xl">🖥️</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-slate-900">{systemMetrics.cpu.usage}%</span>
                <div className="text-right text-sm text-slate-600">
                  <p>{systemMetrics.cpu.cores} cores</p>
                  <p>{systemMetrics.cpu.frequency} MHz</p>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getUsageColor(systemMetrics.cpu.usage)}`}
                  style={{ width: `${systemMetrics.cpu.usage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-slate-900">Memory Usage</h3>
              <span className="text-2xl">🧠</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-slate-900">{systemMetrics.memory.percentage}%</span>
                <div className="text-right text-sm text-slate-600">
                  <p>{formatBytes(systemMetrics.memory.used)} used</p>
                  <p>{formatBytes(systemMetrics.memory.total)} total</p>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getUsageColor(systemMetrics.memory.percentage)}`}
                  style={{ width: `${systemMetrics.memory.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Disk Usage */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-slate-900">Disk Usage</h3>
              <span className="text-2xl">💾</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-slate-900">{systemMetrics.disk.percentage}%</span>
                <div className="text-right text-sm text-slate-600">
                  <p>{formatBytes(systemMetrics.disk.used)} used</p>
                  <p>{formatBytes(systemMetrics.disk.total)} total</p>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getUsageColor(systemMetrics.disk.percentage)}`}
                  style={{ width: `${systemMetrics.disk.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Network Stats */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-slate-900">Network</h3>
              <span className="text-2xl">🌐</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Received:</span>
                <span className="font-medium">{formatBytes(systemMetrics.network.bytesReceived)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sent:</span>
                <span className="font-medium">{formatBytes(systemMetrics.network.bytesSent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Packets In:</span>
                <span className="font-medium">{systemMetrics.network.packetsReceived.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Packets Out:</span>
                <span className="font-medium">{systemMetrics.network.packetsSent.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Database Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Total Cases</p>
              <p className="text-2xl font-bold text-slate-900">{databaseStats.totalCases}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Evidence Items</p>
              <p className="text-2xl font-bold text-slate-900">{databaseStats.totalEvidence}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Events Logged</p>
              <p className="text-2xl font-bold text-slate-900">{databaseStats.totalEvents}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Database Size</p>
              <p className="text-2xl font-bold text-slate-900">{formatBytes(databaseStats.databaseSize)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Last Backup</p>
              <p className="text-sm font-bold text-slate-900">{formatDate(databaseStats.lastBackup)}</p>
            </div>
          </div>
        </div>

        {/* Backup Management */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Backup Management</h2>
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                Auto Backup: ON
              </button>
              <button className="bg-slate-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
                Configure Schedule
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-slate-900">{backup.filename}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(backup.type)}`}>
                        {backup.type}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(backup.status)}`}>
                        {backup.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>📅 {formatDate(backup.createdAt)}</span>
                      <span>📦 {formatBytes(backup.size)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {backup.status === 'completed' && (
                      <>
                        <button className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
                          Download
                        </button>
                        <button className="bg-green-50 text-green-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-100 transition-colors">
                          Restore
                        </button>
                      </>
                    )}
                    <button className="bg-red-50 text-red-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-100 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent System Logs</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {[
                { time: '2024-09-14 14:30:45', level: 'INFO', message: 'Manual backup completed successfully', category: 'Backup' },
                { time: '2024-09-14 14:25:12', level: 'INFO', message: 'Memory Analyzer agent restarted', category: 'Agent' },
                { time: '2024-09-14 14:20:33', level: 'WARN', message: 'High CPU usage detected (85%)', category: 'System' },
                { time: '2024-09-14 14:15:08', level: 'INFO', message: 'New evidence uploaded: suspicious.exe', category: 'Evidence' },
                { time: '2024-09-14 14:10:22', level: 'ERROR', message: 'Live Response Agent connection failed', category: 'Agent' },
                { time: '2024-09-14 14:05:15', level: 'INFO', message: 'Case CASE-2024-001 status updated', category: 'Case' }
              ].map((log, index) => (
                <div key={index} className="flex items-start gap-4 py-2 font-mono text-sm">
                  <span className="text-slate-500 whitespace-nowrap">{log.time}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                    log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                    log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-slate-600 whitespace-nowrap">[{log.category}]</span>
                  <span className="text-slate-900 flex-1">{log.message}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View full logs →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Create Manual Backup</h2>
            <p className="text-slate-600 mb-4">
              This will create a complete backup of the database including all cases, evidence, and system data.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Backup Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Pre-maintenance backup"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
