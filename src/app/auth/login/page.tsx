"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Bot,
  Shield,
  BarChart3,
} from "lucide-react"

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking")

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch("http://localhost:8000/health", {
          method: "GET",
        })
        if (response.ok) {
          setApiStatus("online")
        } else {
          setApiStatus("offline")
        }
      } catch (error) {
        console.error("API status check failed:", error)
        setApiStatus("offline")
      }
    }

    checkApiStatus()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Store JWT token
        localStorage.setItem("aegis_token", data.access_token)
        localStorage.setItem("aegis_token_expires", (Date.now() + data.expires_in * 1000).toString())

        // Redirect to dashboard
        window.location.href = "/dashboard"
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Invalid email or password")
      }
    } catch (error) {
      console.error("Authentication error:", error)
      setError("Authentication failed. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getApiStatusBadge = () => {
    switch (apiStatus) {
      case "online":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        )
      case "offline":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1 animate-pulse" />
            Checking...
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center p-2">
                <Image src="/favicon.svg" alt="Aegis Forensics Logo" width={32} height={32} className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Aegis Forensics</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Investigation</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">Welcome back</h2>
              <p className="text-lg text-muted-foreground">Access your digital forensics platform</p>
            </div>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Sign In</CardTitle>
                {getApiStatusBadge()}
              </div>
              {apiStatus === "offline" && (
                <CardDescription className="text-destructive">Backend service is currently unavailable</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="bg-background border-border pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                    Remember me
                  </Label>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90" size="lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button variant="ghost" asChild>
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Right side - Enhanced Branding */}
      <div className="hidden lg:block relative w-0 flex-1 bg-muted/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background/50">
          <div className="relative z-10 flex flex-col justify-center h-full px-16">
            <div className="max-w-lg">
              <Badge variant="outline" className="mb-8 border-primary/20 text-primary">
                <CheckCircle className="w-3 h-3 mr-1" />
                Secure Access Portal
              </Badge>

              <h2 className="text-4xl font-bold mb-6 text-balance text-foreground">
                Digital Forensics
                <span className="block text-primary">Platform</span>
              </h2>

              <p className="text-lg text-muted-foreground mb-12 leading-relaxed text-pretty">
                Advanced AI-powered tools for comprehensive digital investigations and evidence analysis with
                intelligent automation.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Search,
                    title: "Deep Evidence Analysis",
                    desc: "Comprehensive forensic examination",
                  },
                  {
                    icon: Bot,
                    title: "AI-Powered Insights",
                    desc: "Intelligent pattern recognition",
                  },
                  {
                    icon: Shield,
                    title: "Secure Chain of Custody",
                    desc: "Tamper-proof evidence handling",
                  },
                  {
                    icon: BarChart3,
                    title: "Real-time Monitoring",
                    desc: "Live investigation tracking",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-4 group">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
