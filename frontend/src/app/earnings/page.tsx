"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { formatPrice } from "@/lib/formatPrice"
import { motion } from "framer-motion"

type CourseEarning = {
  id: number
  title: string
  isActive: boolean
  chapterCount: number
  totalEarned: ethers.BigNumber
}

export default function EarningsPage() {
  const { address, connect, loading, getEduPay } = useMiniPay()
  const [fetching, setFetching] = useState(true)
  const [courses, setCourses] = useState<CourseEarning[]>([])
  const [total, setTotal] = useState(ethers.BigNumber.from(0))

  useEffect(() => {
    if (loading || !address) { setFetching(false); return }
    load()
  }, [loading, address])

  async function load() {
    setFetching(true)
    try {
      const eduPay = getEduPay()
      const ids: number[] = await eduPay.getTutorCourses(address)
      if (ids.length === 0) { setCourses([]); setFetching(false); return }

      const raw = await Promise.all(ids.map(id => eduPay.courses(id)))
      let sum = ethers.BigNumber.from(0)
      const list: CourseEarning[] = raw.map((c, idx) => {
        const earned = ethers.BigNumber.from(c.totalEarned)
        sum = sum.add(earned)
        return {
          id: Number(ids[idx]),
          title: c.title,
          isActive: c.isActive,
          chapterCount: Number(c.chapterCount),
          totalEarned: earned,
        }
      })
      list.sort((a, b) => (b.totalEarned.gt(a.totalEarned) ? 1 : -1))
      setCourses(list)
      setTotal(sum)
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  const label = {
    fontSize: 10,
    color: "rgba(13,11,8,0.28)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.22em",
    fontWeight: 500,
  }

  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh", paddingTop: 120, paddingBottom: 96 }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px" }}>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 64 }}
        >
          <div style={{ ...label, marginBottom: 20 }}>
            <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Dashboard</Link>
            {" / "}Earnings
          </div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 600, color: "#0D0B08", letterSpacing: "-0.025em", lineHeight: 1.05, margin: 0 }}>
            Your earnings.
          </h1>
        </motion.div>

        {!address && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ border: "1px solid rgba(13,11,8,0.1)", padding: 64, textAlign: "center" }}
          >
            <p style={{ color: "rgba(13,11,8,0.35)", fontSize: 15, marginBottom: 32, fontWeight: 300 }}>
              Connect your wallet to view earnings
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
            {/* Total banner */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              style={{ borderTop: "1px solid rgba(13,11,8,0.08)", borderBottom: "1px solid rgba(13,11,8,0.08)", padding: "40px 0", marginBottom: 64, display: "flex", alignItems: "baseline", gap: 16 }}
            >
              <div style={{ fontSize: "clamp(2.4rem,7vw,4rem)", fontWeight: 700, color: "#C4622D", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {fetching ? "—" : `$${Number(ethers.utils.formatUnits(total, 6)).toFixed(2)}`}
              </div>
              <div style={{ ...label }}>Total earned across all courses</div>
            </motion.div>

            {/* Course breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div style={{ ...label, marginBottom: 24 }}>By course</div>

              {fetching ? (
                <div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "32px 0", display: "flex", justifyContent: "space-between" }}>
                      <div style={{ height: 16, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 200 }} />
                      <div style={{ height: 16, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 60 }} />
                    </div>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "80px 0", textAlign: "center" }}>
                  <p style={{ color: "rgba(13,11,8,0.22)", fontSize: 15, marginBottom: 8, fontWeight: 300 }}>No courses yet</p>
                  <p style={{ color: "rgba(13,11,8,0.14)", fontSize: 13, marginBottom: 32 }}>Create your first course to start earning</p>
                  <Link href="/create" style={{ fontSize: 11, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.18em", textDecoration: "none", borderBottom: "1px solid rgba(196,98,45,0.3)", paddingBottom: 2 }}>
                    Create a course
                  </Link>
                </div>
              ) : (
                <>
                  {courses.map((course, i) => {
                    const earned = Number(ethers.utils.formatUnits(course.totalEarned, 6))
                    const share = total.gt(0) ? (earned / Number(ethers.utils.formatUnits(total, 6))) * 100 : 0
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.06 }}
                      >
                        <Link href={`/course/${course.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "28px 0", cursor: "pointer" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginBottom: 14 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                  <h3 style={{ fontSize: 16, fontWeight: 500, color: "#0D0B08", margin: 0, lineHeight: 1.3 }}>
                                    {course.title}
                                  </h3>
                                  {!course.isActive && (
                                    <span style={{ fontSize: 9, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.14em", border: "1px solid rgba(13,11,8,0.12)", padding: "2px 6px" }}>
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                <div style={{ ...label }}>
                                  {course.chapterCount} {course.chapterCount === 1 ? "chapter" : "chapters"}
                                </div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontSize: 20, fontWeight: 700, color: earned > 0 ? "#C4622D" : "rgba(13,11,8,0.2)", letterSpacing: "-0.02em" }}>
                                  ${earned.toFixed(2)}
                                </div>
                                <div style={{ ...label, marginTop: 4 }}>
                                  {share > 0 ? `${share.toFixed(0)}% of total` : "no earnings yet"}
                                </div>
                              </div>
                            </div>
                            {/* Revenue bar */}
                            <div style={{ height: 3, background: "rgba(13,11,8,0.06)", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${share}%`, background: "#C4622D", borderRadius: 2, transition: "width 0.7s ease" }} />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                  <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)" }} />
                  <div style={{ paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ ...label }}>
                      {courses.length} {courses.length === 1 ? "course" : "courses"} total
                    </div>
                    <Link href="/create" style={{ fontSize: 10, color: "rgba(13,11,8,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", textDecoration: "none", borderBottom: "1px solid rgba(13,11,8,0.1)", paddingBottom: 2 }}>
                      + Create another
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
