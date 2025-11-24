"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  FolderOpen,
  Search,
  Bot,
  Radio,
  FileText,
  Monitor,
  User,
  Menu,
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react"
import { DynamicBackground } from "@/components/DynamicBackground"
import { motion, AnimatePresence } from "framer-motion"

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
    message: "System Online",
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
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSystemHealth({
            status: data.status === "ok" ? "online" : "offline",
            message: data.status === "ok" ? "System Online" : "System Offline",
          })
        } else {
          setSystemHealth({
            status: "offline",
            message: "System Offline",
          })
        }
      } catch {
        setSystemHealth({
          status: "offline",
          message: "System Offline",
        })
      }
    }

    checkSystemHealth()
    const interval = setInterval(checkSystemHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  // Update page title based on current route
  useEffect(() => {
    const pageName = navigation.find((item) => item.href === pathname)?.name || "Dashboard"
    document.title = `${pageName} - Aegis Forensics`
  }, [pathname])

  const handleLogout = () => {
    window.location.href = "/auth/logout"
    localStorage.removeItem("aegis_token")
  }

  const SidebarContent = ({ className }: { className?: string }) => (
    <div className={`flex h-full flex-col bg-black/30 backdrop-blur-xl border-none ${className}`}>
      {/* Logo Section */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#3533cd]/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Image src="/favicon.svg" alt="Aegis Logo" width={24} height={24} className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">Aegis Forensics</span>
            <p className="text-xs text-gray-400">AI Investigation</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const IconComponent = item.icon
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-[#3533cd]/80 text-white shadow-lg shadow-[#3533cd]/20 backdrop-blur-sm"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <IconComponent className="w-5 h-5 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator className="bg-white/5" />

      {/* User Profile Section */}
      <div className="p-4">
        <Link
          href="/profile"
          className="flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors group"
          onClick={() => setSidebarOpen(false)}
        >
          <Avatar className="h-8 w-8 ring-2 ring-white/10">
            <AvatarImage
              src={userProfile?.avatar_base64 ? `data:image/jpeg;base64,${userProfile.avatar_base64}` : undefined}
              alt="Profile"
            />
            <AvatarFallback className="bg-[#3533cd]/20 text-[#3533cd]">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {isLoadingUser ? "Loading..." : userProfile?.full_name || "Admin User"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {isLoadingUser ? "Loading..." : userProfile?.email || "admin@company.com"}
            </p>
          </div>
          <Settings className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen relative bg-transparent">
      <DynamicBackground />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col p-4">
        <SidebarContent className="rounded-2xl border border-white/5 shadow-2xl shadow-black/20" />
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-4 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-black/30 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8 mx-4 rounded-2xl border border-white/5 shadow-lg shadow-black/10">
          {/* Mobile menu button */}
          <button
            type="button"
            className={`lg:hidden p-1 hover:bg-transparent transition-colors focus:outline-none ${sidebarOpen ? "text-[#3533cd]" : "text-white"}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Toggle sidebar</span>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-semibold text-white">
                {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* System Health Badge */}
              <Badge
                variant={systemHealth.status === "online" ? "default" : "destructive"}
                className={`flex items-center gap-1 ${
                  systemHealth.status === "online"
                    ? "bg-[#3533cd] hover:bg-[#3533cd]/90 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {systemHealth.status === "online" ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {systemHealth.message}
              </Badge>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden lg:hidden"
              >
                <div className="p-4 flex flex-col space-y-4">
                  {/* Navigation */}
                  <nav className="flex flex-col space-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href
                      const IconComponent = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`
                            flex items-center gap-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200
                            ${
                              isActive
                                ? "bg-[#3533cd]/80 text-white shadow-lg shadow-[#3533cd]/20"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                            }
                          `}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <IconComponent className="w-5 h-5 shrink-0" />
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      )
                    })}
                  </nav>

                  <Separator className="bg-white/5" />

                  {/* User Profile Section */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-x-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors group"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-white/10">
                      <AvatarImage
                        src={userProfile?.avatar_base64 ? `data:image/jpeg;base64,${userProfile.avatar_base64}` : undefined}
                        alt="Profile"
                      />
                      <AvatarFallback className="bg-[#3533cd]/20 text-[#3533cd]">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {isLoadingUser ? "Loading..." : userProfile?.full_name || "Admin User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {isLoadingUser ? "Loading..." : userProfile?.email || "admin@company.com"}
                      </p>
                    </div>
                    <Settings className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Page Content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
