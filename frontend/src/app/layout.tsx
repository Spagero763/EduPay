import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Navbar } from "@/components/Navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EduPay - Learn & Earn on Celo",
  description: "Pay-per-lesson education platform built on Celo and MiniPay",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="talentapp:project_verification"
          content="a39cb1ae17e967a401b06baf0f6d31acb2326952abe3fcbef47a30d01afb22fe2c4f0edaacb57e3e9a2a843c860d49bfc2563ff8fc4f875dc1993192f261097f"
        />
      </head>
      <body className={inter.className} style={{ background: "#F2ECE2", color: "#0D0B08", margin: 0, padding: 0 }}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
