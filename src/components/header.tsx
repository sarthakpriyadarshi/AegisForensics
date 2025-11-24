"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative z-50 flex flex-col p-4 md:p-6 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#3533cd] to-[#4f46e5] rounded-xl flex items-center justify-center">
            <Image
              src="/favicon.svg"
              alt="Aegis Logo"
              width={24}
              height={24}
              className="w-10 h-10"
            />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">
              Aegis Forensics
            </h1>
            <p className="text-[10px] md:text-xs text-white/60">
              Open Source AI Platform
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          <a
            href="#features"
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
          <Badge
            variant="outline"
            className="border-[#3533cd]/30 text-white bg-[#3533cd] hover:bg-[#3533cd]/90"
          >
            <Github className="w-3 h-3 mr-1" />
            Open Source
          </Badge>
        </nav>

        {/* Desktop Login Button Group */}
        <div
          id="gooey-btn"
          className="hidden md:flex relative items-center group"
          style={{ filter: "url(#gooey-filter)" }}
        >
          <button className="absolute right-0 px-2.5 py-2 rounded-full bg-[#3533cd] text-white font-normal text-xs transition-all duration-300 hover:bg-[#4f46e5] cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0">
            <ArrowRight className="w-3 h-3" />
          </button>
          <Button
            asChild
            className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center z-10"
          >
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mx-4 mt-2 bg-[#0a0a0a]/95 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10 md:hidden shadow-2xl"
          >
            <div className="p-6 flex flex-col space-y-4">
              <a
                href="#features"
                className="text-white/80 hover:text-white text-sm font-light py-2 border-b border-white/5 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="/auth/setup"
                className="text-white/80 hover:text-white text-sm font-light py-2 border-b border-white/5 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Get Started
              </a>
              <div className="flex items-center justify-between pt-2">
                <Badge
                  variant="outline"
                  className="border-[#3533cd]/30 text-white bg-[#3533cd] hover:bg-[#3533cd]/90"
                >
                  <Github className="w-3 h-3 mr-1" />
                  Open Source
                </Badge>
                <Button
                  asChild
                  className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs"
                >
                  <Link href="/auth/login">Login</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
