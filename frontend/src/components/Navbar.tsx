"use client"

import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { useAppKit } from "@reown/appkit/react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GuideModal } from "@/components/GuideModal"

export function Navbar() {
  const { address, cusdBalance, isMiniPay, loading } = useMiniPay()
  const { open } = useAppKit()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-[#F2ECE2]/92 backdrop-blur-sm border-b border-[#0D0B08]/8" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 md:px-16 py-5 flex items-center justify-between">
          <Link href="/" className="text-[#0D0B08] font-semibold text-sm tracking-widest uppercase">
            EduPay
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {[["/#courses", "Courses"], ["/create", "Teach"], ["/dashboard", "Dashboard"]].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-[#0D0B08]/40 hover:text-[#0D0B08]/80 tracking-widest uppercase transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => setGuideOpen(true)}
              className="text-xs text-[#0D0B08]/40 hover:text-[#0D0B08]/80 tracking-widest uppercase transition-colors duration-200 bg-transparent cursor-pointer"
            >
              Guide
            </button>
          </div>

          <div className="flex items-center gap-3">
            {loading ? null : address ? (
              <div className="flex items-center gap-3">
                {isMiniPay && (
                  <span className="text-[10px] text-[#C4622D] border border-[#C4622D]/30 px-2.5 py-1 rounded-full tracking-widest uppercase">
                    MiniPay
                  </span>
                )}
                <button
                  onClick={() => open()}
                  className="text-xs border border-[#0D0B08]/12 px-3 py-1.5 rounded-full flex items-center gap-2 bg-transparent cursor-pointer"
                >
                  <span className="text-[#C4622D] font-medium tabular-nums">{Number(cusdBalance).toFixed(2)}</span>
                  <span className="text-[#0D0B08]/30">cUSD</span>
                  <span className="text-[#0D0B08]/35 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => open()}
                className="text-xs text-[#0D0B08]/50 border border-[#0D0B08]/15 hover:border-[#0D0B08]/35 hover:text-[#0D0B08]/80 px-4 py-1.5 rounded-full tracking-widest uppercase transition-all duration-200 bg-transparent cursor-pointer"
              >
                Connect
              </button>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex flex-col gap-1.5 p-2">
              <span className={`block w-5 h-px bg-[#0D0B08] transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-px bg-[#0D0B08] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-px bg-[#0D0B08] transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#F2ECE2] flex flex-col items-center justify-center gap-10 md:hidden"
          >
            {[["/#courses", "Courses"], ["/create", "Teach"], ["/dashboard", "Dashboard"]].map(([href, label], i) => (
              <motion.div key={href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-light text-[#0D0B08] hover:text-[#C4622D] tracking-tight transition-colors"
                >
                  {label}
                </Link>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 * 0.08 }}>
              <button
                onClick={() => { setMenuOpen(false); setGuideOpen(true) }}
                className="text-3xl font-light text-[#0D0B08] hover:text-[#C4622D] tracking-tight transition-colors bg-transparent cursor-pointer"
              >
                Guide
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}