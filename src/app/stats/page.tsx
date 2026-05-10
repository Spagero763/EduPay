"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { CELO_RPC, EDUPAY_ADDRESS, EDUPAY_ABI } from "@/lib/contract"
import { motion } from "framer-motion"
import Link from "next/link"

type CourseStats = {
  id: number
  title: string
  tutor: string
  chapterCount: number
  totalEarned: number // raw 6-decimal bigint as number
  isActive: boolean
}

type PurchaseEvent = {
  txHash: string
  courseTitle: string
  courseId: number
  type: "chapter" | "full"
  student: string
  amount: string
  blockNumber: number
}

type PlatformStats = {
  totalCourses: number
  activeCourses: number
  totalLessons: number
  grossVolumeUSD: string
  tutorPayoutsUSD: string
  platformFeesUSD: string
  totalPurchases: number
  uniqueStudents: number
  uniqueTutors: number
  platformFeePercent: number
  topCourses: CourseStats[]
  recentActivity: PurchaseEvent[]
  eventsLoaded: boolean
}

const DEPLOY_BLOCK = 63373514
const CELOSCAN = "https://celoscan.io"

const label: React.CSSProperties = {
  fontSize: 10,
  color: "rgba(13,11,8,0.28)",
  textTransform: "uppercase",
  letterSpacing: "0.24em",
  fontWeight: 500,
}

function StatCard({
  value,
  sublabel,
  accent = false,
  loading,
}: {
  value: string
  sublabel: string
  accent?: boolean
  loading: boolean
}) {
  return (
    <div style={{ padding: "40px 0" }}>
      {loading ? (
        <div style={{ height: 40, width: 120, background: "rgba(13,11,8,0.06)", borderRadius: 4, marginBottom: 10 }} />
      ) : (
        <div
          style={{
            fontSize: "clamp(1.8rem,4vw,2.8rem)",
            fontWeight: 600,
            color: accent ? "#C4622D" : "#0D0B08",
            letterSpacing: "-0.025em",
            marginBottom: 8,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
      )}
      <div style={label}>{sublabel}</div>
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const provider = new ethers.providers.JsonRpcProvider(CELO_RPC)
      const contract = new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, provider)

      const [courseCount, platformFeePercent] = await Promise.all([
        contract.courseCount(),
        contract.platformFeePercent(),
      ])

      const count = Number(courseCount)
      const feePercent = Number(platformFeePercent)

      const courses: CourseStats[] = []
      const tutorSet = new Set<string>()
      let totalEarned6 = ethers.BigNumber.from(0)
      let totalLessons = 0

      for (let i = 0; i < count; i++) {
        try {
          const c = await contract.courses(i)
          courses.push({
            id: i,
            title: c.title,
            tutor: c.tutor,
            chapterCount: Number(c.chapterCount),
            totalEarned: Number(c.totalEarned),
            isActive: c.isActive,
          })
          tutorSet.add(c.tutor.toLowerCase())
          totalEarned6 = totalEarned6.add(c.totalEarned)
          totalLessons += Number(c.chapterCount)
        } catch {}
      }

      const activeCourses = courses.filter(c => c.isActive).length
      const topCourses = [...courses]
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 5)

      const grossUSD = Number(ethers.utils.formatUnits(totalEarned6, 6))
      const tutorPayouts = grossUSD * ((100 - feePercent) / 100)
      const platformFees = grossUSD * (feePercent / 100)

      // Try to load events; gracefully degrade if RPC limits it
      let totalPurchases = 0
      let uniqueStudents = 0
      let recentActivity: PurchaseEvent[] = []
      let eventsLoaded = false

      try {
        const [chapterLogs, fullCourseLogs] = await Promise.all([
          contract.queryFilter(contract.filters.ChapterPurchased(), DEPLOY_BLOCK, "latest"),
          contract.queryFilter(contract.filters.FullCoursePurchased(), DEPLOY_BLOCK, "latest"),
        ])

        const studentSet = new Set<string>()
        const allEvents: PurchaseEvent[] = []

        const courseMap = new Map(courses.map(c => [c.id, c.title]))

        for (const log of chapterLogs) {
          const args = log.args!
          studentSet.add((args.student as string).toLowerCase())
          allEvents.push({
            txHash: log.transactionHash,
            courseId: Number(args.courseId),
            courseTitle: courseMap.get(Number(args.courseId)) ?? `Course #${args.courseId}`,
            type: "chapter",
            student: args.student as string,
            amount: Number(ethers.utils.formatUnits(args.amountPaid as ethers.BigNumber, 6)).toFixed(2),
            blockNumber: log.blockNumber,
          })
        }

        for (const log of fullCourseLogs) {
          const args = log.args!
          studentSet.add((args.student as string).toLowerCase())
          allEvents.push({
            txHash: log.transactionHash,
            courseId: Number(args.courseId),
            courseTitle: courseMap.get(Number(args.courseId)) ?? `Course #${args.courseId}`,
            type: "full",
            student: args.student as string,
            amount: Number(ethers.utils.formatUnits(args.totalPaid as ethers.BigNumber, 6)).toFixed(2),
            blockNumber: log.blockNumber,
          })
        }

        allEvents.sort((a, b) => b.blockNumber - a.blockNumber)

        totalPurchases = allEvents.length
        uniqueStudents = studentSet.size
        recentActivity = allEvents.slice(0, 10)
        eventsLoaded = true
      } catch (evtErr) {
        console.warn("Could not load events:", evtErr)
      }

      setStats({
        totalCourses: count,
        activeCourses,
        totalLessons,
        grossVolumeUSD: grossUSD.toFixed(2),
        tutorPayoutsUSD: tutorPayouts.toFixed(2),
        platformFeesUSD: platformFees.toFixed(2),
        totalPurchases,
        uniqueStudents,
        uniqueTutors: tutorSet.size,
        platformFeePercent: feePercent,
        topCourses,
        recentActivity,
        eventsLoaded,
      })
    } catch (err) {
      console.error(err)
      setError("Failed to load platform stats. Please refresh.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh", paddingTop: 120, paddingBottom: 96 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 64 }}
        >
          <div style={{ ...label, marginBottom: 20 }}>Live onchain data</div>
          <h1
            style={{
              fontSize: "clamp(2.2rem,6vw,4rem)",
              fontWeight: 600,
              color: "#0D0B08",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            Platform Stats.
          </h1>
          <p style={{ fontSize: 14, color: "rgba(13,11,8,0.38)", fontWeight: 300, maxWidth: 400, lineHeight: 1.8 }}>
            Real-time metrics from the EduPay smart contract on Celo mainnet.
          </p>
          <a
            href={`${CELOSCAN}/address/${EDUPAY_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 16,
              fontSize: 10,
              fontFamily: "monospace",
              color: "rgba(13,11,8,0.3)",
              borderBottom: "1px solid rgba(13,11,8,0.12)",
              paddingBottom: 2,
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
          >
            {EDUPAY_ADDRESS} ↗
          </a>
        </motion.div>

        {error && (
          <div style={{ color: "#C4622D", fontSize: 14, marginBottom: 32, padding: "16px 24px", border: "1px solid rgba(196,98,45,0.2)", background: "rgba(196,98,45,0.04)" }}>
            {error}
          </div>
        )}

        {/* Primary stats — 4 up top */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "1px solid rgba(13,11,8,0.1)",
            marginBottom: 2,
          }}
        >
          {[
            { value: stats ? `$${stats.grossVolumeUSD}` : "—", sublabel: "Total volume (USD)", accent: true },
            { value: stats ? `${stats.totalPurchases}` : "—", sublabel: "Total purchases" },
            { value: stats ? `${stats.uniqueStudents}` : "—", sublabel: "Unique students" },
            { value: stats ? `${stats.uniqueTutors}` : "—", sublabel: "Unique tutors" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                paddingLeft: i > 0 ? 32 : 0,
                paddingRight: i < 3 ? 32 : 0,
                borderLeft: i > 0 ? "1px solid rgba(13,11,8,0.08)" : "none",
              }}
            >
              <StatCard {...s} loading={loading} />
            </div>
          ))}
        </motion.div>

        {/* Secondary stats — platform health */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "1px solid rgba(13,11,8,0.08)",
            borderBottom: "1px solid rgba(13,11,8,0.08)",
            marginBottom: 80,
          }}
        >
          {[
            { value: stats ? `${stats.activeCourses}` : "—", sublabel: "Active courses" },
            { value: stats ? `${stats.totalLessons}` : "—", sublabel: "Total lessons" },
            { value: stats ? `$${stats.tutorPayoutsUSD}` : "—", sublabel: "Tutor payouts" },
            { value: stats ? `${stats.platformFeePercent}%` : "—", sublabel: "Platform fee" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                paddingLeft: i > 0 ? 32 : 0,
                paddingRight: i < 3 ? 32 : 0,
                borderLeft: i > 0 ? "1px solid rgba(13,11,8,0.06)" : "none",
              }}
            >
              <div style={{ padding: "28px 0" }}>
                {loading ? (
                  <div style={{ height: 28, width: 80, background: "rgba(13,11,8,0.05)", borderRadius: 4, marginBottom: 8 }} />
                ) : (
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#0D0B08", letterSpacing: "-0.02em", marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
                    {s.value}
                  </div>
                )}
                <div style={label}>{s.sublabel}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Two-column: Top Courses + Recent Activity */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>

          {/* Top Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div style={{ ...label, marginBottom: 32 }}>Top courses by earnings</div>

            {loading ? (
              <div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ borderTop: "1px solid rgba(13,11,8,0.07)", padding: "20px 0", display: "flex", justifyContent: "space-between" }}>
                    <div style={{ height: 14, width: 160, background: "rgba(13,11,8,0.05)", borderRadius: 4 }} />
                    <div style={{ height: 14, width: 60, background: "rgba(13,11,8,0.05)", borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            ) : stats && stats.topCourses.length > 0 ? (
              <div>
                {stats.topCourses.map((course, i) => (
                  <Link key={course.id} href={`/course/${course.id}`} style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        borderTop: "1px solid rgba(13,11,8,0.07)",
                        padding: "20px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "rgba(13,11,8,0.18)", fontVariantNumeric: "tabular-nums", width: 20, flexShrink: 0, fontWeight: 600 }}>
                        {(i + 1).toString().padStart(2, "0")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#0D0B08",
                            letterSpacing: "-0.005em",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: 4,
                          }}
                        >
                          {course.title}
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(13,11,8,0.22)", fontFamily: "monospace" }}>
                          {course.tutor.slice(0, 8)}... · {course.chapterCount} {course.chapterCount === 1 ? "lesson" : "lessons"}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#C4622D", fontVariantNumeric: "tabular-nums" }}>
                          ${(course.totalEarned / 1_000_000).toFixed(2)}
                        </div>
                        <div style={{ fontSize: 9, color: "rgba(13,11,8,0.22)", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 2 }}>
                          earned
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                <div style={{ borderTop: "1px solid rgba(13,11,8,0.07)" }} />
                <div style={{ paddingTop: 20 }}>
                  <Link
                    href="/#courses"
                    style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.18em", textDecoration: "none", borderBottom: "1px solid rgba(13,11,8,0.1)", paddingBottom: 2 }}
                  >
                    View all courses →
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ borderTop: "1px solid rgba(13,11,8,0.07)", padding: "40px 0", color: "rgba(13,11,8,0.2)", fontSize: 13, fontWeight: 300 }}>
                No courses yet
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <div style={{ ...label, marginBottom: 32 }}>Recent purchases</div>

            {loading ? (
              <div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ borderTop: "1px solid rgba(13,11,8,0.07)", padding: "20px 0" }}>
                    <div style={{ height: 12, width: 140, background: "rgba(13,11,8,0.05)", borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 10, width: 80, background: "rgba(13,11,8,0.04)", borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            ) : !stats?.eventsLoaded ? (
              <div style={{ borderTop: "1px solid rgba(13,11,8,0.07)", padding: "40px 0", color: "rgba(13,11,8,0.2)", fontSize: 13, fontWeight: 300 }}>
                Activity data unavailable.{" "}
                <a href={`${CELOSCAN}/address/${EDUPAY_ADDRESS}#events`} target="_blank" rel="noopener noreferrer" style={{ color: "#C4622D", textDecoration: "none" }}>
                  View on Celoscan ↗
                </a>
              </div>
            ) : stats.recentActivity.length === 0 ? (
              <div style={{ borderTop: "1px solid rgba(13,11,8,0.07)", padding: "40px 0", color: "rgba(13,11,8,0.2)", fontSize: 13, fontWeight: 300 }}>
                No purchases yet
              </div>
            ) : (
              <div>
                {stats.recentActivity.map((evt, i) => (
                  <div
                    key={`${evt.txHash}-${i}`}
                    style={{
                      borderTop: "1px solid rgba(13,11,8,0.07)",
                      padding: "18px 0",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#0D0B08",
                          marginBottom: 4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {evt.courseTitle}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(13,11,8,0.22)", fontFamily: "monospace" }}>
                        {evt.student.slice(0, 8)}...{evt.student.slice(-4)}
                        <span style={{ marginLeft: 8, fontFamily: "inherit", letterSpacing: "0.1em" }}>
                          {evt.type === "full" ? "Full course" : "Chapter"}
                        </span>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#C4622D", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>
                        ${evt.amount}
                      </div>
                      <a
                        href={`${CELOSCAN}/tx/${evt.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 9, color: "rgba(13,11,8,0.2)", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}
                        onClick={e => e.stopPropagation()}
                      >
                        Tx ↗
                      </a>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid rgba(13,11,8,0.07)" }} />
                <div style={{ paddingTop: 20 }}>
                  <a
                    href={`${CELOSCAN}/address/${EDUPAY_ADDRESS}#events`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.18em", textDecoration: "none", borderBottom: "1px solid rgba(13,11,8,0.1)", paddingBottom: 2 }}
                  >
                    All events on Celoscan ↗
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          style={{ marginTop: 80, paddingTop: 32, borderTop: "1px solid rgba(13,11,8,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}
        >
          <div style={{ fontSize: 11, color: "rgba(13,11,8,0.2)", letterSpacing: "0.05em" }}>
            Data sourced directly from Celo mainnet · Chain ID 42220
          </div>
          <button
            onClick={loadStats}
            style={{
              fontSize: 10,
              color: "rgba(13,11,8,0.35)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              background: "none",
              border: "1px solid rgba(13,11,8,0.12)",
              padding: "8px 20px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Refresh
          </button>
        </motion.div>

      </div>
    </div>
  )
}
