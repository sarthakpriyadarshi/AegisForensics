"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function HeroContent() {
  return (
    <main className="absolute bottom-8 left-8 z-20 max-w-lg">
      <div className="text-left">
        <div
          className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-4 relative"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
          <span className="text-white/90 text-xs font-light relative z-10">✨ Next-Generation Forensics Platform</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl md:leading-16 tracking-tight font-light text-white mb-4">
          <span className="font-medium italic instrument">Forensics</span>
          <br />
          <span className="font-light tracking-tight text-white">Agentic AI</span>
          <br />
          <span className="font-light tracking-tight text-[#3533cd]">Solution</span>
        </h1>

        {/* Description */}
        <p className="text-xs font-light text-white/70 mb-4 leading-relaxed">
          Revolutionize digital investigations with our open-source AI-powered platform. Deploy intelligent agents
          for automated evidence analysis, threat detection, and comprehensive forensic reporting.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button asChild variant="outline" className="px-8 py-3 rounded-full bg-transparent border border-white/30 text-white font-normal text-xs transition-all duration-200 hover:bg-white/10 hover:border-white/50 cursor-pointer">
            <Link href="/auth/login">Access Platform</Link>
          </Button>
          <Button asChild className="px-8 py-3 rounded-full bg-[#3533cd] hover:bg-[#4f46e5] text-white font-normal text-xs transition-all duration-200 cursor-pointer">
            <Link href="/auth/setup">
              Start Investigation
              <ArrowRight className="w-3 h-3 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
