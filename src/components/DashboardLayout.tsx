"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, FolderOpen, Search, Bot, Radio, FileText, Monitor, User, Menu, Settings, LogOut } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface UserProfile {
  full_name: string
  email: string
  avatar_base64?: string
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Cases", href: "/cases", icon: FolderOpen },
  { name: "Evidence Analysis", href: "/analysis", icon: Search },
  { name: "Agent Status", href: "/agents", icon: Bot },
  { name: "Live Response", href: "/live", icon: Radio },
  { name: "Script Generator", href: "/scripts", icon: FileText },
  { name: "System Monitor", href: "/system", icon: Monitor },
]

export default function DashboardLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [systemHealth, setSystemHealth] = useState<{ status: string; message: string }>({
    status: "online",
    message: "System Online"
  })
  const pathname = usePathname()

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem("aegis_token")
        if (!token) {
          window.location.href = "/auth/login"
          return
        }

        const response = await fetch("http://localhost:8000/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setUserProfile(userData)
        } else if (response.status === 401) {
          localStorage.removeItem("aegis_token")
          window.location.href = "/auth/login"
        } else {
          console.error("Failed to load user profile")
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
      } finally {
        setIsLoadingUser(false)
      }
    }

    loadUserProfile()
  }, [])

  // Check system health
  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const token = localStorage.getItem("aegis_token")
        if (!token) return

        const response = await fetch("http://localhost:8000/health", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSystemHealth({
            status: data.status === "ok" ? "online" : "offline",
            message: data.status === "ok" ? "System Online" : "System Offline"
          })
        } else {
          setSystemHealth({
            status: "offline",
            message: "System Offline"
          })
        }
      } catch {
        setSystemHealth({
          status: "offline",
          message: "System Offline"
        })
      }
    }

    checkSystemHealth()
    // Check health every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  // Update page title based on current route
  useEffect(() => {
    const pageName = navigation.find((item) => item.href === pathname)?.name || "Dashboard"
    document.title = `${pageName} - Aegis Forensics`
  }, [pathname])

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("aegis_token")
    window.location.href = "/auth/login"
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-purple-950" style={{ backgroundColor: "#020617" }}>
      <div className="fixed inset-0 animate-dynamic-gradient opacity-90"></div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-floating-orbs"></div>
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-floating-orbs"
          style={{ animationDelay: "4s" }}
        ></div>
        <div
          className="absolute -bottom-40 right-1/3 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-floating-orbs"
          style={{ animationDelay: "8s" }}
        ></div>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
        fixed inset-y-0 z-50 flex w-72 flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-purple-950/95 backdrop-blur-xl border-r border-purple-500/30 px-6 pb-4" style={{ backgroundColor: "rgba(59, 7, 100, 0.95)" }}>
          <div className="flex h-20 shrink-0 items-center">
            <div className="w-14 h-14 bg-transparent rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow mr-4">
              <Image src="/aegis-logo.svg" alt="Aegis Logo" width={40} height={40} className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">Aegis Forensics</span>
              <p className="text-purple-300 text-sm">Agentic-AI Investigation</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    const IconComponent = item.icon
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-4 rounded-2xl p-4 text-sm leading-6 font-semibold transition-all duration-300
                            ${
                              isActive
                                ? "bg-gradient-to-r from-purple-800/50 to-purple-700/30 text-white border border-purple-400/50 shadow-lg animate-pulse-glow"
                                : "text-slate-300 hover:text-white hover:bg-purple-800/20 hover:border-purple-400/30 border border-transparent"
                            }
                          `}
                        >
                          <IconComponent className="w-5 h-5" />
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
                              {item.badge}
                            </span>
                          )}
                          {isActive && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>

              <li className="mt-auto">
                <Link
                  href="/profile"
                  className="flex items-center gap-x-4 px-4 py-4 text-sm font-semibold leading-6 text-slate-300 hover:bg-purple-800/20 rounded-2xl transition-all duration-300 border border-transparent hover:border-purple-400/30 group"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center animate-pulse-glow overflow-hidden">
                    {userProfile?.avatar_base64 ? (
                      <Image 
                        src={`data:image/jpeg;base64,${userProfile.avatar_base64}`}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {isLoadingUser ? "Loading..." : userProfile?.full_name || "Admin User"}
                    </p>
                    <p className="text-xs text-purple-300">
                      {isLoadingUser ? "Loading..." : userProfile?.email || "admin@company.com"}
                    </p>
                  </div>
                  <Settings className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 relative z-10">
        <div className="fixed top-0 left-0 right-0 lg:left-72 z-30 flex h-20 shrink-0 items-center gap-x-4 bg-purple-950/95 backdrop-blur-xl border-b border-purple-500/30 px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8" style={{ backgroundColor: "rgba(59, 7, 100, 0.95)" }}>
          <button
            type="button"
            className="-m-2.5 p-2.5 text-purple-200 hover:text-white lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-purple-500/30 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-2xl font-bold text-white">
                {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-3 bg-purple-900/50 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-500/20">
                <div 
                  className={`h-2 w-2 rounded-full animate-pulse ${
                    systemHealth.status === "online" ? "bg-green-400" : "bg-red-400"
                  }`}
                ></div>
                <span className="text-sm text-purple-200 font-medium">{systemHealth.message}</span>
              </div>

              <div className="relative">
                <button
                  onClick={handleLogout}
                  className="flex items-center p-1.5 hover:bg-red-800/20 rounded-full transition-colors group"
                  title="Logout"
                >
                  <span className="sr-only">Logout</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center group-hover:from-red-500 group-hover:to-red-700 transition-all">
                    <LogOut className="w-4 h-4 text-white" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="pt-20 py-8 min-h-screen bg-purple-800 mt-4">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
