"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AuthState {
  isAuthenticated: boolean
  needsAdminSetup: boolean
  isLoading: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function useAuthCheck() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    needsAdminSetup: false,
    isLoading: true,
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        // First check if admin setup is needed
        const rootResponse = await fetch(`${API_BASE_URL}/`, {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        })

        clearTimeout(timeoutId)

        if (rootResponse.ok) {
          const rootData = await rootResponse.json()

          if (rootData.admin_setup_required) {
            setAuthState({
              isAuthenticated: false,
              needsAdminSetup: true,
              isLoading: false,
            })
            return
          }
        }

        // Check if user is authenticated
        const token = localStorage.getItem("aegis_token")
        if (!token) {
          setAuthState({
            isAuthenticated: false,
            needsAdminSetup: false,
            isLoading: false,
          })
          return
        }

        const verifyController = new AbortController()
        const verifyTimeoutId = setTimeout(() => verifyController.abort(), 5000)

        const verifyResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          signal: verifyController.signal,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        clearTimeout(verifyTimeoutId)

        if (verifyResponse.ok) {
          setAuthState({
            isAuthenticated: true,
            needsAdminSetup: false,
            isLoading: false,
          })
        } else {
          // Token is invalid, remove it
          localStorage.removeItem("aegis_token")
          setAuthState({
            isAuthenticated: false,
            needsAdminSetup: false,
            isLoading: false,
          })
        }
      } catch (error) {
        console.error("Auth check error:", error)

        // Handle different types of errors
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            console.warn("Auth check timed out - API server may be unavailable")
          } else if (error.message.includes("fetch")) {
            console.warn("Network error during auth check - API server may be down")
          }
        }

        // For development, assume no auth required if API is unavailable
        // In production, you might want to show an error page instead
        setAuthState({
          isAuthenticated: false,
          needsAdminSetup: false,
          isLoading: false,
        })
      }
    }

    checkAuthStatus()
  }, [])

  const redirectToAuth = () => {
    if (authState.needsAdminSetup) {
      router.push("/auth/setup")
    } else {
      router.push("/auth/login")
    }
  }

  const redirectToDashboard = () => {
    router.push("/dashboard")
  }

  return {
    ...authState,
    redirectToAuth,
    redirectToDashboard,
  }
}

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, needsAdminSetup, isLoading, redirectToAuth } = useAuthCheck()

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      redirectToAuth()
    }
  }, [isLoading, requireAuth, isAuthenticated, redirectToAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 animate-dynamic-gradient opacity-90"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-500/20 to-green-400/10 rounded-full blur-3xl animate-floating-orbs"></div>
          <div
            className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-green-600/15 to-teal-400/20 rounded-full blur-3xl animate-floating-orbs"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center glass-strong rounded-3xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
            <p className="text-green-100 font-medium">Initializing Aegis Forensics...</p>
            <p className="text-teal-300 text-sm mt-2">Connecting to secure systems</p>
          </div>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}

// Hook for checking if redirect is needed on landing page
export function useAuthRedirect() {
  const { isAuthenticated, needsAdminSetup, isLoading, redirectToAuth, redirectToDashboard } = useAuthCheck()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // User is authenticated, redirect to dashboard
        redirectToDashboard()
      } else if (needsAdminSetup) {
        // Need admin setup, redirect to setup page
        redirectToAuth()
      }
      // If not authenticated and no setup needed, stay on landing page
    }
  }, [isLoading, isAuthenticated, needsAdminSetup, redirectToAuth, redirectToDashboard])

  return { isLoading, needsAdminSetup, isAuthenticated }
}
