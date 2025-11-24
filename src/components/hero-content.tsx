"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroContent() {
  return (
    <main className="flex-1 relative z-20 w-full px-6 flex flex-col items-center justify-center text-center min-h-[80vh] md:min-h-0">
      <div className="w-full">
        <div
          className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-4 relative"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
          <span className="text-white/90 text-xs font-light relative z-10">
            ✨ Next-Generation Forensics Platform
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl md:leading-16 tracking-tight font-light text-white mb-4">
          <span className="font-medium italic instrument">Forensics</span>
          <br />
          <span className="font-light tracking-tight text-white">
            Agentic AI
          </span>
          <br />
          <span className="font-light tracking-tight text-[#6366f1]">
            Solution
          </span>
        </h1>

        {/* Description */}
        <p className="text-xs sm:text-sm font-light text-white/70 mb-8 leading-relaxed max-w-xl mx-auto">
          Revolutionize digital investigations with our open-source AI-powered
          platform. Deploy intelligent agents for automated evidence analysis,
          threat detection, and comprehensive forensic reporting.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-white/10 hover:bg-indigo-500/20 backdrop-blur-sm border border-white/30 hover:border-indigo-400/50 text-white font-medium text-xs transition-all duration-200 cursor-pointer shadow-lg"
          >
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#3533cd] hover:bg-[#4f46e5] text-white font-normal text-xs transition-all duration-200 cursor-pointer"
          >
            <Link href="/auth/setup">
              Get Started
              <ArrowRight className="w-3 h-3 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
