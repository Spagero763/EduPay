"use client"

import { useEffect, useRef, useState } from "react"
import { ethers } from "ethers"
import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { motion, useScroll, useTransform, useInView } from "framer-motion"

type Course = {
  id: number
  tutor: string
  title: string
  description: string
  chapterCount: number
  totalEarned: string
}

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-30px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/course/${course.id}`}>
        <div
          className="group"
          style={{
            borderTop: "1px solid rgba(13,11,8,0.09)",
            padding: "40px 0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "48px",
            cursor: "pointer",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 500 }}>
              {course.chapterCount} {course.chapterCount === 1 ? "lesson" : "lessons"}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 500, color: "rgba(13,11,8,0.85)", marginBottom: 12, lineHeight: 1.3 }}>
              {course.title}
            </h3>
            <p style={{ fontSize: 14, color: "rgba(13,11,8,0.38)", lineHeight: 1.7, maxWidth: 480 }} className="line-clamp-2">
              {course.description}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, paddingTop: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(13,11,8,0.22)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.18em" }}>Tutor</div>
            <div style={{ fontSize: 12, color: "rgba(13,11,8,0.38)", fontFamily: "monospace" }}>
              {course.tutor.slice(0, 6)}...{course.tutor.slice(-4)}
            </div>
            <div style={{ marginTop: 16, color: "#C4622D", fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
              {Number(ethers.utils.formatEther(course.totalEarned)).toFixed(2)}
              <span style={{ color: "rgba(196,98,45,0.4)", fontSize: 11, marginLeft: 4 }}>cUSD</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Home() {
  const { getEduPay, loading } = useMiniPay()
  const [courses, setCourses] = useState<Course[]>([])
  const [fetching, setFetching] = useState(true)

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  useEffect(() => {
    if (loading) return
    async function fetchCourses() {
      try {
        const eduPay = getEduPay()
        const count = await eduPay.courseCount()
        const list: Course[] = []
        for (let i = 0; i < Number(count); i++) {
          const c = await eduPay.courses(i)
          if (c.isActive) {
            list.push({
              id: i,
              tutor: c.tutor,
              title: c.title,
              description: c.description,
              chapterCount: Number(c.chapterCount),
              totalEarned: c.totalEarned.toString(),
            })
          }
        }
        setCourses(list)
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchCourses()
  }, [loading])

  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh" }}>

      {/* ── Hero ─────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 64px 96px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <motion.div style={{ y: heroY, opacity: heroOpacity, width: "100%", maxWidth: 800, margin: "0 auto" }}>
          <motion.h1
            initial={{ opacity: 0, y: 44 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: "clamp(3rem, 8vw, 7rem)",
              fontWeight: 600,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              color: "#0D0B08",
              marginBottom: 16,
            }}
          >
            Learn what<br />you need.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: "clamp(2.2rem, 5vw, 4.5rem)",
              fontWeight: 600,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              color: "#C4622D",
              marginBottom: 40,
            }}
          >
            Pay per lesson.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            style={{ color: "rgba(13,11,8,0.4)", fontSize: 16, maxWidth: 340, margin: "0 auto 48px", lineHeight: 1.7 }}
          >
            African students pay tutors in cUSD,
            one chapter at a time. No banks. No middlemen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}
          >
            <Link
              href="#courses"
              style={{
                fontSize: 11,
                color: "rgba(13,11,8,0.42)",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                borderBottom: "1px solid rgba(13,11,8,0.15)",
                paddingBottom: 2,
                textDecoration: "none",
              }}
            >
              Browse courses
            </Link>
            <Link
              href="/create"
              style={{
                fontSize: 11,
                background: "#0D0B08",
                color: "#F2ECE2",
                padding: "14px 32px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Start teaching
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          <span style={{ fontSize: 9, color: "rgba(13,11,8,0.2)", textTransform: "uppercase", letterSpacing: "0.3em" }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(13,11,8,0.15), transparent)" }}
          />
        </motion.div>
      </section>

      {/* ── Stats ────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "80px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { value: "cUSD", label: "Mento stablecoin" },
            { value: "95%", label: "Goes to tutors" },
            { value: "IPFS", label: "Decentralised content" },
          ].map((stat, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div style={{
                textAlign: "center",
                padding: "0 40px",
                borderLeft: i > 0 ? "1px solid rgba(13,11,8,0.08)" : "none",
              }}>
                <div style={{ fontSize: 36, fontWeight: 600, color: "#0D0B08", marginBottom: 8, letterSpacing: "-0.02em" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "rgba(13,11,8,0.3)", textTransform: "uppercase", letterSpacing: "0.18em" }}>{stat.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Courses ──────────────────────────────────── */}
      <section id="courses" style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "96px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 64 }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.24em", marginBottom: 16, fontWeight: 500 }}>
                  Available now
                </div>
                <h2 style={{ fontSize: 40, fontWeight: 600, color: "#0D0B08", letterSpacing: "-0.02em" }}>Courses</h2>
              </div>
              <Link
                href="/create"
                style={{
                  fontSize: 10,
                  color: "rgba(13,11,8,0.32)",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  borderBottom: "1px solid rgba(13,11,8,0.1)",
                  paddingBottom: 2,
                  textDecoration: "none",
                  marginBottom: 4,
                }}
              >
                Add yours
              </Link>
            </div>
          </FadeUp>

          {fetching ? (
            <div>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "40px 0" }}>
                  <div style={{ height: 10, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 56, marginBottom: 20 }} />
                  <div style={{ height: 20, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 200, marginBottom: 14 }} />
                  <div style={{ height: 12, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 280 }} />
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <FadeUp>
              <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "96px 0", textAlign: "center" }}>
                <p style={{ color: "rgba(13,11,8,0.25)", fontSize: 16, marginBottom: 12, fontWeight: 300 }}>No courses yet</p>
                <p style={{ color: "rgba(13,11,8,0.15)", fontSize: 13, marginBottom: 40 }}>Be the first educator on EduPay</p>
                <Link
                  href="/create"
                  style={{ fontSize: 11, color: "#C4622D", borderBottom: "1px solid rgba(196,98,45,0.3)", paddingBottom: 2, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.18em" }}
                >
                  Create a course
                </Link>
              </div>
            </FadeUp>
          ) : (
            <div>
              {courses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
              <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)" }} />
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "120px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <FadeUp>
            <div style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.28em", marginBottom: 32, fontWeight: 500 }}>
              For educators
            </div>
            <h2 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 600, color: "#0D0B08", lineHeight: 1.06, letterSpacing: "-0.025em", marginBottom: 24, maxWidth: 560, margin: "0 auto 24px" }}>
              Share your knowledge.
            </h2>
            <p style={{ color: "rgba(13,11,8,0.35)", fontSize: 15, marginBottom: 48, maxWidth: 360, margin: "0 auto 48px", lineHeight: 1.7 }}>
              Publish your course, set your price per chapter, get paid instantly in cUSD.
            </p>
            <Link
              href="/create"
              style={{
                display: "inline-block",
                fontSize: 11,
                background: "#0D0B08",
                color: "#F2ECE2",
                padding: "16px 48px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Create your course
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "32px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(13,11,8,0.3)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.18em" }}>EduPay</span>
          <span style={{ color: "rgba(13,11,8,0.18)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em" }}>2026</span>
          
          <a  href="https://celoscan.io/address/0x8A2D3A806f932616ba07D3Fc42bAb1Bdf6f312a1"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(13,11,8,0.22)", fontSize: 10, fontFamily: "monospace", textDecoration: "none" }}
          >
            0x8A2D...12a1
          </a>
        </div>
      </footer>
    </div>
  )
}