"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface SystemStats {
  totalCases: number
  activeCases: number
  evidenceFiles: number
  analysisReports: number
}

interface RecentActivity {
  id: number
  type: string
  description: string
  timestamp: string
  status: string
}

export default function HomePage() {
  const [stats, setStats] = useState<SystemStats>({
    totalCases: 0,
    activeCases: 0,
    evidenceFiles: 0,
    analysisReports: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch system statistics
      const statsResponse = await fetch("http://localhost:8000/api/dashboard/stats", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      } else {
        // Fallback to mock data if API is not available
        setStats({
          totalCases: 12,
          activeCases: 5,
          evidenceFiles: 47,
          analysisReports: 89
        })
      }

      // Fetch recent activity
      const activityResponse = await fetch("http://localhost:8000/api/dashboard/activity", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      })
      
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activities || [])
      } else {
        // Fallback to mock data
        setRecentActivity([
          {
            id: 1,
            type: "evidence_upload",
            description: "New PCAP file uploaded for analysis",
            timestamp: new Date().toISOString(),
            status: "completed"
          },
          {
            id: 2,
            type: "case_created",
            description: "Case CASE-2024-001 created",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: "active"
          },
          {
            id: 3,
            type: "analysis_complete",
            description: "Binary analysis completed for malware.exe",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            status: "completed"
          }
        ])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      // Use mock data on error
      setStats({
        totalCases: 12,
        activeCases: 5,
        evidenceFiles: 47,
        analysisReports: 89
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `${diffMins} minutes ago`
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`
    } else {
      return `${diffDays} days ago`
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "evidence_upload":
        return "📁"
      case "case_created":
        return "🔍"
      case "analysis_complete":
        return "✅"
      default:
        return "📊"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400"
      case "active":
        return "text-blue-400"
      case "pending":
        return "text-yellow-400"
      case "error":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-purple-500/30 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Aegis Forensics</h1>
                <p className="text-sm text-purple-300">Digital Investigation Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="flex space-x-6">
                <Link href="/analysis" className="text-purple-300 hover:text-white transition-colors">
                  Analysis
                </Link>
                <Link href="/scripts" className="text-purple-300 hover:text-white transition-colors">
                  Scripts
                </Link>
                <Link href="/cases" className="text-purple-300 hover:text-white transition-colors">
                  Cases
                </Link>
                <Link href="/auth/setup" className="text-purple-300 hover:text-white transition-colors">
                  Setup
                </Link>
              </nav>
              <Link 
                href="/auth/login" 
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:transform hover:scale-105"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome to Aegis Forensics
          </h2>
          <p className="text-xl text-purple-300 max-w-3xl mx-auto">
            Advanced AI-powered digital forensics platform for comprehensive evidence analysis,
            automated investigations, and intelligent threat detection.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/analysis" className="group">
              <div className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Upload Evidence</h4>
                <p className="text-purple-300">Upload files for forensic analysis using AI-powered agents</p>
              </div>
            </Link>

            <Link href="/scripts" className="group">
              <div className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Generate Scripts</h4>
                <p className="text-purple-300">Create custom forensic collection scripts for different platforms</p>
              </div>
            </Link>

            <div className="group cursor-pointer" onClick={() => fetchDashboardData()}>
              <div className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Refresh Data</h4>
                <p className="text-purple-300">Update dashboard statistics and recent activity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6">System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-900/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total Cases</p>
                  <p className="text-3xl font-bold text-white">{isLoading ? "..." : stats.totalCases}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-900/40 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Active Cases</p>
                  <p className="text-3xl font-bold text-white">{isLoading ? "..." : stats.activeCases}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Evidence Files</p>
                  <p className="text-3xl font-bold text-white">{isLoading ? "..." : stats.evidenceFiles}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-orange-900/40 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Analysis Reports</p>
                  <p className="text-3xl font-bold text-white">{isLoading ? "..." : stats.analysisReports}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6">Recent Activity</h3>
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-500/30">
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-purple-300 mt-2">Loading activity...</p>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.description}</p>
                        <p className="text-gray-400 text-sm">{formatTimestamp(activity.timestamp)}</p>
                      </div>
                      <div className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No recent activity found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-500/30">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">AI-Powered Analysis</h4>
              <p className="text-gray-300">Leverage advanced AI agents for automated forensic analysis and threat detection.</p>
            </div>

            <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-500/30">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Secure Evidence Handling</h4>
              <p className="text-gray-300">Chain of custody preservation with cryptographic integrity verification.</p>
            </div>

            <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-500/30">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Real-time Processing</h4>
              <p className="text-gray-300">Fast analysis and immediate results for time-critical investigations.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-purple-500/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-purple-300">© 2024 Aegis Forensics. Advanced Digital Investigation Platform.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
