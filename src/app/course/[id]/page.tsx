"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useParams, useRouter } from "next/navigation"
import { useMiniPay } from "@/hooks/useMiniPay"
import { parseError } from "@/lib/parseError"
import { formatPrice, isLegacyPrice } from "@/lib/formatPrice"
import { motion } from "framer-motion"

type Chapter = {
  id: number
  title: string
  price: string
  purchased: boolean
}

type CourseData = {
  tutor: string
  title: string
  description: string
  isActive: boolean
  chapterCount: number
  totalEarned: string
}

export default function CoursePage() {
  const { id } = useParams()
  const router = useRouter()
  const { address, connect, getEduPay, purchaseChapter, purchaseFullCourse, loading } = useMiniPay()

  const [course, setCourse] = useState<CourseData | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [fullPrice, setFullPrice] = useState<string>("0")
  const [fetching, setFetching] = useState(true)
  const [buying, setBuying] = useState<number | "full" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<Record<number, string>>({})

  const courseId = Number(id)

  async function fetchCourse() {
    try {
      const eduPay = getEduPay()
      const c = await eduPay.courses(courseId)
      setCourse({
        tutor: c.tutor,
        title: c.title,
        description: c.description,
        isActive: c.isActive,
        chapterCount: Number(c.chapterCount),
        totalEarned: c.totalEarned.toString(),
      })

      const chList: Chapter[] = []
      for (let i = 0; i < Number(c.chapterCount); i++) {
        const ch = await eduPay.getChapter(courseId, i)
        chList.push({
          id: i,
          title: ch.title,
          price: ch.priceUSD.toString(),
          purchased: ch.purchased,
        })
      }
      setChapters(chList)

      if (address) {
        const fp = await eduPay.getFullCoursePrice(courseId, address)
        setFullPrice(fp.toString())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (loading) return
    fetchCourse()
  }, [loading, address])

  async function handleBuyChapter(chapterId: number, price: string) {
    if (!address) { connect(); return }
    if (isLegacyPrice(price)) {
      setError("This chapter has an incorrect price set by the tutor and cannot be purchased. The tutor needs to update it.")
      return
    }
    setBuying(chapterId)
    setError(null)
    try {
      await purchaseChapter(courseId, chapterId, ethers.BigNumber.from(price))
      await fetchCourse()
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setBuying(null)
    }
  }

  async function handleBuyFull() {
    if (!address) { connect(); return }
    if (chapters.some(ch => isLegacyPrice(ch.price))) {
      setError("One or more chapters have an incorrect price and cannot be purchased. The tutor needs to update them.")
      return
    }
    setBuying("full")
    setError(null)
    try {
      await purchaseFullCourse(courseId, ethers.BigNumber.from(fullPrice))
      await fetchCourse()
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setBuying(null)
    }
  }

  async function handleReadChapter(chapterId: number) {
    try {
      const eduPay = getEduPay()
      const hash = await eduPay.getChapterContent(courseId, chapterId)
      setContent(prev => ({ ...prev, [chapterId]: hash }))
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch content.")
    }
  }

  const allPurchased = chapters.length > 0 && chapters.every(ch => ch.purchased)
  const someUnpurchased = chapters.some(ch => !ch.purchased)

  if (fetching) {
    return (
      <div style={{ background: "#F2ECE2", minHeight: "100vh", paddingTop: 120, paddingBottom: 96 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 64px" }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "40px 0" }}>
              <div style={{ height: 10, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 56, marginBottom: 20 }} />
              <div style={{ height: 20, background: "rgba(13,11,8,0.05)", borderRadius: 4, width: 200 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ background: "#F2ECE2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(13,11,8,0.3)", fontSize: 14 }}>Course not found.</p>
      </div>
    )
  }

  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh", paddingTop: 120, paddingBottom: 96 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 64px" }}>

        {/* Back */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push("/")}
          style={{
            fontSize: 10, color: "rgba(13,11,8,0.3)", textTransform: "uppercase",
            letterSpacing: "0.22em", background: "none", border: "none",
            cursor: "pointer", fontFamily: "inherit", marginBottom: 48, display: "block",
          }}
        >
          Back to courses
        </motion.button>

        {/* Course header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 64 }}
        >
          <div style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.24em", marginBottom: 16, fontWeight: 500 }}>
            {course.chapterCount} {course.chapterCount === 1 ? "lesson" : "lessons"}
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, color: "#0D0B08", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: 20 }}>
            {course.title}
          </h1>
          <p style={{ color: "rgba(13,11,8,0.4)", fontSize: 15, lineHeight: 1.7, maxWidth: 480, marginBottom: 24 }}>
            {course.description}
          </p>
          <div style={{ fontSize: 11, color: "rgba(13,11,8,0.28)", fontFamily: "monospace" }}>
            By {course.tutor.slice(0, 6)}...{course.tutor.slice(-4)}
          </div>
        </motion.div>

        {/* Buy full course banner */}
        {someUnpurchased && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              border: "1px solid rgba(13,11,8,0.1)",
              padding: "24px 32px",
              marginBottom: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 6 }}>
                Full course
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#0D0B08" }}>
                {formatPrice(fullPrice)}
                <span style={{ fontSize: 12, color: "rgba(13,11,8,0.35)", marginLeft: 6, fontWeight: 400 }}>cUSD</span>
              </div>
            </div>
            <button
              onClick={handleBuyFull}
              disabled={buying === "full"}
              style={{
                fontSize: 11, background: "#0D0B08", color: "#F2ECE2",
                padding: "14px 28px", textTransform: "uppercase",
                letterSpacing: "0.16em", fontWeight: 500, border: "none",
                cursor: "pointer", fontFamily: "inherit",
                opacity: buying === "full" ? 0.5 : 1,
              }}
            >
              {buying === "full" ? "Processing..." : "Buy all lessons"}
            </button>
          </motion.div>
        )}

        {error && (
          <p style={{ color: "#C4622D", fontSize: 12, marginBottom: 24, letterSpacing: "0.02em" }}>{error}</p>
        )}

        {/* Chapters */}
        <div>
          {chapters.map((ch, i) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{
                borderTop: "1px solid rgba(13,11,8,0.08)",
                padding: "32px 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "rgba(13,11,8,0.25)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 10 }}>
                    Chapter {i + 1}
                    {ch.purchased && (
                      <span style={{ marginLeft: 12, color: "#C4622D" }}>Unlocked</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 500, color: ch.purchased ? "#0D0B08" : "rgba(13,11,8,0.55)", marginBottom: 8 }}>
                    {ch.title}
                  </h3>
                  <div style={{ fontSize: 13, color: "#C4622D", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    {formatPrice(ch.price)}
                    <span style={{ color: "rgba(196,98,45,0.4)", fontSize: 11, marginLeft: 4 }}>cUSD</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, paddingTop: 4 }}>
                  {ch.purchased ? (
                    <>
                      {content[ch.id] ? (
                        
                         <a href={content[ch.id].replace("ipfs://", "https://ipfs.io/ipfs/")}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 10, color: "#C4622D",
                            textTransform: "uppercase", letterSpacing: "0.18em",
                            textDecoration: "none", borderBottom: "1px solid rgba(196,98,45,0.3)",
                            paddingBottom: 1,
                          }}
                        >
                          Open content
                        </a>
                      ) : (
                        <button
                          onClick={() => handleReadChapter(ch.id)}
                          style={{
                            fontSize: 10, color: "rgba(13,11,8,0.4)",
                            textTransform: "uppercase", letterSpacing: "0.18em",
                            background: "none", border: "none",
                            borderBottom: "1px solid rgba(13,11,8,0.12)",
                            paddingBottom: 1, cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          Read lesson
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleBuyChapter(ch.id, ch.price)}
                      disabled={buying === ch.id}
                      style={{
                        fontSize: 10, background: "#0D0B08", color: "#F2ECE2",
                        padding: "10px 20px", textTransform: "uppercase",
                        letterSpacing: "0.16em", fontWeight: 500,
                        border: "none", cursor: "pointer", fontFamily: "inherit",
                        opacity: buying === ch.id ? 0.5 : 1,
                      }}
                    >
                      {buying === ch.id ? "Buying..." : "Buy lesson"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)" }} />
        </div>

        {/* All purchased */}
        {allPurchased && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", paddingTop: 48 }}
          >
            <p style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.24em" }}>
              You own this course
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}