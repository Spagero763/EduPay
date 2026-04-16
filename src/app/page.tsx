"use client"

import { useEffect, useRef, useState } from "react"
import { ethers } from "ethers"
import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { motion, useInView } from "framer-motion"

type Course = {
  id: number
  tutor: string
  title: string
  description: string
  chapterCount: number
  totalEarned: string
  isActive: boolean
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

const label: React.CSSProperties = {
  fontSize: 10, color: "rgba(13,11,8,0.28)",
  textTransform: "uppercase", letterSpacing: "0.24em", fontWeight: 500,
}

export default function Home() {
  const { address, loading } = useMiniPay()
  const [courses, setCourses] = useState<Course[]>([])
  const [fetching, setFetching] = useState(true)

  const HIDDEN_IDS = [0, 1, 2, 3] // hide test courses

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    try {
      const provider = new ethers.providers.JsonRpcProvider("https://forno.celo.org")
      const abi = [
        "function courseCount() external view returns (uint256)",
        "function courses(uint256) external view returns (address tutor, string memory title, string memory description, bool isActive, uint256 chapterCount, uint256 totalEarned)",
      ]
      const eduPay = new ethers.Contract(
        "0xDBA56f8d23c69Dbd9659be4ca18133962BC86191",
        abi,
        provider
      )

      const count = Number(await eduPay.courseCount())
      const list: Course[] = []

      for (let i = 0; i < count; i++) {
        if (HIDDEN_IDS.includes(i)) continue
        try {
          const c = await eduPay.courses(i)
          if (c.isActive) {
            list.push({
              id: i,
              tutor: c.tutor,
              title: c.title,
              description: c.description,
              chapterCount: Number(c.chapterCount),
              totalEarned: ethers.utils.formatUnits(c.totalEarned, 6),
              isActive: c.isActive,
            })
          }
        } catch {}
      }
      setCourses(list)
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh" }}>

      {/* Hero */}
      <section style={{ padding: "160px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ ...label, marginBottom: 24 }}>Education · Celo Blockchain</div>
          <h1 style={{
            fontSize: "clamp(3rem, 8vw, 6rem)",
            fontWeight: 600, letterSpacing: "-0.03em",
            lineHeight: 0.95, color: "#0D0B08",
            marginBottom: 24,
          }}>
            Learn. Earn.<br />
            <span style={{ color: "#C4622D" }}>On Celo.</span>
          </h1>
          <p style={{
            fontSize: 16, fontWeight: 300,
            color: "rgba(13,11,8,0.45)", maxWidth: 480,
            lineHeight: 1.8, marginBottom: 48,
          }}>
            Pay per lesson with cUSD. Tutors earn instantly.
            Students own their content forever on the blockchain.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/create" style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "#F2ECE2",
              background: "#0D0B08", padding: "15px 32px",
              textDecoration: "none", display: "inline-block",
            }}>
              Start teaching
            </Link>
            <a href="#courses" style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "rgba(13,11,8,0.5)",
              border: "1px solid rgba(13,11,8,0.2)", padding: "15px 32px",
              textDecoration: "none", display: "inline-block",
            }}>
              Browse courses
            </a>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: "1px solid rgba(13,11,8,0.08)", borderBottom: "1px solid rgba(13,11,8,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { v: courses.length, l: "Active courses" },
            { v: "cUSD", l: "Payment token" },
            { v: "100%", l: "Onchain ownership" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "32px 0", paddingLeft: i > 0 ? 40 : 0, paddingRight: i < 2 ? 40 : 0,
              borderLeft: i > 0 ? "1px solid rgba(13,11,8,0.08)" : "none",
            }}>
              <div style={{ fontSize: 32, fontWeight: 600, color: "#0D0B08", letterSpacing: "-0.02em", marginBottom: 6 }}>
                {fetching ? "—" : s.v}
              </div>
              <div style={{ ...label }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="courses" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px 120px" }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 64 }}>
            <div>
              <div style={{ ...label, marginBottom: 16 }}>Available courses</div>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 600, letterSpacing: "-0.025em", color: "#0D0B08" }}>
                Start learning today.
              </h2>
            </div>
            <Link href="/create" style={{
              fontSize: 10, fontWeight: 500, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "rgba(13,11,8,0.4)",
              textDecoration: "none", borderBottom: "1px solid rgba(13,11,8,0.15)",
              paddingBottom: 2,
            }}>
              Become a tutor →
            </Link>
          </div>
        </Reveal>

        {fetching ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "rgba(13,11,8,0.04)", height: 240, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", borderTop: "1px solid rgba(13,11,8,0.08)" }}>
            <div style={{ fontSize: 15, fontWeight: 300, color: "rgba(13,11,8,0.25)", marginBottom: 8 }}>No courses yet</div>
            <div style={{ fontSize: 13, color: "rgba(13,11,8,0.15)", marginBottom: 32 }}>Be the first to create a course</div>
            <Link href="/create" style={{
              fontSize: 11, color: "#C4622D", textTransform: "uppercase",
              letterSpacing: "0.18em", textDecoration: "none",
              borderBottom: "1px solid rgba(196,98,45,0.3)", paddingBottom: 2,
            }}>
              Create course →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, borderTop: "1px solid rgba(13,11,8,0.08)", borderLeft: "1px solid rgba(13,11,8,0.08)" }}>
            {courses.map((course, i) => (
              <Reveal key={course.id} delay={i * 0.05}>
                <Link href={`/course/${course.id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      padding: "36px 32px",
                      borderRight: "1px solid rgba(13,11,8,0.08)",
                      borderBottom: "1px solid rgba(13,11,8,0.08)",
                      background: "#F2ECE2",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      height: "100%",
                      minHeight: 200,
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(13,11,8,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#F2ECE2")}
                  >
                    <div style={{ ...label, color: "#C4622D", marginBottom: 14 }}>
                      {course.chapterCount} {course.chapterCount === 1 ? "lesson" : "lessons"}
                    </div>
                    <h3 style={{
                      fontSize: 18, fontWeight: 600, color: "#0D0B08",
                      lineHeight: 1.25, marginBottom: 12, letterSpacing: "-0.01em",
                      flex: 1,
                    }}>
                      {course.title}
                    </h3>
                    <p style={{
                      fontSize: 13, color: "rgba(13,11,8,0.4)",
                      lineHeight: 1.6, marginBottom: 24,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {course.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(13,11,8,0.2)" }}>
                        {course.tutor.slice(0, 8)}...
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
                        textTransform: "uppercase", color: "#C4622D",
                        background: "rgba(196,98,45,0.08)",
                        padding: "6px 12px",
                        border: "1px solid rgba(196,98,45,0.2)",
                      }}>
                        View course →
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "80px 40px 120px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <div style={{ ...label, marginBottom: 64 }}>How it works</div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 0, borderLeft: "1px solid rgba(13,11,8,0.08)" }}>
            {[
              { n: "01", t: "Connect wallet", d: "Use MetaMask, Valora, or MiniPay on Celo mainnet." },
              { n: "02", t: "Browse courses", d: "Find lessons on blockchain, coding, and Web3." },
              { n: "03", t: "Pay with cUSD", d: "Buy chapters individually or the full course at once." },
              { n: "04", t: "Access instantly", d: "Content unlocks immediately after purchase. Yours forever." },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ padding: "40px 32px", borderRight: "1px solid rgba(13,11,8,0.08)", borderBottom: "1px solid rgba(13,11,8,0.08)" }}>
                  <div style={{ ...label, color: "#C4622D", marginBottom: 16 }}>{s.n}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0D0B08", marginBottom: 10 }}>{s.t}</h3>
                  <p style={{ fontSize: 13, color: "rgba(13,11,8,0.4)", lineHeight: 1.7, fontWeight: 300 }}>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}