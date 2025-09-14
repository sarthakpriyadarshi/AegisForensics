'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useState } from 'react';

interface ScriptConfig {
  operatingSystem: 'windows' | 'linux' | 'macos';
  analysisType: 'memory' | 'disk' | 'network' | 'comprehensive' | 'live_response';
  collectMemory: boolean;
  collectDisk: boolean;
  collectNetwork: boolean;
  collectLogs: boolean;
  collectRegistry: boolean;
  collectBrowserData: boolean;
  burstMode: {
    enabled: boolean;
    intervalSeconds: number;
    totalBursts: number;
  };
  server: {
    url: string;
    authToken: string;
    sslVerify: boolean;
  };
  output: {
    compression: boolean;
    encryption: boolean;
    cleanupAfter: boolean;
  };
  advanced: {
    memoryDumpSize: 'full' | 'kernel' | 'small';
    networkCaptureDuration: number;
    logRetentionDays: number;
    customCommands: string[];
  };
}

interface GeneratedScript {
  id: string;
  name: string;
  operatingSystem: string;
  analysisType: string;
  createdAt: string;
  size: number;
  downloadCount: number;
  config: Partial<ScriptConfig>;
}

export default function ScriptsPage() {
  const [config, setConfig] = useState<ScriptConfig>({
    operatingSystem: 'windows',
    analysisType: 'comprehensive',
    collectMemory: true,
    collectDisk: false,
    collectNetwork: true,
    collectLogs: true,
    collectRegistry: true,
    collectBrowserData: false,
    burstMode: {
      enabled: false,
      intervalSeconds: 300,
      totalBursts: 10
    },
    server: {
      url: 'http://localhost:8000',
      authToken: '',
      sslVerify: true
    },
    output: {
      compression: true,
      encryption: false,
      cleanupAfter: true
    },
    advanced: {
      memoryDumpSize: 'full',
      networkCaptureDuration: 300,
      logRetentionDays: 7,
      customCommands: []
    }
  });

  const [generatedScripts, setGeneratedScripts] = useState<GeneratedScript[]>([
    {
      id: '1',
      name: 'Windows Comprehensive Collection',
      operatingSystem: 'Windows',
      analysisType: 'Comprehensive',
      createdAt: '2024-09-14T10:30:00Z',
      size: 12584,
      downloadCount: 5,
      config: {
        operatingSystem: 'windows',
        analysisType: 'comprehensive',
        collectMemory: true,
        collectNetwork: true,
        collectLogs: true
      }
    },
    {
      id: '2',
      name: 'Linux Memory Analysis',
      operatingSystem: 'Linux',
      analysisType: 'Memory',
      createdAt: '2024-09-13T15:45:00Z',
      size: 8743,
      downloadCount: 3,
      config: {
        operatingSystem: 'linux',
        analysisType: 'memory',
        collectMemory: true
      }
    },
    {
      id: '3',
      name: 'macOS Live Response',
      operatingSystem: 'macOS',
      analysisType: 'Live Response',
      createdAt: '2024-09-12T09:20:00Z',
      size: 15632,
      downloadCount: 8,
      config: {
        operatingSystem: 'macos',
        analysisType: 'live_response',
        burstMode: { enabled: true, intervalSeconds: 30, totalBursts: 10 }
      }
    }
  ]);

  const [activeTab, setActiveTab] = useState<'configure' | 'generated'>('configure');
  const [showPreview, setShowPreview] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>('');

  const updateConfig = (section: keyof ScriptConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' ? {
        ...prev[section] as any,
        [key]: value
      } : value
    }));
  };

  const updateSimpleConfig = (key: keyof ScriptConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generateScript = async () => {
    const token = localStorage.getItem('aegis_token');
    if (!token) {
      alert('Please login to generate scripts');
      window.location.href = '/auth/login';
      return;
    }

    try {
      console.log('Generating script with config:', config);
      
      const response = await fetch('http://localhost:8000/api/scripts/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: config,
          script_name: `forensic_script_${config.operatingSystem}_${Date.now()}`,
          description: `${config.analysisType} analysis script for ${config.operatingSystem}`
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Script generated successfully:', result);
        
        // Store the generated script info for download
        const newScript: GeneratedScript = {
          id: result.script_id || Date.now().toString(),
          name: result.script_name || 'generated_script',
          operatingSystem: config.operatingSystem,
          analysisType: config.analysisType,
          createdAt: new Date().toISOString(),
          size: result.script_size || 1024,
          downloadCount: 0,
          config: config
        };
        
        // Add to generated scripts list
        setGeneratedScripts(prev => [newScript, ...prev]);
        
        // Show preview with the generated script content
        if (result.script_content) {
          setGeneratedScript(result.script_content);
        }
        setShowPreview(true);
        
      } else if (response.status === 401) {
        localStorage.removeItem('aegis_token');
        window.location.href = '/auth/login';
      } else {
        const errorData = await response.json();
        alert(`Failed to generate script: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating script:', error);
      alert('Failed to generate script. Please check your connection and try again.');
      
      // Fall back to showing preview with mock data
      setShowPreview(true);
    }
  };

  const downloadScript = async (scriptId: string, scriptName: string) => {
    const token = localStorage.getItem('aegis_token');
    if (!token) {
      alert('Please login to download scripts');
      window.location.href = '/auth/login';
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/scripts/download/${scriptId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = scriptName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Update download count
        setGeneratedScripts(prev => prev.map(script => 
          script.id === scriptId 
            ? { ...script, downloadCount: script.downloadCount + 1 }
            : script
        ));
        
      } else if (response.status === 401) {
        localStorage.removeItem('aegis_token');
        window.location.href = '/auth/login';
      } else {
        const errorData = await response.json();
        alert(`Failed to download script: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error downloading script:', error);
      alert('Failed to download script. Please check your connection and try again.');
    }
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

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getOSIcon = (os: string) => {
    switch (os.toLowerCase()) {
      case 'windows': return '🪟';
      case 'linux': return '🐧';
      case 'macos': return '🍎';
      default: return '💻';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Script Generator</h1>
          <p className="text-slate-600 mt-1">Generate custom forensic collection scripts for remote deployment</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('configure')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'configure'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Configure Script
              </button>
              <button
                onClick={() => setActiveTab('generated')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'generated'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Generated Scripts
              </button>
            </nav>
          </div>

          {/* Configure Tab */}
          {activeTab === 'configure' && (
            <div className="p-6 space-y-8">
              {/* Basic Configuration */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Basic Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Target Operating System
                    </label>
                    <select
                      value={config.operatingSystem}
                      onChange={(e) => updateSimpleConfig('operatingSystem', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="windows">Windows</option>
                      <option value="linux">Linux</option>
                      <option value="macos">macOS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Analysis Type
                    </label>
                    <select
                      value={config.analysisType}
                      onChange={(e) => updateSimpleConfig('analysisType', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="comprehensive">Comprehensive Collection</option>
                      <option value="memory">Memory Analysis Only</option>
                      <option value="disk">Disk Forensics Only</option>
                      <option value="network">Network Analysis Only</option>
                      <option value="live_response">Live Response</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Collection Options */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Data Collection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'collectMemory', label: 'Memory Dump', description: 'Collect RAM dump for analysis' },
                    { key: 'collectDisk', label: 'Disk Imaging', description: 'Create forensic disk images' },
                    { key: 'collectNetwork', label: 'Network Capture', description: 'Capture network traffic' },
                    { key: 'collectLogs', label: 'System Logs', description: 'Collect system and application logs' },
                    { key: 'collectRegistry', label: 'Registry Data', description: 'Windows registry collection' },
                    { key: 'collectBrowserData', label: 'Browser Data', description: 'Browser history and cache' }
                  ].map((option) => (
                    <label key={option.key} className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config[option.key as keyof ScriptConfig] as boolean}
                        onChange={(e) => updateSimpleConfig(option.key as keyof ScriptConfig, e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{option.label}</p>
                        <p className="text-sm text-slate-600">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Burst Mode Configuration */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Burst Mode (Live Collection)</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.burstMode.enabled}
                      onChange={(e) => updateConfig('burstMode', 'enabled', e.target.checked)}
                    />
                    <span className="font-medium text-slate-900">Enable burst mode for continuous collection</span>
                  </label>
                  
                  {config.burstMode.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Interval (seconds)
                        </label>
                        <input
                          type="number"
                          value={config.burstMode.intervalSeconds}
                          onChange={(e) => updateConfig('burstMode', 'intervalSeconds', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="60"
                          max="3600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Total Bursts
                        </label>
                        <input
                          type="number"
                          value={config.burstMode.totalBursts}
                          onChange={(e) => updateConfig('burstMode', 'totalBursts', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          max="100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Server Configuration */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Server Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Server URL
                    </label>
                    <input
                      type="url"
                      value={config.server.url}
                      onChange={(e) => updateConfig('server', 'url', e.target.value)}
                      placeholder="http://localhost:8000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Auth Token
                    </label>
                    <input
                      type="password"
                      value={config.server.authToken}
                      onChange={(e) => updateConfig('server', 'authToken', e.target.value)}
                      placeholder="JWT token for authentication"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.server.sslVerify}
                        onChange={(e) => updateConfig('server', 'sslVerify', e.target.checked)}
                      />
                      <span className="font-medium text-slate-900">Verify SSL certificates</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Output Options */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Output Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.output.compression}
                      onChange={(e) => updateConfig('output', 'compression', e.target.checked)}
                    />
                    <span className="font-medium text-slate-900">Compress collected data</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.output.encryption}
                      onChange={(e) => updateConfig('output', 'encryption', e.target.checked)}
                    />
                    <span className="font-medium text-slate-900">Encrypt collected data</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.output.cleanupAfter}
                      onChange={(e) => updateConfig('output', 'cleanupAfter', e.target.checked)}
                    />
                    <span className="font-medium text-slate-900">Clean up temporary files after upload</span>
                  </label>
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Advanced Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Memory Dump Size
                    </label>
                    <select
                      value={config.advanced.memoryDumpSize}
                      onChange={(e) => updateConfig('advanced', 'memoryDumpSize', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="full">Full Memory Dump</option>
                      <option value="kernel">Kernel Memory Only</option>
                      <option value="small">Small Memory Dump</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Network Capture Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={config.advanced.networkCaptureDuration}
                      onChange={(e) => updateConfig('advanced', 'networkCaptureDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="60"
                      max="3600"
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                <button
                  onClick={() => setShowPreview(true)}
                  className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Preview Script
                </button>
                <button
                  onClick={generateScript}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">⚡</span>
                  Generate Script
                </button>
              </div>
            </div>
          )}

          {/* Generated Scripts Tab */}
          {activeTab === 'generated' && (
            <div className="p-6">
              <div className="space-y-4">
                {generatedScripts.map((script) => (
                  <div key={script.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getOSIcon(script.operatingSystem)}</span>
                          <h3 className="font-medium text-slate-900">{script.name}</h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {script.analysisType}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <span>💻 {script.operatingSystem}</span>
                          <span>📅 {formatDate(script.createdAt)}</span>
                          <span>📦 {formatFileSize(script.size)}</span>
                          <span>⬇️ {script.downloadCount} downloads</span>
                        </div>
                        <div className="text-sm text-slate-500">
                          Configuration: {Object.entries(script.config).filter(([_, value]) => value === true).map(([key]) => key).join(', ')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
                          Download
                        </button>
                        <button className="bg-green-50 text-green-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-100 transition-colors">
                          Deploy
                        </button>
                        <button className="bg-slate-50 text-slate-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors">
                          Clone Config
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Script Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Script Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-100 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-2">Configuration Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>OS:</strong> {config.operatingSystem}</p>
                    <p><strong>Type:</strong> {config.analysisType}</p>
                    <p><strong>Burst Mode:</strong> {config.burstMode.enabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div>
                    <p><strong>Compression:</strong> {config.output.compression ? 'Yes' : 'No'}</p>
                    <p><strong>Encryption:</strong> {config.output.encryption ? 'Yes' : 'No'}</p>
                    <p><strong>Cleanup:</strong> {config.output.cleanupAfter ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900 text-green-400 rounded-lg p-4 font-mono text-sm">
                <div className="mb-2 text-slate-400"># Generated Forensic Collection Script</div>
                <div className="mb-2 text-slate-400"># Target: {config.operatingSystem.toUpperCase()}</div>
                <div className="mb-2 text-slate-400"># Type: {config.analysisType}</div>
                <div className="mb-4 text-slate-400"># Generated: {new Date().toISOString()}</div>
                
                <div className="space-y-2">
                  {config.operatingSystem === 'windows' ? (
                    <>
                      <div><span className="text-yellow-400">@echo</span> off</div>
                      <div><span className="text-blue-400">echo</span> Starting Aegis Forensics Collection...</div>
                      {config.collectMemory && <div><span className="text-blue-400">echo</span> Collecting memory dump...</div>}
                      {config.collectLogs && <div><span className="text-blue-400">echo</span> Collecting system logs...</div>}
                      {config.collectRegistry && <div><span className="text-blue-400">echo</span> Collecting registry data...</div>}
                    </>
                  ) : (
                    <>
                      <div><span className="text-yellow-400">#!/bin/bash</span></div>
                      <div><span className="text-blue-400">echo</span> "Starting Aegis Forensics Collection..."</div>
                      {config.collectMemory && <div><span className="text-blue-400">echo</span> "Collecting memory dump..."</div>}
                      {config.collectLogs && <div><span className="text-blue-400">echo</span> "Collecting system logs..."</div>}
                    </>
                  )}
                  <div className="text-slate-400"># ... (full script would be much longer)</div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Download Script
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
