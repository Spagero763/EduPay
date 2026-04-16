"use client"

import { useEffect, useState, useCallback } from "react"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { motion } from "framer-motion"

type Chapter = {
  id: number
  title: string
  priceUSD6: ethers.BigNumber  // 6 decimals
  contentHash: string
  hasAccess: boolean
  content: string | null
}

type Course = {
  tutor: string
  title: string
  description: string
  isActive: boolean
  chapterCount: number
}

function decodeContent(hash: string): React.ReactNode {
  if (!hash) return null

  // Multi-block JSON v2
  if (hash.startsWith("data:application/json;base64,")) {
    try {
      const json = decodeURIComponent(escape(atob(hash.replace("data:application/json;base64,", ""))))
      const data = JSON.parse(json) as { title?: string; blocks: Array<{ id: string; type: string; content: string }> }
      return (
        <div>
          {data.title && (
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#0D0B08", marginBottom: 24, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              {data.title}
            </h1>
          )}
          {data.blocks?.map((block, i) => {
            if (block.type === "heading") return <h2 key={i} style={{ fontSize: "1.6rem", fontWeight: 600, color: "#0D0B08", margin: "32px 0 12px", lineHeight: 1.2 }}>{block.content}</h2>
            if (block.type === "subheading") return <h3 key={i} style={{ fontSize: "1.2rem", fontWeight: 500, color: "#0D0B08", margin: "24px 0 8px" }}>{block.content}</h3>
            if (block.type === "text") return <p key={i} style={{ fontSize: 16, lineHeight: 1.85, color: "rgba(13,11,8,0.75)", marginBottom: 20, whiteSpace: "pre-wrap", fontWeight: 300 }}>{block.content}</p>
            if (block.type === "code") return <pre key={i} style={{ background: "rgba(13,11,8,0.04)", border: "1px solid rgba(13,11,8,0.08)", padding: "20px", fontSize: 13, lineHeight: 1.7, overflow: "auto", fontFamily: "monospace", marginBottom: 20 }}><code>{block.content}</code></pre>
            if (block.type === "image" && block.content) return <figure key={i} style={{ margin: "24px 0" }}><img src={block.content} alt="" style={{ width: "100%", display: "block" }} /></figure>
            if (block.type === "url" && block.content) return (
              <div key={i} style={{ margin: "20px 0", padding: "16px 20px", border: "1px solid rgba(13,11,8,0.1)", background: "rgba(13,11,8,0.02)" }}>
                <div style={{ fontSize: 9, color: "rgba(13,11,8,0.3)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8 }}>Resource</div>
                <a href={block.content} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "#C4622D", textDecoration: "none", wordBreak: "break-all" }}>{block.content}</a>
              </div>
            )
            return null
          })}
        </div>
      )
    } catch { return null }
  }

  if (hash.startsWith("data:text/plain;base64,")) {
    try {
      const text = decodeURIComponent(escape(atob(hash.replace("data:text/plain;base64,", ""))))
      return <p style={{ fontSize: 16, lineHeight: 1.85, color: "rgba(13,11,8,0.75)", whiteSpace: "pre-wrap", fontWeight: 300 }}>{text}</p>
    } catch { return null }
  }

  if (hash.startsWith("data:image/")) {
    return <img src={hash} alt="Lesson" style={{ width: "100%", display: "block" }} />
  }

  if (hash.startsWith("http")) {
    return (
      <div style={{ padding: "24px", border: "1px solid rgba(13,11,8,0.1)", background: "rgba(13,11,8,0.02)" }}>
        <div style={{ fontSize: 9, color: "rgba(13,11,8,0.3)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 }}>External resource</div>
        <a href={hash} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.15em", textDecoration: "none", borderBottom: "1px solid rgba(196,98,45,0.3)", paddingBottom: 2 }}
        >
          Open content →
        </a>
      </div>
    )
  }

  if (hash.startsWith("ipfs://")) {
    const cid = hash.replace("ipfs://", "")
    return (
      <a href={`https://gateway.pinata.cloud/ipfs/${cid}`} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 13, color: "#C4622D", textDecoration: "none" }}
      >
        View on IPFS →
      </a>
    )
  }

  return <p style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(13,11,8,0.3)", wordBreak: "break-all" }}>{hash}</p>
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, color: "rgba(13,11,8,0.28)",
  textTransform: "uppercase", letterSpacing: "0.24em", fontWeight: 500,
}

const btnPrimary: React.CSSProperties = {
  fontSize: 10, fontWeight: 500, letterSpacing: "0.2em",
  textTransform: "uppercase", color: "#F2ECE2",
  background: "#0D0B08", border: "none",
  padding: "13px 28px", cursor: "pointer",
  fontFamily: "inherit", transition: "opacity 0.2s",
  display: "inline-block", textDecoration: "none",
}

const btnTerracotta: React.CSSProperties = {
  fontSize: 10, fontWeight: 500, letterSpacing: "0.2em",
  textTransform: "uppercase", color: "#F2ECE2",
  background: "#C4622D", border: "none",
  padding: "13px 28px", cursor: "pointer",
  fontFamily: "inherit", transition: "opacity 0.2s",
}

export default function CoursePage({ params }: { params: { id: string } }) {
  const courseId = Number(params.id)
  const { address, loading: walletLoading, connect, purchaseChapter, purchaseFullCourse, getChapterContent, getEduPay } = useMiniPay()

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [fullPrice6, setFullPrice6] = useState<ethers.BigNumber>(ethers.BigNumber.from(0))
  const [fetching, setFetching] = useState(true)
  const [buying, setBuying] = useState<number | null>(null) // chapter id being bought
  const [buyingFull, setBuyingFull] = useState(false)
  const [error, setError] = useState("")
  const [loadingContent, setLoadingContent] = useState<number | null>(null)

  const loadCourse = useCallback(async () => {
    setFetching(true)
    try {
      const eduPay = getEduPay(false)
      const c = await eduPay.courses(courseId)
      const count = Number(c.chapterCount)

      setCourse({
        tutor: c.tutor,
        title: c.title,
        description: c.description,
        isActive: c.isActive,
        chapterCount: count,
      })

      const chapterList: Chapter[] = []
      for (let i = 0; i < count; i++) {
        try {
          const [title, priceUSD6] = await eduPay.getChapter(courseId, i)
          let hasAccess = false
          if (address) {
            hasAccess = await eduPay.checkAccess(courseId, i, address)
          }
          chapterList.push({ id: i, title, priceUSD6, contentHash: "", hasAccess, content: null })
        } catch {}
      }
      setChapters(chapterList)

      if (address) {
        try {
          const remaining = await eduPay.getFullCoursePrice(courseId, address)
          setFullPrice6(remaining)
        } catch {}
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFetching(false)
    }
  }, [courseId, address])

  useEffect(() => {
    if (!walletLoading) loadCourse()
  }, [walletLoading, loadCourse])

  async function handleBuyChapter(chapter: Chapter) {
    if (!address) { connect(); return }
    setBuying(chapter.id)
    setError("")
    try {
      // priceUSD6 is 6 decimals; multiply by 1e12 to get 18 decimals for cUSD approval
      const priceIn18 = chapter.priceUSD6.mul(ethers.BigNumber.from("1000000000000"))
      await purchaseChapter(courseId, chapter.id, priceIn18)
      await loadCourse()
    } catch (err: any) {
      setError(err?.reason || err?.message || "Purchase failed")
    } finally {
      setBuying(null)
    }
  }

  async function handleBuyFull() {
    if (!address) { connect(); return }
    setBuyingFull(true)
    setError("")
    try {
      const priceIn18 = fullPrice6.mul(ethers.BigNumber.from("1000000000000"))
      await purchaseFullCourse(courseId, priceIn18)
      await loadCourse()
    } catch (err: any) {
      setError(err?.reason || err?.message || "Purchase failed")
    } finally {
      setBuyingFull(false)
    }
  }

  async function handleLoadContent(chapter: Chapter) {
    if (!address) { connect(); return }
    setLoadingContent(chapter.id)
    try {
      const hash = await getChapterContent(courseId, chapter.id)
      setChapters(prev => prev.map(ch =>
        ch.id === chapter.id ? { ...ch, contentHash: hash } : ch
      ))
    } catch (err: any) {
      setError(err?.message || "Could not load content")
    } finally {
      setLoadingContent(null)
    }
  }

  const allPurchased = chapters.length > 0 && chapters.every(ch => ch.hasAccess)
  const displayFullPrice = Number(ethers.utils.formatUnits(fullPrice6, 6)).toFixed(2)

  if (fetching) {
    return (
      <div style={{ background: "#F2ECE2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...labelStyle }}>Loading course...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ background: "#F2ECE2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>
          <div style={{ ...labelStyle, marginBottom: 16 }}>Course not found</div>
          <Link href="/" style={{ ...btnPrimary, textDecoration: "none" }}>← Back to courses</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh" }}>

      {/* Course header */}
      <section style={{ borderBottom: "1px solid rgba(13,11,8,0.08)", padding: "120px 40px 60px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Link href="/" style={{ ...labelStyle, textDecoration: "none", display: "inline-block", marginBottom: 32 }}>
              ← All courses
            </Link>
            <div style={{ ...labelStyle, color: "#C4622D", marginBottom: 16 }}>
              {chapters.length} {chapters.length === 1 ? "lesson" : "lessons"}
            </div>
            <h1 style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 700, letterSpacing: "-0.025em",
              lineHeight: 1.05, color: "#0D0B08", marginBottom: 20,
            }}>
              {course.title}
            </h1>
            <p style={{ fontSize: 16, fontWeight: 300, color: "rgba(13,11,8,0.5)", lineHeight: 1.8, marginBottom: 32, maxWidth: 600 }}>
              {course.description}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(13,11,8,0.25)" }}>
                by {course.tutor.slice(0, 10)}...{course.tutor.slice(-6)}
              </div>
              {!address && (
                <button onClick={connect} style={btnPrimary}>Connect to purchase</button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Buy full course banner */}
      {address && !allPurchased && fullPrice6.gt(0) && (
        <div style={{ background: "#0D0B08", padding: "20px 40px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#F2ECE2", marginBottom: 4 }}>
                Get all lessons for {displayFullPrice} cUSD
              </div>
              <div style={{ fontSize: 11, color: "rgba(242,236,226,0.4)", letterSpacing: "0.1em" }}>
                Best value — instant access to everything
              </div>
            </div>
            <button
              onClick={handleBuyFull}
              disabled={buyingFull}
              style={{ ...btnTerracotta, opacity: buyingFull ? 0.6 : 1 }}
            >
              {buyingFull ? "Purchasing..." : `Buy all for ${displayFullPrice} cUSD`}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(196,98,45,0.08)", borderBottom: "1px solid rgba(196,98,45,0.2)", padding: "14px 40px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", fontSize: 13, color: "#C4622D" }}>
            {error}
          </div>
        </div>
      )}

      {/* Chapters */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "60px 40px 120px" }}>
        <div style={{ ...labelStyle, marginBottom: 40 }}>Course lessons</div>

        {chapters.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", borderTop: "1px solid rgba(13,11,8,0.08)" }}>
            <div style={{ ...labelStyle }}>No lessons added yet</div>
          </div>
        ) : (
          <div>
            {chapters.map((chapter, i) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.6 }}
                style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "32px 0" }}
              >
                {/* Chapter header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...labelStyle, marginBottom: 10 }}>
                      Lesson {i + 1}
                      {chapter.hasAccess && (
                        <span style={{ marginLeft: 12, color: "#C4622D" }}>✓ Unlocked</span>
                      )}
                    </div>
                    <h3 style={{
                      fontSize: 20, fontWeight: 600, color: "#0D0B08",
                      lineHeight: 1.25, letterSpacing: "-0.01em",
                    }}>
                      {chapter.title}
                    </h3>
                  </div>

                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#0D0B08", marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>
                      {Number(ethers.utils.formatUnits(chapter.priceUSD6, 6)).toFixed(2)}
                      <span style={{ fontSize: 11, color: "rgba(13,11,8,0.3)", marginLeft: 4, fontWeight: 400 }}>cUSD</span>
                    </div>

                    {chapter.hasAccess ? (
                      !chapter.contentHash ? (
                        <button
                          onClick={() => handleLoadContent(chapter)}
                          disabled={loadingContent === chapter.id}
                          style={btnPrimary}
                        >
                          {loadingContent === chapter.id ? "Loading..." : "Read lesson"}
                        </button>
                      ) : null
                    ) : (
                      address ? (
                        <button
                          onClick={() => handleBuyChapter(chapter)}
                          disabled={buying === chapter.id}
                          style={{ ...btnTerracotta, opacity: buying === chapter.id ? 0.6 : 1 }}
                        >
                          {buying === chapter.id ? "Purchasing..." : "Buy lesson"}
                        </button>
                      ) : (
                        <button onClick={connect} style={btnPrimary}>
                          Connect to buy
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Chapter content (shown after reading) */}
                {chapter.hasAccess && chapter.contentHash && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      marginTop: 32,
                      padding: "40px",
                      background: "#FAFAF7",
                      border: "1px solid rgba(13,11,8,0.07)",
                    }}
                  >
                    {/* Article header */}
                    <div style={{ borderBottom: "1px solid rgba(13,11,8,0.08)", paddingBottom: 24, marginBottom: 32 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#C4622D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 14, color: "#F2ECE2", fontWeight: 700 }}>E</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08" }}>EduPay</div>
                          <div style={{ fontSize: 11, color: "rgba(13,11,8,0.3)" }}>Lesson {i + 1} of {chapters.length}</div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ maxWidth: 640 }}>
                      {decodeContent(chapter.contentHash)}
                    </div>

                    {/* Article footer */}
                    <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)", marginTop: 48, paddingTop: 24 }}>
                      <div style={{ ...labelStyle }}>
                        End of lesson {i + 1} · EduPay on Celo
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}

            <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)" }} />
          </div>
        )}
      </section>
    </div>
  )
}