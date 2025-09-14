"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"

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

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden" style={{ backgroundColor: "#020617" }}>
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

      <div className="min-h-screen flex relative z-10">
        {/* Left side - Login Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="animate-slide-up">
              <div className="flex items-center space-x-4 mb-12">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg animate-glow">
                  <span className="text-white font-bold text-2xl">A</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Aegis Forensics</h1>
                  <p className="text-purple-300 text-sm">AI-Powered Investigation</p>
                </div>
              </div>

              <div className="mb-10">
                <h2 className="text-4xl font-bold text-white mb-3 text-balance">Welcome back</h2>
                <p className="text-xl text-slate-300">Access your digital forensics platform</p>
              </div>
            </div>

            <div className="glass-strong rounded-3xl p-8 animate-scale-in">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-sm rounded-2xl p-4">
                    <div className="text-sm text-red-300">{error}</div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-white mb-3">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full appearance-none rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-4 text-white placeholder-slate-400 shadow-sm focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-300"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-white mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full appearance-none rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-4 pr-12 text-white placeholder-slate-400 shadow-sm focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-300"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500/30 focus:ring-2"
                    />
                    <label htmlFor="rememberMe" className="ml-3 block text-sm text-slate-300">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link
                      href="/auth/forgot-password"
                      className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-2xl text-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-purple-500/25"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Sign in</span>
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

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-transparent px-4 text-slate-400">Demo Credentials</span>
                  </div>
                </div>

                <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <p className="font-semibold mb-3 text-white text-sm">Demo Login:</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-300">
                      <span className="text-purple-400">Email:</span> admin@company.com
                    </p>
                    <p className="text-slate-300">
                      <span className="text-purple-400">Password:</span> secure_password_123
                    </p>
                  </div>
                  <p className="text-xs mt-4 text-slate-500">
                    Note: First setup admin at{" "}
                    <Link href="/auth/setup" className="text-purple-400 hover:text-purple-300">
                      /auth/setup
                    </Link>{" "}
                    if needed
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-slate-400 hover:text-white transition-colors inline-flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Enhanced Branding */}
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-slate-900/50 backdrop-blur-sm">
            <div className="relative z-10 flex flex-col justify-center h-full px-16 text-white">
              <div className="max-w-lg animate-fade-in">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-purple-200 mb-8">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Secure Access Portal
                </div>

                <h2 className="text-5xl font-bold mb-8 text-balance text-white">
                  Digital Forensics
                  <span className="block gradient-text">Platform</span>
                </h2>

                <p className="text-xl text-slate-300 mb-12 leading-relaxed text-pretty">
                  Advanced AI-powered tools for comprehensive digital investigations and evidence analysis with
                  intelligent automation.
                </p>

                <div className="space-y-6">
                  {[
                    {
                      icon: "🔍",
                      title: "Deep Evidence Analysis",
                      desc: "Comprehensive forensic examination",
                      color: "from-purple-500 to-blue-500",
                    },
                    {
                      icon: "🤖",
                      title: "AI-Powered Insights",
                      desc: "Intelligent pattern recognition",
                      color: "from-blue-500 to-cyan-500",
                    },
                    {
                      icon: "🔒",
                      title: "Secure Chain of Custody",
                      desc: "Tamper-proof evidence handling",
                      color: "from-cyan-500 to-teal-500",
                    },
                    {
                      icon: "📊",
                      title: "Real-time Monitoring",
                      desc: "Live investigation tracking",
                      color: "from-teal-500 to-green-500",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 group animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <span className="text-lg text-white">{feature.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-slate-400 text-sm">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
