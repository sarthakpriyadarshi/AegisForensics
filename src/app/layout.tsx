import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import "./globals.css"

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Aegis Forensics - AI-Powered Digital Forensics Platform",
  description:
    "Advanced cybersecurity investigation and analysis platform with AI-powered agents for comprehensive digital forensics.",
  keywords: "digital forensics, cybersecurity, AI analysis, incident response, malware analysis, memory forensics",
  authors: [{ name: "Aegis Forensics Team" }],
  creator: "Aegis Forensics",
  publisher: "Aegis Forensics",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
