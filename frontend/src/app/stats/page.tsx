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
  totalEarned: number
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
    setLoading(true)
    setError(null)
    try {
      const provider = new ethers.providers.JsonRpcProvider(CELO_RPC)
      const contract = new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, provider)

      const [courseCount, platformFeePercent] = await Promise.all([
        contract.courseCount(),
        contract.platformFeePercent(),
      ])

      const count = Number(courseCount)
      const feePercent = Number(platformFeePercent)

      const rawCourses = await Promise.all(
        Array.from({ length: count }, (_, i) => contract.courses(i).catch(() => null))
      )
      const courses: CourseStats[] = []
      const tutorSet = new Set<string>()
      let totalEarned6 = ethers.BigNumber.from(0)
      let totalLessons = 0
      rawCourses.forEach((c, i) => {
        if (!c) return
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
      })

      const activeCourses = courses.filter(c => c.isActive).length
      const topCourses = [...courses]
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 5)

      const grossUSD = Number(ethers.utils.formatUnits(totalEarned6, 6))
      const tutorPayouts = grossUSD * ((100 - feePercent) / 100)
      const platformFees = grossUSD * (feePercent / 100)

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

        const cusdAddr = "0x765de816845861e75a25fca122bb6898b8b1282a"
        function fmtAmount(raw: ethers.BigNumber, tokenAddr: string): string {
          const decimals = tokenAddr.toLowerCase() === cusdAddr ? 18 : 6
          return Number(ethers.utils.formatUnits(raw, decimals)).toFixed(2)
        }

        for (const log of chapterLogs) {
          const args = log.args!
          studentSet.add((args.student as string).toLowerCase())
          allEvents.push({
            txHash: log.transactionHash,
            courseId: Number(args.courseId),
            courseTitle: courseMap.get(Number(args.courseId)) ?? `Course #${args.courseId}`,
            type: "chapter",
            student: args.student as string,
            amount: fmtAmount(args.amountPaid as ethers.BigNumber, args.token as string),
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
            amount: fmtAmount(args.totalPaid as ethers.BigNumber, args.token as string),
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

        {/* Primary stats */}
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

        {/* Secondary stats */}
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

        {/* Recent Activity — full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ marginBottom: 80 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div style={{ ...label }}>Recent purchases</div>
            {stats?.eventsLoaded && (
              <a href={`${CELOSCAN}/address/${EDUPAY_ADDRESS}#events`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.18em", borderBottom: "1px solid rgba(13,11,8,0.1)", paddingBottom: 1 }}>
                View all on Celoscan ↗
              </a>
            )}
          </div>

          {loading ? (
            <div>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ borderTop: "1px solid rgba(13,11,8,0.07)", padding: "20px 0", display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ height: 12, width: "40%", background: "rgba(13,11,8,0.05)", borderRadius: 4 }} />
                  <div style={{ height: 12, width: "20%", background: "rgba(13,11,8,0.04)", borderRadius: 4 }} />
                  <div style={{ marginLeft: "auto", height: 12, width: 60, background: "rgba(13,11,8,0.05)", borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : !stats?.eventsLoaded ? (
            <div style={{ borderTop: "1px solid rgba(13,11,8,0.07)", padding: "48px 0", textAlign: "center" }}>
              <p style={{ color: "rgba(13,11,8,0.2)", fontSize: 13, fontWeight: 300, marginBottom: 12 }}>Activity data unavailable</p>
              <a href={`${CELOSCAN}/address/${EDUPAY_ADDRESS}#events`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#C4622D", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.16em" }}>
                View on Celoscan ↗
              </a>
            </div>
          ) : stats.recentActivity.length === 0 ? (
            <div style={{ borderTop: "1px solid rgba(13,11,8,0.07)", padding: "48px 0", textAlign: "center", color: "rgba(13,11,8,0.2)", fontSize: 13, fontWeight: 300 }}>
              No purchases yet
            </div>
          ) : (
            <div>
              {stats.recentActivity.map((evt, i) => (
                <a
                  key={`${evt.txHash}-${i}`}
                  href={`${CELOSCAN}/tx/${evt.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div style={{
                    borderTop: "1px solid rgba(13,11,8,0.07)",
                    padding: "16px 0",
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto auto",
                    alignItems: "center",
                    gap: 24,
                  }}>
                    {/* Course title + student */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#0D0B08", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {evt.courseTitle}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", fontFamily: "monospace" }}>
                        {evt.student.slice(0, 10)}...{evt.student.slice(-4)}
                      </div>
                    </div>
                    {/* Type badge */}
                    <span style={{
                      fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase",
                      padding: "4px 10px", borderRadius: 2, flexShrink: 0,
                      background: evt.type === "full" ? "rgba(196,98,45,0.1)" : "rgba(13,11,8,0.06)",
                      color: evt.type === "full" ? "#C4622D" : "rgba(13,11,8,0.45)",
                    }}>
                      {evt.type === "full" ? "Full course" : "Chapter"}
                    </span>
                    {/* Amount */}
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#C4622D", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                      ${evt.amount}
                    </div>
                    {/* Tx link arrow */}
                    <div style={{ fontSize: 10, color: "rgba(13,11,8,0.2)", flexShrink: 0 }}>↗</div>
                  </div>
                </a>
              ))}
              <div style={{ borderTop: "1px solid rgba(13,11,8,0.07)" }} />
            </div>
          )}
        </motion.div>

        {/* Top Courses — full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div style={{ ...label }}>Top courses by earnings</div>
            <Link href="/#courses" style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.18em", borderBottom: "1px solid rgba(13,11,8,0.1)", paddingBottom: 1 }}>
              Browse all →
            </Link>
          </div>

          {loading ? (
            <div>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ borderTop: "1px solid rgba(13,11,8,0.07)", padding: "20px 0", display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ height: 14, width: "50%", background: "rgba(13,11,8,0.05)", borderRadius: 4 }} />
                  <div style={{ marginLeft: "auto", height: 14, width: 60, background: "rgba(13,11,8,0.05)", borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : stats && stats.topCourses.length > 0 ? (
            <div>
              {stats.topCourses.map((course, i) => (
                <Link key={course.id} href={`/course/${course.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{
                    borderTop: "1px solid rgba(13,11,8,0.07)",
                    padding: "18px 0",
                    display: "grid",
                    gridTemplateColumns: "28px 1fr auto",
                    alignItems: "center",
                    gap: 20,
                  }}>
                    <div style={{ fontSize: 11, color: "rgba(13,11,8,0.18)", fontVariantNumeric: "tabular-nums", fontWeight: 700, letterSpacing: "0.04em" }}>
                      {(i + 1).toString().padStart(2, "0")}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#0D0B08", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.005em" }}>
                        {course.title}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(13,11,8,0.25)", fontFamily: "monospace" }}>
                        {course.tutor.slice(0, 10)}... · {course.chapterCount} {course.chapterCount === 1 ? "lesson" : "lessons"}
                        {!course.isActive && <span style={{ marginLeft: 8, color: "rgba(13,11,8,0.2)" }}>· Inactive</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#C4622D", fontVariantNumeric: "tabular-nums" }}>
                        ${(course.totalEarned / 1_000_000).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(13,11,8,0.22)", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 2 }}>earned</div>
                    </div>
                  </div>
                </Link>
              ))}
              <div style={{ borderTop: "1px solid rgba(13,11,8,0.07)" }} />
            </div>
          ) : (
            <div style={{ borderTop: "1px solid rgba(13,11,8,0.07)", padding: "48px 0", textAlign: "center", color: "rgba(13,11,8,0.2)", fontSize: 13, fontWeight: 300 }}>
              No courses yet
            </div>
          )}
        </motion.div>

        {/* Footer */}
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
