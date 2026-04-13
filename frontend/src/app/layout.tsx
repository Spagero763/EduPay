import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Navbar } from "@/components/Navbar"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "EduPay - Learn & Earn on Celo",
  description: "Pay-per-lesson education platform built on Celo and MiniPay",
  other: {
    "talentapp:project_verification": "a39cb1ae17e967a401b06baf0f6d31acb2326952abe3fcbef47a30d01afb22fe2c4f0edaacb57e3e9a2a843c860d49bfc2563ff8fc4f875dc1993192f261097f",
    "fc:frame": "vNext",
    "fc:frame:image": "https://edupay.vercel.app/og.png",
    "fc:frame:button:1": "Browse Courses",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://edupay.vercel.app",
    "fc:frame:button:2": "Create Course",
    "fc:frame:button:2:action": "link",
    "fc:frame:button:2:target": "https://edupay.vercel.app/create",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="talentapp:project_verification"
          content="a39cb1ae17e967a401b06baf0f6d31acb2326952abe3fcbef47a30d01afb22fe2c4f0edaacb57e3e9a2a843c860d49bfc2563ff8fc4f875dc1993192f261097f"
        />
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content="https://edupay.vercel.app/og.png" />
        <meta name="fc:frame:button:1" content="Browse Courses" />
        <meta name="fc:frame:button:1:action" content="link" />
        <meta name="fc:frame:button:1:target" content="https://edupay.vercel.app" />
        <meta name="fc:frame:button:2" content="Start Teaching" />
        <meta name="fc:frame:button:2:action" content="link" />
        <meta name="fc:frame:button:2:target" content="https://edupay.vercel.app/create" />
      </head>
      <body className={inter.variable} style={{ background: "#F2ECE2", color: "#0D0B08", margin: 0, padding: 0 }}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}