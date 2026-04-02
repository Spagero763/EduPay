"use client"

import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const { address, cusdBalance, isMiniPay, loading } = useMiniPay()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/80 backdrop-blur-md border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white font-semibold text-lg tracking-tight">
            EduPay
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link href="/#courses" className="text-sm text-white/50 hover:text-white transition-colors duration-200">
              Courses
            </Link>
            <Link href="/create" className="text-sm text-white/50 hover:text-white transition-colors duration-200">
              Teach
            </Link>
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors duration-200">
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {!loading && address ? (
              <div className="flex items-center gap-3">
                {isMiniPay && (
                  <span className="text-xs text-green-400 border border-green-400/30 px-2.5 py-1 rounded-full">
                    MiniPay
                  </span>
                )}
                <div className="text-sm text-white/60 border border-white/10 px-3 py-1.5 rounded-full">
                  <span className="text-green-400 font-medium">{Number(cusdBalance).toFixed(2)}</span>
                  <span className="text-white/30 mx-1.5">cUSD</span>
                  <span className="text-white/40">{address.slice(0, 6)}...{address.slice(-4)}</span>
                </div>
              </div>
            ) : !loading ? (
              <span className="text-xs text-white/30">No wallet</span>
            ) : null}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2"
            >
              <span className={`block w-5 h-px bg-white transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-px bg-white transition-all ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-px bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-10 md:hidden"
          >
            {["/#courses", "/create", "/dashboard"].map((href, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-light text-white hover:text-green-400 transition-colors"
                >
                  {href === "/#courses" ? "Courses" : href === "/create" ? "Teach" : "Dashboard"}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
