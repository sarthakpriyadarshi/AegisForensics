"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3533cd]/20 via-black to-[#3533cd]/10">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#3533cd]/5 to-transparent animate-pulse"></div>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 20% 50%, #3533cd 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, #3533cd 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, #3533cd 0%, transparent 50%)
              `,
              animation: "float 20s ease-in-out infinite",
            }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#3533cd]/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-[#3533cd]/20">
            <Image src="/aegis-logo.svg" alt="Aegis Logo" width={48} height={48} className="w-12 h-12" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">Aegis Forensics</h1>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-[#3533cd] text-xl">🛡️</span>
            <p className="text-xl md:text-2xl text-gray-300 font-medium">Agentic AI Framework for Forensics</p>
            <span className="text-[#3533cd] text-xl">⚡</span>
          </div>
        </div>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Advanced artificial intelligence agents working autonomously to conduct comprehensive digital forensic
          investigations with unprecedented speed and accuracy.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button
            asChild
            size="lg"
            className="bg-[#3533cd] hover:bg-[#3533cd]/90 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Link href="/auth/login" className="flex items-center gap-2">
              Login
              <span>→</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-[#3533cd] text-[#3533cd] hover:bg-[#3533cd] hover:text-white px-8 py-3 text-lg font-semibold rounded-xl backdrop-blur-sm bg-white/5 transition-all duration-300 hover:scale-105"
          >
            <Link href="/auth/setup" className="flex items-center gap-2">
              Setup System
              <span>🛡️</span>
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-[#3533cd]/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-[#3533cd]/20">
              <span className="text-[#3533cd] text-2xl">🛡️</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Autonomous Agents</h3>
            <p className="text-gray-400 text-sm">AI agents that work independently to analyze evidence</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-[#3533cd]/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-[#3533cd]/20">
              <span className="text-[#3533cd] text-2xl">⚡</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Real-time Analysis</h3>
            <p className="text-gray-400 text-sm">Instant processing and immediate forensic insights</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-[#3533cd]/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-[#3533cd]/20">
              <span className="text-[#3533cd] text-2xl">→</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Intelligent Workflow</h3>
            <p className="text-gray-400 text-sm">Streamlined investigation processes powered by AI</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
      `}</style>
    </div>
  )
}
