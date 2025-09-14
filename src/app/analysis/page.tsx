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
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loadingCases, setLoadingCases] = useState(false)
  const [loadingEvidence, setLoadingEvidence] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
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
      // Analysis type will be auto-detected by backend

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
        return "bg-purple-100 text-purple-800 border-purple-200"
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
        return "bg-purple-100 text-purple-800 border-purple-200"
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
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            AI-Powered Evidence Analysis
          </h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto leading-relaxed">
            Upload forensic evidence and let our intelligent agents automatically detect file types and perform comprehensive analysis
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/40 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-8 flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            Evidence Upload Center
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* File Upload Area */}
            <div className="xl:col-span-2 space-y-6">
              <div
                className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-500 ${
                  dragActive
                    ? "border-purple-400 bg-purple-500/30 scale-105 shadow-2xl"
                    : "border-purple-500/50 hover:border-purple-400/70 hover:bg-purple-500/20"
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
                <div className="space-y-8">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <p className="text-2xl font-semibold text-white mb-3">Drop Evidence Files Here</p>
                    <p className="text-purple-200 leading-relaxed max-w-lg mx-auto">
                      Supports all forensic file types: memory dumps, disk images, network captures, executables, documents, and more
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 text-sm">
                    {['Memory Dumps', 'Disk Images', 'PCAP Files', 'Executables', 'Documents'].map((type) => (
                      <span
                        key={type}
                        className="px-4 py-2 bg-purple-600/40 text-purple-200 rounded-xl border border-purple-400/30"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={onButtonClick}
                disabled={!selectedCaseId}
                className={`w-full px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  selectedCaseId
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 border border-purple-500/30"
                    : "bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-500/30"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Select Evidence Files
                </div>
              </button>
              {!selectedCaseId && (
                <p className="text-red-400 text-sm text-center bg-red-500/20 rounded-xl p-3 border border-red-400/30">
                  ⚠️ Please select a case first to associate evidence
                </p>
              )}
            </div>

            {/* Case Selection */}
            <div className="space-y-6">
              {/* Case Selection */}
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/30 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2"
                      />
                    </svg>
                  </div>
                  Select Active Case
                </h3>
                {loadingCases ? (
                  <div className="bg-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                      <p className="text-purple-200">Loading available cases...</p>
                    </div>
                  </div>
                ) : cases.length > 0 ? (
                  <div className="space-y-4">
                    <select
                      value={selectedCaseId || ""}
                      onChange={(e) => setSelectedCaseId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full p-4 bg-gray-900/70 border border-purple-500/40 rounded-2xl text-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 backdrop-blur-sm"
                    >
                      <option value="">Choose a case to associate evidence...</option>
                      {cases.map((caseItem) => (
                        <option key={caseItem.id} value={caseItem.id} className="bg-gray-900">
                          {caseItem.caseNumber} - {caseItem.name} ({caseItem.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    {selectedCaseId && (
                      <div className="bg-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
                        {(() => {
                          const selectedCase = cases.find((c) => c.id === selectedCaseId)
                          return selectedCase ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-semibold text-white text-lg">{selectedCase.name}</p>
                                  <p className="text-purple-200 text-sm">Case #{selectedCase.caseNumber}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-purple-600/20 rounded-xl p-3">
                                  <p className="text-purple-300 font-medium">Investigator</p>
                                  <p className="text-white">{selectedCase.investigator}</p>
                                </div>
                                <div className="bg-purple-600/20 rounded-xl p-3">
                                  <p className="text-purple-300 font-medium">Status & Priority</p>
                                  <p className="text-white">
                                    <span className="text-purple-300">{selectedCase.status.toUpperCase()}</span> | 
                                    <span className="text-orange-300 ml-1">{selectedCase.priority.toUpperCase()}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : null
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-yellow-200 font-medium">No Cases Available</p>
                        <p className="text-yellow-300 text-sm">
                          <a href="/cases" className="text-purple-300 hover:text-purple-200 underline">
                            Create a case first
                          </a> to start evidence analysis
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI-Powered Analysis Info */}
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-800/30 backdrop-blur-xl rounded-3xl p-8 border border-indigo-500/30 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  Intelligent Analysis Engine
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-indigo-500/20 rounded-2xl border border-indigo-400/30">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white mb-2">Auto-Detection Technology</p>
                      <p className="text-indigo-200 text-sm leading-relaxed">
                        Our AI automatically identifies file types and selects the optimal analysis approach - 
                        memory dumps, disk images, network captures, executables, and documents are all handled intelligently.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-purple-500/20 rounded-2xl border border-purple-400/30">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white mb-2">Multi-Agent Forensics</p>
                      <p className="text-purple-200 text-sm leading-relaxed">
                        Specialized AI agents for memory analysis, disk forensics, network investigation, 
                        binary analysis, and behavioral assessment work together for comprehensive results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Analysis Results */}
        <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/40 backdrop-blur-xl rounded-3xl border border-purple-500/30 shadow-2xl">
          <div className="px-8 py-6 border-b border-purple-500/30 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17h6l-1-1V9l1-1H9l1 1v7l-1 1z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h.01M12 12h.01M2 12h.01M7 3h10l1 1v16l-1 1H7l-1-1V4l1-1z" />
                </svg>
              </div>
              Analysis Results
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchEvidenceResults}
                disabled={loadingEvidence}
                className="inline-flex items-center gap-3 px-6 py-3 text-sm font-medium text-purple-200 hover:text-white disabled:opacity-50 transition-all duration-300 border border-purple-500/30 rounded-2xl hover:bg-purple-600/20 bg-purple-600/10 backdrop-blur-sm"
              >
                {loadingEvidence ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
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
                Refresh Results
              </button>
              <div className="text-purple-200 text-sm bg-purple-600/20 px-4 py-2 rounded-xl border border-purple-400/30">
                {evidence.length} total • {evidence.filter((e) => e.analysisStatus === "completed").length} analyzed
              </div>
            </div>
          </div>
          <div className="p-8">
            {loadingEvidence && evidence.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-purple-200 text-lg">Loading evidence results...</p>
              </div>
            ) : evidence.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">No Evidence Analysis Found</h3>
                <p className="text-purple-200 mb-6 max-w-md mx-auto">
                  Upload evidence files above to start AI-powered forensic analysis
                </p>
                <p className="text-sm text-purple-300">
                  Results will appear here once files are uploaded and analyzed by our intelligent agents
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {evidence.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-r from-purple-900/30 to-indigo-900/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:bg-purple-500/10 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">{item.filename}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${getStatusColor(item.analysisStatus)}`}
                              >
                                {item.analysisStatus.toUpperCase()}
                              </span>
                              {item.analysisResults && (
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${getVerdictColor(item.analysisResults.verdict)}`}
                                >
                                  {item.analysisResults.verdict.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-purple-200 mb-4">
                          {item.fileSize && (
                            <div className="flex items-center gap-2 bg-purple-600/20 rounded-xl p-3">
                              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                              </svg>
                              <span>{formatFileSize(item.fileSize)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 bg-purple-600/20 rounded-xl p-3">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatDate(item.uploadedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-purple-600/20 rounded-xl p-3">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2" />
                            </svg>
                            <span>Case: {item.caseId}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-purple-600/20 rounded-xl p-3">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{item.report_count || 0} Reports</span>
                          </div>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
                          <p className="text-xs text-purple-300 font-mono break-all">
                            SHA256: {item.sha256Hash}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 ml-6">
                        <button
                          onClick={() => viewEvidenceDetails(item)}
                          className="px-6 py-3 text-sm font-medium transition-all duration-300 rounded-2xl bg-purple-600/20 text-purple-300 hover:text-white hover:bg-purple-600/30 border border-purple-500/30 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                        <button
                          onClick={() => generatePDFReport(item)}
                          className="px-6 py-3 text-sm font-medium transition-all duration-300 rounded-2xl bg-indigo-600/20 text-indigo-300 hover:text-white hover:bg-indigo-600/30 border border-indigo-500/30 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Generate Report
                        </button>
                      </div>
                    </div>

                    {/* Analysis Summary */}
                    <div className="mt-6 pt-6 border-t border-purple-500/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analysis Summary
                          </h4>
                          <p className="text-purple-200 mb-4 leading-relaxed">
                            {item.analysisResults?.summary || "Analysis completed successfully with AI-powered detection"}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span
                              className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium border ${getSeverityColor(item.analysisResults?.severity || "low")}`}
                            >
                              {(item.analysisResults?.severity || "low").toUpperCase()} SEVERITY
                            </span>
                            <span className="text-purple-300 bg-purple-600/20 px-4 py-2 rounded-xl border border-purple-400/30">
                              {item.analysisResults?.confidence || 0}% confidence
                            </span>
                            <span className="text-purple-300 bg-indigo-600/20 px-4 py-2 rounded-xl border border-indigo-400/30">
                              {item.report_count || 0} agent reports
                            </span>
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
          <div className="bg-gradient-to-br from-emerald-900/50 to-green-800/40 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-300 mb-1">Successfully Analyzed</p>
                <p className="text-3xl font-bold text-white">
                  {evidence.filter((e) => e.analysisStatus === "completed").length}
                </p>
                <p className="text-xs text-emerald-400 mt-1">Files processed</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-400 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-900/50 to-orange-800/40 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-300 mb-1">Threats Detected</p>
                <p className="text-3xl font-bold text-white">
                  {evidence.filter((e) => e.analysisResults?.verdict === "malicious").length}
                </p>
                <p className="text-xs text-red-400 mt-1">Malicious files</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-400 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="bg-gradient-to-br from-amber-900/50 to-yellow-800/40 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-300 mb-1">In Processing Queue</p>
                <p className="text-3xl font-bold text-white">
                  {evidence.filter((e) => e.analysisStatus === "pending" || e.analysisStatus === "processing").length}
                </p>
                <p className="text-xs text-amber-400 mt-1">Awaiting analysis</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900/95 to-indigo-900/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30">
            <div className="sticky top-0 bg-gradient-to-r from-purple-900/95 to-indigo-900/90 backdrop-blur-xl border-b border-purple-500/30 px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Evidence Analysis Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-purple-300 hover:text-white text-2xl transition-colors p-3 hover:bg-purple-600/20 rounded-2xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8">
              {/* Evidence Information */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Evidence Information
                </h3>
                <div className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-purple-500/30">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-purple-300 mb-1">Filename</p>
                      <p className="text-white font-medium">{selectedEvidence.filename}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-300 mb-1">File Size</p>
                      <p className="text-white">{selectedEvidence.fileSize ? formatFileSize(selectedEvidence.fileSize) : "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-300 mb-1">MIME Type</p>
                      <p className="text-white">{selectedEvidence.mimeType || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-300 mb-1">Upload Date</p>
                      <p className="text-white">{formatDate(selectedEvidence.uploadedAt)}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-purple-500/30">
                    <p className="text-sm font-medium text-purple-300 mb-2">SHA256 Hash</p>
                    <p className="text-xs text-purple-200 font-mono bg-gray-900/50 p-3 rounded-xl border border-purple-500/20 break-all">
                      {selectedEvidence.sha256Hash}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-purple-300 mb-1">Analysis Status</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${getStatusColor(selectedEvidence.analysisStatus)}`}>
                        {selectedEvidence.analysisStatus.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-300 mb-1">Case ID</p>
                      <p className="text-white">{selectedEvidence.caseId}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Analysis Summary
                </h3>
                <div className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-purple-500/30">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-purple-300 mb-2">Verdict</p>
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium border ${getVerdictColor(selectedEvidence.analysisResults?.verdict || "unknown")}`}>
                        {(selectedEvidence.analysisResults?.verdict || "unknown").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-300 mb-2">Severity</p>
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium border ${getSeverityColor(selectedEvidence.analysisResults?.severity || "low")}`}>
                        {(selectedEvidence.analysisResults?.severity || "low").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-300 mb-2">Confidence</p>
                      <p className="text-white text-lg font-semibold">{selectedEvidence.analysisResults?.confidence || 0}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-300 mb-2">Summary</p>
                    <p className="text-purple-200 leading-relaxed">
                      {selectedEvidence.analysisResults?.summary || "Analysis completed successfully"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Agent Reports */}
              {selectedEvidence.analysis_results && selectedEvidence.analysis_results.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2" />
                      </svg>
                    </div>
                    Detailed Agent Reports ({selectedEvidence.analysis_results.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedEvidence.analysis_results.map((report) => (
                      <div key={report.id} className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/30">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-white text-lg">{report.agent_name}</h4>
                            <p className="text-sm text-indigo-300">Analysis Type: {report.analysis_type}</p>
                            <p className="text-sm text-indigo-300">Execution Time: {report.execution_time || 0}s</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${getVerdictColor(report.verdict)}`}>
                              {report.verdict.toUpperCase()}
                            </span>
                            <p className="text-sm text-indigo-300 mt-1">{report.confidence || 0}% confidence</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm font-medium text-indigo-300 mb-2">Summary</p>
                          <p className="text-indigo-200 leading-relaxed">{report.summary}</p>
                        </div>
                        {report.findings && report.findings.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-indigo-300 mb-3">Findings ({report.findings.length})</p>
                            <div className="space-y-2">
                              {report.findings.map((finding, findingIndex) => (
                                <div key={findingIndex} className="bg-purple-600/20 rounded-xl p-3">
                                  <p className="text-sm text-white">{finding.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getSeverityColor(finding.severity)}`}>
                                      {finding.severity.toUpperCase()}
                                    </span>
                                    {finding.confidence && (
                                      <span className="text-xs text-purple-300">{finding.confidence}% confidence</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
