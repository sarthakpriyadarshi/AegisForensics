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
            mimeType: item.file_type,
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
  const generatePDFReport = async (evidence: Evidence) => {
    // Dynamically import jsPDF to avoid SSR issues
    const { jsPDF } = await import('jspdf')
    const { addMontserratFont } = await import('@/lib/montserrat-font')
    const doc = new jsPDF()
    
    // Load Montserrat font (fallback to helvetica if it fails)
    const fontLoaded = await addMontserratFont(doc)
    
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPos = 20
    
    // Use Montserrat font family if loaded, otherwise helvetica
    const fontFamily = fontLoaded ? 'Montserrat' : 'helvetica'
    
    // Helper function to add new page if needed
    const checkPageBreak = (lineHeight = 10) => {
      if (yPos + lineHeight > pageHeight - margin) {
        doc.addPage()
        yPos = margin
        return true
      }
      return false
    }
    
    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize)
      doc.setFont(fontFamily, isBold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPageBreak()
        doc.text(line, x, yPos)
        yPos += fontSize * 0.5
      })
    }
    
    // Add logo and header
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    // Load and add logo from public folder
    try {
      const logoResponse = await fetch('/aegis-logo.svg')
      const logoSvg = await logoResponse.text()
      
      // Create a blob URL from SVG
      const svgBlob = new Blob([logoSvg], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)
      
      const logoImg = new Image()
      logoImg.src = svgUrl
      
      await new Promise((resolve) => {
        logoImg.onload = () => {
          const logoX = 25
          const logoY = 12
          const logoSize = 16
          
          // Create canvas to convert SVG to PNG
          const canvas = document.createElement('canvas')
          canvas.width = logoSize * 4 // Higher resolution
          canvas.height = logoSize * 4
          const ctx = canvas.getContext('2d')
          
          if (ctx) {
            // Make background transparent
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height)
            
            // Get PNG data URL from canvas
            const pngDataUrl = canvas.toDataURL('image/png')
            
            // Add logo image to PDF
            doc.addImage(pngDataUrl, 'PNG', logoX, logoY, logoSize, logoSize)
          }
          
          URL.revokeObjectURL(svgUrl)
          resolve(true)
        }
        logoImg.onerror = () => {
          URL.revokeObjectURL(svgUrl)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('Failed to load logo:', error)
    }
    
    // Add text beside the logo
    const logoSize = 16
    const logoX = 25
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont(fontFamily, 'bold')
    doc.text('AEGIS FORENSICS', logoX + logoSize + 8, 22)
    
    doc.setFontSize(12)
    doc.setFont(fontFamily, 'normal')
    doc.text('Evidence Analysis Report', logoX + logoSize + 8, 30)
    
    doc.setTextColor(0, 0, 0)
    yPos = 50
    
    // Case Information
    doc.setFillColor(241, 245, 249) // slate-100
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFontSize(14)
    doc.setFont(fontFamily, 'bold')
    doc.text('CASE INFORMATION', margin + 2, yPos + 6)
    yPos += 16
    
    doc.setFontSize(10)
    doc.setFont(fontFamily, 'normal')
    addWrappedText(`Case ID: ${evidence.caseId}`, margin + 2)
    addWrappedText(`Case Name: ${evidence.case?.name || "Unknown"}`, margin + 2)
    yPos += 5
    
    // Evidence Information
    checkPageBreak(40)
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFontSize(14)
    doc.setFont(fontFamily, 'bold')
    doc.text('EVIDENCE INFORMATION', margin + 2, yPos + 6)
    yPos += 16
    
    doc.setFontSize(10)
    doc.setFont(fontFamily, 'normal')
    addWrappedText(`Filename: ${evidence.filename}`, margin + 2)
    addWrappedText(`File Size: ${evidence.fileSize ? `${(evidence.fileSize / 1024).toFixed(2)} KB` : "Unknown"}`, margin + 2)
    addWrappedText(`File Type: ${evidence.mimeType || "Unknown"}`, margin + 2)
    addWrappedText(`SHA256 Hash: ${evidence.sha256Hash}`, margin + 2, 10)
    addWrappedText(`Upload Date: ${formatDate(evidence.uploadedAt)}`, margin + 2)
    addWrappedText(`Analysis Status: ${evidence.analysisStatus?.toUpperCase()}`, margin + 2)
    yPos += 5
    
    // Overall Analysis Summary
    checkPageBreak(50)
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFontSize(14)
    doc.setFont(fontFamily, 'bold')
    doc.text('OVERALL ANALYSIS SUMMARY', margin + 2, yPos + 6)
    yPos += 16
    
    const verdict = evidence.analysisResults?.verdict?.toUpperCase() || "UNKNOWN"
    const severity = evidence.analysisResults?.severity?.toUpperCase() || "LOW"
    
    // Color code verdict
    doc.setFont(fontFamily, 'bold')
    doc.text('Verdict: ', margin + 2, yPos)
    const verdictLabelWidth = doc.getTextWidth('Verdict: ')
    if (verdict === 'MALICIOUS') doc.setTextColor(220, 38, 38)
    else if (verdict === 'SUSPICIOUS') doc.setTextColor(234, 179, 8)
    else doc.setTextColor(34, 197, 94)
    doc.text(verdict, margin + 2 + verdictLabelWidth, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 6
    
    doc.setFont(fontFamily, 'normal')
    addWrappedText(`Severity: ${severity}`, margin + 2)
    addWrappedText(`Confidence: ${evidence.analysisResults?.confidence || 0}%`, margin + 2)
    addWrappedText(`Summary: ${evidence.analysisResults?.summary || "No summary available"}`, margin + 2)
    yPos += 5
    
    // Overall Findings
    if (evidence.analysisResults?.findings && evidence.analysisResults.findings.length > 0) {
      checkPageBreak(30)
      doc.setFillColor(241, 245, 249)
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
      doc.setFontSize(12)
      doc.setFont(fontFamily, 'bold')
      doc.text(`OVERALL FINDINGS (${evidence.analysisResults.findings.length})`, margin + 2, yPos + 6)
      yPos += 16
      
      evidence.analysisResults.findings.forEach((finding, index) => {
        checkPageBreak(25)
        doc.setFont(fontFamily, 'bold')
        addWrappedText(`${index + 1}. ${finding.description}`, margin + 2, 10, true)
        doc.setFont(fontFamily, 'normal')
        addWrappedText(`   Category: ${finding.category || "General"}`, margin + 2, 9)
        addWrappedText(`   Severity: ${finding.severity}`, margin + 2, 9)
        yPos += 3
      })
      yPos += 5
    }
    
    // Detailed Agent Reports
    if (evidence.analysis_results && evidence.analysis_results.length > 0) {
      evidence.analysis_results.forEach((report, index) => {
        checkPageBreak(40)
        doc.setFillColor(51, 65, 85) // slate-700
        doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont(fontFamily, 'bold')
        doc.text(`AGENT REPORT ${index + 1}: ${report.agent_name}`, margin + 2, yPos + 7)
        doc.setTextColor(0, 0, 0)
        yPos += 18
        
        doc.setFontSize(10)
        doc.setFont(fontFamily, 'normal')
        addWrappedText(`Analysis Type: ${report.analysis_type}`, margin + 2)
        addWrappedText(`Date: ${formatDate(report.created_at)}`, margin + 2)
        addWrappedText(`Verdict: ${report.verdict?.toUpperCase() || "UNKNOWN"}`, margin + 2, 10, true)
        addWrappedText(`Severity: ${report.severity?.toUpperCase() || "LOW"}`, margin + 2)
        addWrappedText(`Summary: ${report.summary || "No summary available"}`, margin + 2)
        yPos += 5
        
        if (report.findings && report.findings.length > 0) {
          doc.setFont(fontFamily, 'bold')
          addWrappedText(`Findings (${report.findings.length}):`, margin + 2, 10, true)
          doc.setFont(fontFamily, 'normal')
          report.findings.slice(0, 5).forEach((finding: any, fIndex: number) => {
            checkPageBreak(15)
            addWrappedText(`  ${fIndex + 1}. ${finding.description}`, margin + 4, 9)
          })
          yPos += 3
        }
      })
    }
    
    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(
        `Generated by Aegis Forensics Platform | ${new Date().toLocaleString()} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }
    
    // Save the PDF
    doc.save(`aegis-report-${evidence.filename.replace(/[^a-z0-9]/gi, "_")}-${Date.now()}.pdf`)
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
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
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
            <Button onClick={loadEvidence} className="bg-primary hover:bg-primary/90 w-full md:w-auto">
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
                                {item.analysisResults?.verdict && (
                                  <Badge variant={getVerdictColor(item.analysisResults.verdict)}>
                                    {item.analysisResults.verdict.toUpperCase()}
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
            <DialogContent className="w-[95vw] md:w-[80vw] lg:w-[60vw] max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                              <Badge variant={getSeverityColor(finding.severity)}>
                                                {finding.severity.toUpperCase()}
                                              </Badge>
                                              {finding.confidence && (
                                                <Badge variant="outline">
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
                                      <Badge variant={getSeverityColor(finding.severity)}>
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
