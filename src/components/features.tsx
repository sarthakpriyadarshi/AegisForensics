"use client";
import { Shield, Zap, Search, FileText, Brain, Lock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Agentic AI Analysis",
    description:
      "Autonomous agents that analyze evidence, detect patterns, and generate hypotheses without human intervention.",
  },
  {
    icon: Search,
    title: "Deep Packet Inspection",
    description:
      "Advanced network traffic analysis to uncover hidden threats, malware communication, and data exfiltration.",
  },
  {
    icon: FileText,
    title: "Automated Reporting",
    description:
      "Generate comprehensive, court-admissible forensic reports with a single click, saving hours of manual work.",
  },
  {
    icon: Shield,
    title: "Threat Intelligence",
    description:
      "Integrated real-time threat feeds to correlate local findings with global attack campaigns.",
  },
  {
    icon: Zap,
    title: "Live Response",
    description:
      "Real-time system interrogation and remediation capabilities for active security incidents.",
  },
  {
    icon: Lock,
    title: "Chain of Custody",
    description:
      "Immutable logging and cryptographic hashing ensure evidence integrity is never compromised.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative z-20 py-24 px-6 md:px-12 max-w-7xl mx-auto"
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          <span className="text-[#6366f1]">Intelligent</span> Forensics
        </h2>
        <p className="text-white/60 max-w-2xl mx-auto text-sm md:text-base">
          Equip your team with the most advanced AI-driven forensic tools
          available. Speed up investigations and uncover the truth.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-lg bg-[#3533cd]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <feature.icon className="w-6 h-6 text-[#3533cd]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
