"use client"

import DashboardLayout from "@/components/DashboardLayout"
import { useState } from "react"

interface ScriptConfig {
  operatingSystem: "windows" | "linux" | "macos"
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
    collectMemory: true,
    collectDisk: true,
    collectNetwork: true,
    collectLogs: true,
    collectRegistry: true,
    collectBrowserData: true,
    burstMode: {
      enabled: true,
      intervalSeconds: 300,
      totalBursts: 10,
    },
    server: {
      url: "http://localhost:8000",
      authToken: "",
      sslVerify: false,
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

  const [generatedScripts, setGeneratedScripts] = useState<GeneratedScript[]>([])
  const [activeTab] = useState<"configure">("configure")

  const updateConfig = (section: keyof ScriptConfig, key: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [section]:
        typeof prev[section] === "object"
          ? {
              ...(prev[section] as Record<string, unknown>),
              [key]: value,
            }
          : value,
    }))
  }

  const updateSimpleConfig = (key: keyof ScriptConfig, value: unknown) => {
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
        analysis_type: "comprehensive", // Always use comprehensive as requested
        memory_dump: frontendConfig.collectMemory,
        disk_imaging: frontendConfig.collectDisk,
        network_capture: frontendConfig.collectNetwork,
        log_collection: frontendConfig.collectLogs,
        registry_collection: frontendConfig.collectRegistry,
        browser_data: frontendConfig.collectBrowserData,
        burst_mode: frontendConfig.burstMode.enabled,
        burst_interval: frontendConfig.burstMode.intervalSeconds,
        burst_count: frontendConfig.burstMode.totalBursts,
        server: {
          url: frontendConfig.server.url,
          auth_token: frontendConfig.server.authToken,
          ssl_verify: frontendConfig.server.sslVerify,
        },
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
      
      console.log("Sending payload to backend:", JSON.stringify(backendPayload, null, 2))
      
      const response = await fetch("http://localhost:8000/api/scripts/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendPayload),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        
        // Create a new script entry
        const newScript: GeneratedScript = {
          id: Date.now().toString(),
          name: `${config.operatingSystem.charAt(0).toUpperCase() + config.operatingSystem.slice(1)} Comprehensive Script`,
          operatingSystem: config.operatingSystem.charAt(0).toUpperCase() + config.operatingSystem.slice(1),
          analysisType: "Comprehensive",
          createdAt: new Date().toISOString(),
          size: result.script_content?.length || 0,
          downloadCount: 0,
          config: { ...config },
        }

        setGeneratedScripts((prev) => [newScript, ...prev])
        
        // Download the script file
        if (result.script_content && result.filename) {
          const blob = new Blob([result.script_content], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = result.filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
        
        alert(`✅ Script generated and downloaded successfully!\n\n📄 Filename: ${result.filename}\n📊 Size: ${result.script_content?.length || 0} characters\n🔧 Features: ${result.features?.join(", ") || "Standard collection"}\n📋 Dependencies: ${result.dependencies?.join(", ") || "None"}\n\n💾 The script has been downloaded to your Downloads folder.`)
      } else if (response.status === 401) {
        localStorage.removeItem("aegis_token")
        window.location.href = "/auth/login"
      } else {
        const errorData = await response.json()
        console.error("Backend error response:", errorData)
        
        // Handle different error response formats
        let errorMessage = "Unknown error"
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          } else if (Array.isArray(errorData.detail)) {
            // Handle Pydantic validation errors
            errorMessage = errorData.detail.map((err: { msg?: string; loc?: string[]; type?: string } | string) => {
              if (err && typeof err === 'object' && err.msg && err.loc) {
                return `${err.loc.join('.')}: ${err.msg}`
              }
              return typeof err === 'string' ? err : JSON.stringify(err)
            }).join('\n')
          } else {
            errorMessage = JSON.stringify(errorData.detail)
          }
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else {
          errorMessage = JSON.stringify(errorData)
        }
        
        alert(`Failed to generate script: ${errorMessage}`)
      }
    } catch (error) {
      console.error("Error generating script:", error)
      alert("Failed to generate script. Please check your connection and try again.")
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          <div className="glass-strong rounded-3xl p-8 border border-cyan-500/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10"></div>
            <div className="relative z-10">
              <div className="text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
                  🛡️ Forensic Script Generator
                </h1>
                <p className="text-slate-300 text-lg mb-6">Generate custom forensic collection scripts for deployment</p>
                
                {/* Auth Token Instructions */}
                <div className="glass-subtle rounded-2xl p-4 border border-orange-500/30 max-w-2xl mx-auto">
                  <h3 className="text-lg font-semibold text-orange-300 mb-2">📋 Get Your Auth Token</h3>
                  <p className="text-sm text-slate-300 mb-3">Run this command to retrieve your authentication token:</p>
                  <div className="bg-slate-800/80 rounded-lg p-3 font-mono text-xs text-green-300 border border-slate-600/30 overflow-x-auto">
                    <pre>{`curl -X POST http://localhost:8000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "your_username", "password": "your_password"}'`}</pre>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Copy the token from the response and paste it in the configuration below</p>
                </div>
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

              {/* Data Collection Modules */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
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
        </div>
      </div>
    </DashboardLayout>
  )
}
