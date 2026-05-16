"use client"

import { use, useCallback, useEffect, useMemo, useState } from "react"
import { ethers } from "ethers"
import { useMiniPay } from "@/hooks/useMiniPay"
import { AddChapterPanel } from "@/components/AddChapterPanel"
import { formatPrice, isLegacyPrice } from "@/lib/formatPrice"
import { parseError } from "@/lib/parseError"
import { toast } from "@/components/Toast"

type Chapter = {
  id: number
  title: string
  priceUSD6: ethers.BigNumber
  hasAccess: boolean
}

type Receipt = {
  type: "chapter" | "full"
  chapterTitle?: string
  amount: string
  chapterId?: number
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
      const json = decodeURIComponent(
        escape(atob(hash.replace("data:application/json;base64,", "")))
      )
      const data = JSON.parse(json)

      return (
        <div className="reader-body">
          {data.title && <h2 className="reader-title">{data.title}</h2>}

          {data.blocks?.map((block: any, i: number) => {
            if (block.type === "heading") {
              return (
                <h3 key={i} className="reader-h1">
                  {block.content}
                </h3>
              )
            }

            if (block.type === "subheading") {
              return (
                <h4 key={i} className="reader-h2">
                  {block.content}
                </h4>
              )
            }

            if (block.type === "imageUrl" && block.content) {
              return (
                <figure key={i} className="reader-figure">
                  <img
                    src={block.content}
                    alt="Lesson image"
                    className="reader-image"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </figure>
              )
            }

            if (block.type === "text") {
              return (
                <p key={i} className="reader-paragraph">
                  {block.content}
                </p>
              )
            }

            if (block.type === "code") {
              return (
                <pre key={i} className="reader-codewrap">
                  <code>{block.content}</code>
                </pre>
              )
            }

            if (block.type === "url" && block.content) {
              return (
                <p key={i} className="reader-paragraph">
                  <a
                    href={block.content}
                    target="_blank"
                    rel="noreferrer"
                    className="reader-link"
                  >
                    {block.content}
                  </a>
                </p>
              )
            }

            return null
          })}
        </div>
      )
    } catch {
      return <p className="muted">Could not parse chapter content.</p>
    }
  }

  return <p className="muted">Unsupported chapter format.</p>
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const courseId = Number(id)
  const isValidCourseId = Number.isInteger(courseId) && courseId >= 0

  const {
    address,
    loading: walletLoading,
    connect,
    isConnected,
    paymentToken,
    setPaymentToken,
    getPublicEduPay,
    purchaseChapter,
    purchaseFullCourse,
    getChapterContent,
    toggleCourse,
  } = useMiniPay()

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null)
  const [selectedContent, setSelectedContent] = useState("")
  const [loadingContentId, setLoadingContentId] = useState<number | null>(null)
  const [purchasingChapterId, setPurchasingChapterId] = useState<number | null>(null)
  const [buyingFullCourse, setBuyingFullCourse] = useState(false)
  const [addingChapter, setAddingChapter] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState("")
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const loadData = useCallback(async () => {
    if (!isValidCourseId) {
      setError("Invalid course id")
      return
    }

    try {
      const eduPay = getPublicEduPay()
      const c = await eduPay.courses(courseId)

      const nextCourse: Course = {
        tutor: c[0],
        title: c[1],
        description: c[2],
        isActive: c[3],
        chapterCount: Number(c[4]),
      }
      setCourse(nextCourse)

      const wallet = address?.toLowerCase()
      const tutor = nextCourse.tutor.toLowerCase()
      const isTutor = !!wallet && wallet === tutor

      const list: Chapter[] = await Promise.all(
        Array.from({ length: nextCourse.chapterCount }, async (_, i) => {
          const [ch, hasAccess] = await Promise.all([
            eduPay.getChapter(courseId, i),
            isTutor ? Promise.resolve(true) : wallet ? eduPay.checkAccess(courseId, i, wallet) : Promise.resolve(false),
          ])
          return {
            id: i,
            title: ch[0],
            priceUSD6: ethers.BigNumber.from(ch[1]),
            hasAccess,
          }
        })
      )

      setChapters(list)
    } catch (err: any) {
      setError(parseError(err))
    }
  }, [address, courseId, getPublicEduPay, isValidCourseId])

  useEffect(() => {
    if (!walletLoading) {
      loadData()
    }
  }, [walletLoading, loadData])

  const isTutor = useMemo(() => {
    if (!address || !course) return false
    return address.toLowerCase() === course.tutor.toLowerCase()
  }, [address, course])

  const remaining = useMemo(() => chapters.filter((c) => !c.hasAccess), [chapters])

  const remainingTotal6 = useMemo(
    () =>
      remaining.reduce(
        (sum, c) => (isLegacyPrice(c.priceUSD6) ? sum : sum.add(c.priceUSD6)),
        ethers.BigNumber.from(0)
      ),
    [remaining]
  )

  const selectedChapter = useMemo(
    () => chapters.find((c) => c.id === selectedChapterId) ?? null,
    [chapters, selectedChapterId]
  )

  async function handleBuyChapter(chapter: Chapter) {
    if (!isConnected) {
      connect()
      return
    }

    if (isLegacyPrice(chapter.priceUSD6)) {
      setError(
        "This chapter uses legacy pricing. Ask the tutor to update this chapter price before purchase."
      )
      return
    }

    setError("")
    setPurchasingChapterId(chapter.id)

    try {
      await purchaseChapter(courseId, chapter.id, chapter.priceUSD6)
      await loadData()
      setReceipt({ type: "chapter", chapterTitle: chapter.title, amount: formatPrice(chapter.priceUSD6), chapterId: chapter.id })
      toast("Chapter unlocked! Start reading now.", "success")
    } catch (err: any) {
      const msg = parseError(err)
      setError(msg)
      toast(msg, "error")
    } finally {
      setPurchasingChapterId(null)
    }
  }

  async function handleBuyFullCourse() {
    if (!isConnected) {
      connect()
      return
    }

    if (remaining.length === 0) return

    if (remaining.some((c) => isLegacyPrice(c.priceUSD6))) {
      setError(
        "One or more chapters use legacy pricing. Tutor needs to update chapter prices first."
      )
      return
    }

    setError("")
    setBuyingFullCourse(true)

    try {
      await purchaseFullCourse(courseId, remainingTotal6)
      await loadData()
      setReceipt({ type: "full", amount: Number(ethers.utils.formatUnits(remainingTotal6, 6)).toFixed(2) })
      toast("Full course unlocked! Happy learning.", "success")
    } catch (err: any) {
      const msg = parseError(err)
      setError(msg)
      toast(msg, "error")
    } finally {
      setBuyingFullCourse(false)
    }
  }

  async function handleReadChapter(chapter: Chapter) {
    if (!chapter.hasAccess) return

    setError("")
    setSelectedChapterId(chapter.id)
    setLoadingContentId(chapter.id)

    try {
      const content = await getChapterContent(courseId, chapter.id)
      setSelectedContent(content)
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setLoadingContentId(null)
    }
  }

  async function handleToggleCourse() {
    if (!course) return
    setError("")
    setToggling(true)
    try {
      await toggleCourse(courseId)
      await loadData()
      toast(course.isActive ? "Course deactivated and hidden from listing." : "Course reactivated.", "info")
    } catch (err: any) {
      const msg = parseError(err)
      setError(msg)
      toast(msg, "error")
    } finally {
      setToggling(false)
    }
  }

  function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: course?.title, text: course?.description, url }).catch(() => null)
    } else {
      navigator.clipboard.writeText(url).then(() => toast("Link copied to clipboard!", "success")).catch(() => toast("Could not copy link.", "error"))
    }
  }

  if (!isValidCourseId) return <div className="state">Invalid course id</div>
  if (!course) return <div className="state">Loading...</div>

  return (
    <div className="page">
      <div className="container">
        <header className="hero">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <div className="eyebrow" style={{ marginBottom: 0 }}>Course</div>
            <button
              onClick={handleShare}
              style={{
                background: "none", border: "1px solid rgba(13,11,8,0.12)", cursor: "pointer",
                padding: "6px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(13,11,8,0.45)", display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit", borderRadius: 2,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="13" cy="3" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="13" cy="13" r="1.5"/>
                <line x1="4.4" y1="7.2" x2="11.5" y2="4"/><line x1="4.4" y1="8.8" x2="11.5" y2="12"/>
              </svg>
              Share
            </button>
          </div>
          <h1 className="headline">{course.title}</h1>
          <p className="description">{course.description}</p>
          <div className="author">By {course.tutor}</div>

          {/* Progress bar — shown to connected students */}
          {!isTutor && address && chapters.length > 0 && (() => {
            const unlocked = chapters.filter(c => c.hasAccess).length
            const total = chapters.length
            const pct = Math.round((unlocked / total) * 100)
            return (
              <div className="progress-wrap">
                <div className="progress-label">
                  <span>{unlocked} of {total} {total === 1 ? "chapter" : "chapters"} unlocked</span>
                  <span className="progress-pct">{pct}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                {unlocked === total && (
                  <div className="progress-complete">Course complete</div>
                )}
              </div>
            )
          })()}

          {isTutor && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
              <button className="ghost-btn" onClick={() => setAddingChapter(true)}>
                + Add chapter
              </button>
              <button
                className="ghost-btn"
                onClick={handleToggleCourse}
                disabled={toggling}
                style={{ opacity: course.isActive ? 1 : 0.6, borderColor: course.isActive ? "rgba(196,98,45,0.3)" : "rgba(32,26,20,0.2)" }}
              >
                {toggling ? "Updating..." : course.isActive ? "Deactivate course" : "Reactivate course"}
              </button>
              {!course.isActive && (
                <span style={{ fontSize: 11, color: "#8a3d17", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  ⚠ Hidden from listing
                </span>
              )}
            </div>
          )}
        </header>

        <section className="layout">
          <article className="reader-card">
            {!selectedChapter && (
              <>
                <div className="eyebrow">Reader</div>
                <h2 className="placeholder-title">Pick a chapter to read</h2>
                <p className="placeholder-copy">
                  Unlocked chapters open here in a clean editorial layout, similar to a
                  newsletter reading experience.
                </p>
              </>
            )}

            {selectedChapter && (
              <>
                <div className="eyebrow">Chapter {selectedChapter.id + 1}</div>
                <h2 className="selected-title">{selectedChapter.title}</h2>
                {loadingContentId === selectedChapter.id ? (
                  <p className="muted">Loading chapter content...</p>
                ) : (
                  renderContent(selectedContent)
                )}
              </>
            )}
          </article>

          <aside className="sidebar">
            <div className="panel">
              <div className="panel-label">Access</div>
              {remaining.length === 0 ? (
                <div className="access-full">You have full access to all chapters.</div>
              ) : (
                <>
                  <div className="remaining-copy">
                    {remaining.length} chapter{remaining.length > 1 ? "s" : ""} remaining
                  </div>
                  <div className="remaining-price">
                    ${Number(ethers.utils.formatUnits(remainingTotal6, 6)).toFixed(2)} {paymentToken}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {(["USDC", "CUSD"] as const).map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => setPaymentToken(token)}
                        style={{
                          border: token === paymentToken ? "1px solid #8a3d17" : "1px solid rgba(32, 26, 20, 0.2)",
                          background: token === paymentToken ? "rgba(138, 61, 23, 0.08)" : "transparent",
                          color: "#201a14",
                          padding: "6px 10px",
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                        }}
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                  <button
                    className="primary-btn"
                    onClick={handleBuyFullCourse}
                    disabled={buyingFullCourse}
                  >
                    {buyingFullCourse ? "Purchasing..." : "Buy full course"}
                  </button>
                </>
              )}
            </div>

            <div className="panel">
              {chapters.map((ch) => (
                <div key={ch.id} className="chapter-row">
                  <div className="row-meta">Chapter {ch.id + 1}</div>
                  <div className="row-title">{ch.title}</div>
                  <div className="row-bottom">
                    <div className="row-price">${formatPrice(ch.priceUSD6)} {paymentToken}</div>
                    {ch.hasAccess ? (
                      <button className="ghost-btn small" onClick={() => handleReadChapter(ch)}>
                        Read
                      </button>
                    ) : (
                      <button
                        className="primary-btn small"
                        onClick={() => handleBuyChapter(ch)}
                        disabled={purchasingChapterId === ch.id}
                      >
                        {purchasingChapterId === ch.id ? "Buying..." : "Buy"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        {addingChapter && (
          <AddChapterPanel
            courseId={courseId}
            existingCount={chapters.length}
            onDone={() => {
              setAddingChapter(false)
              loadData()
            }}
          />
        )}

        {error && <p className="error">{error}</p>}
      </div>

      {/* Purchase receipt modal */}
      {receipt && (
        <div className="receipt-overlay" onClick={() => setReceipt(null)}>
          <div className="receipt-modal" onClick={e => e.stopPropagation()}>
            <div className="receipt-check">✓</div>
            <div className="receipt-eyebrow">
              {receipt.type === "full" ? "Full course unlocked" : "Chapter unlocked"}
            </div>
            <h2 className="receipt-title">
              {receipt.type === "full" ? course?.title : receipt.chapterTitle}
            </h2>
            <div className="receipt-amount">${receipt.amount} <span className="receipt-token">{receipt.type === "full" ? "paid" : "paid"}</span></div>
            <div className="receipt-actions">
              {receipt.type === "chapter" && receipt.chapterId !== undefined && (
                <button
                  className="primary-btn"
                  style={{ width: "auto", padding: "12px 28px" }}
                  onClick={() => {
                    const ch = chapters.find(c => c.id === receipt.chapterId)
                    if (ch) handleReadChapter(ch)
                    setReceipt(null)
                  }}
                >
                  Start reading →
                </button>
              )}
              {receipt.type === "full" && (
                <button
                  className="primary-btn"
                  style={{ width: "auto", padding: "12px 28px" }}
                  onClick={() => {
                    const first = chapters.find(c => c.hasAccess)
                    if (first) handleReadChapter(first)
                    setReceipt(null)
                  }}
                >
                  Start reading →
                </button>
              )}
              <button
                className="ghost-btn"
                style={{ width: "auto", padding: "12px 20px" }}
                onClick={() => setReceipt(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: radial-gradient(circle at 10% -10%, #fff7ee 0%, #f4ece3 36%, #efe6db 100%);
          color: #201a14;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 24px 90px;
        }

        .hero {
          margin-bottom: 34px;
        }

        .eyebrow {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(32, 26, 20, 0.45);
          margin-bottom: 10px;
        }

        .headline {
          margin: 0;
          font-size: clamp(2rem, 4.5vw, 3.6rem);
          line-height: 1.05;
          letter-spacing: -0.03em;
          font-weight: 800;
        }

        .description {
          margin-top: 16px;
          max-width: 760px;
          font-size: 18px;
          line-height: 1.75;
          color: rgba(32, 26, 20, 0.74);
        }

        .author {
          margin-top: 12px;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(32, 26, 20, 0.45);
        }

        .progress-wrap {
          margin-top: 24px;
          max-width: 420px;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(32, 26, 20, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 8px;
        }

        .progress-pct {
          color: #8a3d17;
          font-weight: 600;
        }

        .progress-track {
          height: 4px;
          background: rgba(32, 26, 20, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #C4622D;
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        .progress-complete {
          margin-top: 8px;
          font-size: 10px;
          color: #8a3d17;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-weight: 600;
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 28px;
          align-items: start;
        }

        .reader-card {
          background: #fffaf4;
          border: 1px solid rgba(32, 26, 20, 0.1);
          padding: 36px clamp(18px, 3vw, 56px);
          min-height: 540px;
        }

        .placeholder-title {
          font-size: 34px;
          line-height: 1.14;
          letter-spacing: -0.02em;
          margin: 0 0 12px;
        }

        .placeholder-copy {
          font-size: 17px;
          line-height: 1.8;
          color: rgba(32, 26, 20, 0.72);
          max-width: 640px;
        }

        .selected-title {
          margin: 0 0 24px;
          font-size: 42px;
          letter-spacing: -0.03em;
          line-height: 1.05;
        }

        .sidebar {
          position: sticky;
          top: 22px;
        }

        .panel {
          background: #fff;
          border: 1px solid rgba(32, 26, 20, 0.1);
          padding: 14px;
          margin-bottom: 14px;
        }

        .panel-label {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(32, 26, 20, 0.45);
          margin-bottom: 10px;
        }

        .access-full {
          font-size: 14px;
          color: #8a3d17;
          font-weight: 600;
        }

        .remaining-copy {
          font-size: 14px;
          color: rgba(32, 26, 20, 0.7);
          margin-bottom: 10px;
        }

        .remaining-price {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 14px;
        }

        .chapter-row {
          border-bottom: 1px solid rgba(32, 26, 20, 0.08);
          padding: 12px 8px;
        }

        .chapter-row:last-child {
          border-bottom: none;
        }

        .row-meta {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(32, 26, 20, 0.45);
          margin-bottom: 6px;
        }

        .row-title {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.35;
          margin-bottom: 8px;
        }

        .row-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .row-price {
          font-size: 13px;
          color: rgba(32, 26, 20, 0.65);
        }

        .primary-btn,
        .ghost-btn {
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.18s ease;
        }

        .primary-btn {
          width: 100%;
          border: none;
          background: #8a3d17;
          color: #fffaf4;
        }

        .primary-btn:disabled {
          cursor: default;
          opacity: 0.55;
        }

        .ghost-btn {
          border: 1px solid rgba(32, 26, 20, 0.2);
          background: transparent;
          color: #201a14;
        }

        .small {
          width: auto;
          padding: 8px 12px;
          font-size: 10px;
        }

        .reader-body {
          color: #201a14;
          font-size: 17px;
          line-height: 1.9;
        }

        .reader-title {
          font-size: 30px;
          margin: 0 0 26px;
          letter-spacing: -0.02em;
        }

        .reader-h1 {
          font-size: 28px;
          margin: 34px 0 16px;
          letter-spacing: -0.02em;
        }

        .reader-h2 {
          font-size: 21px;
          margin: 28px 0 14px;
          letter-spacing: -0.01em;
        }

        .reader-paragraph {
          margin: 16px 0;
        }

        .reader-figure {
          margin: 32px 0;
        }

        .reader-image {
          width: 100%;
          display: block;
          max-height: 500px;
          object-fit: contain;
        }

        .reader-codewrap {
          margin: 22px 0;
          padding: 16px;
          overflow-x: auto;
          background: #f4ede4;
          border: 1px solid rgba(28, 22, 16, 0.08);
          font-size: 13px;
          line-height: 1.6;
        }

        .reader-link {
          color: #8a3d17;
          text-decoration: underline;
        }

        .muted {
          color: rgba(32, 26, 20, 0.55);
        }

        .state {
          padding: 40px;
          color: rgba(32, 26, 20, 0.7);
        }

        .error {
          margin-top: 14px;
          color: #c04f20;
          font-size: 14px;
        }

        .receipt-overlay {
          position: fixed;
          inset: 0;
          background: rgba(13, 11, 8, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }

        .receipt-modal {
          background: #fffaf4;
          border: 1px solid rgba(32, 26, 20, 0.1);
          padding: 48px 40px;
          max-width: 420px;
          width: 100%;
          text-align: center;
        }

        .receipt-check {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #C4622D;
          color: #fffaf4;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }

        .receipt-eyebrow {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(32, 26, 20, 0.4);
          margin-bottom: 12px;
        }

        .receipt-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin: 0 0 20px;
          color: #201a14;
        }

        .receipt-amount {
          font-size: 32px;
          font-weight: 700;
          color: #C4622D;
          letter-spacing: -0.02em;
          margin-bottom: 32px;
        }

        .receipt-token {
          font-size: 13px;
          color: rgba(196, 98, 45, 0.5);
          font-weight: 400;
        }

        .receipt-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        @media (max-width: 980px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: static;
          }

          .reader-card {
            min-height: 380px;
          }

          .selected-title {
            font-size: 33px;
          }
        }
      `}</style>
    </div>
  )
}
