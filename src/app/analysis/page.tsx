'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useState, useRef, useEffect } from 'react';

interface EvidenceAPIResponse {
  id: number;
  filename: string;
  file_path: string;
  file_hash: string;
  file_size: number;
  file_type: string;
  collected_at: string;
  metadata: Record<string, unknown>;
  case: {
    id: number;
    case_number: string;
    name: string;
  };
  analysis_status: string;
  latest_verdict: string;
  latest_severity: string;
  latest_confidence: number;
  analysis_results: Array<{
    id: number;
    agent_name: string;
    analysis_type: string;
    verdict: string;
    severity: string;
    confidence: number;
    summary: string;
    findings: Array<{
      description: string;
      severity: string;
    }>;
    technical_details: Record<string, unknown>;
    recommendations: Array<Record<string, unknown>>;
    execution_time: number;
    created_at: string;
  }>;
  report_count: number;
}

interface Evidence {
  id: number;
  filename: string;
  fileSize: number;
  mimeType?: string;
  sha256Hash: string;
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  caseId: string;
  analysisResults?: AnalysisResult;
  case?: {
    id: number;
    case_number: string;
    name: string;
  };
  latest_verdict?: string;
  latest_severity?: string;
  latest_confidence?: number;
  analysis_results?: AnalysisReport[];
  report_count?: number;
}

interface AnalysisReport {
  id: number;
  agent_name: string;
  analysis_type: string;
  verdict: string;
  severity: string;
  confidence: number;
  summary: string;
  findings: Finding[];
  technical_details: Record<string, string | number | boolean>;
  recommendations: string[];
  execution_time: number;
  created_at: string;
}

interface AnalysisResult {
  verdict: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  summary: string;
  findings: Finding[];
  executionTime: number;
}

interface Finding {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

interface Case {
  id: number;
  caseNumber: string;
  name: string;
  description: string;
  investigator: string;
  status: 'OPEN' | 'ANALYZING' | 'CLOSED' | 'SUSPENDED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
}

export default function AnalysisPage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('comprehensive');
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch evidence results
  const fetchEvidenceResults = async () => {
    try {
      setLoadingEvidence(true);
      const token = localStorage.getItem('aegis_token');
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/evidence-results', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          const mappedEvidence = data.evidence_results.map((item: EvidenceAPIResponse) => ({
            id: item.id,
            filename: item.filename,
            filePath: item.file_path,
            fileSize: item.file_size,
            sha256Hash: item.file_hash,
            analysisStatus: 'completed', // Always show completed
            uploadedAt: item.collected_at,
            caseId: item.case?.case_number || 'Unknown',
            case: item.case,
            latest_verdict: item.latest_verdict,
            latest_severity: item.latest_severity,
            latest_confidence: item.latest_confidence,
            analysis_results: item.analysis_results,
            report_count: item.report_count,
            analysisResults: item.analysis_results?.length > 0 ? {
              verdict: (item.latest_verdict || 'unknown') as 'clean' | 'suspicious' | 'malicious' | 'unknown',
              severity: (item.latest_severity || 'low') as 'low' | 'medium' | 'high' | 'critical',
              confidence: item.latest_confidence || 0,
              summary: item.analysis_results[0]?.summary || 'Analysis completed successfully',
              findings: typeof item.analysis_results[0]?.findings === 'string' 
                ? JSON.parse(item.analysis_results[0].findings || '[]')
                : (item.analysis_results[0]?.findings || []),
              executionTime: item.analysis_results[0]?.execution_time || 0
            } : {
              verdict: 'unknown' as 'clean' | 'suspicious' | 'malicious' | 'unknown',
              severity: 'low' as 'low' | 'medium' | 'high' | 'critical',
              confidence: 0,
              summary: 'Analysis completed successfully',
              findings: [],
              executionTime: 0
            }
          }));
          setEvidence(mappedEvidence);
        }
      }
    } catch (error) {
      console.error('Error fetching evidence results:', error);
    } finally {
      setLoadingEvidence(false);
    }
  };

  // Fetch available cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoadingCases(true);
        const token = localStorage.getItem('aegis_token');
        if (!token) return;

        const response = await fetch('http://localhost:8000/api/cases', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setCases(data.cases || []);
            // Auto-select the first open case if available
            const openCases = data.cases.filter((c: Case) => c.status === 'OPEN');
            if (openCases.length > 0) {
              setSelectedCaseId(openCases[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setLoadingCases(false);
      }
    };

    fetchCases();
    fetchEvidenceResults();
  }, []);

  // Refresh evidence results when a new file is uploaded
  useEffect(() => {
    fetchEvidenceResults();
  }, []);

  // Function to generate PDF report
  const generatePDFReport = (evidence: Evidence) => {
    const formatTechnicalDetails = (details: Record<string, string | number | boolean>) => {
      return Object.entries(details).map(([key, value]) => 
        `    ${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`
      ).join('\n');
    };

    const formatRecommendations = (recommendations: string[]) => {
      return recommendations.map((rec, index) => 
        `  ${index + 1}. ${typeof rec === 'object' ? JSON.stringify(rec) : rec}`
      ).join('\n');
    };

    let content = `
═══════════════════════════════════════════════════════════════════
                    AEGIS FORENSICS - EVIDENCE ANALYSIS REPORT
═══════════════════════════════════════════════════════════════════

CASE INFORMATION:
  Case ID: ${evidence.caseId}
  Case Name: ${evidence.case?.name || 'Unknown'}

EVIDENCE INFORMATION:
  Filename: ${evidence.filename}
  File Size: ${evidence.fileSize ? `${(evidence.fileSize / 1024).toFixed(2)} KB` : 'Unknown'}
  MIME Type: ${evidence.mimeType || 'Unknown'}
  SHA256 Hash: ${evidence.sha256Hash}
  Upload Date: ${formatDate(evidence.uploadedAt)}
  Analysis Status: ${evidence.analysisStatus}

OVERALL ANALYSIS SUMMARY:
  Verdict: ${evidence.analysisResults?.verdict?.toUpperCase() || 'UNKNOWN'}
  Severity: ${evidence.analysisResults?.severity?.toUpperCase() || 'LOW'}
  Confidence: ${evidence.analysisResults?.confidence || 0}%
  Summary: ${evidence.analysisResults?.summary || 'No summary available'}

`;

    // Add detailed findings if available
    if (evidence.analysisResults?.findings && evidence.analysisResults.findings.length > 0) {
      content += `
OVERALL FINDINGS (${evidence.analysisResults.findings.length}):
${evidence.analysisResults.findings.map((finding, index) => 
  `  ${index + 1}. ${finding.description}
     Category: ${finding.category || 'General'}
     Severity: ${finding.severity}
     Confidence: ${finding.confidence || 0}%`
).join('\n')}

`;
    }

    // Add detailed agent reports
    if (evidence.analysis_results && evidence.analysis_results.length > 0) {
      content += `
═══════════════════════════════════════════════════════════════════
                            DETAILED AGENT REPORTS
═══════════════════════════════════════════════════════════════════

`;

      evidence.analysis_results.forEach((report, index) => {
        content += `
───────────────────────────────────────────────────────────────────
AGENT REPORT ${index + 1}: ${report.agent_name}
───────────────────────────────────────────────────────────────────

Analysis Type: ${report.analysis_type}
Analysis Date: ${formatDate(report.created_at)}
Execution Time: ${report.execution_time || 0} seconds

VERDICT & METRICS:
  Verdict: ${report.verdict?.toUpperCase() || 'UNKNOWN'}
  Severity: ${report.severity?.toUpperCase() || 'LOW'}
  Confidence: ${report.confidence || 0}%

SUMMARY:
${report.summary || 'No summary available'}

`;

        // Add agent-specific findings
        if (report.findings && report.findings.length > 0) {
          content += `DETAILED FINDINGS (${report.findings.length}):
${report.findings.map((finding, findingIndex) => 
  `  ${findingIndex + 1}. ${finding.description}
     Category: ${finding.category || 'General'}
     Severity: ${finding.severity}
     Confidence: ${finding.confidence || 0}%`
).join('\n')}

`;
        }

        // Add technical details
        if (report.technical_details && Object.keys(report.technical_details).length > 0) {
          content += `TECHNICAL DETAILS:
${formatTechnicalDetails(report.technical_details)}

`;
        }

        // Add recommendations
        if (report.recommendations && report.recommendations.length > 0) {
          content += `RECOMMENDATIONS (${report.recommendations.length}):
${formatRecommendations(report.recommendations)}

`;
        }
      });
    }

    content += `
═══════════════════════════════════════════════════════════════════

REPORT GENERATION:
  Generated by: Aegis Forensics Platform
  Generation Date: ${new Date().toLocaleString()}
  Report Format: Comprehensive Analysis Report
  Total Agent Reports: ${evidence.analysis_results?.length || 0}

═══════════════════════════════════════════════════════════════════
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-comprehensive-report-${evidence.filename.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to view evidence details
  const viewEvidenceDetails = (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setShowDetailModal(true);
  };

  // Refresh evidence results when a new file is uploaded
  useEffect(() => {
    if (selectedCaseId) {
      fetchEvidenceResults();
    }
  }, [selectedCaseId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const token = localStorage.getItem('aegis_token');
    if (!token) {
      alert('Please login to upload files');
      window.location.href = '/auth/login';
      return;
    }

    if (!selectedCaseId) {
      alert('Please select a case to associate this evidence with');
      return;
    }

    // Find the selected case for display
    const selectedCase = cases.find(c => c.id === selectedCaseId);
    const caseNumber = selectedCase ? selectedCase.caseNumber : 'Unknown';

    // Create a new evidence entry for immediate feedback
    const newEvidence: Evidence = {
      id: Date.now(),
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      sha256Hash: 'calculating...',
      analysisStatus: 'pending',
      uploadedAt: new Date().toISOString(),
      caseId: caseNumber
    };

    setEvidence(prev => [...prev, newEvidence]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('case_id', selectedCaseId.toString());
      formData.append('analysis_type', 'full'); // Default to full analysis

      const response = await fetch('http://localhost:8000/analyze/uploadfile/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        console.log('File uploaded and analyzed successfully:', result);
        
        // Refresh the evidence list to get the latest data
        await fetchEvidenceResults();
      } else if (response.status === 401) {
        localStorage.removeItem('aegis_token');
        window.location.href = '/auth/login';
      } else {
        const errorData = await response.json();
        setEvidence(prev => prev.map(e => 
          e.id === newEvidence.id 
            ? { ...e, analysisStatus: 'failed' }
            : e
        ));
        alert(`Upload failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setEvidence(prev => prev.map(e => 
        e.id === newEvidence.id 
          ? { ...e, analysisStatus: 'failed' }
          : e
      ));
      alert('Upload failed. Please check your connection and try again.');
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'clean':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspicious':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'malicious':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'unknown':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Evidence Analysis</h1>
          <p className="text-slate-600 mt-1">Upload and analyze forensic evidence using AI-powered tools</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Evidence</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload Area */}
            <div>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-slate-300 hover:border-slate-400'
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
                  <div className="text-4xl">📤</div>
                  <div>
                    <p className="text-lg font-medium text-slate-900">Drop files here or click to upload</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Supports memory dumps, disk images, network captures, executables, and documents
                    </p>
                  </div>
                  <button
                    onClick={onButtonClick}
                    disabled={!selectedCaseId}
                    className={`px-6 py-2 rounded-lg transition-colors ${
                      selectedCaseId 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Select Files
                  </button>
                  {!selectedCaseId && (
                    <p className="text-xs text-red-500 mt-2">Please select a case first</p>
                  )}
                </div>
              </div>
            </div>

            {/* Case Selection and Analysis Options */}
            <div className="space-y-6">
              {/* Case Selection */}
              <div>
                <h3 className="text-md font-medium text-slate-900 mb-3">Select Case</h3>
                {loadingCases ? (
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <p className="text-slate-600">Loading cases...</p>
                  </div>
                ) : cases.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedCaseId || ''}
                      onChange={(e) => setSelectedCaseId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a case...</option>
                      {cases.map((caseItem) => (
                        <option key={caseItem.id} value={caseItem.id}>
                          {caseItem.caseNumber} - {caseItem.name} ({caseItem.status})
                        </option>
                      ))}
                    </select>
                    {selectedCaseId && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        {(() => {
                          const selectedCase = cases.find(c => c.id === selectedCaseId);
                          return selectedCase ? (
                            <div className="text-sm">
                              <p className="font-medium text-blue-900">{selectedCase.name}</p>
                              <p className="text-blue-700">Investigator: {selectedCase.investigator}</p>
                              <p className="text-blue-700">Status: {selectedCase.status} | Priority: {selectedCase.priority}</p>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 border border-slate-200 rounded-lg bg-yellow-50">
                    <p className="text-yellow-800 text-sm">
                      No cases available. 
                      <a href="/cases" className="text-blue-600 hover:text-blue-800 underline ml-1">
                        Create a case first
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Analysis Options */}
              <div>
                <h3 className="text-md font-medium text-slate-900 mb-3">Analysis Type</h3>
                <div className="space-y-3">
                {[
                  { id: 'memory', label: 'Memory Analysis', description: 'Analyze memory dumps for processes, malware, and artifacts' },
                  { id: 'disk', label: 'Disk Forensics', description: 'File system analysis, deleted file recovery, timeline reconstruction' },
                  { id: 'network', label: 'Network Analysis', description: 'PCAP analysis, traffic patterns, IoC extraction' },
                  { id: 'binary', label: 'Binary Analysis', description: 'Malware analysis, reverse engineering, behavioral assessment' },
                  { id: 'comprehensive', label: 'Comprehensive', description: 'Automatic analysis type detection and multi-modal analysis' }
                ].map((type) => (
                  <label key={type.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="analysisType"
                      value={type.id}
                      checked={selectedAnalysisType === type.id}
                      onChange={(e) => setSelectedAnalysisType(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-slate-900">{type.label}</p>
                      <p className="text-sm text-slate-600">{type.description}</p>
                    </div>
                  </label>
                ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Analysis Results */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Evidence Analysis Results</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchEvidenceResults}
                disabled={loadingEvidence}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors border border-slate-200 rounded-md hover:bg-slate-50"
              >
                {loadingEvidence ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-slate-600"></div>
                ) : (
                  <span>🔄</span>
                )}
                Refresh
              </button>
              <span className="text-sm text-slate-500">
                {evidence.length} total • {evidence.filter(e => e.analysisStatus === 'completed').length} analyzed
              </span>
            </div>
          </div>
          <div className="p-6">
            {loadingEvidence && evidence.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading evidence results...</p>
              </div>
            ) : evidence.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Evidence Found</h3>
                <p className="text-slate-600 mb-4">Upload files above to start forensic analysis</p>
                <p className="text-sm text-slate-500">Results will appear here once files are uploaded and analyzed</p>
              </div>
            ) : (
              <div className="space-y-4">
              {evidence.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-slate-900">{item.filename}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.analysisStatus)}`}>
                          {item.analysisStatus}
                        </span>
                        {item.analysisResults && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getVerdictColor(item.analysisResults.verdict)}`}>
                            {item.analysisResults.verdict}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                        {item.fileSize && (
                          <span>📁 {formatFileSize(item.fileSize)}</span>
                        )}
                        <span>📅 {formatDate(item.uploadedAt)}</span>
                        <span>🔗 Case: {item.caseId}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono bg-slate-100 p-2 rounded">
                        SHA256: {item.sha256Hash}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => viewEvidenceDetails(item)}
                        className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => generatePDFReport(item)}
                        className="bg-green-50 text-green-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                      >
                        📄 Generate Report
                      </button>
                    </div>
                  </div>

                  {/* Analysis Summary - Always shown */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-2">Analysis Summary</h4>
                        <p className="text-sm text-slate-700 mb-3">{item.analysisResults?.summary || 'Analysis completed successfully'}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(item.analysisResults?.severity || 'low')}`}>
                            {(item.analysisResults?.severity || 'low')} severity
                          </span>
                          <span className="text-slate-600">
                            {item.analysisResults?.confidence || 0}% confidence
                          </span>
                          <span className="text-slate-600">
                            Report Count: {item.report_count || 0}
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
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Analyzed</p>
                <p className="text-2xl font-bold text-slate-900">
                  {evidence.filter(e => e.analysisStatus === 'completed').length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Threats Detected</p>
                <p className="text-2xl font-bold text-slate-900">
                  {evidence.filter(e => e.analysisResults?.verdict === 'malicious').length}
                </p>
              </div>
              <div className="text-3xl">🚨</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">In Queue</p>
                <p className="text-2xl font-bold text-slate-900">
                  {evidence.filter(e => e.analysisStatus === 'pending' || e.analysisStatus === 'processing').length}
                </p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Evidence View Modal */}
      {showDetailModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Evidence Analysis Details</h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Evidence Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Evidence Information</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-slate-600">Filename:</span>
                      <p className="text-slate-900">{selectedEvidence.filename}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">Case:</span>
                      <p className="text-slate-900">{selectedEvidence.caseId}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">File Size:</span>
                      <p className="text-slate-900">{selectedEvidence.fileSize ? formatFileSize(selectedEvidence.fileSize) : 'Unknown'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-slate-600">SHA256 Hash:</span>
                      <p className="text-slate-900 font-mono text-xs break-all">{selectedEvidence.sha256Hash}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">Upload Date:</span>
                      <p className="text-slate-900">{formatDate(selectedEvidence.uploadedAt)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">Analysis Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedEvidence.analysisStatus)}`}>
                        {selectedEvidence.analysisStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Results */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Analysis Results</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <span className="text-sm font-medium text-slate-600">Verdict</span>
                      <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getVerdictColor(selectedEvidence.analysisResults?.verdict || 'unknown')}`}>
                        {(selectedEvidence.analysisResults?.verdict || 'unknown').toUpperCase()}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium text-slate-600">Severity</span>
                      <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(selectedEvidence.analysisResults?.severity || 'low')}`}>
                        {(selectedEvidence.analysisResults?.severity || 'low').toUpperCase()}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium text-slate-600">Confidence</span>
                      <div className="mt-1 text-2xl font-bold text-slate-900">
                        {selectedEvidence.analysisResults?.confidence || 0}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-sm font-medium text-slate-600">Summary:</span>
                    <p className="text-slate-900 mt-1">{selectedEvidence.analysisResults?.summary || 'Analysis completed successfully'}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Findings */}
              {selectedEvidence.analysisResults?.findings && selectedEvidence.analysisResults.findings.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Detailed Findings</h3>
                  <div className="space-y-3">
                    {selectedEvidence.analysisResults.findings.map((finding, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-slate-900 mb-2">{finding.description}</p>
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(finding.severity)}`}>
                                {finding.severity} severity
                              </span>
                              {finding.confidence && (
                                <span className="text-sm text-slate-600">
                                  {finding.confidence}% confidence
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent Reports */}
              {selectedEvidence.analysis_results && selectedEvidence.analysis_results.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">
                    Agent Analysis Reports ({selectedEvidence.analysis_results.length})
                  </h3>
                  <div className="space-y-6">
                    {selectedEvidence.analysis_results.map((report, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                        {/* Report Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-semibold text-slate-900">{report.agent_name}</h4>
                            <span className="text-sm text-slate-500 bg-slate-200 px-2 py-1 rounded">
                              {report.analysis_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500">{formatDate(report.created_at)}</span>
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedReports);
                                if (newExpanded.has(index)) {
                                  newExpanded.delete(index);
                                } else {
                                  newExpanded.add(index);
                                }
                                setExpandedReports(newExpanded);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {expandedReports.has(index) ? 'Collapse' : 'Expand Details'}
                            </button>
                          </div>
                        </div>

                        {/* Report Metrics */}
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <span className="text-xs font-medium text-slate-600">Verdict</span>
                            {report.verdict && (
                              <div className={`mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getVerdictColor(report.verdict)}`}>
                                {report.verdict.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-medium text-slate-600">Severity</span>
                            {report.severity && (
                              <div className={`mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(report.severity)}`}>
                                {report.severity.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-medium text-slate-600">Confidence</span>
                            <div className="mt-1 text-lg font-bold text-slate-900">
                              {report.confidence || 0}%
                            </div>
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-medium text-slate-600">Execution Time</span>
                            <div className="mt-1 text-lg font-bold text-slate-900">
                              {report.execution_time || 0}s
                            </div>
                          </div>
                        </div>

                        {/* Report Summary */}
                        <div className="mb-4">
                          <h5 className="font-medium text-slate-900 mb-2">Summary</h5>
                          <div className="bg-white p-3 rounded border">
                            <p className="text-slate-700">{report.summary || 'No summary available'}</p>
                          </div>
                        </div>

                        {/* Always show findings count, expand for details */}
                        {report.findings && report.findings.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-slate-900 mb-2">
                              Findings ({report.findings.length}) 
                              {!expandedReports.has(index) && (
                                <span className="text-sm font-normal text-slate-500 ml-2">
                                  - Click &quot;Expand Details&quot; to view all findings
                                </span>
                              )}
                            </h5>
                            <div className="space-y-2">
                              {/* Show first 2 findings when collapsed, all when expanded */}
                              {(expandedReports.has(index) ? report.findings : report.findings.slice(0, 2)).map((finding, findingIndex) => (
                                <div key={findingIndex} className="bg-white p-3 rounded border flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-slate-700 text-sm">{finding.description}</p>
                                    {finding.category && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                        {finding.category}
                                      </span>
                                    )}
                                  </div>
                                  <div className="ml-3 flex flex-col items-end gap-1">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(finding.severity)}`}>
                                      {finding.severity}
                                    </span>
                                    {finding.confidence && (
                                      <span className="text-xs text-slate-600">
                                        {finding.confidence}% conf.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {!expandedReports.has(index) && report.findings.length > 2 && (
                                <div className="bg-slate-100 p-2 rounded text-center">
                                  <span className="text-slate-600 text-sm">
                                    +{report.findings.length - 2} more findings - Expand to view all
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Technical Details - Collapsible */}
                        {expandedReports.has(index) && report.technical_details && Object.keys(report.technical_details).length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-slate-900 mb-2">Technical Details</h5>
                            <div className="bg-white p-3 rounded border max-h-48 overflow-y-auto">
                              <div className="grid grid-cols-1 gap-2 text-sm">
                                {Object.entries(report.technical_details).map(([key, value]) => (
                                  <div key={key} className="flex flex-col border-b border-slate-100 pb-2">
                                    <span className="font-medium text-slate-600">{key}:</span>
                                    <span className="text-slate-900 font-mono text-xs bg-slate-50 p-1 rounded mt-1 break-all">
                                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Recommendations - Collapsible */}
                        {expandedReports.has(index) && report.recommendations && report.recommendations.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-slate-900 mb-2">
                              Recommendations ({report.recommendations.length})
                            </h5>
                            <div className="bg-white p-3 rounded border">
                              <ul className="space-y-1">
                                {report.recommendations.map((rec, recIndex) => (
                                  <li key={recIndex} className="text-sm text-slate-700 flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <span>{typeof rec === 'object' ? JSON.stringify(rec) : rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => generatePDFReport(selectedEvidence)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                  📄 Generate Full Report
                </button>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="bg-slate-600 text-white px-4 py-2 rounded-md font-medium hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
