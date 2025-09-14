"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Home, AlertTriangle, Shield } from "lucide-react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the critical error to an error reporting service
    console.error("Critical application error:", error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        <div className="min-h-screen flex items-center justify-center p-4">
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
                {/* Critical Error Icon */}
                <div className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                </div>

                {/* Error Message */}
                <div className="space-y-4 mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">Critical System Failure</h2>
                  <p className="text-lg text-white/70 max-w-md mx-auto leading-relaxed">
                    A critical error has occurred in the Aegis Forensics platform. Our security protocols have been
                    activated to protect your investigation data.
                  </p>
                </div>

                {/* Security Notice */}
                <Card className="bg-yellow-500/10 border-yellow-500/30 mb-8">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-yellow-300 mb-1">Security Notice:</p>
                        <p className="text-sm text-yellow-200">
                          All forensic data remains secure and encrypted. No evidence has been compromised.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Error Details */}
                {error.message && (
                  <Card className="bg-red-500/10 border-red-500/30 mb-8">
                    <CardContent className="p-4">
                      <div className="text-left">
                        <p className="text-sm font-medium text-red-300 mb-2">Technical Details:</p>
                        <p className="text-sm text-red-200 font-mono break-words mb-2">{error.message}</p>
                        {error.digest && <p className="text-xs text-red-300">Critical Error ID: {error.digest}</p>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button onClick={reset} className="bg-[#3533cd] hover:bg-[#4f46e5] text-white">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restart Application
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    <Link href="/">
                      <Home className="w-4 h-4 mr-2" />
                      Return to Safety
                    </Link>
                  </Button>
                </div>

                {/* Emergency Contact */}
                <div className="mt-8 pt-8 border-t border-white/20">
                  <p className="text-sm text-white/60 mb-2">
                    <strong>Emergency Protocol Activated</strong>
                  </p>
                  <p className="text-xs text-white/50">
                    If this critical error persists, immediately contact the forensic system administrator with the
                    Critical Error ID above. All investigation data remains secure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </body>
    </html>
  )
}
