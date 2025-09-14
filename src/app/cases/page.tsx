"use client"

import DashboardLayout from "@/components/DashboardLayout"
import { AuthGuard } from "@/components/AuthGuard"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Eye,
  Trash2,
  X,
  FileText,
  Calendar,
  User,
  Hash,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
} from "lucide-react"

interface Case {
  id: number
  caseNumber: string
  name: string
  description: string
  investigator: string
  status: "open" | "analyzing" | "closed" | "suspended"
  priority: "low" | "medium" | "high" | "critical"
  createdAt: string
  updatedAt: string
  evidenceCount: number
  tags: string[]
}

interface Evidence {
  id: number
  filename: string
  fileSize: number
  mimeType: string
  sha256Hash: string
  uploadedAt: string
  analysisStatus: string
  verdict?: string
  severity?: string
}

interface CreateCaseData {
  name: string
  description: string
  investigator: string
  status: string
  priority: string
  tags: string[]
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createData, setCreateData] = useState<CreateCaseData>({
    name: "",
    description: "",
    investigator: "",
    status: "open",
    priority: "medium",
    tags: [],
  })
  const [tagInput, setTagInput] = useState("")
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [showCaseDetails, setShowCaseDetails] = useState(false)
  const [caseEvidence, setCaseEvidence] = useState<Evidence[]>([])

  // Function to view case details and fetch evidence
  const viewCaseDetails = async (caseItem: Case) => {
    try {
      setSelectedCase(caseItem)
      setShowCaseDetails(true)

      // Fetch evidence for this case
      const token = localStorage.getItem("aegis_token")
      const response = await fetch(`http://localhost:8000/api/evidence-results?case_id=${caseItem.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === "success") {
          const mappedEvidence = data.evidence_results.map(
            (item: {
              id: number
              filename: string
              file_size: number
              file_type?: string
              file_hash: string
              collected_at: string
              case_number: string
              latest_verdict?: string
              latest_severity?: string
              analysis_results: Array<{
                agent_name: string
                verdict?: string
                severity?: string
              }>
            }) => ({
              id: item.id,
              filename: item.filename,
              fileSize: item.file_size,
              mimeType: item.file_type || "unknown",
              sha256Hash: item.file_hash,
              uploadedAt: item.collected_at,
              analysisStatus: "completed",
              verdict: item.latest_verdict,
              severity: item.latest_severity,
            }),
          )
          setCaseEvidence(mappedEvidence)
        }
      }
    } catch (error) {
      console.error("Error fetching case details:", error)
    }
  }

  const fetchCases = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("aegis_token")
      const response = await fetch("http://localhost:8000/api/cases", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch cases: ${response.status}`)
      }

      const data = await response.json()
      if (data.status === "success") {
        setCases(data.cases || [])
      } else {
        throw new Error("Failed to load cases")
      }
    } catch (err) {
      console.error("Error fetching cases:", err)
      setError(err instanceof Error ? err.message : "Failed to load cases")
    } finally {
      setLoading(false)
    }
  }

  const createCase = async () => {
    try {
      const token = localStorage.getItem("aegis_token")
      const response = await fetch("http://localhost:8000/api/cases", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create case: ${response.status}`)
      }

      const data = await response.json()
      if (data.status === "success") {
        await fetchCases()
        setShowCreateForm(false)
        setCreateData({
          name: "",
          description: "",
          investigator: "",
          status: "open",
          priority: "medium",
          tags: [],
        })
        setTagInput("")
      } else {
        throw new Error("Failed to create case")
      }
    } catch (err) {
      console.error("Error creating case:", err)
      setError(err instanceof Error ? err.message : "Failed to create case")
    }
  }

  const deleteCase = async (caseId: number) => {
    if (!confirm("Are you sure you want to delete this case?")) {
      return
    }

    try {
      const token = localStorage.getItem("aegis_token")
      const response = await fetch(`http://localhost:8000/api/cases/${caseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete case: ${response.status}`)
      }

      await fetchCases()
    } catch (err) {
      console.error("Error deleting case:", err)
      setError(err instanceof Error ? err.message : "Failed to delete case")
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !createData.tags.includes(tagInput.trim())) {
      setCreateData({
        ...createData,
        tags: [...createData.tags, tagInput.trim()],
      })
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setCreateData({
      ...createData,
      tags: createData.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  useEffect(() => {
    fetchCases()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-purple-700 bg-purple-100/80 border-purple-200"
      case "analyzing":
        return "text-blue-700 bg-blue-100/80 border-blue-200"
      case "closed":
        return "text-slate-700 bg-slate-100/80 border-slate-200"
      case "suspended":
        return "text-red-700 bg-red-100/80 border-red-200"
      default:
        return "text-slate-700 bg-slate-100/80 border-slate-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-700 bg-red-100/80 border-red-200"
      case "high":
        return "text-orange-700 bg-orange-100/80 border-orange-200"
      case "medium":
        return "text-yellow-700 bg-yellow-100/80 border-yellow-200"
      case "low":
        return "text-emerald-700 bg-emerald-100/80 border-emerald-200"
      default:
        return "text-slate-700 bg-slate-100/80 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <CheckCircle className="w-3 h-3" />
      case "analyzing":
        return <Clock className="w-3 h-3" />
      case "closed":
        return <AlertCircle className="w-3 h-3" />
      case "suspended":
        return <Pause className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary/20 text-primary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Case Management System
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">Case Management</h1>
              <p className="text-lg text-muted-foreground">
                Manage your forensic investigation cases with advanced tracking and AI-powered insights.
              </p>
            </div>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Case
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Case</DialogTitle>
                  <DialogDescription>
                    Start a new forensic investigation case with detailed information.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="case-name">Case Name</Label>
                    <Input
                      id="case-name"
                      value={createData.name}
                      onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                      placeholder="Enter case name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={createData.description}
                      onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                      placeholder="Enter case description"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investigator">Investigator</Label>
                    <Input
                      id="investigator"
                      value={createData.investigator}
                      onChange={(e) => setCreateData({ ...createData, investigator: e.target.value })}
                      placeholder="Enter investigator name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={createData.status}
                        onValueChange={(value) => setCreateData({ ...createData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="analyzing">Analyzing</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={createData.priority}
                        onValueChange={(value) => setCreateData({ ...createData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                        placeholder="Add tag"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        <Tag className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {createData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tag.toUpperCase()}
                          <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createCase}
                    disabled={!createData.name || !createData.investigator}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Create Case
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-64" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cases found</h3>
                <p className="text-muted-foreground">Create your first case to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{caseItem.name}</h3>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Hash className="w-4 h-4" />
                          <span className="font-mono text-sm">Case #{caseItem.caseNumber}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            caseItem.status === "open"
                              ? "default"
                              : caseItem.status === "analyzing"
                                ? "secondary"
                                : caseItem.status === "closed"
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {getStatusIcon(caseItem.status)}
                          {caseItem.status.toUpperCase()}
                        </Badge>
                        <Badge
                          variant={
                            caseItem.priority === "critical"
                              ? "destructive"
                              : caseItem.priority === "high"
                                ? "destructive"
                                : caseItem.priority === "medium"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {caseItem.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{caseItem.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <div>
                          <span className="font-medium">Investigator:</span>
                          <p className="text-muted-foreground">{caseItem.investigator}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <span className="font-medium">Evidence:</span>
                          <p className="text-muted-foreground">{caseItem.evidenceCount} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div>
                          <span className="font-medium">Created:</span>
                          <p className="text-muted-foreground">{new Date(caseItem.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <div>
                          <span className="font-medium">Updated:</span>
                          <p className="text-muted-foreground">{new Date(caseItem.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {caseItem.tags && caseItem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {caseItem.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => viewCaseDetails(caseItem)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => deleteCase(caseItem.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Case Details Dialog */}
        {showCaseDetails && selectedCase && (
          <Dialog open={showCaseDetails} onOpenChange={setShowCaseDetails}>
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Case Details - {selectedCase.caseNumber}</DialogTitle>
                <DialogDescription>Detailed information and evidence for this case</DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Case Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Case Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Case Name:</Label>
                        <p className="font-medium">{selectedCase.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Investigator:</Label>
                        <p className="font-medium">{selectedCase.investigator}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status:</Label>
                        <Badge
                          variant={
                            selectedCase.status === "open"
                              ? "default"
                              : selectedCase.status === "analyzing"
                                ? "secondary"
                                : selectedCase.status === "closed"
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {getStatusIcon(selectedCase.status)}
                          {selectedCase.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Priority:</Label>
                        <Badge
                          variant={
                            selectedCase.priority === "critical"
                              ? "destructive"
                              : selectedCase.priority === "high"
                                ? "destructive"
                                : selectedCase.priority === "medium"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {selectedCase.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-muted-foreground">Description:</Label>
                        <p className="mt-1">{selectedCase.description}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Created:</Label>
                        <p>{new Date(selectedCase.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Evidence Count:</Label>
                        <p>{caseEvidence.length}</p>
                      </div>
                    </div>
                    {selectedCase.tags && selectedCase.tags.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-muted-foreground">Tags:</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedCase.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Evidence List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Evidence ({caseEvidence.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {caseEvidence.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No evidence found for this case</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Filename</TableHead>
                              <TableHead className="min-w-[80px]">Size</TableHead>
                              <TableHead className="min-w-[120px]">Type</TableHead>
                              <TableHead className="min-w-[100px]">Status</TableHead>
                              <TableHead className="min-w-[100px]">Verdict</TableHead>
                              <TableHead className="min-w-[120px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {caseEvidence.map((evidence) => (
                              <TableRow key={evidence.id}>
                                <TableCell className="font-medium min-w-[200px]">
                                  <div className="truncate max-w-[200px]" title={evidence.filename}>
                                    {evidence.filename}
                                  </div>
                                </TableCell>
                                <TableCell className="min-w-[80px]">
                                  {(evidence.fileSize / 1024).toFixed(1)} KB
                                </TableCell>
                                <TableCell className="min-w-[120px]">
                                  <div className="truncate max-w-[120px]" title={evidence.mimeType}>
                                    {evidence.mimeType}
                                  </div>
                                </TableCell>
                                <TableCell className="min-w-[100px]">
                                  <Badge variant="secondary">{evidence.analysisStatus.toUpperCase()}</Badge>
                                </TableCell>
                                <TableCell className="min-w-[100px]">
                                  {evidence.verdict && (
                                    <Badge
                                      variant={
                                        evidence.verdict === "clean"
                                          ? "default"
                                          : evidence.verdict === "suspicious"
                                            ? "secondary"
                                            : evidence.verdict === "malicious"
                                              ? "destructive"
                                              : "outline"
                                      }
                                    >
                                      {evidence.verdict.toUpperCase()}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="min-w-[120px]">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setShowCaseDetails(false)
                                      window.location.href = "/analysis"
                                    }}
                                  >
                                    View Report
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
