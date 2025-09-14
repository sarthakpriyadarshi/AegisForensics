"use client"

import type React from "react"

import DashboardLayout from "@/components/DashboardLayout"
import { useState, useRef, useEffect } from "react"

interface EvidenceAPIResponse {
  id: number
  filename: string
  file_path: string
  file_hash: string
  file_size: number
  file_type: string
  collected_at: string
  metadata: Record<string, unknown>
  case: {
    id: number
    case_number: string
    name: string
  }
  analysis_status: string
  latest_verdict: string
  latest_severity: string
  latest_confidence: number
  analysis_results: Array<{
    id: number
    agent_name: string
    analysis_type: string
    verdict: string
    severity: string
    confidence: number
    summary: string
    findings: Array<{
      description: string
      severity: string
    }>
    technical_details: Record<string, unknown>
    recommendations: Array<Record<string, unknown>>
    execution_time: number
    created_at: string
  }>
  report_count: number
}

interface Evidence {
  id: number
  filename: string
  fileSize: number
  mimeType?: string
  sha256Hash: string
  analysisStatus: "pending" | "processing" | "completed" | "failed"
  uploadedAt: string
  caseId: string
  analysisResults?: AnalysisResult
  case?: {
    id: number
    case_number: string
    name: string
  }
  latest_verdict?: string
  latest_severity?: string
  latest_confidence?: number
  analysis_results?: AnalysisReport[]
  report_count?: number
}

interface AnalysisReport {
  id: number
  agent_name: string
  analysis_type: string
  verdict: string
  severity: string
  confidence: number
  summary: string
  findings: Finding[]
  technical_details: Record<string, string | number | boolean>
  recommendations: string[]
  execution_time: number
  created_at: string
}

interface AnalysisResult {
  verdict: "clean" | "suspicious" | "malicious" | "unknown"
  severity: "low" | "medium" | "high" | "critical"
  confidence: number
  summary: string
  findings: Finding[]
  executionTime: number
}

interface Finding {
  category: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  confidence: number
}

interface Case {
  id: number
  caseNumber: string
  name: string
  description: string
  investigator: string
  status: "OPEN" | "ANALYZING" | "CLOSED" | "SUSPENDED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  createdAt: string
  updatedAt: string
}

export default function AnalysisPage() {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [selectedAnalysisType, setSelectedAnalysisType] = useState("comprehensive")
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loadingCases, setLoadingCases] = useState(false)
  const [loadingEvidence, setLoadingEvidence] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch evidence results
  const fetchEvidenceResults = async () => {
    try {
      setLoadingEvidence(true)
      const token = localStorage.getItem("aegis_token")
      if (!token) return

      const response = await fetch("http://localhost:8000/api/evidence-results", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === "success") {
          const mappedEvidence = data.evidence_results.map((item: EvidenceAPIResponse) => ({
            id: item.id,
            filename: item.filename,
            filePath: item.file_path,
            fileSize: item.file_size,
            sha256Hash: item.file_hash,
            analysisStatus: "completed", // Always show completed
            uploadedAt: item.collected_at,
            caseId: item.case?.case_number || "Unknown",
            case: item.case,
            latest_verdict: item.latest_verdict,
            latest_severity: item.latest_severity,
            latest_confidence: item.latest_confidence,
            analysis_results: item.analysis_results,
            report_count: item.report_count,
            analysisResults:
              item.analysis_results?.length > 0
                ? {
                    verdict: (item.latest_verdict || "unknown") as "clean" | "suspicious" | "malicious" | "unknown",
                    severity: (item.latest_severity || "low") as "low" | "medium" | "high" | "critical",
                    confidence: item.latest_confidence || 0,
                    summary: item.analysis_results[0]?.summary || "Analysis completed successfully",
                    findings:
                      typeof item.analysis_results[0]?.findings === "string"
                        ? JSON.parse(item.analysis_results[0].findings || "[]")
                        : item.analysis_results[0]?.findings || [],
                    executionTime: item.analysis_results[0]?.execution_time || 0,
                  }
                : {
                    verdict: "unknown" as "clean" | "suspicious" | "malicious" | "unknown",
                    severity: "low" as "low" | "medium" | "high" | "critical",
                    confidence: 0,
                    summary: "Analysis completed successfully",
                    findings: [],
                    executionTime: 0,
                  },
          }))
          setEvidence(mappedEvidence)
        }
      }
    } catch (error) {
      console.error("Error fetching evidence results:", error)
    } finally {
      setLoadingEvidence(false)
    }
  }

  // Fetch available cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoadingCases(true)
        const token = localStorage.getItem("aegis_token")
        if (!token) return

        const response = await fetch("http://localhost:8000/api/cases", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.status === "success") {
            setCases(data.cases || [])
            // Auto-select the first open case if available
            const openCases = data.cases.filter((c: Case) => c.status === "OPEN")
            if (openCases.length > 0) {
              setSelectedCaseId(openCases[0].id)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching cases:", error)
      } finally {
        setLoadingCases(false)
      }
    }

    fetchCases()
    fetchEvidenceResults()
  }, [])

  // Refresh evidence results when a new file is uploaded
  useEffect(() => {
    fetchEvidenceResults()
  }, [])

  // Function to generate PDF report
  const generatePDFReport = (evidence: Evidence) => {
    const formatTechnicalDetails = (details: Record<string, string | number | boolean>) => {
      return Object.entries(details)
        .map(([key, value]) => `    ${key}: ${typeof value === "object" ? JSON.stringify(value, null, 2) : value}`)
        .join("\n")
    }

    const formatRecommendations = (recommendations: string[]) => {
      return recommendations
        .map((rec, index) => `  ${index + 1}. ${typeof rec === "object" ? JSON.stringify(rec) : rec}`)
        .join("\n")
    }

    let content = `
═══════════════════════════════════════════════════════════════════
                    AEGIS FORENSICS - EVIDENCE ANALYSIS REPORT
═══════════════════════════════════════════════════════════════════

CASE INFORMATION:
  Case ID: ${evidence.caseId}
  Case Name: ${evidence.case?.name || "Unknown"}

EVIDENCE INFORMATION:
  Filename: ${evidence.filename}
  File Size: ${evidence.fileSize ? `${(evidence.fileSize / 1024).toFixed(2)} KB` : "Unknown"}
  MIME Type: ${evidence.mimeType || "Unknown"}
  SHA256 Hash: ${evidence.sha256Hash}
  Upload Date: ${formatDate(evidence.uploadedAt)}
  Analysis Status: ${evidence.analysisStatus}

OVERALL ANALYSIS SUMMARY:
  Verdict: ${evidence.analysisResults?.verdict?.toUpperCase() || "UNKNOWN"}
  Severity: ${evidence.analysisResults?.severity?.toUpperCase() || "LOW"}
  Confidence: ${evidence.analysisResults?.confidence || 0}%
  Summary: ${evidence.analysisResults?.summary || "No summary available"}

`

    // Add detailed findings if available
    if (evidence.analysisResults?.findings && evidence.analysisResults.findings.length > 0) {
      content += `
OVERALL FINDINGS (${evidence.analysisResults.findings.length}):
${evidence.analysisResults.findings
  .map(
    (finding, index) =>
      `  ${index + 1}. ${finding.description}
     Category: ${finding.category || "General"}
     Severity: ${finding.severity}
     Confidence: ${finding.confidence || 0}%`,
  )
  .join("\n")}

`
    }

    // Add detailed agent reports
    if (evidence.analysis_results && evidence.analysis_results.length > 0) {
      content += `
═══════════════════════════════════════════════════════════════════
                            DETAILED AGENT REPORTS
═══════════════════════════════════════════════════════════════════

`

      evidence.analysis_results.forEach((report, index) => {
        content += `
───────────────────────────────────────────────────────────────────
AGENT REPORT ${index + 1}: ${report.agent_name}
───────────────────────────────────────────────────────────────────

Analysis Type: ${report.analysis_type}
Analysis Date: ${formatDate(report.created_at)}
Execution Time: ${report.execution_time || 0} seconds

VERDICT & METRICS:
  Verdict: ${report.verdict?.toUpperCase() || "UNKNOWN"}
  Severity: ${report.severity?.toUpperCase() || "LOW"}
  Confidence: ${report.confidence || 0}%

SUMMARY:
${report.summary || "No summary available"}

`

        // Add agent-specific findings
        if (report.findings && report.findings.length > 0) {
          content += `DETAILED FINDINGS (${report.findings.length}):
${report.findings
  .map(
    (finding, findingIndex) =>
      `  ${findingIndex + 1}. ${finding.description}
     Category: ${finding.category || "General"}
     Severity: ${finding.severity}
     Confidence: ${finding.confidence || 0}%`,
  )
  .join("\n")}

`
        }

        // Add technical details
        if (report.technical_details && Object.keys(report.technical_details).length > 0) {
          content += `TECHNICAL DETAILS:
${formatTechnicalDetails(report.technical_details)}

`
        }

        // Add recommendations
        if (report.recommendations && report.recommendations.length > 0) {
          content += `RECOMMENDATIONS (${report.recommendations.length}):
${formatRecommendations(report.recommendations)}

`
        }
      })
    }

    content += `
═══════════════════════════════════════════════════════════════════

REPORT GENERATION:
  Generated by: Aegis Forensics Platform
  Generation Date: ${new Date().toLocaleString()}
  Report Format: Comprehensive Analysis Report
  Total Agent Reports: ${evidence.analysis_results?.length || 0}

═══════════════════════════════════════════════════════════════════
`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `aegis-comprehensive-report-${evidence.filename.replace(/[^a-z0-9]/gi, "_")}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Function to view evidence details
  const viewEvidenceDetails = (evidence: Evidence) => {
    setSelectedEvidence(evidence)
    setShowDetailModal(true)
  }

  // Refresh evidence results when a new file is uploaded
  useEffect(() => {
    if (selectedCaseId) {
      fetchEvidenceResults()
    }
  }, [selectedCaseId])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    const file = files[0]
    if (!file) return

    const token = localStorage.getItem("aegis_token")
    if (!token) {
      alert("Please login to upload files")
      window.location.href = "/auth/login"
      return
    }

    if (!selectedCaseId) {
      alert("Please select a case to associate this evidence with")
      return
    }

    // Find the selected case for display
    const selectedCase = cases.find((c) => c.id === selectedCaseId)
    const caseNumber = selectedCase ? selectedCase.caseNumber : "Unknown"

    // Create a new evidence entry for immediate feedback
    const newEvidence: Evidence = {
      id: Date.now(),
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      sha256Hash: "calculating...",
      analysisStatus: "pending",
      uploadedAt: new Date().toISOString(),
      caseId: caseNumber,
    }

    setEvidence((prev) => [...prev, newEvidence])

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("case_id", selectedCaseId.toString())
      formData.append("analysis_type", "full") // Default to full analysis

      const response = await fetch("http://localhost:8000/analyze/uploadfile/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()

        console.log("File uploaded and analyzed successfully:", result)

        // Refresh the evidence list to get the latest data
        await fetchEvidenceResults()
      } else if (response.status === 401) {
        localStorage.removeItem("aegis_token")
        window.location.href = "/auth/login"
      } else {
        const errorData = await response.json()
        setEvidence((prev) => prev.map((e) => (e.id === newEvidence.id ? { ...e, analysisStatus: "failed" } : e)))
        alert(`Upload failed: ${errorData.detail || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Upload error:", error)
      setEvidence((prev) => prev.map((e) => (e.id === newEvidence.id ? { ...e, analysisStatus: "failed" } : e)))
      alert("Upload failed. Please check your connection and try again.")
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "clean":
        return "bg-green-100 text-green-800 border-green-200"
      case "suspicious":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "malicious":
        return "bg-red-100 text-red-800 border-red-200"
      case "unknown":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-green-100">Evidence Analysis</h1>
          <p className="text-green-200 mt-1">Upload and analyze forensic evidence using AI-powered tools</p>
        </div>

        {/* Upload Section */}
        <div className="glass-strong rounded-3xl p-8 border border-teal-500/30 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload Evidence
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Upload Area */}
            <div className="space-y-4">
              <div
                className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-teal-400 bg-teal-500/20 glass-strong"
                    : "border-teal-500/50 hover:border-teal-400/70 hover:bg-teal-500/10"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-green-400 rounded-3xl flex items-center justify-center shadow-xl animate-pulse-glow">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-white mb-2">Drop files here</p>
                    <p className="text-sm text-slate-300">
                      Supports memory dumps, disk images, network captures, executables, and documents
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onButtonClick}
                disabled={!selectedCaseId}
                className={`w-full px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  selectedCaseId
                    ? "bg-gradient-to-r from-teal-600 to-green-600 text-white hover:from-teal-700 hover:to-green-700 shadow-xl hover:shadow-teal-500/25 transform hover:scale-105 border border-teal-500/30"
                    : "bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-500/30"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Select Files to Upload
                </div>
              </button>
              {!selectedCaseId && <p className="text-xs text-red-400 mt-2 text-center">Please select a case first</p>}
            </div>

            {/* Case Selection and Analysis Options */}
            <div className="space-y-6">
              {/* Case Selection */}
              <div className="glass-subtle rounded-2xl p-6 border border-teal-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                    />
                  </svg>
                  Select Case
                </h3>
                {loadingCases ? (
                  <div className="glass-subtle rounded-xl p-4 border border-teal-500/20">
                    <p className="text-slate-300">Loading cases...</p>
                  </div>
                ) : cases.length > 0 ? (
                  <div className="space-y-3">
                    <select
                      value={selectedCaseId || ""}
                      onChange={(e) => setSelectedCaseId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full p-4 bg-gray-800/50 border border-teal-500/30 rounded-xl text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                    >
                      <option value="">Select a case...</option>
                      {cases.map((caseItem) => (
                        <option key={caseItem.id} value={caseItem.id}>
                          {caseItem.caseNumber} - {caseItem.name} ({caseItem.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    {selectedCaseId && (
                      <div className="glass-subtle rounded-xl p-4 border border-teal-500/20">
                        {(() => {
                          const selectedCase = cases.find((c) => c.id === selectedCaseId)
                          return selectedCase ? (
                            <div className="text-sm space-y-1">
                              <p className="font-semibold text-white">{selectedCase.name}</p>
                              <p className="text-slate-300">Investigator: {selectedCase.investigator}</p>
                              <p className="text-slate-300">
                                Status: <span className="text-teal-300">{selectedCase.status.toUpperCase()}</span> |
                                Priority: <span className="text-orange-300">{selectedCase.priority.toUpperCase()}</span>
                              </p>
                            </div>
                          ) : null
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-subtle rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/10">
                    <p className="text-yellow-200 text-sm">
                      No cases available.
                      <a href="/cases" className="text-teal-300 hover:text-teal-200 underline ml-1">
                        Create a case first
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Analysis Options */}
              <div className="glass-subtle rounded-2xl p-6 border border-teal-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Analysis Type
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      id: "memory",
                      label: "Memory Analysis",
                      description: "Analyze memory dumps for processes, malware, and artifacts",
                      icon: "🧠",
                    },
                    {
                      id: "disk",
                      label: "Disk Forensics",
                      description: "File system analysis, deleted file recovery, timeline reconstruction",
                      icon: "💾",
                    },
                    {
                      id: "network",
                      label: "Network Analysis",
                      description: "PCAP analysis, traffic patterns, IoC extraction",
                      icon: "🌐",
                    },
                    {
                      id: "binary",
                      label: "Binary Analysis",
                      description: "Malware analysis, reverse engineering, behavioral assessment",
                      icon: "🔍",
                    },
                    {
                      id: "comprehensive",
                      label: "Comprehensive",
                      description: "Automatic analysis type detection and multi-modal analysis",
                      icon: "⚡",
                    },
                  ].map((type) => (
                    <label
                      key={type.id}
                      className="glass-subtle rounded-xl p-4 hover:glass-strong cursor-pointer transition-all duration-300 border border-teal-500/20 hover:border-teal-400/40 block"
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="radio"
                          name="analysisType"
                          value={type.id}
                          checked={selectedAnalysisType === type.id}
                          onChange={(e) => setSelectedAnalysisType(e.target.value)}
                          className="mt-1 rounded border-teal-500/30 bg-gray-700/50 text-teal-500 focus:ring-teal-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">{type.icon}</span>
                            <p className="font-semibold text-white">{type.label}</p>
                          </div>
                          <p className="text-sm text-slate-300">{type.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Analysis Results */}
        <div className="glass-strong rounded-2xl border border-teal-500/30 shadow-lg">
          <div className="px-6 py-4 border-b border-teal-500/30 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-100">Evidence Analysis Results</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchEvidenceResults}
                disabled={loadingEvidence}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-200 hover:text-green-100 disabled:opacity-50 transition-all duration-300 border border-teal-500/30 rounded-xl hover:bg-teal-600/20 glass-subtle"
              >
                {loadingEvidence ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                Refresh
              </button>
              <span className="text-sm text-green-300">
                {evidence.length} total • {evidence.filter((e) => e.analysisStatus === "completed").length} analyzed
              </span>
            </div>
          </div>
          <div className="p-6">
            {loadingEvidence && evidence.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto mb-4"></div>
                <p className="text-green-200">Loading evidence results...</p>
              </div>
            ) : evidence.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-green-100 mb-2">No Evidence Found</h3>
                <p className="text-green-200 mb-4">Upload files above to start forensic analysis</p>
                <p className="text-sm text-green-300">Results will appear here once files are uploaded and analyzed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evidence.map((item) => (
                  <div
                    key={item.id}
                    className="border border-teal-500/30 rounded-xl p-4 hover:bg-teal-500/10 transition-all duration-300 glass-subtle"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-green-100">{item.filename}</h3>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.analysisStatus)}`}
                          >
                            {item.analysisStatus.toUpperCase()}
                          </span>
                          {item.analysisResults && (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getVerdictColor(item.analysisResults.verdict)}`}
                            >
                              {item.analysisResults.verdict.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-green-300 mb-2">
                          {item.fileSize && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                                />
                              </svg>
                              {formatFileSize(item.fileSize)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11m-6 0h6"
                              />
                            </svg>
                            {formatDate(item.uploadedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                            Case: {item.caseId}
                          </span>
                        </div>
                        <p className="text-xs text-green-400 font-mono bg-gray-800/50 p-2 rounded-lg border border-teal-500/20">
                          SHA256: {item.sha256Hash}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => viewEvidenceDetails(item)}
                          className="px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl glass-subtle text-teal-300 hover:text-teal-100 hover:bg-teal-600/20 border border-teal-500/30 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View Details
                        </button>
                        <button
                          onClick={() => generatePDFReport(item)}
                          className="px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl glass-subtle text-green-300 hover:text-green-100 hover:bg-green-600/20 border border-green-500/30 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Generate Report
                        </button>
                      </div>
                    </div>

                    {/* Analysis Summary - Always shown */}
                    <div className="mt-4 pt-4 border-t border-teal-500/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-green-100 mb-2">Analysis Summary</h4>
                          <p className="text-sm text-green-300 mb-3">
                            {item.analysisResults?.summary || "Analysis completed successfully"}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(item.analysisResults?.severity || "low")}`}
                            >
                              {(item.analysisResults?.severity || "low").toUpperCase()} severity
                            </span>
                            <span className="text-green-300">{item.analysisResults?.confidence || 0}% confidence</span>
                            <span className="text-green-300">Report Count: {item.report_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-strong rounded-2xl p-6 border border-teal-500/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-300">Total Analyzed</p>
                <p className="text-2xl font-bold text-green-100">
                  {evidence.filter((e) => e.analysisStatus === "completed").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="glass-strong rounded-2xl p-6 border border-teal-500/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-300">Threats Detected</p>
                <p className="text-2xl font-bold text-green-100">
                  {evidence.filter((e) => e.analysisResults?.verdict === "malicious").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="glass-strong rounded-2xl p-6 border border-teal-500/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-300">In Queue</p>
                <p className="text-2xl font-bold text-green-100">
                  {evidence.filter((e) => e.analysisStatus === "pending" || e.analysisStatus === "processing").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Evidence View Modal */}
      {showDetailModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-teal-500/30">
            <div className="sticky top-0 glass-strong border-b border-teal-500/30 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-green-100">Evidence Analysis Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-green-300 hover:text-green-100 text-2xl transition-colors p-2 hover:bg-teal-600/20 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Evidence Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-green-100 mb-4">Evidence Information</h3>
                <div className="glass-subtle rounded-xl p-4 space-y-3 border border-teal-500/20">
                  <p className="text-sm text-green-300">Filename: {selectedEvidence.filename}</p>
                  <p className="text-sm text-green-300">File Size: {formatFileSize(selectedEvidence.fileSize)}</p>
                  <p className="text-sm text-green-300">MIME Type: {selectedEvidence.mimeType || "Unknown"}</p>
                  <p className="text-sm text-green-300">SHA256 Hash: {selectedEvidence.sha256Hash}</p>
                  <p className="text-sm text-green-300">Upload Date: {formatDate(selectedEvidence.uploadedAt)}</p>
                  <p className="text-sm text-green-300">
                    Analysis Status: {selectedEvidence.analysisStatus.toUpperCase()}
                  </p>
                  <p className="text-sm text-green-300">Case ID: {selectedEvidence.caseId}</p>
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-green-100 mb-4">Analysis Summary</h3>
                <div className="glass-subtle rounded-xl p-4 space-y-3 border border-teal-500/20">
                  <p className="text-sm text-green-300">
                    Verdict: {selectedEvidence.analysisResults?.verdict?.toUpperCase() || "UNKNOWN"}
                  </p>
                  <p className="text-sm text-green-300">
                    Severity: {selectedEvidence.analysisResults?.severity?.toUpperCase() || "LOW"}
                  </p>
                  <p className="text-sm text-green-300">
                    Confidence: {selectedEvidence.analysisResults?.confidence || 0}%
                  </p>
                  <p className="text-sm text-green-300">
                    Summary: {selectedEvidence.analysisResults?.summary || "No summary available"}
                  </p>
                </div>
              </div>

              {/* Detailed Findings */}
              {selectedEvidence.analysisResults?.findings && selectedEvidence.analysisResults.findings.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-green-100 mb-4">Detailed Findings</h3>
                  <div className="glass-subtle rounded-xl p-4 space-y-3 border border-teal-500/20">
                    {selectedEvidence.analysisResults.findings.map((finding, index) => (
                      <div key={index} className="space-y-2">
                        <p className="text-sm text-green-300">
                          Finding {index + 1}: {finding.description}
                        </p>
                        <p className="text-sm text-green-300">Category: {finding.category || "General"}</p>
                        <p className="text-sm text-green-300">Severity: {finding.severity}</p>
                        <p className="text-sm text-green-300">Confidence: {finding.confidence || 0}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Agent Reports */}
              {selectedEvidence.analysis_results && selectedEvidence.analysis_results.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-green-100 mb-4">Detailed Agent Reports</h3>
                  {selectedEvidence.analysis_results.map((report, index) => (
                    <div key={report.id} className="mb-4">
                      <div className="glass-subtle rounded-xl p-4 space-y-3 border border-teal-500/20">
                        <p className="text-sm text-green-300">Agent Name: {report.agent_name}</p>
                        <p className="text-sm text-green-300">Analysis Type: {report.analysis_type}</p>
                        <p className="text-sm text-green-300">Analysis Date: {formatDate(report.created_at)}</p>
                        <p className="text-sm text-green-300">Execution Time: {report.execution_time || 0} seconds</p>
                        <p className="text-sm text-green-300">Verdict: {report.verdict?.toUpperCase() || "UNKNOWN"}</p>
                        <p className="text-sm text-green-300">Severity: {report.severity?.toUpperCase() || "LOW"}</p>
                        <p className="text-sm text-green-300">Confidence: {report.confidence || 0}%</p>
                        <p className="text-sm text-green-300">Summary: {report.summary || "No summary available"}</p>
                      </div>

                      {/* Agent-Specific Findings */}
                      {report.findings && report.findings.length > 0 && (
                        <div className="glass-subtle rounded-xl p-4 space-y-3 border border-teal-500/20">
                          {report.findings.map((finding, findingIndex) => (
                            <div key={findingIndex} className="space-y-2">
                              <p className="text-sm text-green-300">
                                Finding {findingIndex + 1}: {finding.description}
                              </p>
                              <p className="text-sm text-green-300">Category: {finding.category || "General"}</p>
                              <p className="text-sm text-green-300">Severity: {finding.severity}</p>
                              <p className="text-sm text-green-300">Confidence: {finding.confidence || 0}%</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Technical Details */}
                      {report.technical_details && Object.keys(report.technical_details).length > 0 && (
                        <div className="glass-subtle rounded-xl p-4 space-y-3 border border-teal-500/20">
                          <p className="text-sm text-green-300">Technical Details:</p>
                          <pre className="text-sm text-green-300 bg-gray-800/50 p-2 rounded-lg border border-teal-500/20">
                            {Object.entries(report.technical_details)
                              .map(
                                ([key, value]) =>
                                  `    ${key}: ${typeof value === "object" ? JSON.stringify(value, null, 2) : value}`,
                              )
                              .join("\n")}
                          </pre>
                        </div>
                      )}

                      {/* Recommendations */}
                      {report.recommendations && report.recommendations.length > 0 && (
                        <div className="glass-subtle rounded-xl p-4 space-y-3 border border-teal-500/20">
                          <p className="text-sm text-green-300">Recommendations:</p>
                          <ul className="list-disc list-inside text-sm text-green-300">
                            {report.recommendations.map((rec, index) => (
                              <li key={index}>{typeof rec === "object" ? JSON.stringify(rec) : rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
