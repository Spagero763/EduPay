"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { motion } from "framer-motion"

type TutorCourse = {
  id: number
  title: string
  description: string
  chapterCount: number
  totalEarned: string
  isActive: boolean
}

type PurchasedChapter = {
  courseId: number
  courseTitle: string
  chapterId: number
  chapterTitle: string
  price: string
}

type Tab = "tutor" | "student"

export default function Dashboard() {
  const { address, connect, getEduPay, loading } = useMiniPay()
  const [tab, setTab] = useState<Tab>("tutor")
  const [fetching, setFetching] = useState(true)

  const [tutorCourses, setTutorCourses] = useState<TutorCourse[]>([])
  const [totalEarned, setTotalEarned] = useState("0")
  const [purchasedChapters, setPurchasedChapters] = useState<PurchasedChapter[]>([])

  useEffect(() => {
    if (loading || !address) { setFetching(false); return }
    fetchData()
  }, [loading, address])

  async function fetchData() {
    setFetching(true)
    try {
      const eduPay = getEduPay()

      // Tutor courses
      const ids: number[] = await eduPay.getTutorCourses(address)
      const courses: TutorCourse[] = []
      let earned = ethers.BigNumber.from(0)

      for (const id of ids) {
        const c = await eduPay.courses(id)
        courses.push({
          id: Number(id),
          title: c.title,
          description: c.description,
          chapterCount: Number(c.chapterCount),
          totalEarned: c.totalEarned.toString(),
          isActive: c.isActive,
        })
        earned = earned.add(c.totalEarned)
      }
      setTutorCourses(courses)
      setTotalEarned(ethers.utils.formatEther(earned))

      // Student purchased chapters — scan all courses
      const courseCount = await eduPay.courseCount()
      const purchased: PurchasedChapter[] = []
      for (let cid = 0; cid < Number(courseCount); cid++) {
        const c = await eduPay.courses(cid)
        for (let chid = 0; chid < Number(c.chapterCount); chid++) {
          const has = await eduPay.checkAccess(cid, chid, address)
          if (has) {
            const ch = await eduPay.getChapter(cid, chid)
            purchased.push({
              courseId: cid,
              courseTitle: c.title,
              chapterId: chid,
              chapterTitle: ch.title,
              price: ch.price.toString(),
            })
          }
        }
      }
      setPurchasedChapters(purchased)
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  const labelStyle = {
    fontSize: 10,
    color: "rgba(13,11,8,0.28)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.22em",
    fontWeight: 500,
  }

  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh", paddingTop: 120, paddingBottom: 96 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 64px" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 64 }}
        >
          <div style={{ ...labelStyle, marginBottom: 20 }}>Dashboard</div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 600, color: "#0D0B08", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: 16 }}>
            Your activity.
          </h1>
          {address && (
            <div style={{ fontSize: 12, color: "rgba(13,11,8,0.32)", fontFamily: "monospace" }}>
              {address}
            </div>
          )}
        </motion.div>

        {/* No wallet */}
        {!address && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ border: "1px solid rgba(13,11,8,0.1)", padding: 64, textAlign: "center" }}
          >
            <p style={{ color: "rgba(13,11,8,0.35)", fontSize: 15, marginBottom: 8, fontWeight: 300 }}>
              No wallet connected
            </p>
            <p style={{ color: "rgba(13,11,8,0.2)", fontSize: 13, marginBottom: 32 }}>
              Connect to view your tutor earnings and purchased lessons
            </p>
            <button
              onClick={connect}
              style={{ fontSize: 11, background: "#0D0B08", color: "#F2ECE2", padding: "14px 32px", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              Connect wallet
            </button>
          </motion.div>
        )}

        {address && (
          <>
            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid rgba(13,11,8,0.08)", marginBottom: 64 }}
            >
              {[
                { label: "Courses created", value: tutorCourses.length },
                { label: "Total earned", value: `${Number(totalEarned).toFixed(2)} cUSD` },
                { label: "Lessons purchased", value: purchasedChapters.length },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    padding: "40px 0",
                    paddingRight: i < 2 ? 48 : 0,
                    paddingLeft: i > 0 ? 48 : 0,
                    borderLeft: i > 0 ? "1px solid rgba(13,11,8,0.08)" : "none",
                  }}
                >
                  <div style={{ fontSize: 32, fontWeight: 600, color: i === 1 ? "#C4622D" : "#0D0B08", letterSpacing: "-0.02em", marginBottom: 8 }}>
                    {fetching ? "—" : stat.value}
                  </div>
                  <div style={{ ...labelStyle }}>{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 32, marginBottom: 48, borderBottom: "1px solid rgba(13,11,8,0.08)", paddingBottom: 0 }}>
              {(["tutor", "student"] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    fontSize: 11,
                    color: tab === t ? "#0D0B08" : "rgba(13,11,8,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    background: "none",
                    border: "none",
                    borderBottom: tab === t ? "1.5px solid #0D0B08" : "1.5px solid transparent",
                    paddingBottom: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: tab === t ? 500 : 400,
                    transition: "all 0.2s",
                  }}
                >
                  {t === "tutor" ? "My courses" : "Purchased lessons"}
                </button>
              ))}
            </div>

            {/* Tutor tab */}
            {tab === "tutor" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {fetching ? (
                  <div>
                    {[...Array(2)].map((_, i) => (
                      <div key={i} style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "32px 0" }}>
                        <div style={{ height: 10, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 48, marginBottom: 16 }} />
                        <div style={{ height: 18, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 180 }} />
                      </div>
                    ))}
                  </div>
                ) : tutorCourses.length === 0 ? (
                  <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "80px 0", textAlign: "center" }}>
                    <p style={{ color: "rgba(13,11,8,0.22)", fontSize: 15, marginBottom: 8, fontWeight: 300 }}>No courses yet</p>
                    <p style={{ color: "rgba(13,11,8,0.14)", fontSize: 13, marginBottom: 32 }}>Create your first course and start earning</p>
                    <Link
                      href="/create"
                      style={{ fontSize: 11, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.18em", textDecoration: "none", borderBottom: "1px solid rgba(196,98,45,0.3)", paddingBottom: 2 }}
                    >
                      Create a course
                    </Link>
                  </div>
                ) : (
                  <div>
                    {tutorCourses.map((course, i) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                      >
                        <Link href={`/course/${course.id}`} style={{ textDecoration: "none" }}>
                          <div
                            style={{
                              borderTop: "1px solid rgba(13,11,8,0.08)",
                              padding: "32px 0",
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: 32,
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ ...labelStyle, marginBottom: 12 }}>
                                {course.chapterCount} {course.chapterCount === 1 ? "lesson" : "lessons"}
                                {!course.isActive && (
                                  <span style={{ marginLeft: 12, color: "rgba(13,11,8,0.28)" }}>Inactive</span>
                                )}
                              </div>
                              <h3 style={{ fontSize: 18, fontWeight: 500, color: "#0D0B08", marginBottom: 8, lineHeight: 1.3 }}>
                                {course.title}
                              </h3>
                              <p style={{ fontSize: 13, color: "rgba(13,11,8,0.36)", lineHeight: 1.6, maxWidth: 400 }} className="line-clamp-1">
                                {course.description}
                              </p>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 20, fontWeight: 600, color: "#C4622D", letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
                                {Number(ethers.utils.formatEther(course.totalEarned)).toFixed(2)}
                                <span style={{ fontSize: 11, color: "rgba(196,98,45,0.4)", marginLeft: 4, fontWeight: 400 }}>cUSD</span>
                              </div>
                              <div style={{ ...labelStyle, marginTop: 4 }}>earned</div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)" }} />
                    <div style={{ paddingTop: 32, textAlign: "right" }}>
                      <Link
                        href="/create"
                        style={{ fontSize: 10, color: "rgba(13,11,8,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", textDecoration: "none", borderBottom: "1px solid rgba(13,11,8,0.1)", paddingBottom: 2 }}
                      >
                        + Create another course
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Student tab */}
            {tab === "student" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {fetching ? (
                  <div>
                    {[...Array(2)].map((_, i) => (
                      <div key={i} style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "32px 0" }}>
                        <div style={{ height: 10, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 48, marginBottom: 16 }} />
                        <div style={{ height: 18, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 180 }} />
                      </div>
                    ))}
                  </div>
                ) : purchasedChapters.length === 0 ? (
                  <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "80px 0", textAlign: "center" }}>
                    <p style={{ color: "rgba(13,11,8,0.22)", fontSize: 15, marginBottom: 8, fontWeight: 300 }}>No lessons purchased yet</p>
                    <p style={{ color: "rgba(13,11,8,0.14)", fontSize: 13, marginBottom: 32 }}>Browse courses and buy your first lesson</p>
                    <Link
                      href="/#courses"
                      style={{ fontSize: 11, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.18em", textDecoration: "none", borderBottom: "1px solid rgba(196,98,45,0.3)", paddingBottom: 2 }}
                    >
                      Browse courses
                    </Link>
                  </div>
                ) : (
                  <div>
                    {purchasedChapters.map((ch, i) => (
                      <motion.div
                        key={`${ch.courseId}-${ch.chapterId}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                      >
                        <Link href={`/course/${ch.courseId}`} style={{ textDecoration: "none" }}>
                          <div
                            style={{
                              borderTop: "1px solid rgba(13,11,8,0.08)",
                              padding: "28px 0",
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: 32,
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ ...labelStyle, marginBottom: 10 }}>
                                {ch.courseTitle} · Chapter {ch.chapterId + 1}
                              </div>
                              <h3 style={{ fontSize: 16, fontWeight: 500, color: "#0D0B08", lineHeight: 1.3 }}>
                                {ch.chapterTitle}
                              </h3>
                            </div>
                            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 16, paddingTop: 2 }}>
                              <div style={{ fontSize: 10, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 500 }}>
                                Unlocked
                              </div>
                              <div style={{ fontSize: 13, color: "rgba(13,11,8,0.3)", fontVariantNumeric: "tabular-nums" }}>
                                {Number(ethers.utils.formatEther(ch.price)).toFixed(2)} cUSD
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)" }} />
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}