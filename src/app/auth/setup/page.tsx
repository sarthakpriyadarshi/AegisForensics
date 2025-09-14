"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight, ArrowLeft, Loader2, XCircle, User, Upload, CheckCircle } from "lucide-react"

interface SetupFormData {
  full_name: string
  email: string
  organization: string
  timezone: string
  password: string
  confirmPassword: string
  avatar_base64?: string
}

export default function AdminSetupPage() {
  const [formData, setFormData] = useState<SetupFormData>({
    full_name: "",
    email: "",
    organization: "",
    timezone: "UTC",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [avatar, setAvatar] = useState<string>("")

  const timezones = ["UTC", "EST", "CST", "MST", "PST", "GMT", "CET", "JST", "AEST", "IST"]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTimezoneChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      timezone: value,
    }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) {
        // 1MB limit
        setError("Avatar image must be less than 1MB")
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        setAvatar(base64)
        setFormData((prev) => ({
          ...prev,
          avatar_base64: base64,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = (): boolean => {
    if (!formData.full_name.trim()) {
      setError("Full name is required")
      return false
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Valid email is required")
      return false
    }
    if (!formData.organization.trim()) {
      setError("Organization is required")
      return false
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const setupData = {
        full_name: formData.full_name,
        email: formData.email,
        organization: formData.organization,
        timezone: formData.timezone,
        password: formData.password,
        ...(formData.avatar_base64 && { avatar_base64: formData.avatar_base64 }),
      }

      const response = await fetch("http://localhost:8000/auth/setup-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(setupData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Admin setup successful:", result)

        // Automatically login after setup
        const loginResponse = await fetch("http://localhost:8000/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        })

        if (loginResponse.ok) {
          const loginResult = await loginResponse.json()
          localStorage.setItem("aegis_token", loginResult.access_token)
          window.location.href = "/dashboard"
        } else {
          window.location.href = "/auth/login"
        }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to setup admin user")
      }
    } catch (error) {
      console.error("Setup error:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center p-3">
              <Image src="/favicon.svg" alt="Aegis Forensics Logo" width={40} height={40} className="w-10 h-10" />
            </div>
          </div>
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Initial Setup Required
          </Badge>
          <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">Setup Admin Account</h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Create the first admin user for Aegis Forensics platform
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl">Administrator Setup</CardTitle>
            <CardDescription>Configure your admin account to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatar || "/placeholder.svg"} alt="Avatar" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload Avatar (Optional)</span>
                  </div>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </Label>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="admin@company.com"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    name="organization"
                    type="text"
                    required
                    value={formData.organization}
                    onChange={handleInputChange}
                    placeholder="Your organization name"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={formData.timezone} onValueChange={handleTimezoneChange}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 8 characters"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Create Admin Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center space-y-3 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Only one admin user is allowed per system</p>
              <Button variant="ghost" asChild>
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
