"use client"

import { useEffect, useState, useCallback } from "react"
import { ethers } from "ethers"
import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { CELO_RPC, EDUPAY_ABI, EDUPAY_ADDRESS } from "@/lib/contract"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"

type Chapter = {
  id: number
  title: string
  priceUSD6: ethers.BigNumber
  contentHash: string
  hasAccess: boolean
}

type Course = {
  tutor: string
  title: string
  description: string
  isActive: boolean
  chapterCount: number
}

function renderContent(hash: string): React.ReactNode {
  if (!hash) return null

  if (hash.startsWith("data:application/json;base64,")) {
    try {
      const json = decodeURIComponent(escape(atob(hash.replace("data:application/json;base64,", ""))))
      const data = JSON.parse(json) as {
        title?: string
        blocks: Array<{ id: string; type: string; content: string }>
      }
      return (
        <div style={{ fontFamily: "'Georgia', serif" }}>
          {data.title && (
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0D0B08", marginBottom: 28, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              {data.title}
            </h2>
          )}
          {data.blocks?.map((block, i) => {
            if (block.type === "heading") return <h3 key={i} style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0D0B08", margin: "40px 0 16px", lineHeight: 1.2 }}>{block.content}</h3>
            if (block.type === "subheading") return <h4 key={i} style={{ fontSize: "1.15rem", fontWeight: 600, color: "#0D0B08", margin: "28px 0 12px" }}>{block.content}</h4>
            if (block.type === "text") return <p key={i} style={{ fontSize: 17, lineHeight: 1.85, color: "rgba(13,11,8,0.78)", marginBottom: 22, whiteSpace: "pre-wrap", fontWeight: 400 }}>{block.content}</p>
            if (block.type === "code") return (
              <pre key={i} style={{ background: "rgba(13,11,8,0.04)", border: "1px solid rgba(13,11,8,0.08)", padding: "20px 24px", fontSize: 13, lineHeight: 1.7, overflow: "auto", fontFamily: "monospace", marginBottom: 24 }}>
                <code>{block.content}</code>
              </pre>
            )
            if ((block.type === "imageUrl" || block.type === "image") && block.content?.startsWith("http")) {
              return (
                <figure key={i} style={{ margin: "32px 0" }}>
                  <img src={block.content} alt="" style={{ width: "100%", display: "block", maxHeight: 500, objectFit: "contain" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                </figure>
              )
            }
            if (block.type === "url" && block.content) return (
              <div key={i} style={{ margin: "24px 0", padding: "16px 20px", border: "1px solid rgba(13,11,8,0.1)", background: "rgba(13,11,8,0.02)" }}>
                <div style={{ fontSize: 9, color: "rgba(13,11,8,0.3)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8 }}>Resource</div>
                <a href={block.content} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "#C4622D", textDecoration: "none", wordBreak: "break-all" }}>{block.content}</a>
              </div>
            )
            return null
          })}
        </div>
      )
    } catch { return <p style={{ color: "rgba(13,11,8,0.4)", fontSize: 14 }}>Could not render content.</p> }
  }

  if (hash.startsWith("data:text/plain;base64,")) {
    try {
      const text = decodeURIComponent(escape(atob(hash.replace("data:text/plain;base64,", ""))))
      return <p style={{ fontSize: 17, lineHeight: 1.85, color: "rgba(13,11,8,0.75)", whiteSpace: "pre-wrap", fontFamily: "'Georgia', serif" }}>{text}</p>
    } catch { return null }
  }

  if (hash.startsWith("ipfs://")) {
    const cid = hash.replace("ipfs://", "")
    return <a href={`https://gateway.pinata.cloud/ipfs/${cid}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#C4622D", textDecoration: "none" }}>View on IPFS →</a>
  }

  if (hash.startsWith("http")) {
    return (
      <div style={{ padding: "20px 24px", border: "1px solid rgba(13,11,8,0.1)", background: "rgba(13,11,8,0.02)" }}>
        <div style={{ fontSize: 9, color: "rgba(13,11,8,0.3)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10 }}>External content</div>
        <a href={hash} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "#C4622D", textDecoration: "none" }}>Open lesson content →</a>
      </div>
    )
  }

  return null
}

const L: React.CSSProperties = {
  fontSize: 10, color: "rgba(13,11,8,0.28)",
  textTransform: "uppercase", letterSpacing: "0.24em", fontWeight: 500,
}

export default function CoursePage() {
  const params = useParams()
  const courseId = Number(params.id)
  const { address, loading: walletLoading, connect, isConnected, purchaseChapter, purchaseFullCourse, getChapterContent } = useMiniPay()

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [fullPrice6, setFullPrice6] = useState(ethers.BigNumber.from(0))
  const [fetching, setFetching] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState("")
  const [buying, setBuying] = useState<number | "full" | null>(null)
  const [loadingChapter, setLoadingChapter] = useState<number | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)

  // Load with retry — fixes race condition after course creation
  const loadData = useCallback(async (retryCount = 0) => {
    if (retryCount === 0) {
      setFetching(true)
      setError("")
      setNotFound(false)
    }

    try {
      const provider = new ethers.providers.JsonRpcProvider(CELO_RPC)
      const contract = new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, provider)

      // Get course count — with retry if 0 (race condition after creation)
      let totalCourses = 0
      try {
        const count = await contract.courseCount()
        totalCourses = Number(count)
      } catch (e) {
        if (retryCount < 3) {
          await new Promise(r => setTimeout(r, 3000))
          return loadData(retryCount + 1)
        }
        setError("Could not connect to Celo network. Please refresh.")
        setFetching(false)
        return
      }

      if (isNaN(courseId) || courseId < 0) {
        setNotFound(true)
        setFetching(false)
        return
      }

      // If courseId >= totalCourses, maybe it's a timing issue — retry up to 3 times
      if (courseId >= totalCourses) {
        if (retryCount < 3) {
          await new Promise(r => setTimeout(r, 3000))
          return loadData(retryCount + 1)
        }
        setNotFound(true)
        setFetching(false)
        return
      }

      // Load course
      const c = await contract.courses(courseId)
      const tutor = c[0] || c.tutor || ""
      const title = c[1] || c.title || ""
      const description = c[2] || c.description || ""
      const isActive = c[3] ?? c.isActive ?? true
      const chapterCount = Number(c[4] ?? c.chapterCount ?? 0)

      if (!tutor || tutor === ethers.constants.AddressZero) {
        if (retryCount < 3) {
          await new Promise(r => setTimeout(r, 3000))
          return loadData(retryCount + 1)
        }
        setNotFound(true)
        setFetching(false)
        return
      }

      setCourse({ tutor, title, description, isActive, chapterCount })

      // Load chapters
      const list: Chapter[] = []
      for (let i = 0; i < chapterCount; i++) {
        try {
          const ch = await contract.getChapter(courseId, i)
          const chTitle = ch[0] || ch.title || `Chapter ${i + 1}`
          const priceRaw = ch[1] ?? ch.priceUSD ?? 0

          let hasAccess = false
          if (address) {
            try { hasAccess = await contract.checkAccess(courseId, i, address) } catch {}
          }

          list.push({
            id: i,
            title: chTitle,
            priceUSD6: ethers.BigNumber.from(priceRaw.toString()),
            contentHash: "",
            hasAccess,
          })
        } catch (chErr) {
          console.warn(`Chapter ${i} load error:`, chErr)
        }
      }
      setChapters(list)

      // Full course price for connected user
      if (address && list.length > 0) {
        try {
          const remaining = await contract.getFullCoursePrice(courseId, address)
          setFullPrice6(ethers.BigNumber.from(remaining.toString()))
        } catch {}
      }

    } catch (err: any) {
      console.error("loadData error:", err)
      setError("Failed to load course. Please refresh.")
    } finally {
      setFetching(false)
    }
  }, [courseId, address])

  useEffect(() => {
    if (!walletLoading) loadData()
  }, [walletLoading, loadData])

  async function handleBuyChapter(chapter: Chapter) {
    if (!isConnected) { connect(); return }
    setBuying(chapter.id)
    setError("")
    try {
      // priceUSD6 is in 6 decimals, cUSD is 18 decimals — multiply by 1e12
      const priceIn18 = chapter.priceUSD6.mul(ethers.BigNumber.from("1000000000000"))
      await purchaseChapter(courseId, chapter.id, priceIn18)
      await loadData()
    } catch (err: any) {
      setError(err?.reason || err?.message || "Purchase failed. Please try again.")
    } finally {
      setBuying(null)
    }
  }

  async function handleBuyFull() {
    if (!isConnected) { connect(); return }
    setBuying("full")
    setError("")
    try {
      const priceIn18 = fullPrice6.mul(ethers.BigNumber.from("1000000000000"))
      await purchaseFullCourse(courseId, priceIn18)
      await loadData()
    } catch (err: any) {
      setError(err?.reason || err?.message || "Purchase failed. Please try again.")
    } finally {
      setBuying(null)
    }
  }

  async function openChapter(chapter: Chapter) {
    if (chapter.contentHash) { setSelectedChapter(chapter.id); return }
    setLoadingChapter(chapter.id)
    try {
      const hash = await getChapterContent(courseId, chapter.id)
      setChapters(prev => prev.map(ch => ch.id === chapter.id ? { ...ch, contentHash: hash } : ch))
      setSelectedChapter(chapter.id)
    } catch (err: any) {
      setError(err?.message || "Could not load lesson. Please try again.")
    } finally {
      setLoadingChapter(null)
    }
  }

  const allPurchased = chapters.length > 0 && chapters.every(ch => ch.hasAccess)
  const anyPurchased = chapters.some(ch => ch.hasAccess)
  const displayFullPrice = Number(ethers.utils.formatUnits(fullPrice6, 6)).toFixed(2)
  const activeChapter = chapters.find(ch => ch.id === selectedChapter)

  if (fetching) {
    return (
      <div style={{ background: "#F2ECE2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...L, marginBottom: 12 }}>Loading course...</div>
          <div style={{ fontSize: 12, color: "rgba(13,11,8,0.25)", fontWeight: 300 }}>Connecting to Celo network</div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ background: "#F2ECE2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...L, marginBottom: 20 }}>Course not found</div>
          <p style={{ fontSize: 14, color: "rgba(13,11,8,0.4)", marginBottom: 32, fontWeight: 300 }}>
            This course doesn't exist yet on the blockchain.
          </p>
          <Link href="/" style={{ fontSize: 11, color: "#0D0B08", textTransform: "uppercase", letterSpacing: "0.18em", textDecoration: "none", borderBottom: "1px solid rgba(13,11,8,0.2)", paddingBottom: 2 }}>
            ← Back to courses
          </Link>
        </div>
      </div>
    )
  }

  if (!course) return null

  // Reader view
  if (selectedChapter !== null && activeChapter) {
    return (
      <div style={{ background: "#F2ECE2", minHeight: "100vh" }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(242,236,226,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(13,11,8,0.08)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setSelectedChapter(null)} style={{ fontSize: 10, color: "rgba(13,11,8,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            ← Back
          </button>
          <div style={{ ...L }}>Lesson {activeChapter.id + 1} of {chapters.length}</div>
          <div style={{ display: "flex", gap: 16 }}>
            {activeChapter.id > 0 && chapters[activeChapter.id - 1]?.hasAccess && (
              <button onClick={() => openChapter(chapters[activeChapter.id - 1])} style={{ fontSize: 10, color: "rgba(13,11,8,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                ← Prev
              </button>
            )}
            {activeChapter.id < chapters.length - 1 && chapters[activeChapter.id + 1]?.hasAccess && (
              <button onClick={() => openChapter(chapters[activeChapter.id + 1])} style={{ fontSize: 10, color: "rgba(13,11,8,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                Next →
              </button>
            )}
          </div>
        </div>

        <article style={{ maxWidth: 680, margin: "0 auto", padding: "90px 24px 120px" }}>
          <header style={{ marginBottom: 48, paddingBottom: 40, borderBottom: "1px solid rgba(13,11,8,0.08)" }}>
            <div style={{ ...L, color: "#C4622D", marginBottom: 16 }}>{course.title} · Lesson {activeChapter.id + 1}</div>
            <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 700, color: "#0D0B08", lineHeight: 1.15, letterSpacing: "-0.025em", marginBottom: 24, fontFamily: "'Georgia', serif" }}>
              {activeChapter.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#C4622D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, color: "#F2ECE2", fontWeight: 700 }}>E</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08" }}>EduPay</div>
                <div style={{ fontSize: 11, color: "rgba(13,11,8,0.3)" }}>{course.tutor.slice(0, 10)}...{course.tutor.slice(-6)}</div>
              </div>
            </div>
          </header>

          <div>
            {activeChapter.contentHash ? renderContent(activeChapter.contentHash) : (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ ...L }}>Loading content...</div>
              </div>
            )}
          </div>

          <footer style={{ marginTop: 80, paddingTop: 32, borderTop: "1px solid rgba(13,11,8,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ ...L }}>End of lesson {activeChapter.id + 1} · EduPay on Celo</div>
              {activeChapter.id < chapters.length - 1 && (
                chapters[activeChapter.id + 1]?.hasAccess ? (
                  <button onClick={() => openChapter(chapters[activeChapter.id + 1])}
                    style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#F2ECE2", background: "#C4622D", border: "none", padding: "12px 24px", cursor: "pointer", fontFamily: "inherit" }}>
                    Next lesson →
                  </button>
                ) : (
                  <button onClick={() => setSelectedChapter(null)}
                    style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#0D0B08", background: "transparent", border: "1px solid rgba(13,11,8,0.15)", padding: "12px 24px", cursor: "pointer", fontFamily: "inherit" }}>
                    Purchase next lesson
                  </button>
                )
              )}
            </div>
          </footer>
        </article>
      </div>
    )
  }

  // Course overview
  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh" }}>

      {/* Header */}
      <section style={{ padding: "100px 24px 56px", borderBottom: "1px solid rgba(13,11,8,0.08)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Link href="/" style={{ ...L, textDecoration: "none", display: "inline-block", marginBottom: 32 }}>← All courses</Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div style={{ ...L, color: "#C4622D", marginBottom: 16 }}>
              {chapters.length} {chapters.length === 1 ? "lesson" : "lessons"}
            </div>
            <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.05, color: "#0D0B08", marginBottom: 20, fontFamily: "'Georgia', serif" }}>
              {course.title}
            </h1>
            <p style={{ fontSize: 16, fontWeight: 300, color: "rgba(13,11,8,0.5)", lineHeight: 1.8, maxWidth: 600, marginBottom: 28 }}>
              {course.description}
            </p>
            <div style={{ fontSize: 11, color: "rgba(13,11,8,0.25)", fontFamily: "monospace" }}>
              {course.tutor.slice(0, 14)}...{course.tutor.slice(-6)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Buy all banner */}
      {address && !allPurchased && fullPrice6.gt(0) && (
        <div style={{ background: "#0D0B08", padding: "18px 24px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#F2ECE2", marginBottom: 4 }}>
                Get all {chapters.length} lessons for {displayFullPrice} cUSD
              </div>
              <div style={{ fontSize: 11, color: "rgba(242,236,226,0.4)" }}>Best value — instant access to everything</div>
            </div>
            <button onClick={handleBuyFull} disabled={buying === "full"}
              style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#F2ECE2", background: "#C4622D", border: "none", padding: "13px 28px", cursor: buying === "full" ? "default" : "pointer", fontFamily: "inherit", opacity: buying === "full" ? 0.6 : 1, whiteSpace: "nowrap" }}>
              {buying === "full" ? "Purchasing..." : `Buy all — ${displayFullPrice} cUSD`}
            </button>
          </div>
        </div>
      )}

      {/* Connect prompt */}
      {!address && (
        <div style={{ background: "rgba(13,11,8,0.04)", borderBottom: "1px solid rgba(13,11,8,0.08)", padding: "14px 24px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "rgba(13,11,8,0.45)", fontWeight: 300 }}>Connect your wallet to purchase lessons</span>
            <button onClick={connect} style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#0D0B08", background: "transparent", border: "1px solid rgba(13,11,8,0.2)", padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}>
              Connect wallet
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(196,98,45,0.06)", borderBottom: "1px solid rgba(196,98,45,0.2)", padding: "12px 24px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", fontSize: 13, color: "#C4622D" }}>{error}</div>
        </div>
      )}

      {/* Chapters list */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 120px" }}>
        <div style={{ ...L, marginBottom: 32 }}>Course content</div>

        {chapters.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", borderTop: "1px solid rgba(13,11,8,0.08)" }}>
            <div style={{ ...L }}>No lessons added yet</div>
          </div>
        ) : (
          <div>
            {chapters.map((chapter, i) => {
              const price = Number(ethers.utils.formatUnits(chapter.priceUSD6, 6)).toFixed(2)
              const isBuying = buying === chapter.id
              const isLoadingContent = loadingChapter === chapter.id

              return (
                <motion.div key={chapter.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  style={{ borderTop: "1px solid rgba(13,11,8,0.08)", padding: "24px 0" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    {/* Chapter number */}
                    <div style={{ width: 36, height: 36, background: chapter.hasAccess ? "#C4622D" : "rgba(13,11,8,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: chapter.hasAccess ? "#F2ECE2" : "rgba(13,11,8,0.35)" }}>
                        {i + 1}
                      </span>
                    </div>

                    {/* Chapter info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0D0B08", lineHeight: 1.3, marginBottom: 4, letterSpacing: "-0.01em" }}>
                        {chapter.title}
                      </h3>
                      {chapter.hasAccess && (
                        <div style={{ fontSize: 10, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500 }}>✓ Purchased</div>
                      )}
                    </div>

                    {/* Action */}
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      {chapter.hasAccess ? (
                        <button onClick={() => openChapter(chapter)} disabled={isLoadingContent}
                          style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#F2ECE2", background: "#0D0B08", border: "none", padding: "10px 20px", cursor: isLoadingContent ? "default" : "pointer", fontFamily: "inherit", opacity: isLoadingContent ? 0.6 : 1 }}>
                          {isLoadingContent ? "Loading..." : "Read lesson →"}
                        </button>
                      ) : (
                        <>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#0D0B08" }}>
                            {price} <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(13,11,8,0.35)" }}>cUSD</span>
                          </div>
                          <button onClick={() => handleBuyChapter(chapter)} disabled={isBuying || !address}
                            style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#F2ECE2", background: isBuying ? "rgba(196,98,45,0.5)" : "#C4622D", border: "none", padding: "10px 20px", cursor: isBuying || !address ? "default" : "pointer", fontFamily: "inherit" }}>
                            {!address ? "Connect wallet" : isBuying ? "Purchasing..." : "Buy lesson"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
            <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)" }} />

            {anyPurchased && (
              <div style={{ marginTop: 32, padding: "20px 24px", background: "rgba(196,98,45,0.06)", border: "1px solid rgba(196,98,45,0.15)" }}>
                <div style={{ ...L, color: "#C4622D", marginBottom: 6 }}>
                  {chapters.filter(c => c.hasAccess).length} of {chapters.length} lessons purchased
                </div>
                <p style={{ fontSize: 13, color: "rgba(13,11,8,0.5)", fontWeight: 300 }}>Click "Read lesson" to start learning.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}