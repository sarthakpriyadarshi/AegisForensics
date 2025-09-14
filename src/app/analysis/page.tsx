"use client"

import type React from "react"
import { formatDate } from "@/utils/dateUtils" // Declare the formatDate variable

import DashboardLayout from "@/components/DashboardLayout"
import { useState, useRef, useEffect } from "react"
import { AuthGuard } from "../../components/AuthGuard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Upload, FileText, AlertCircle, CheckCircle, Clock, Shield, Eye, RefreshCw } from "lucide-react"

interface UploadAnalysisResult {
  verdict: string
  severity: string
  criticality: string
  confidence: string
  summary: string
  findings: Array<{
    category: string
    description: string
    severity: string
    evidence: string
  }>
  technical_details: {
    raw_response: string
  }
  recommendations: string[]
}

interface UploadAnalysisResponse {
  status: string
  message: string
  analysis?: UploadAnalysisResult
  evidence_id: number
  file_info: {
    filename: string
    file_hash: string
    file_type: string
    file_size: number
    file_path: string
  }
}

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
  analysisResults?: any // Add this field for the new analysis results
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

const AnalysisPage: React.FC = () => {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loadingCases, setLoadingCases] = useState(false)
  const [loadingEvidence, setLoadingEvidence] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    type: "success" | "error" | "warning"
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "error",
  })

  const showAlert = (title: string, description: string, type: "success" | "error" | "warning" = "error") => {
    setAlertDialog({
      isOpen: true,
      title,
      description,
      type,
    })
  }

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
              item.analysisResults || // Use the new analysisResults field from backend
              (item.analysis_results?.length > 0
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
                  }),
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
  const viewEvidenceDetailsHandler = (evidence: Evidence) => {
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
    if (!selectedCaseId) {
      showAlert("No Case Selected", "Please select a case before uploading evidence.", "warning")
      return
    }

    const file = files[0]
    const formData = new FormData()
    formData.append("file", file)
    formData.append("case_id", selectedCaseId.toString())

    try {
      const token = localStorage.getItem("aegis_token")
      const response = await fetch("http://localhost:8000/api/upload-evidence", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result: UploadAnalysisResponse = await response.json()
        showAlert("Upload Successful", `File "${file.name}" uploaded and analysis started.`, "success")
        await loadEvidence()
      } else {
        const errorData = await response.json()
        showAlert("Upload Failed", errorData.message || "Failed to upload file", "error")
      }
    } catch (error) {
      console.error("Upload error:", error)
      showAlert("Upload Error", "An error occurred while uploading the file.", "error")
    }
  }

  const loadCases = async () => {
    setLoadingCases(true)
    try {
      const token = localStorage.getItem("aegis_token")
      const response = await fetch("http://localhost:8000/api/cases", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === "success") {
          setCases(data.cases || [])
        }
      }
    } catch (error) {
      console.error("Error loading cases:", error)
    } finally {
      setLoadingCases(false)
    }
  }

  const loadEvidence = async () => {
    setLoadingEvidence(true)
    try {
      const token = localStorage.getItem("aegis_token")
      const response = await fetch("http://localhost:8000/api/evidence-results", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === "success") {
          const mappedEvidence = data.evidence_results.map((item: EvidenceAPIResponse) => ({
            id: item.id,
            filename: item.filename,
            fileSize: item.file_size,
            mimeType: item.file_type,
            sha256Hash: item.file_hash,
            analysisStatus: item.analysis_status === "completed" ? "completed" : "processing",
            uploadedAt: item.collected_at,
            caseId: item.case?.case_number || "Unknown",
            case: item.case,
            latest_verdict: item.latest_verdict,
            latest_severity: item.latest_severity,
            latest_confidence: item.latest_confidence,
            analysis_results: item.analysis_results,
            report_count: item.report_count,
          }))
          setEvidence(mappedEvidence)
        }
      }
    } catch (error) {
      console.error("Error loading evidence:", error)
    } finally {
      setLoadingEvidence(false)
    }
  }

  const getVerdictColor = (verdict?: string) => {
    switch (verdict?.toLowerCase()) {
      case "clean":
        return "default"
      case "suspicious":
        return "secondary"
      case "malicious":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return "outline"
      case "medium":
        return "secondary"
      case "high":
        return "destructive"
      case "critical":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "processing":
        return <Clock className="w-4 h-4" />
      case "failed":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  useEffect(() => {
    loadCases()
    loadEvidence()
  }, [])

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary/20 text-primary">
                  <Shield className="w-3 h-3 mr-1" />
                  AI-Powered Evidence Analysis
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">Evidence Analysis</h1>
              <p className="text-lg text-muted-foreground">
                Upload forensic evidence and let our intelligent agents automatically detect file types and perform
                comprehensive analysis with unprecedented accuracy.
              </p>
            </div>
            <Button onClick={loadEvidence} className="bg-primary hover:bg-primary/90">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Evidence Upload Center
              </CardTitle>
              <CardDescription>Select a case and upload evidence files for automated analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Case Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Case</label>
                <Select
                  value={selectedCaseId?.toString() || ""}
                  onValueChange={(value) => setSelectedCaseId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a case for evidence upload" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                        {caseItem.name} (#{caseItem.caseNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
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
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Drop files here or click to browse</h3>
                    <p className="text-muted-foreground">
                      Upload evidence files for automated analysis. Supported formats: All file types
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedCaseId}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Files
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="evidence" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="evidence">Evidence Analysis Results</TabsTrigger>
            </TabsList>

            <TabsContent value="evidence" className="space-y-6">
              {loadingEvidence ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : evidence.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No evidence found</h3>
                    <p className="text-muted-foreground">Upload your first evidence file to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Evidence Analysis Results ({evidence.length})</CardTitle>
                    <CardDescription>
                      View and manage uploaded evidence with AI-powered analysis results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Filename</TableHead>
                            <TableHead>Case</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Verdict</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Reports</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {evidence.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <span className="truncate max-w-[200px]" title={item.filename}>
                                    {item.filename}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{item.case?.name || "Unknown"}</div>
                                  <div className="text-muted-foreground">#{item.case?.case_number || item.caseId}</div>
                                </div>
                              </TableCell>
                              <TableCell>{(item.fileSize / 1024).toFixed(1)} KB</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.mimeType || "Unknown"}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.analysisStatus === "completed"
                                      ? "default"
                                      : item.analysisStatus === "processing"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {getStatusIcon(item.analysisStatus)}
                                  {item.analysisStatus.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.latest_verdict && (
                                  <Badge variant={getVerdictColor(item.latest_verdict)}>
                                    {item.latest_verdict.toUpperCase()}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {item.latest_severity && (
                                  <Badge variant={getSeverityColor(item.latest_severity)}>
                                    {item.latest_severity.toUpperCase()}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.report_count || 0} reports</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => viewEvidenceDetailsHandler(item)}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => generatePDFReport(item)}
                                    disabled={!item.analysis_results || item.analysis_results.length === 0}
                                  >
                                    <FileText className="w-4 h-4 mr-1" />
                                    Report
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {selectedEvidence && (
          <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Evidence Analysis Details</DialogTitle>
                <DialogDescription>Detailed analysis results for {selectedEvidence.filename}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* File Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>File Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Filename:</label>
                        <p className="font-medium">{selectedEvidence.filename}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">File Size:</label>
                        <p>{(selectedEvidence.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">File Type:</label>
                        <p>{selectedEvidence.mimeType || "Unknown"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">SHA256 Hash:</label>
                        <p className="font-mono text-xs break-all">{selectedEvidence.sha256Hash}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Upload Date:</label>
                        <p>{new Date(selectedEvidence.uploadedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Case:</label>
                        <p>
                          {selectedEvidence.case?.name || "Unknown"} (#
                          {selectedEvidence.case?.case_number || selectedEvidence.caseId})
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Results */}
                {selectedEvidence.analysis_results && selectedEvidence.analysis_results.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis Reports ({selectedEvidence.analysis_results.length})</CardTitle>
                      <CardDescription>
                        Detailed analysis results from {selectedEvidence.analysis_results.length} different agents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedEvidence.analysis_results.map((report, index) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-5 h-5 text-primary" />
                                  <span>{report.agent_name}</span>
                                  <Badge variant="outline">{report.analysis_type}</Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant={getVerdictColor(report.verdict)}>
                                    {report.verdict.toUpperCase()}
                                  </Badge>
                                  <Badge variant={getSeverityColor(report.severity)}>
                                    {report.severity.toUpperCase()}
                                  </Badge>
                                </div>
                              </CardTitle>
                              <CardDescription>
                                <div className="flex items-center gap-4 text-sm">
                                  <span>Confidence: {report.confidence}%</span>
                                  <span>Execution Time: {report.execution_time}s</span>
                                  <span>Analysis Date: {formatDate(report.created_at)}</span>
                                </div>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Summary
                                  </h4>
                                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                    {report.summary}
                                  </p>
                                </div>

                                {report.findings && report.findings.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4" />
                                      Findings ({report.findings.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {report.findings.map((finding, findingIndex) => (
                                        <div key={findingIndex} className="border rounded-lg p-3 bg-muted/30">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                              <p className="font-medium text-sm mb-1">{finding.description}</p>
                                              {finding.category && (
                                                <p className="text-xs text-muted-foreground">
                                                  Category: {finding.category}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex gap-2 ml-2">
                                              <Badge variant={getSeverityColor(finding.severity)} size="sm">
                                                {finding.severity.toUpperCase()}
                                              </Badge>
                                              {finding.confidence && (
                                                <Badge variant="outline" size="sm">
                                                  {finding.confidence}%
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {report.technical_details && Object.keys(report.technical_details).length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                      <Shield className="w-4 h-4" />
                                      Technical Details
                                    </h4>
                                    <div className="bg-muted/50 p-3 rounded-lg">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(report.technical_details).map(([key, value]) => (
                                          <div key={key} className="text-sm">
                                            <span className="font-medium text-muted-foreground">{key}:</span>
                                            <span className="ml-2 font-mono text-xs">
                                              {typeof value === "object"
                                                ? JSON.stringify(value, null, 2)
                                                : String(value)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {report.recommendations && report.recommendations.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4" />
                                      Recommendations ({report.recommendations.length})
                                    </h4>
                                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                                      <ul className="list-disc list-inside space-y-1 text-sm">
                                        {report.recommendations.map((rec, recIndex) => (
                                          <li key={recIndex} className="text-blue-800 dark:text-blue-200">
                                            {typeof rec === "object" ? JSON.stringify(rec) : rec}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 border-t">
                        <Button
                          onClick={() => generatePDFReport(selectedEvidence)}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Comprehensive Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedEvidence.analysisResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Overall Analysis Summary</CardTitle>
                      <CardDescription>Aggregated results from all analysis agents</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold mb-1">
                            <Badge
                              variant={getVerdictColor(selectedEvidence.analysisResults.verdict)}
                              className="text-lg px-3 py-1"
                            >
                              {selectedEvidence.analysisResults.verdict.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Overall Verdict</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold mb-1">
                            <Badge
                              variant={getSeverityColor(selectedEvidence.analysisResults.severity)}
                              className="text-lg px-3 py-1"
                            >
                              {selectedEvidence.analysisResults.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Severity Level</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold mb-1">{selectedEvidence.analysisResults.confidence}%</div>
                          <p className="text-sm text-muted-foreground">Confidence Score</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Analysis Summary</h4>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            {selectedEvidence.analysisResults.summary}
                          </p>
                        </div>

                        {selectedEvidence.analysisResults.findings &&
                          selectedEvidence.analysisResults.findings.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">
                                Key Findings ({selectedEvidence.analysisResults.findings.length})
                              </h4>
                              <div className="space-y-2">
                                {selectedEvidence.analysisResults.findings.map((finding, index) => (
                                  <div key={index} className="border rounded-lg p-3 bg-muted/30">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm mb-1">{finding.description}</p>
                                        <p className="text-xs text-muted-foreground">Category: {finding.category}</p>
                                      </div>
                                      <Badge variant={getSeverityColor(finding.severity)} size="sm">
                                        {finding.severity.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Execution Time:</span>{" "}
                          {selectedEvidence.analysisResults.executionTime}s
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <AlertDialog
          open={alertDialog.isOpen}
          onOpenChange={(open) => setAlertDialog((prev) => ({ ...prev, isOpen: open }))}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle
                className={`flex items-center gap-2 ${
                  alertDialog.type === "success"
                    ? "text-green-600"
                    : alertDialog.type === "warning"
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {alertDialog.type === "success" && <CheckCircle className="w-5 h-5" />}
                {alertDialog.type === "warning" && <AlertCircle className="w-5 h-5" />}
                {alertDialog.type === "error" && <AlertCircle className="w-5 h-5" />}
                {alertDialog.title}
              </AlertDialogTitle>
              <AlertDialogDescription>{alertDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </AuthGuard>
  )
}

export default AnalysisPage
