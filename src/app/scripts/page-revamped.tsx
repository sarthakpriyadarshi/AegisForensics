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

export default function ScriptsPageRevamped() {
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

  // Map frontend config to backend format
  const mapConfigToBackendFormat = (frontendConfig: ScriptConfig) => {
    return {
      config: {
        os: frontendConfig.operatingSystem,
        analysis_type: frontendConfig.analysisType,
        memory_dump: frontendConfig.collectMemory,
        disk_imaging: frontendConfig.collectDisk,
        network_capture: frontendConfig.collectNetwork,
        log_collection: frontendConfig.collectLogs,
        registry_collection: frontendConfig.collectRegistry,
        browser_data: frontendConfig.collectBrowserData,
        burst_mode: frontendConfig.burstMode.enabled,
        burst_interval: frontendConfig.burstMode.intervalSeconds,
        burst_count: frontendConfig.burstMode.totalBursts,
        server_url: frontendConfig.server.url,
        auth_token: frontendConfig.server.authToken,
        ssl_verify: frontendConfig.server.sslVerify,
        compression: frontendConfig.output.compression,
        encryption: frontendConfig.output.encryption,
        cleanup: frontendConfig.output.cleanupAfter,
        memory_dump_size: frontendConfig.advanced.memoryDumpSize,
        network_duration: frontendConfig.advanced.networkCaptureDuration,
        log_retention: frontendConfig.advanced.logRetentionDays,
      },
    }
  }

  const generateScript = async () => {
    const token = localStorage.getItem("aegis_token")
    if (!token) {
      alert("Please login to generate scripts")
      window.location.href = "/auth/login"
      return
    }

    try {
      // Map the frontend config to backend format
      const backendPayload = mapConfigToBackendFormat(config)
      
      const response = await fetch("http://localhost:8000/api/scripts/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendPayload),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Create a new script entry
        const newScript: GeneratedScript = {
          id: Date.now().toString(),
          name: `${config.operatingSystem.charAt(0).toUpperCase() + config.operatingSystem.slice(1)} ${
            config.analysisType.charAt(0).toUpperCase() + config.analysisType.slice(1)
          } Script`,
          operatingSystem: config.operatingSystem.charAt(0).toUpperCase() + config.operatingSystem.slice(1),
          analysisType: config.analysisType.charAt(0).toUpperCase() + config.analysisType.slice(1),
          createdAt: new Date().toISOString(),
          size: result.script_content?.length || 0,
          downloadCount: 0,
          config: { ...config },
        }

        setGeneratedScripts((prev) => [newScript, ...prev])
        setGeneratedScript(result.script_content || "")
        setActiveTab("generated")
        
        alert(`✅ Script generated successfully!\n\n📄 Filename: ${result.filename}\n📊 Size: ${result.script_content?.length || 0} characters\n🔧 Features: ${result.features?.join(", ") || "Standard collection"}\n📋 Dependencies: ${result.dependencies?.join(", ") || "None"}`)
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
      // Find the script config for re-generation and download
      const script = generatedScripts.find(s => s.id === scriptId)
      if (!script) {
        alert("Script not found")
        return
      }

      // Map the script config back to backend format for download
      const backendPayload = mapConfigToBackendFormat(script.config as ScriptConfig)
      
      const response = await fetch("http://localhost:8000/api/scripts/download", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendPayload),
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
        
        alert(`Script "${scriptName}" downloaded successfully!`)
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
    const sizes = ["Bytes", "KB", "MB", "GB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const getOSIcon = (os: string) => {
    switch (os.toLowerCase()) {
      case "windows":
        return "🪟"
      case "linux":
        return "🐧"
      case "macos":
        return "🍎"
      default:
        return "💻"
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen space-y-8">
        {/* Enhanced Header with API Status */}
        <div className="relative overflow-hidden">
          <div className="glass-strong rounded-3xl p-8 border border-cyan-500/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
                    🛡️ Forensic Script Generator
                  </h1>
                  <p className="text-slate-300 text-lg">Generate custom forensic collection scripts with advanced API integration</p>
                </div>
                <div className="hidden lg:flex items-center space-x-4">
                  <div className="glass-subtle rounded-2xl p-4 border border-green-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-300 font-medium">API Connected</span>
                    </div>
                  </div>
                  <div className="glass-subtle rounded-2xl p-4 border border-blue-500/30">
                    <div className="text-blue-300">
                      <div className="text-sm font-medium">Generated Scripts</div>
                      <div className="text-xl font-bold">{generatedScripts.length}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("configure")}
                  className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                    activeTab === "configure"
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/50"
                      : "glass-subtle border-slate-600/30 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">Configure Script</div>
                      <div className="text-sm text-slate-300">Setup collection parameters</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab("generated")}
                  className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                    activeTab === "generated"
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50"
                      : "glass-subtle border-slate-600/30 hover:border-purple-400/30"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">Generated Scripts</div>
                      <div className="text-sm text-slate-300">View & download scripts</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={generateScript}
                  className="group relative p-4 rounded-2xl border border-green-500/30 glass-subtle hover:border-green-400/50 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">Quick Generate</div>
                      <div className="text-sm text-slate-300">Generate with current config</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="glass-strong rounded-3xl shadow-2xl border border-purple-500/30 overflow-hidden">
          {/* Configure Tab - Modern API-Focused Design */}
          {activeTab === "configure" && (
            <div className="p-8 space-y-8">
              {/* Platform Selection */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Target Platform</h2>
                    <p className="text-slate-300">Select the operating system for script deployment</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: "windows", label: "Windows", icon: "🪟", desc: "PowerShell-based collection", color: "from-blue-500 to-cyan-500" },
                    { value: "linux", label: "Linux", icon: "🐧", desc: "Bash/Python collection", color: "from-green-500 to-emerald-500" },
                    { value: "macos", label: "macOS", icon: "🍎", desc: "Unix-based collection", color: "from-purple-500 to-pink-500" }
                  ].map((os) => (
                    <button
                      key={os.value}
                      onClick={() => updateSimpleConfig("operatingSystem", os.value)}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                        config.operatingSystem === os.value
                          ? `border-cyan-400/60 bg-gradient-to-r ${os.color}/20`
                          : "border-slate-600/30 glass-subtle hover:border-cyan-400/30"
                      }`}
                    >
                      <div className="text-center space-y-3">
                        <div className="text-4xl">{os.icon}</div>
                        <div className="font-semibold text-white text-lg">{os.label}</div>
                        <div className="text-sm text-slate-300">{os.desc}</div>
                        {config.operatingSystem === os.value && (
                          <div className="absolute top-3 right-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Analysis Type */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Analysis Profile</h2>
                    <p className="text-slate-300">Choose the type of forensic analysis to perform</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { value: "comprehensive", label: "Comprehensive", icon: "🔍", desc: "Full system analysis", modules: ["Memory", "Disk", "Network", "Logs", "Registry"] },
                    { value: "memory", label: "Memory Focus", icon: "🧠", desc: "RAM & memory analysis", modules: ["Memory Dump", "Process Analysis", "DLL Analysis"] },
                    { value: "disk", label: "Disk Analysis", icon: "💾", desc: "Storage & file analysis", modules: ["File System", "Deleted Files", "Metadata"] },
                    { value: "network", label: "Network Focus", icon: "🌐", desc: "Network traffic analysis", modules: ["Packet Capture", "Connections", "DNS"] },
                    { value: "live_response", label: "Live Response", icon: "⚡", desc: "Real-time monitoring", modules: ["Live Processes", "Active Connections", "File Monitor"] }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateSimpleConfig("analysisType", type.value)}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                        config.analysisType === type.value
                          ? "border-purple-400/60 bg-gradient-to-r from-purple-500/20 to-pink-500/20"
                          : "border-slate-600/30 glass-subtle hover:border-purple-400/30"
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-3xl">{type.icon}</div>
                          {config.analysisType === type.value && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">{type.label}</div>
                          <div className="text-sm text-slate-300 mb-3">{type.desc}</div>
                          <div className="flex flex-wrap gap-1">
                            {type.modules.map((module, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-300">
                                {module}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Collection Modules */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Collection Modules</h2>
                    <p className="text-slate-300">Select which data types to collect during analysis</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "collectMemory", label: "Memory Dump", icon: "🧠", desc: "RAM analysis & process memory", api: "/api/memory/dump" },
                    { key: "collectDisk", label: "Disk Imaging", icon: "💾", desc: "File system & storage analysis", api: "/api/disk/image" },
                    { key: "collectNetwork", label: "Network Capture", icon: "🌐", desc: "Traffic analysis & connections", api: "/api/network/capture" },
                    { key: "collectLogs", label: "System Logs", icon: "📋", desc: "Event logs & system records", api: "/api/logs/collect" },
                    { key: "collectRegistry", label: "Registry Data", icon: "🗂️", desc: "Windows registry analysis", api: "/api/registry/export" },
                    { key: "collectBrowserData", label: "Browser Data", icon: "🌍", desc: "Browser history & artifacts", api: "/api/browser/extract" }
                  ].map((module) => (
                    <label
                      key={module.key}
                      className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        config[module.key as keyof ScriptConfig]
                          ? "border-green-400/60 bg-gradient-to-r from-green-500/20 to-emerald-500/20"
                          : "border-slate-600/30 glass-subtle hover:border-green-400/30"
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-3xl">{module.icon}</div>
                          <input
                            type="checkbox"
                            checked={config[module.key as keyof ScriptConfig] as boolean}
                            onChange={(e) => updateSimpleConfig(module.key as keyof ScriptConfig, e.target.checked)}
                            className="w-5 h-5 rounded border-2 border-green-400/30 bg-transparent checked:bg-gradient-to-r checked:from-green-400 checked:to-emerald-400 focus:ring-2 focus:ring-green-400/50"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">{module.label}</div>
                          <div className="text-sm text-slate-300 mb-2">{module.desc}</div>
                          <div className="text-xs font-mono text-green-400 bg-slate-800/50 px-2 py-1 rounded">
                            {module.api}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* API Configuration */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">API & Server Configuration</h2>
                    <p className="text-slate-300">Configure backend connectivity and data transmission</p>
                  </div>
                </div>
                
                <div className="glass-subtle rounded-2xl p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">Server URL</label>
                      <input
                        type="url"
                        value={config.server.url}
                        onChange={(e) => updateConfig("server", "url", e.target.value)}
                        placeholder="http://localhost:8000"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-orange-500/30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">Auth Token</label>
                      <input
                        type="password"
                        value={config.server.authToken}
                        onChange={(e) => updateConfig("server", "authToken", e.target.value)}
                        placeholder="Enter API token..."
                        className="w-full px-4 py-3 bg-gray-800/50 border border-orange-500/30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="sslVerify"
                      checked={config.server.sslVerify}
                      onChange={(e) => updateConfig("server", "sslVerify", e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-orange-400/30 bg-transparent checked:bg-gradient-to-r checked:from-orange-400 checked:to-red-400 focus:ring-2 focus:ring-orange-400/50"
                    />
                    <label htmlFor="sslVerify" className="text-slate-300 cursor-pointer">
                      Enable SSL certificate verification
                    </label>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-6">
                <button
                  onClick={generateScript}
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate Forensic Script</span>
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              </div>
            </div>
          )}

          {/* Generated Scripts Tab */}
          {activeTab === "generated" && (
            <div className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Generated Scripts</h2>
                    <p className="text-slate-300">Download and manage your forensic collection scripts</p>
                  </div>
                  <div className="text-sm text-slate-400">
                    {generatedScripts.length} script{generatedScripts.length !== 1 ? 's' : ''} available
                  </div>
                </div>

                {generatedScripts.map((script) => (
                  <div
                    key={script.id}
                    className="glass-strong rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                          {getOSIcon(script.operatingSystem)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{script.name}</h3>
                          <div className="text-sm text-slate-300">
                            {script.operatingSystem} • {script.analysisType} • {formatDate(script.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right text-sm">
                          <div className="text-slate-300">Size: {formatFileSize(script.size)}</div>
                          <div className="text-slate-400">Downloads: {script.downloadCount}</div>
                        </div>
                        <button
                          onClick={() => downloadScript(script.id, script.name)}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>

                    {/* Script Configuration Preview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="glass-subtle rounded-lg p-3">
                        <div className="text-slate-400 mb-1">Memory Collection</div>
                        <div className={`font-medium ${script.config.collectMemory ? 'text-green-300' : 'text-slate-500'}`}>
                          {script.config.collectMemory ? '✓ Enabled' : '✗ Disabled'}
                        </div>
                      </div>
                      <div className="glass-subtle rounded-lg p-3">
                        <div className="text-slate-400 mb-1">Network Capture</div>
                        <div className={`font-medium ${script.config.collectNetwork ? 'text-green-300' : 'text-slate-500'}`}>
                          {script.config.collectNetwork ? '✓ Enabled' : '✗ Disabled'}
                        </div>
                      </div>
                      <div className="glass-subtle rounded-lg p-3">
                        <div className="text-slate-400 mb-1">System Logs</div>
                        <div className={`font-medium ${script.config.collectLogs ? 'text-green-300' : 'text-slate-500'}`}>
                          {script.config.collectLogs ? '✓ Enabled' : '✗ Disabled'}
                        </div>
                      </div>
                      <div className="glass-subtle rounded-lg p-3">
                        <div className="text-slate-400 mb-1">Burst Mode</div>
                        <div className={`font-medium ${script.config.burstMode?.enabled ? 'text-green-300' : 'text-slate-500'}`}>
                          {script.config.burstMode?.enabled ? '✓ Enabled' : '✗ Disabled'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {generatedScripts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Scripts Generated</h3>
                    <p className="text-slate-300 mb-6">Create your first forensic collection script to get started</p>
                    <button
                      onClick={() => setActiveTab("configure")}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
                    >
                      Create Script
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
