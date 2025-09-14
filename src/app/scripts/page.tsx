"use client"

import DashboardLayout from "@/components/DashboardLayout"
import { useState } from "react"

interface ScriptConfig {
  operatingSystem: "windows" | "linux" | "macos"
  analysisType: "memory" | "disk" | "network" | "comprehensive" | "live_response"
  collectMemory: boolean
  collectDisk: boolean
  collectNetwork: boolean
  collectLogs: boolean
  collectRegistry: boolean
  collectBrowserData: boolean
  burstMode: {
    enabled: boolean
    intervalSeconds: number
    totalBursts: number
  }
  server: {
    url: string
    authToken: string
    sslVerify: boolean
  }
  output: {
    compression: boolean
    encryption: boolean
    cleanupAfter: boolean
  }
  advanced: {
    memoryDumpSize: "full" | "kernel" | "small"
    networkCaptureDuration: number
    logRetentionDays: number
    customCommands: string[]
  }
}

interface GeneratedScript {
  id: string
  name: string
  operatingSystem: string
  analysisType: string
  createdAt: string
  size: number
  downloadCount: number
  config: Partial<ScriptConfig>
}

export default function ScriptsPage() {
  const [config, setConfig] = useState<ScriptConfig>({
    operatingSystem: "windows",
    analysisType: "comprehensive",
    collectMemory: true,
    collectDisk: false,
    collectNetwork: true,
    collectLogs: true,
    collectRegistry: true,
    collectBrowserData: false,
    burstMode: {
      enabled: false,
      intervalSeconds: 300,
      totalBursts: 10,
    },
    server: {
      url: "http://localhost:8000",
      authToken: "",
      sslVerify: true,
    },
    output: {
      compression: true,
      encryption: false,
      cleanupAfter: true,
    },
    advanced: {
      memoryDumpSize: "full",
      networkCaptureDuration: 300,
      logRetentionDays: 7,
      customCommands: [],
    },
  })

  const [generatedScripts, setGeneratedScripts] = useState<GeneratedScript[]>([
    {
      id: "1",
      name: "Windows Comprehensive Collection",
      operatingSystem: "Windows",
      analysisType: "Comprehensive",
      createdAt: "2024-09-14T10:30:00Z",
      size: 12584,
      downloadCount: 5,
      config: {
        operatingSystem: "windows",
        analysisType: "comprehensive",
        collectMemory: true,
        collectNetwork: true,
        collectLogs: true,
      },
    },
    {
      id: "2",
      name: "Linux Memory Analysis",
      operatingSystem: "Linux",
      analysisType: "Memory",
      createdAt: "2024-09-13T15:45:00Z",
      size: 8743,
      downloadCount: 3,
      config: {
        operatingSystem: "linux",
        analysisType: "memory",
        collectMemory: true,
      },
    },
    {
      id: "3",
      name: "macOS Live Response",
      operatingSystem: "macOS",
      analysisType: "Live Response",
      createdAt: "2024-09-12T09:20:00Z",
      size: 15632,
      downloadCount: 8,
      config: {
        operatingSystem: "macos",
        analysisType: "live_response",
        burstMode: { enabled: true, intervalSeconds: 30, totalBursts: 10 },
      },
    },
  ])

  const [activeTab, setActiveTab] = useState<"configure" | "generated">("configure")
  const [showPreview, setShowPreview] = useState(false)
  const [generatedScript, setGeneratedScript] = useState<string>("")

  const updateConfig = (section: keyof ScriptConfig, key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]:
        typeof prev[section] === "object"
          ? {
              ...(prev[section] as any),
              [key]: value,
            }
          : value,
    }))
  }

  const updateSimpleConfig = (key: keyof ScriptConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const generateScript = async () => {
    const token = localStorage.getItem("aegis_token")
    if (!token) {
      alert("Please login to generate scripts")
      window.location.href = "/auth/login"
      return
    }

    try {
      console.log("Generating script with config:", config)

      const response = await fetch("http://localhost:8000/api/scripts/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: config,
          script_name: `forensic_script_${config.operatingSystem}_${Date.now()}`,
          description: `${config.analysisType} analysis script for ${config.operatingSystem}`,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Script generated successfully:", result)

        // Store the generated script info for download
        const newScript: GeneratedScript = {
          id: result.script_id || Date.now().toString(),
          name: result.script_name || "generated_script",
          operatingSystem: config.operatingSystem,
          analysisType: config.analysisType,
          createdAt: new Date().toISOString(),
          size: result.script_size || 1024,
          downloadCount: 0,
          config: config,
        }

        // Add to generated scripts list
        setGeneratedScripts((prev) => [newScript, ...prev])

        // Show preview with the generated script content
        if (result.script_content) {
          setGeneratedScript(result.script_content)
        }
        setShowPreview(true)
      } else if (response.status === 401) {
        localStorage.removeItem("aegis_token")
        window.location.href = "/auth/login"
      } else {
        const errorData = await response.json()
        alert(`Failed to generate script: ${errorData.detail || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error generating script:", error)
      alert("Failed to generate script. Please check your connection and try again.")

      // Fall back to showing preview with mock data
      setShowPreview(true)
    }
  }

  const downloadScript = async (scriptId: string, scriptName: string) => {
    const token = localStorage.getItem("aegis_token")
    if (!token) {
      alert("Please login to download scripts")
      window.location.href = "/auth/login"
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/scripts/download/${scriptId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = scriptName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Update download count
        setGeneratedScripts((prev) =>
          prev.map((script) =>
            script.id === scriptId ? { ...script, downloadCount: script.downloadCount + 1 } : script,
          ),
        )
      } else if (response.status === 401) {
        localStorage.removeItem("aegis_token")
        window.location.href = "/auth/login"
      } else {
        const errorData = await response.json()
        alert(`Failed to download script: ${errorData.detail || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error downloading script:", error)
      alert("Failed to download script. Please check your connection and try again.")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const getOSIcon = (os: string) => {
    switch (os.toLowerCase()) {
      case "windows":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7l6 6-6 4z" />
          </svg>
        )
      case "linux":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
          </svg>
        )
      case "macos":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="glass-subtle rounded-3xl p-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-2">Script Generator</h1>
          <p className="text-slate-300">Generate custom forensic collection scripts for remote deployment</p>
        </div>

        <div className="glass-strong rounded-3xl shadow-xl border border-teal-500/30">
          <div className="border-b border-teal-500/30">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("configure")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                  activeTab === "configure"
                    ? "border-teal-400 text-teal-300"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500"
                }`}
              >
                Configure Script
              </button>
              <button
                onClick={() => setActiveTab("generated")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                  activeTab === "generated"
                    ? "border-teal-400 text-teal-300"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500"
                }`}
              >
                Generated Scripts
              </button>
            </nav>
          </div>

          {/* Configure Tab */}
          {activeTab === "configure" && (
            <div className="p-6 space-y-8">
              <div className="glass-subtle rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Basic Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Target Operating System</label>
                    <select
                      value={config.operatingSystem}
                      onChange={(e) => updateSimpleConfig("operatingSystem", e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-teal-500/30 rounded-xl text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                    >
                      <option value="windows">Windows</option>
                      <option value="linux">Linux</option>
                      <option value="macos">macOS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Analysis Type</label>
                    <select
                      value={config.analysisType}
                      onChange={(e) => updateSimpleConfig("analysisType", e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-teal-500/30 rounded-xl text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
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

              <div className="glass-subtle rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                    />
                  </svg>
                  Data Collection
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      key: "collectMemory",
                      label: "Memory Dump",
                      description: "Collect RAM dump for analysis",
                      icon: "🧠",
                    },
                    {
                      key: "collectDisk",
                      label: "Disk Imaging",
                      description: "Create forensic disk images",
                      icon: "💾",
                    },
                    {
                      key: "collectNetwork",
                      label: "Network Capture",
                      description: "Capture network traffic",
                      icon: "🌐",
                    },
                    {
                      key: "collectLogs",
                      label: "System Logs",
                      description: "Collect system and application logs",
                      icon: "📋",
                    },
                    {
                      key: "collectRegistry",
                      label: "Registry Data",
                      description: "Windows registry collection",
                      icon: "🗂️",
                    },
                    {
                      key: "collectBrowserData",
                      label: "Browser Data",
                      description: "Browser history and cache",
                      icon: "🌍",
                    },
                  ].map((option) => (
                    <label
                      key={option.key}
                      className="glass-subtle rounded-xl p-4 hover:glass-strong cursor-pointer transition-all duration-300 border border-teal-500/20 hover:border-teal-400/40"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={config[option.key as keyof ScriptConfig] as boolean}
                          onChange={(e) => updateSimpleConfig(option.key as keyof ScriptConfig, e.target.checked)}
                          className="mt-1 rounded border-teal-500/30 bg-gray-700/50 text-teal-500 focus:ring-teal-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{option.icon}</span>
                            <p className="font-medium text-white">{option.label}</p>
                          </div>
                          <p className="text-sm text-slate-400">{option.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Collection Options */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Data Collection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { key: "collectMemory", label: "Memory Dump", description: "Collect RAM dump for analysis" },
                    { key: "collectDisk", label: "Disk Imaging", description: "Create forensic disk images" },
                    { key: "collectNetwork", label: "Network Capture", description: "Capture network traffic" },
                    { key: "collectLogs", label: "System Logs", description: "Collect system and application logs" },
                    { key: "collectRegistry", label: "Registry Data", description: "Windows registry collection" },
                    { key: "collectBrowserData", label: "Browser Data", description: "Browser history and cache" },
                  ].map((option) => (
                    <label
                      key={option.key}
                      className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
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
                      onChange={(e) => updateConfig("burstMode", "enabled", e.target.checked)}
                    />
                    <span className="font-medium text-slate-900">Enable burst mode for continuous collection</span>
                  </label>

                  {config.burstMode.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Interval (seconds)</label>
                        <input
                          type="number"
                          value={config.burstMode.intervalSeconds}
                          onChange={(e) =>
                            updateConfig("burstMode", "intervalSeconds", Number.parseInt(e.target.value))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="60"
                          max="3600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Total Bursts</label>
                        <input
                          type="number"
                          value={config.burstMode.totalBursts}
                          onChange={(e) => updateConfig("burstMode", "totalBursts", Number.parseInt(e.target.value))}
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Server URL</label>
                    <input
                      type="url"
                      value={config.server.url}
                      onChange={(e) => updateConfig("server", "url", e.target.value)}
                      placeholder="http://localhost:8000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Auth Token</label>
                    <input
                      type="password"
                      value={config.server.authToken}
                      onChange={(e) => updateConfig("server", "authToken", e.target.value)}
                      placeholder="JWT token for authentication"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.server.sslVerify}
                        onChange={(e) => updateConfig("server", "sslVerify", e.target.checked)}
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
                      onChange={(e) => updateConfig("output", "compression", e.target.checked)}
                    />
                    <span className="font-medium text-slate-900">Compress collected data</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.output.encryption}
                      onChange={(e) => updateConfig("output", "encryption", e.target.checked)}
                    />
                    <span className="font-medium text-slate-900">Encrypt collected data</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.output.cleanupAfter}
                      onChange={(e) => updateConfig("output", "cleanupAfter", e.target.checked)}
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Memory Dump Size</label>
                    <select
                      value={config.advanced.memoryDumpSize}
                      onChange={(e) => updateConfig("advanced", "memoryDumpSize", e.target.value)}
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
                      onChange={(e) =>
                        updateConfig("advanced", "networkCaptureDuration", Number.parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="60"
                      max="3600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-teal-500/30">
                <button
                  onClick={() => setShowPreview(true)}
                  className="bg-gray-700/50 text-slate-300 px-6 py-3 rounded-xl hover:bg-gray-600/50 transition-all duration-300 border border-gray-600/50 hover:border-gray-500/50"
                >
                  Preview Script
                </button>
                <button
                  onClick={generateScript}
                  className="bg-gradient-to-r from-teal-600 to-green-600 text-white px-8 py-3 rounded-xl hover:from-teal-700 hover:to-green-700 transition-all duration-300 flex items-center gap-3 shadow-lg shadow-teal-500/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Script
                </button>
              </div>
            </div>
          )}

          {activeTab === "generated" && (
            <div className="p-6">
              <div className="space-y-4">
                {generatedScripts.map((script) => (
                  <div
                    key={script.id}
                    className="glass-subtle rounded-2xl p-6 hover:glass-strong transition-all duration-300 border border-teal-500/20 hover:border-teal-400/40"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-teal-400">{getOSIcon(script.operatingSystem)}</div>
                          <h3 className="font-semibold text-white text-lg">{script.name}</h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            {script.analysisType.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-400 mb-3">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            {script.operatingSystem}
                          </span>
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {formatDate(script.createdAt)}
                          </span>
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                              />
                            </svg>
                            {script.downloadCount} downloads
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">
                          Configuration:{" "}
                          {Object.entries(script.config)
                            .filter(([_, value]) => value === true)
                            .map(([key]) => key)
                            .join(", ")}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button className="bg-teal-500/20 text-teal-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-500/30 transition-all border border-teal-500/30">
                          Download
                        </button>
                        <button className="bg-green-500/20 text-green-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-500/30 transition-all border border-green-500/30">
                          Deploy
                        </button>
                        <button className="bg-gray-500/20 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-500/30 transition-all border border-gray-500/30">
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

      {showPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-strong rounded-3xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-teal-500/30">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Script Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="glass-subtle rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Configuration Summary</h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <p className="text-slate-300">
                      <strong className="text-white">OS:</strong> {config.operatingSystem}
                    </p>
                    <p className="text-slate-300">
                      <strong className="text-white">Type:</strong> {config.analysisType}
                    </p>
                    <p className="text-slate-300">
                      <strong className="text-white">Burst Mode:</strong>{" "}
                      {config.burstMode.enabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-300">
                      <strong className="text-white">Compression:</strong> {config.output.compression ? "Yes" : "No"}
                    </p>
                    <p className="text-slate-300">
                      <strong className="text-white">Encryption:</strong> {config.output.encryption ? "Yes" : "No"}
                    </p>
                    <p className="text-slate-300">
                      <strong className="text-white">Cleanup:</strong> {config.output.cleanupAfter ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-green-400 rounded-lg p-4 font-mono text-sm">
                <div className="mb-2 text-slate-400"># Generated Forensic Collection Script</div>
                <div className="mb-2 text-slate-400"># Target: {config.operatingSystem.toUpperCase()}</div>
                <div className="mb-2 text-slate-400"># Type: {config.analysisType}</div>
                <div className="mb-4 text-slate-400"># Generated: {new Date().toISOString()}</div>

                <div className="space-y-2">
                  {config.operatingSystem === "windows" ? (
                    <>
                      <div>
                        <span className="text-yellow-400">@echo</span> off
                      </div>
                      <div>
                        <span className="text-blue-400">echo</span> Starting Aegis Forensics Collection...
                      </div>
                      {config.collectMemory && (
                        <div>
                          <span className="text-blue-400">echo</span> Collecting memory dump...
                        </div>
                      )}
                      {config.collectLogs && (
                        <div>
                          <span className="text-blue-400">echo</span> Collecting system logs...
                        </div>
                      )}
                      {config.collectRegistry && (
                        <div>
                          <span className="text-blue-400">echo</span> Collecting registry data...
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-yellow-400">#!/bin/bash</span>
                      </div>
                      <div>
                        <span className="text-blue-400">echo</span> "Starting Aegis Forensics Collection..."
                      </div>
                      {config.collectMemory && (
                        <div>
                          <span className="text-blue-400">echo</span> "Collecting memory dump..."
                        </div>
                      )}
                      {config.collectLogs && (
                        <div>
                          <span className="text-blue-400">echo</span> "Collecting system logs..."
                        </div>
                      )}
                    </>
                  )}
                  <div className="text-slate-400"># ... (full script would be much longer)</div>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 text-slate-300 border border-slate-600 rounded-xl hover:bg-slate-700/50 transition-all"
                >
                  Close
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-xl hover:from-teal-700 hover:to-green-700 transition-all shadow-lg shadow-teal-500/25">
                  Download Script
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
