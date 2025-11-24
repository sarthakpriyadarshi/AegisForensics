"use client"

import DashboardLayout from "@/components/DashboardLayout"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Monitor,
  Database,
  Wifi,
  FileText,
  FolderOpen,
  Globe,
  Zap,
  Server,
  Settings,
  CheckCircle,
  Info,
  Laptop,
  Apple,
  Terminal,
} from "lucide-react"

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

        // Download the script file
        if (result.script_content && result.filename) {
          const blob = new Blob([result.script_content], { type: "text/plain" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = result.filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }

        alert(
          `✅ Script generated and downloaded successfully!\n\n📄 Filename: ${result.filename}\n📊 Size: ${result.script_content?.length || 0} characters\n🔧 Features: ${result.features?.join(", ") || "Standard collection"}\n📋 Dependencies: ${result.dependencies?.join(", ") || "None"}\n\n💾 The script has been downloaded to your Downloads folder.`,
        )
      } else if (response.status === 401) {
        localStorage.removeItem("aegis_token")
        window.location.href = "/auth/login"
      } else {
        const errorData = await response.json()
        console.error("Backend error response:", errorData)

        // Handle different error response formats
        let errorMessage = "Unknown error"
        if (errorData.detail) {
          if (typeof errorData.detail === "string") {
            errorMessage = errorData.detail
          } else if (Array.isArray(errorData.detail)) {
            // Handle Pydantic validation errors
            errorMessage = errorData.detail
              .map((err: { msg?: string; loc?: string[]; type?: string } | string) => {
                if (err && typeof err === "object" && err.msg && err.loc) {
                  return `${err.loc.join(".")}: ${err.msg}`
                }
                return typeof err === "string" ? err : JSON.stringify(err)
              })
              .join("\n")
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
      <div className="space-y-6">
        {/* Header */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                🛡️ Forensic Script Generator
              </h1>
              <p className="text-lg text-muted-foreground">
                Generate custom forensic collection scripts for deployment
              </p>

              {/* Auth Token Instructions */}
              <Alert className="max-w-2xl mx-auto border-orange-500/30">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-semibold text-orange-300">📋 Get Your Auth Token</p>
                    <p className="text-sm">Run this command to retrieve your authentication token:</p>
                    <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-all">{`curl -X POST http://localhost:8000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "your_username", "password": "your_password"}'`}</pre>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Copy the token from the response and paste it in the configuration below
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Main Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Script Configuration
            </CardTitle>
            <CardDescription>Configure your forensic collection script parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Platform Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Target Platform</h3>
                  <p className="text-sm text-muted-foreground">Select the operating system for script deployment</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: "windows", label: "Windows", icon: Laptop, desc: "PowerShell-based collection" },
                  { value: "linux", label: "Linux", icon: Terminal, desc: "Bash/Python collection" },
                  { value: "macos", label: "macOS", icon: Apple, desc: "Unix-based collection" },
                ].map((os) => (
                  <Card
                    key={os.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      config.operatingSystem === os.value ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => updateSimpleConfig("operatingSystem", os.value)}
                  >
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="flex justify-center">
                        <os.icon className="w-12 h-12 text-primary" />
                      </div>
                      <div className="font-semibold">{os.label}</div>
                      <div className="text-sm text-muted-foreground">{os.desc}</div>
                      {config.operatingSystem === os.value && (
                        <Badge className="bg-primary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Data Collection Modules */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Collection Modules</h3>
                  <p className="text-sm text-muted-foreground">Select which data types to collect during analysis</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    key: "collectMemory",
                    label: "Memory Dump",
                    icon: Database,
                    desc: "RAM analysis & process memory",
                    api: "/api/memory/dump",
                  },
                  {
                    key: "collectDisk",
                    label: "Disk Imaging",
                    icon: FolderOpen,
                    desc: "File system & storage analysis",
                    api: "/api/disk/image",
                  },
                  {
                    key: "collectNetwork",
                    label: "Network Capture",
                    icon: Wifi,
                    desc: "Traffic analysis & connections",
                    api: "/api/network/capture",
                  },
                  {
                    key: "collectLogs",
                    label: "System Logs",
                    icon: FileText,
                    desc: "Event logs & system records",
                    api: "/api/logs/collect",
                  },
                  {
                    key: "collectRegistry",
                    label: "Registry Data",
                    icon: Settings,
                    desc: "Windows registry analysis",
                    api: "/api/registry/export",
                  },
                  {
                    key: "collectBrowserData",
                    label: "Browser Data",
                    icon: Globe,
                    desc: "Browser history & artifacts",
                    api: "/api/browser/extract",
                  },
                ].map((module) => (
                  <Card
                    key={module.key}
                    className={`transition-all ${
                      config[module.key as keyof ScriptConfig]
                        ? "border-green-500/50 bg-green-500/5"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <module.icon className="w-8 h-8 text-primary" />
                        <Checkbox
                          checked={config[module.key as keyof ScriptConfig] as boolean}
                          onCheckedChange={(checked) => updateSimpleConfig(module.key as keyof ScriptConfig, checked)}
                        />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">{module.label}</h4>
                        <p className="text-sm text-muted-foreground">{module.desc}</p>
                        <Badge variant="outline" className="text-xs font-mono">
                          {module.api}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* API Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">API & Server Configuration</h3>
                  <p className="text-sm text-muted-foreground">Configure backend connectivity and data transmission</p>
                </div>
              </div>

              <Card className="bg-muted/20">
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="serverUrl">Server URL</Label>
                      <Input
                        id="serverUrl"
                        type="url"
                        value={config.server.url}
                        onChange={(e) => updateConfig("server", "url", e.target.value)}
                        placeholder="http://localhost:8000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authToken">Auth Token</Label>
                      <Input
                        id="authToken"
                        type="password"
                        value={config.server.authToken}
                        onChange={(e) => updateConfig("server", "authToken", e.target.value)}
                        placeholder="Enter API token..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sslVerify"
                      checked={config.server.sslVerify}
                      onCheckedChange={(checked) => updateConfig("server", "sslVerify", checked)}
                    />
                    <Label htmlFor="sslVerify" className="text-sm">
                      Enable SSL certificate verification
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={generateScript}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8"
              >
                <Zap className="w-5 h-5 mr-2" />
                Generate Forensic Script
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
