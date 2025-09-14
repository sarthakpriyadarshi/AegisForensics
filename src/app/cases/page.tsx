'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { useState, useEffect } from 'react';

interface Case {
  id: number;
  caseNumber: string;
  name: string;
  description: string;
  investigator: string;
  status: 'open' | 'analyzing' | 'closed' | 'suspended';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
  tags: string[];
}

interface Evidence {
  id: number;
  filename: string;
  fileSize: number;
  mimeType: string;
  sha256Hash: string;
  uploadedAt: string;
  analysisStatus: string;
  verdict?: string;
  severity?: string;
}

interface CreateCaseData {
  name: string;
  description: string;
  investigator: string;
  status: string;
  priority: string;
  tags: string[];
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<CreateCaseData>({
    name: '',
    description: '',
    investigator: '',
    status: 'open',
    priority: 'medium',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [caseEvidence, setCaseEvidence] = useState<Evidence[]>([]);

  // Function to view case details and fetch evidence
  const viewCaseDetails = async (caseItem: Case) => {
    try {
      setSelectedCase(caseItem);
      setShowCaseDetails(true);
      
      // Fetch evidence for this case
      const token = localStorage.getItem('aegis_token');
      const response = await fetch(`http://localhost:8000/api/evidence-results?case_id=${caseItem.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          const mappedEvidence = data.evidence_results.map((item: {
            id: number;
            filename: string;
            file_size: number;
            file_type?: string;
            file_hash: string;
            collected_at: string;
            case_number: string;
            latest_verdict?: string;
            latest_severity?: string;
            analysis_results: Array<{
              agent_name: string;
              verdict?: string;
              severity?: string;
            }>;
          }) => ({
            id: item.id,
            filename: item.filename,
            fileSize: item.file_size,
            mimeType: item.file_type || 'unknown',
            sha256Hash: item.file_hash,
            uploadedAt: item.collected_at,
            analysisStatus: 'completed',
            verdict: item.latest_verdict,
            severity: item.latest_severity
          }));
          setCaseEvidence(mappedEvidence);
        }
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('aegis_token');
      const response = await fetch('http://localhost:8000/api/cases', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cases: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        setCases(data.cases || []);
      } else {
        throw new Error('Failed to load cases');
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const createCase = async () => {
    try {
      const token = localStorage.getItem('aegis_token');
      const response = await fetch('http://localhost:8000/api/cases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create case: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        await fetchCases();
        setShowCreateForm(false);
        setCreateData({
          name: '',
          description: '',
          investigator: '',
          status: 'open',
          priority: 'medium',
          tags: []
        });
        setTagInput('');
      } else {
        throw new Error('Failed to create case');
      }
    } catch (err) {
      console.error('Error creating case:', err);
      setError(err instanceof Error ? err.message : 'Failed to create case');
    }
  };

  const deleteCase = async (caseId: number) => {
    if (!confirm('Are you sure you want to delete this case?')) {
      return;
    }

    try {
      const token = localStorage.getItem('aegis_token');
      const response = await fetch(`http://localhost:8000/api/cases/${caseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete case: ${response.status}`);
      }

      await fetchCases();
    } catch (err) {
      console.error('Error deleting case:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete case');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !createData.tags.includes(tagInput.trim())) {
      setCreateData({
        ...createData,
        tags: [...createData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCreateData({
      ...createData,
      tags: createData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-100';
      case 'analyzing': return 'text-blue-600 bg-blue-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
              <p className="mt-2 text-gray-600">Manage your forensic investigation cases</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Create New Case
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create New Case</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Case Name</label>
                    <input
                      type="text"
                      value={createData.name}
                      onChange={(e) => setCreateData({...createData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter case name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={createData.description}
                      onChange={(e) => setCreateData({...createData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter case description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Investigator</label>
                    <input
                      type="text"
                      value={createData.investigator}
                      onChange={(e) => setCreateData({...createData, investigator: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter investigator name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={createData.status}
                        onChange={(e) => setCreateData({...createData, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="open">Open</option>
                        <option value="analyzing">Analyzing</option>
                        <option value="closed">Closed</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={createData.priority}
                        onChange={(e) => setCreateData({...createData, priority: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add tag"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {createData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createCase}
                    disabled={!createData.name || !createData.investigator}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Create Case
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading cases...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {cases.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <p className="text-gray-500 text-lg">No cases found</p>
                  <p className="text-gray-400 mt-2">Create your first case to get started</p>
                </div>
              ) : (
                cases.map((caseItem) => (
                  <div key={caseItem.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{caseItem.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Case #{caseItem.caseNumber}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
                          {caseItem.priority}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{caseItem.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                      <div>
                        <span className="font-medium">Investigator:</span> {caseItem.investigator}
                      </div>
                      <div>
                        <span className="font-medium">Evidence:</span> {caseItem.evidenceCount} items
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(caseItem.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span> {new Date(caseItem.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {caseItem.tags && caseItem.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {caseItem.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => viewCaseDetails(caseItem)}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => deleteCase(caseItem.id)}
                        className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Case Details Modal */}
        {showCaseDetails && selectedCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  Case Details - {selectedCase.caseNumber}
                </h2>
                <button 
                  onClick={() => setShowCaseDetails(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6">
                {/* Case Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Case Information</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-slate-600">Case Name:</span>
                        <p className="text-slate-900">{selectedCase.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Investigator:</span>
                        <p className="text-slate-900">{selectedCase.investigator}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedCase.status === 'open' ? 'bg-green-100 text-green-800' :
                          selectedCase.status === 'analyzing' ? 'bg-blue-100 text-blue-800' :
                          selectedCase.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedCase.status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Priority:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedCase.priority === 'low' ? 'bg-green-100 text-green-800' :
                          selectedCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          selectedCase.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedCase.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm font-medium text-slate-600">Description:</span>
                        <p className="text-slate-900">{selectedCase.description}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Created:</span>
                        <p className="text-slate-900">{new Date(selectedCase.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Evidence Count:</span>
                        <p className="text-slate-900">{caseEvidence.length}</p>
                      </div>
                    </div>
                    {selectedCase.tags && selectedCase.tags.length > 0 && (
                      <div className="mt-4">
                        <span className="text-sm font-medium text-slate-600">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedCase.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence List */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Evidence ({caseEvidence.length})</h3>
                  {caseEvidence.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">📂</div>
                      <p className="text-slate-600">No evidence found for this case</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {caseEvidence.map((evidence) => (
                        <div key={evidence.id} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-slate-900">{evidence.filename}</h4>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                  {evidence.analysisStatus}
                                </span>
                                {evidence.verdict && (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                    evidence.verdict === 'clean' ? 'bg-green-100 text-green-800 border-green-300' :
                                    evidence.verdict === 'suspicious' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                    evidence.verdict === 'malicious' ? 'bg-red-100 text-red-800 border-red-300' :
                                    'bg-gray-100 text-gray-800 border-gray-300'
                                  }`}>
                                    {evidence.verdict}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                {evidence.fileSize && (
                                  <span>📁 {(evidence.fileSize / 1024).toFixed(1)} KB</span>
                                )}
                                {evidence.mimeType && evidence.mimeType !== 'unknown' && (
                                  <span>🏷️ {evidence.mimeType}</span>
                                )}
                                <span>📅 {new Date(evidence.uploadedAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-slate-500 font-mono bg-white p-2 rounded mt-2">
                                SHA256: {evidence.sha256Hash}
                              </p>
                            </div>
                            <div className="ml-4">
                              <button 
                                onClick={() => {
                                  setShowCaseDetails(false);
                                  // Navigate to analysis page with this evidence selected
                                  window.location.href = '/analysis';
                                }}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
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
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowCaseDetails(false)}
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
    </AuthGuard>
  );
}