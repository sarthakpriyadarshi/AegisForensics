"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute -bottom-40 right-1/3 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="max-w-lg w-full space-y-8">
          <div className="text-center animate-slide-up">
            <div className="flex justify-center items-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl animate-glow">
                <span className="text-3xl font-bold text-white">A</span>
              </div>
            </div>
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-purple-200 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Initial Setup Required
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 text-balance">Setup Admin Account</h2>
            <p className="text-xl text-slate-300 text-pretty">
              Create the first admin user for Aegis Forensics platform
            </p>
          </div>

          <div className="glass-strong rounded-3xl p-10 shadow-2xl animate-scale-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm">
                  {avatar ? (
                    <img src={avatar || "/placeholder.svg"} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <label className="cursor-pointer text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  Upload Avatar (Optional)
                </label>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-semibold text-white mb-3">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border border-white/20 rounded-2xl bg-white/10 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-white mb-3">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border border-white/20 rounded-2xl bg-white/10 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-300"
                    placeholder="admin@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-semibold text-white mb-3">
                    Organization
                  </label>
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    required
                    value={formData.organization}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border border-white/20 rounded-2xl bg-white/10 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-300"
                    placeholder="Your organization name"
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-semibold text-white mb-3">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border border-white/20 rounded-2xl bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-300"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz} className="bg-slate-800">
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-white mb-3">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border border-white/20 rounded-2xl bg-white/10 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-300"
                      placeholder="Minimum 8 characters"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-3">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border border-white/20 rounded-2xl bg-white/10 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-300"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-sm text-red-300 px-6 py-4 rounded-2xl">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-2xl text-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-purple-500/25"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Setting up...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Create Admin Account</span>
                      <svg
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center space-y-3">
              <p className="text-xs text-slate-400">Only one admin user is allowed per system</p>
              <Link
                href="/"
                className="text-purple-400 hover:text-purple-300 text-sm font-medium inline-flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
