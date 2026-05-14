"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { formatPrice } from "@/lib/formatPrice"
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

const CARD_ACCENTS = ["#C4622D", "#2D7CC4", "#2DC47A", "#C4A62D", "#7C2DC4", "#2DC4B8"]

const CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: "Blockchain", keywords: ["solidity", "smart contract", "web3", "defi", "celo", "blockchain", "nft", "crypto", "wallet", "token"] },
  { label: "Programming", keywords: ["javascript", "python", "react", "node", "typescript", "fullstack", "frontend", "backend", "coding", "software", "developer", "app", "api", "html", "css", "ai", "machine learning", "data"] },
  { label: "Finance", keywords: ["finance", "money", "invest", "trading", "budget", "accounting", "business", "economics", "stock", "forex"] },
  { label: "Design", keywords: ["design", "ui", "ux", "figma", "graphic", "brand", "illustration", "photoshop", "canva"] },
  { label: "Language", keywords: ["english", "french", "spanish", "arabic", "yoruba", "igbo", "hausa", "language", "writing", "grammar"] },
]

function getCourseCategory(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => text.includes(kw))) return cat.label
  }
  return "General"
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-30px" })
  const accent = CARD_ACCENTS[course.id % CARD_ACCENTS.length]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/course/${course.id}`} style={{ textDecoration: "none" }}>
        <div
          style={{
            borderTop: "1px solid rgba(13,11,8,0.09)",
            padding: "32px 0",
            display: "flex",
            alignItems: "flex-start",
            gap: "24px",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {/* Color accent bar + index */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 2 }}>
            <div style={{ width: 3, height: 40, background: accent, borderRadius: 2, opacity: 0.7 }} />
            <span style={{ fontSize: 10, color: "rgba(13,11,8,0.2)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.06em" }}>
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {/* Category tag */}
              <span style={{
                fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase",
                color: accent, background: `${accent}18`, padding: "3px 8px", borderRadius: 2,
              }}>
                {getCourseCategory(course.title, course.description)}
              </span>
              {/* Chapter count */}
              <span style={{ fontSize: 9, color: "rgba(13,11,8,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {course.chapterCount} {course.chapterCount === 1 ? "lesson" : "lessons"}
              </span>
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 600, color: "#0D0B08", marginBottom: 10, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              {course.title}
            </h3>
            <p style={{ fontSize: 13, color: "rgba(13,11,8,0.42)", lineHeight: 1.7, maxWidth: 540 }} className="line-clamp-2">
              {course.description}
            </p>
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "rgba(13,11,8,0.28)", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                by {course.tutor.slice(0, 6)}…{course.tutor.slice(-4)}
              </span>
              {Number(course.totalEarned) > 0 && (
                <span style={{ fontSize: 11, color: "#C4622D", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  ${formatPrice(course.totalEarned)} earned
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div style={{ flexShrink: 0, paddingTop: 6, opacity: 0.2 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M8 3l5 5-5 5" stroke="#0D0B08" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Home() {
  const { getPublicEduPay, loading, isMiniPay } = useMiniPay()
  const [courses, setCourses] = useState<Course[]>([])
  const [fetching, setFetching] = useState(true)
  const [totalLessons, setTotalLessons] = useState(0)
  const [totalVolume, setTotalVolume] = useState("0")
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  const courseCategories = courses.map(c => getCourseCategory(c.title, c.description))
  const availableCategories = ["All", ...Array.from(new Set(courseCategories)).sort()]

  const filteredCourses = courses.filter(c => {
    const matchSearch = !search.trim() ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === "All" ||
      getCourseCategory(c.title, c.description) === activeCategory
    return matchSearch && matchCategory
  })

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  useEffect(() => {
    if (loading) return
    async function fetchCourses() {
      try {
        const eduPay = getPublicEduPay()
        const { ethers } = await import("ethers")
        const count = Number(await eduPay.courseCount())
        const all = await Promise.all(
          Array.from({ length: count }, (_, i) => eduPay.courses(i))
        )
        let lessons = 0
        let volume = ethers.BigNumber.from(0)
        const list: Course[] = []
        all.forEach((c, i) => {
          lessons += Number(c.chapterCount)
          volume = volume.add(c.totalEarned)
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
        })
        setCourses(list)
        setTotalLessons(lessons)
        setTotalVolume(Number(ethers.utils.formatUnits(volume, 6)).toFixed(2))
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32, flexWrap: "wrap" }}
          >
            {isMiniPay && (
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C4622D", border: "1px solid rgba(196,98,45,0.3)", padding: "5px 12px", borderRadius: 20 }}>
                ⚡ MiniPay
              </span>
            )}
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(13,11,8,0.35)", border: "1px solid rgba(13,11,8,0.1)", padding: "5px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#FCFF52" }} />
              Built on Celo
            </span>
          </motion.div>

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

      {/* ── How it works ─────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "96px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.28em", marginBottom: 56, fontWeight: 500 }}>
              How it works
            </div>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "48px" }}>
            {[
              {
                step: "01",
                title: "Tutor publishes a course",
                body: "Set a price per chapter. Your content is stored on-chain, accessible only to paying students.",
              },
              {
                step: "02",
                title: "Student pays one chapter",
                body: "No subscription. No credit card. Students pay in cUSD or USDC directly from MiniPay — instantly.",
              },
              {
                step: "03",
                title: "Funds go straight to tutor",
                body: "Every payment settles on Celo in seconds. No intermediaries, no monthly payouts, no delays.",
              },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.12}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#C4622D", letterSpacing: "0.2em", marginBottom: 20 }}>{item.step}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0D0B08", marginBottom: 12, lineHeight: 1.3, letterSpacing: "-0.01em" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "rgba(13,11,8,0.45)", lineHeight: 1.75 }}>{item.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "80px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { value: fetching ? "—" : `${courses.length}`, label: "Active courses" },
            { value: fetching ? "—" : `${totalLessons}`, label: "Lessons published" },
            { value: fetching ? "—" : `$${totalVolume}`, label: "Paid to tutors" },
          ].map((stat, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div style={{
                textAlign: "center",
                padding: "0 40px",
                borderLeft: i > 0 ? "1px solid rgba(13,11,8,0.08)" : "none",
              }}>
                {fetching ? (
                  <div style={{ height: 40, width: 80, background: "rgba(13,11,8,0.06)", borderRadius: 4, margin: "0 auto 12px" }} />
                ) : (
                  <div style={{ fontSize: 36, fontWeight: 600, color: i === 2 ? "#C4622D" : "#0D0B08", marginBottom: 8, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                    {stat.value}
                  </div>
                )}
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
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, gap: 24, flexWrap: "wrap" }}>
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

            {/* Search bar */}
            {!fetching && courses.length > 0 && (
              <div style={{ marginBottom: 40, position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setActiveCategory("All") }}
                  style={{
                    width: "100%",
                    padding: "14px 48px 14px 20px",
                    fontSize: 14,
                    color: "#0D0B08",
                    background: "transparent",
                    border: "1px solid rgba(13,11,8,0.15)",
                    outline: "none",
                    fontFamily: "inherit",
                    letterSpacing: "0.01em",
                    boxSizing: "border-box",
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      position: "absolute",
                      right: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 16,
                      color: "rgba(13,11,8,0.3)",
                      lineHeight: 1,
                      padding: 4,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </FadeUp>

          {/* Category filter tabs */}
          {!fetching && availableCategories.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    fontSize: 10,
                    fontWeight: activeCategory === cat ? 600 : 400,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "8px 16px",
                    border: activeCategory === cat ? "1px solid #0D0B08" : "1px solid rgba(13,11,8,0.12)",
                    background: activeCategory === cat ? "#0D0B08" : "transparent",
                    color: activeCategory === cat ? "#F2ECE2" : "rgba(13,11,8,0.45)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    borderRadius: 2,
                    transition: "all 0.18s",
                  }}
                >
                  {cat}
                  {cat !== "All" && (
                    <span style={{ marginLeft: 6, opacity: 0.5 }}>
                      {courseCategories.filter(c => c === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

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
          ) : filteredCourses.length === 0 ? (
            <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "64px 0", textAlign: "center" }}>
              <p style={{ color: "rgba(13,11,8,0.25)", fontSize: 15, marginBottom: 12, fontWeight: 300 }}>No courses match "{search}"</p>
              <button
                onClick={() => setSearch("")}
                style={{ fontSize: 11, color: "#C4622D", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.18em", fontFamily: "inherit", borderBottom: "1px solid rgba(196,98,45,0.3)", paddingBottom: 2 }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div>
              {filteredCourses.map((course, i) => (
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
          <svg width="82" height="22" viewBox="0 0 136 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="EduPay">
            <circle cx="20" cy="20" r="18" fill="rgba(13,11,8,0.2)"/>
            <rect x="12" y="12" width="3" height="16" fill="rgba(242,236,226,0.6)"/>
            <rect x="12" y="12" width="14" height="3" fill="rgba(242,236,226,0.6)"/>
            <rect x="12" y="18.5" width="10" height="3" fill="rgba(242,236,226,0.6)"/>
            <rect x="12" y="25" width="14" height="3" fill="rgba(242,236,226,0.6)"/>
            <text x="46" y="28" fontFamily="Inter, system-ui, sans-serif" fontSize="21" fontWeight="700" letterSpacing="-0.5" fill="rgba(13,11,8,0.3)">EduPay</text>
          </svg>
          <span style={{ color: "rgba(13,11,8,0.18)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em" }}>2026</span>
          
          <a  href="https://celoscan.io/address/0xDBA56f8d23c69Dbd9659be4ca18133962BC86191"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(13,11,8,0.22)", fontSize: 10, fontFamily: "monospace", textDecoration: "none" }}
          >
            0xDBA5...6191
          </a>
        </div>
      </footer>
    </div>
  )
}