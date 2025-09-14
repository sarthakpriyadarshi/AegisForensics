"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, ArrowRight, Github, Star, CheckCircle } from "lucide-react"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden relative">
      {/* Dynamic Moving Background */}
      <div className="fixed inset-0 z-0">
        {/* Base black background */}
        <div className="absolute inset-0 bg-black"></div>

        {/* Moving radial gradients */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-[#3533cd]/40 via-[#3533cd]/20 to-transparent rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-radial from-[#4f46e5]/30 via-[#4f46e5]/15 to-transparent rounded-full blur-3xl animate-float-reverse"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-radial from-[#3533cd]/25 via-[#3533cd]/10 to-transparent rounded-full blur-2xl animate-pulse-glow"></div>
        </div>

        {/* Animated overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#3533cd]/5 to-transparent animate-gradient-shift"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-black/50 to-transparent"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 glass-subtle border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3533cd] to-[#4f46e5] rounded-xl flex items-center justify-center">
                <Image src="/favicon.svg" alt="Aegis Logo" width={24} height={24} className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Aegis Forensics</h1>
                <p className="text-xs text-white/60">Open Source AI Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-[#3533cd]/30 text-[#3533cd] bg-[#3533cd]/10">
                <Github className="w-3 h-3 mr-1" />
                Open Source
              </Badge>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="text-white/80 hover:text-white hover:bg-white/10">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild className="bg-[#3533cd] hover:bg-[#4f46e5] text-white">
                  <Link href="/auth/setup">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content - Centered in remaining viewport */}
      <main className="relative z-10 flex items-center justify-center" style={{ height: "calc(100vh - 4rem)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 animate-slide-up">
          {/* Badge */}
          <Badge variant="outline" className="border-[#3533cd]/30 text-[#3533cd] bg-[#3533cd]/10 px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            Next-Generation Forensics Platform
          </Badge>

          {/* Main Headline */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-balance">
              <span className="gradient-text">Forensics</span>
              <br />
              <span className="text-white">Agentic AI</span>
              <br />
              <span className="text-white/80">Solution</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto text-pretty leading-relaxed">
              Revolutionize digital investigations with our open-source AI-powered platform. Deploy intelligent agents
              for automated evidence analysis, threat detection, and comprehensive forensic reporting.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button
              size="lg"
              asChild
              className="bg-[#3533cd] hover:bg-[#4f46e5] text-white px-8 py-4 text-lg btn-gradient"
            >
              <Link href="/auth/setup">
                Start Investigation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg btn-glass bg-transparent"
            >
              <Link href="/auth/login">Access Platform</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-8 pt-12 text-white/60">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Open Source</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#3533cd]" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>Real-time Analysis</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
