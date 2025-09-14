'use client';

import React from 'react';
import Link from 'next/link';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-xl font-bold text-white">Aegis Forensics</h1>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#agents" className="text-slate-300 hover:text-white transition-colors">AI Agents</a>
            <a href="#about" className="text-slate-300 hover:text-white transition-colors">About</a>
            <Link 
              href="/auth/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        <div className="relative z-10 px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Agentic AI
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                Digital Forensics
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Advanced AI-powered platform that provides comprehensive analysis capabilities for cybersecurity investigations with intelligent agent-based automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/login"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Access Dashboard
              </Link>
              <a 
                href="#features"
                className="border border-white text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white hover:text-slate-900 transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What is Agentic AI in Digital Forensics?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Agentic AI represents a paradigm shift where intelligent agents autonomously perform complex forensic analysis tasks, 
              making decisions and coordinating investigations with minimal human intervention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-slate-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Autonomous Decision Making</h3>
              <p className="text-gray-600">
                AI agents independently analyze evidence, prioritize tasks, and make investigative decisions based on learned patterns and forensic expertise.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Agent Collaboration</h3>
              <p className="text-gray-600">
                Specialized agents work together, sharing insights and coordinating efforts to provide comprehensive forensic analysis across all domains.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Adaptation</h3>
              <p className="text-gray-600">
                Agents continuously learn from new evidence patterns and adjust their analysis strategies to improve accuracy and detection capabilities.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Goal-Oriented Investigation</h3>
              <p className="text-gray-600">
                Each agent maintains specific investigative objectives, working systematically towards case resolution with minimal human oversight.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Intelligent Evidence Correlation</h3>
              <p className="text-gray-600">
                Agents automatically identify relationships between disparate evidence sources, building comprehensive investigation timelines.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Predictive Analysis</h3>
              <p className="text-gray-600">
                AI agents predict potential attack vectors and suggest proactive security measures based on current evidence patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section id="agents" className="py-20 px-6 bg-slate-100">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Specialized Forensic AI Agents
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI ecosystem consists of specialized agents, each designed for specific forensic domains, 
              working together under the coordination of the Forensic Orchestrator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Forensic Orchestrator", icon: "🎭", desc: "Central coordinator managing all agent activities and investigation workflows", specialty: "Workflow Management" },
              { name: "Memory Analyzer", icon: "🧠", desc: "RAM dump analysis, process inspection, and rootkit detection specialist", specialty: "Memory Forensics" },
              { name: "Disk Analyzer", icon: "💾", desc: "File system analysis, deleted file recovery, and timeline reconstruction", specialty: "Disk Forensics" },
              { name: "Network Analyzer", icon: "🌐", desc: "PCAP analysis, traffic pattern detection, and IoC extraction", specialty: "Network Security" },
              { name: "Binary Analyzer", icon: "⚙️", desc: "Malware analysis, reverse engineering, and behavioral assessment", specialty: "Malware Analysis" },
              { name: "Timeline Agent", icon: "⏰", desc: "Event correlation and chronological reconstruction of incidents", specialty: "Temporal Analysis" },
              { name: "User Profiler", icon: "👤", desc: "Behavioral analysis, activity patterns, and anomaly detection", specialty: "Behavioral Analysis" },
              { name: "Sandbox Agent", icon: "🔒", desc: "Safe malware execution and controlled behavior analysis", specialty: "Dynamic Analysis" },
              { name: "Live Response Agent", icon: "🔴", desc: "Real-time system analysis and incident response automation", specialty: "Live Investigation" },
              { name: "Recon Agent", icon: "🕵️", desc: "Intelligence gathering, OSINT, and threat actor profiling", specialty: "Intelligence Gathering" },
              { name: "Custodian Agent", icon: "📋", desc: "Evidence integrity, chain of custody, and compliance management", specialty: "Evidence Management" }
            ].map((agent, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{agent.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                </div>
                <div className="mb-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {agent.specialty}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section id="about" className="py-20 px-6 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Comprehensive Digital Investigation Platform
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Aegis Forensics represents the next generation of digital investigation tools, 
                combining cutting-edge AI technology with proven forensic methodologies.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Multi-Platform Support</h4>
                    <p className="text-gray-600">Windows, Linux, and macOS forensic analysis capabilities</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Analysis</h4>
                    <p className="text-gray-600">Live system monitoring and incident response automation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Enterprise Security</h4>
                    <p className="text-gray-600">JWT authentication, secure chain of custody, and audit logging</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">API Integration</h4>
                    <p className="text-gray-600">RESTful API for seamless integration with existing security tools</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Link 
                  href="/auth/login"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
                >
                  Start Investigation
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-slate-900 rounded-xl p-6 text-white">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <pre className="text-sm text-green-400 overflow-x-auto">
{`$ curl -X POST "http://localhost:8000/analyze/uploadfile/" \\
     -H "Authorization: Bearer JWT_TOKEN" \\
     -F "file=@evidence.mem" \\
     -F "analysis_type=memory"

{
  "status": "success",
  "analysis": {
    "verdict": "SUSPICIOUS",
    "severity": "High",
    "confidence": "High",
    "findings": [
      {
        "category": "Process Analysis",
        "description": "Suspicious process detected",
        "evidence": "malware.exe PID:1234"
      }
    ],
    "recommendations": [
      "Isolate affected system",
      "Perform deeper memory analysis"
    ]
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <h3 className="text-lg font-bold">Aegis Forensics</h3>
              </div>
              <p className="text-slate-400 mb-4">
                Advanced AI-powered digital forensics platform for comprehensive cybersecurity investigations.
              </p>
              <p className="text-slate-500 text-sm">
                Built with ❤️ for the cybersecurity community
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#agents" className="hover:text-white transition-colors">AI Agents</a></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 Aegis Forensics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
