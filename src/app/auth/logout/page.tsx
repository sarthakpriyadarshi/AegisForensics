"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Loader2, LogOut } from "lucide-react"

const LogoutPage: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(true)
  const [loggedOut, setLoggedOut] = useState(false)

  useEffect(() => {
    const performLogout = async () => {
      try {
        const token = localStorage.getItem("aegis_token")

        // Call logout API if token exists
        if (token) {
          try {
            await fetch("http://localhost:8000/auth/logout", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })
          } catch (error) {
            console.error("Logout API call failed:", error)
            // Continue with local logout even if API fails
          }
        }

        // Clear local storage
        localStorage.removeItem("aegis_token")
        localStorage.removeItem("aegis_token_expires")

        // Clear any other auth-related data
        sessionStorage.clear()

        // Wait a moment for visual feedback
        setTimeout(() => {
          setIsLoggingOut(false)
          setLoggedOut(true)
        }, 1500)
      } catch (error) {
        console.error("Logout error:", error)
        // Still proceed with logout
        setIsLoggingOut(false)
        setLoggedOut(true)
      }
    }

    performLogout()
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center p-3">
              <Image src="/favicon.svg" alt="Aegis Forensics Logo" width={40} height={40} className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">
            {isLoggingOut ? "Signing Out" : "Signed Out"}
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            {isLoggingOut
              ? "Securely ending your session..."
              : "You have been successfully signed out of Aegis Forensics"}
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {isLoggingOut ? (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              )}
            </div>
            <CardTitle className="text-xl">{isLoggingOut ? "Logging Out..." : "Logout Complete"}</CardTitle>
            <CardDescription>
              {isLoggingOut
                ? "Please wait while we securely end your session"
                : "Your session has been terminated and all data cleared"}
            </CardDescription>
          </CardHeader>

          {loggedOut && (
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <Badge variant="outline" className="border-green-500/20 text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Session Terminated
                </Badge>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>✓ Authentication token cleared</p>
                  <p>✓ Session data removed</p>
                  <p>✓ Secure logout completed</p>
                </div>
              </div>

              <div className="flex flex-col space-y-3 pt-4">
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/auth/login">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign In Again
                  </Link>
                </Button>

                <Button variant="ghost" asChild className="w-full">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {loggedOut && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Thank you for using Aegis Forensics. Stay secure!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LogoutPage
