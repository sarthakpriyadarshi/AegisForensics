"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, ArrowRight } from "lucide-react"

export default function Header() {
  return (
    <header className="relative z-20 flex items-center justify-between p-6">
      {/* Logo */}
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#3533cd] to-[#4f46e5] rounded-xl flex items-center justify-center">
          <Image src="/favicon.svg" alt="Aegis Logo" width={24} height={24} className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Aegis Forensics</h1>
          <p className="text-xs text-white/60">Open Source AI Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center space-x-2">
        <a
          href="/auth/login"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Features
        </a>
        <a
          href="/auth/setup"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Get Started
        </a>
        <Badge variant="outline" className="border-[#3533cd]/30 text-[#3533cd] bg-[#3533cd]/10">
          <Github className="w-3 h-3 mr-1" />
          Open Source
        </Badge>
      </nav>

      {/* Login Button Group with Arrow */}
      <div id="gooey-btn" className="relative flex items-center group" style={{ filter: "url(#gooey-filter)" }}>
        <button className="absolute right-0 px-2.5 py-2 rounded-full bg-[#3533cd] text-white font-normal text-xs transition-all duration-300 hover:bg-[#4f46e5] cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0">
          <ArrowRight className="w-3 h-3" />
        </button>
        <Button asChild className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center z-10">
          <Link href="/auth/login">Login</Link>
        </Button>
      </div>
    </header>
  )
}
