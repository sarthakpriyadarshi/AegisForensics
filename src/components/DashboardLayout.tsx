"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FolderOpen, Search, Bot, Radio, FileText, Monitor, User, Menu, Bell, Settings } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
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
  const pathname = usePathname()

  return (
    <div className="min-h-screen relative overflow-hidden bg-teal-900">
      <div className="fixed inset-0 animate-dynamic-gradient opacity-90"></div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-500/20 to-green-400/10 rounded-full blur-3xl animate-floating-orbs"></div>
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-green-600/15 to-teal-400/20 rounded-full blur-3xl animate-floating-orbs"
          style={{ animationDelay: "4s" }}
        ></div>
        <div
          className="absolute -bottom-40 right-1/3 w-72 h-72 bg-gradient-to-br from-green-300/10 to-teal-600/15 rounded-full blur-3xl animate-floating-orbs"
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
        <div className="flex grow flex-col gap-y-5 overflow-y-auto glass-strong border-r border-teal-500/30 px-6 pb-4">
          <div className="flex h-20 shrink-0 items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-green-400 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow mr-4">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <span className="text-xl font-bold text-green-100">Aegis Forensics</span>
              <p className="text-teal-300 text-sm">Agentic-AI Investigation</p>
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
                                ? "bg-gradient-to-r from-teal-600/30 to-green-500/20 text-green-100 border border-teal-400/40 shadow-lg animate-pulse-glow"
                                : "text-green-200 hover:text-green-100 hover:bg-teal-600/20 hover:border-teal-400/30 border border-transparent"
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
                          {isActive && <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>

              <li className="mt-auto">
                <Link
                  href="/profile"
                  className="flex items-center gap-x-4 px-4 py-4 text-sm font-semibold leading-6 text-green-200 hover:bg-teal-600/20 rounded-2xl transition-all duration-300 border border-transparent hover:border-teal-400/30 group"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-green-400 flex items-center justify-center animate-pulse-glow">
                    <User className="w-5 h-5 text-green-900" />
                  </div>
                  <div className="flex-1">
                    <p className="text-green-100 font-medium">Admin User</p>
                    <p className="text-xs text-teal-300">admin@company.com</p>
                  </div>
                  <Settings className="w-5 h-5 text-teal-400 group-hover:text-green-300 transition-colors" />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 relative z-10">
        <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 glass-strong border-b border-teal-500/30 px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-green-200 hover:text-green-100 lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-teal-500/30 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-2xl font-bold text-green-100">
                {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-3 glass-subtle rounded-full px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm text-green-200 font-medium">System Online</span>
              </div>

              <button
                type="button"
                className="relative -m-2.5 p-2.5 text-teal-400 hover:text-green-300 transition-colors"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </button>

              <div className="relative">
                <Link
                  href="/profile"
                  className="flex items-center p-1.5 hover:bg-teal-600/20 rounded-full transition-colors"
                >
                  <span className="sr-only text-white">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-green-400 flex items-center justify-center animate-pulse-glow">
                    <User className="w-4 h-4 text-green-900" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8 min-h-screen bg-teal-800">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
