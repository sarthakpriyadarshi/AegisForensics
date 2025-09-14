import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aegis Forensics - AI-Powered Digital Forensics Platform",
  description: "Advanced cybersecurity investigation and analysis platform with AI-powered agents for comprehensive digital forensics.",
  keywords: "digital forensics, cybersecurity, AI analysis, incident response, malware analysis, memory forensics",
  authors: [{ name: "Aegis Forensics Team" }],
  creator: "Aegis Forensics",
  publisher: "Aegis Forensics",
  icons: {
    icon: [
      { url: "/aegis-logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/aegis-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
