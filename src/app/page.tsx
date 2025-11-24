"use client";

import Header from "@/components/header";
import HeroContent from "@/components/hero-content";
import PulsingCircle from "@/components/pulsing-circle";
import ShaderBackground from "@/components/shader-background";
import Features from "@/components/features";
import Footer from "@/components/footer";

export default function HomePage() {
  return (
    <ShaderBackground>
      <div className="relative z-10">
        <div className="min-h-screen flex flex-col relative">
          <Header />
          <HeroContent />
          <PulsingCircle />
        </div>
        <Features />
        <Footer />
      </div>
    </ShaderBackground>
  );
}
