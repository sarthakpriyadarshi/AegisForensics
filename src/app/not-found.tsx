"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, Search, FileQuestion } from "lucide-react"

export default function NotFound() {

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-[#3533cd]/30 via-[#3533cd]/15 to-transparent rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-radial from-[#4f46e5]/20 via-[#4f46e5]/10 to-transparent rounded-full blur-3xl animate-float-reverse"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#3533cd] to-[#4f46e5] rounded-xl flex items-center justify-center">
            <Image src="/favicon.svg" alt="Aegis Logo" width={28} height={28} className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Aegis Forensics</h1>
            <p className="text-sm text-white/60">Open Source AI Platform</p>
          </div>
        </div>

        <Card className="glass-strong border-white/20">
          <CardContent className="p-12">
            {/* 404 Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <FileQuestion className="w-12 h-12 text-blue-400" />
            </div>

            {/* 404 Message */}
            <div className="space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
              <p className="text-lg text-white/70 max-w-md mx-auto leading-relaxed">
                The forensic data you&apos;re looking for couldn&apos;t be located. The page may have been moved, deleted, or the URL might be incorrect.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild className="bg-[#3533cd] hover:bg-[#4f46e5] text-white">
                <Link href="/dashboard">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                <Link href="/cases">
                  <Search className="w-4 h-4 mr-2" />
                  Search Cases
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-sm text-white/60">
                Need help finding what you&apos;re looking for? Try searching through your cases or return to the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
