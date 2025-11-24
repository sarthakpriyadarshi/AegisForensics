"use client";
import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-20 border-t border-white/10 bg-black/20 backdrop-blur-md mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3533cd] to-[#4f46e5] rounded-lg flex items-center justify-center">
                <Image
                  src="/favicon.svg"
                  alt="Aegis Logo"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </div>
              <span className="text-xl font-bold text-white">
                Aegis Forensics
              </span>
            </div>
            <p className="text-white/60 text-sm max-w-sm mb-6">
              The world&apos;s first open-source agentic AI forensics platform.
              Empowering investigators with autonomous intelligence.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li>
                <Link
                  href="#features"
                  className="hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="hover:text-white transition-colors"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/setup"
                  className="hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-white/40">
          <p>© 2024 Aegis Forensics. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
