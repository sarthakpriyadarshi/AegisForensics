"use client"

import DashboardLayout from "@/components/DashboardLayout"
import { AuthGuard } from "@/components/AuthGuard"
import { useState, useEffect } from "react"
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
        return "text-emerald-700 bg-emerald-100/80 border-emerald-200"
      case "analyzing":
        return "text-teal-700 bg-teal-100/80 border-teal-200"
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
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/20 via-teal-800/20 to-emerald-400/20 backdrop-blur-sm border border-white/20 p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-teal-500/10 animate-pulse"></div>
            <div className="relative flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-green-100">
                  Case Management
                </h1>
                <p className="mt-3 text-lg text-green-100">
                  Manage your forensic investigation cases with advanced tracking
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3">
                  <Plus className="w-5 h-5" />
                  Create New Case
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            </div>
          )}

          {showCreateForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 w-full max-w-2xl shadow-2xl border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                    Create New Case
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Case Name</label>
                    <input
                      type="text"
                      value={createData.name}
                      onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                      placeholder="Enter case name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                    <textarea
                      value={createData.description}
                      onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                      rows={4}
                      placeholder="Enter case description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Investigator</label>
                    <input
                      type="text"
                      value={createData.investigator}
                      onChange={(e) => setCreateData({ ...createData, investigator: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                      placeholder="Enter investigator name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                      <select
                        value={createData.status}
                        onChange={(e) => setCreateData({ ...createData, status: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                      >
                        <option value="open">Open</option>
                        <option value="analyzing">Analyzing</option>
                        <option value="closed">Closed</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                      <select
                        value={createData.priority}
                        onChange={(e) => setCreateData({ ...createData, priority: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                    <div className="flex gap-3 mb-3">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                        placeholder="Add tag"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {createData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100/80 text-emerald-800 border border-emerald-200"
                        >
                          {tag.toUpperCase()}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-emerald-600 hover:text-emerald-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createCase}
                    disabled={!createData.name || !createData.investigator}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-400 transition-all duration-200 font-medium shadow-lg"
                  >
                    Create Case
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400/20 to-teal-400/20 animate-pulse"></div>
              </div>
              <p className="mt-6 text-slate-600 text-lg">Loading cases...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {cases.length === 0 ? (
                <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 text-xl font-medium">No cases found</p>
                  <p className="text-slate-400 mt-2">Create your first case to get started</p>
                </div>
              ) : (
                cases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-8 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">{caseItem.name}</h3>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Hash className="w-4 h-4" />
                            <span className="font-mono text-sm">Case #{caseItem.caseNumber}</span>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border ${getStatusColor(caseItem.status)}`}
                          >
                            {getStatusIcon(caseItem.status)}
                            {caseItem.status.toUpperCase()}
                          </span>
                          <span
                            className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold border ${getPriorityColor(caseItem.priority)}`}
                          >
                            {caseItem.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-600 mb-6 text-lg leading-relaxed">{caseItem.description}</p>

                      <div className="grid grid-cols-2 gap-6 text-slate-600 mb-6">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-emerald-600" />
                          <div>
                            <span className="font-semibold text-slate-700">Investigator:</span>
                            <p className="text-slate-600">{caseItem.investigator}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-teal-600" />
                          <div>
                            <span className="font-semibold text-slate-700">Evidence:</span>
                            <p className="text-slate-600">{caseItem.evidenceCount} items</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          <div>
                            <span className="font-semibold text-slate-700">Created:</span>
                            <p className="text-slate-600">{new Date(caseItem.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-teal-600" />
                          <div>
                            <span className="font-semibold text-slate-700">Updated:</span>
                            <p className="text-slate-600">{new Date(caseItem.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {caseItem.tags && caseItem.tags.length > 0 && (
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2">
                            {caseItem.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-100/80 text-slate-700 border border-slate-200"
                              >
                                {tag.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => viewCaseDetails(caseItem)}
                          className="group flex items-center gap-2 px-6 py-3 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all duration-200 font-medium"
                        >
                          <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          View Details
                        </button>
                        <button
                          onClick={() => deleteCase(caseItem.id)}
                          className="group flex items-center gap-2 px-6 py-3 text-red-700 border border-red-200 rounded-xl hover:bg-red-50 transition-all duration-200 font-medium"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {showCaseDetails && selectedCase && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-8 py-6 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                  Case Details - {selectedCase.caseNumber}
                </h2>
                <button
                  onClick={() => setShowCaseDetails(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                {/* Case Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Case Information</h3>
                  <div className="bg-gradient-to-br from-slate-50/80 to-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm font-semibold text-slate-600">Case Name:</span>
                        <p className="text-slate-900 font-medium">{selectedCase.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-600">Investigator:</span>
                        <p className="text-slate-900 font-medium">{selectedCase.investigator}</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-600">Status:</span>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedCase.status)}`}
                        >
                          {getStatusIcon(selectedCase.status)}
                          {selectedCase.status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-600">Priority:</span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(selectedCase.priority)}`}
                        >
                          {selectedCase.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm font-semibold text-slate-600">Description:</span>
                        <p className="text-slate-900 mt-1">{selectedCase.description}</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-600">Created:</span>
                        <p className="text-slate-900">{new Date(selectedCase.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-600">Evidence Count:</span>
                        <p className="text-slate-900">{caseEvidence.length}</p>
                      </div>
                    </div>
                    {selectedCase.tags && selectedCase.tags.length > 0 && (
                      <div className="mt-6">
                        <span className="text-sm font-semibold text-slate-600">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedCase.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200"
                            >
                              {tag.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence List */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Evidence ({caseEvidence.length})</h3>
                  {caseEvidence.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 text-lg">No evidence found for this case</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {caseEvidence.map((evidence) => (
                        <div
                          key={evidence.id}
                          className="bg-gradient-to-br from-slate-50/80 to-white/80 backdrop-blur-sm rounded-2xl p-6 hover:shadow-md transition-all duration-200 border border-slate-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <h4 className="font-semibold text-slate-900">{evidence.filename}</h4>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                                  {evidence.analysisStatus.toUpperCase()}
                                </span>
                                {evidence.verdict && (
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
                                      evidence.verdict === "clean"
                                        ? "bg-emerald-100/80 text-emerald-800 border-emerald-200"
                                        : evidence.verdict === "suspicious"
                                          ? "bg-yellow-100/80 text-yellow-800 border-yellow-200"
                                          : evidence.verdict === "malicious"
                                            ? "bg-red-100/80 text-red-800 border-red-200"
                                            : "bg-slate-100/80 text-slate-800 border-slate-200"
                                    }`}
                                  >
                                    {evidence.verdict.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-6 text-sm text-slate-600 mb-3">
                                {evidence.fileSize && (
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span>{(evidence.fileSize / 1024).toFixed(1)} KB</span>
                                  </div>
                                )}
                                {evidence.mimeType && evidence.mimeType !== "unknown" && (
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    <span>{evidence.mimeType}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(evidence.uploadedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 font-mono bg-white/80 p-3 rounded-lg border border-slate-200">
                                SHA256: {evidence.sha256Hash}
                              </p>
                            </div>
                            <div className="ml-6">
                              <button
                                onClick={() => {
                                  setShowCaseDetails(false)
                                  window.location.href = "/analysis"
                                }}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg"
                              >
                                View Report
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowCaseDetails(false)}
                    className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
