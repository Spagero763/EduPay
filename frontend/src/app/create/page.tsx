"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import { useMiniPay } from "@/hooks/useMiniPay"
import { ChapterEditor } from "@/components/ChapterEditor"
import { motion } from "framer-motion"

type ChapterDraft = {
  title: string
  contentEncoded: string
  priceUSD: string
}

const label: React.CSSProperties = {
  fontSize: 10, color: "rgba(13,11,8,0.3)",
  textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 500,
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "transparent", border: "none",
  borderBottom: "1px solid rgba(13,11,8,0.12)",
  padding: "12px 0", color: "#0D0B08",
  fontFamily: "inherit", outline: "none", lineHeight: 1.6,
  transition: "border-color 0.2s",
}

export default function CreatePage() {
  const router = useRouter()
  const { address, connect, isConnected, createCourse, addChapter } = useMiniPay()

  const [step, setStep] = useState<"details" | "chapters" | "publishing">("details")
  const [courseTitle, setCourseTitle] = useState("")
  const [courseDescription, setCourseDescription] = useState("")
  const [chapters, setChapters] = useState<ChapterDraft[]>([
    { title: "", contentEncoded: "", priceUSD: "0.50" }
  ])
  const [courseId, setCourseId] = useState<number | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishStep, setPublishStep] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  function addNewChapter() {
    setChapters(prev => [...prev, { title: "", contentEncoded: "", priceUSD: "0.50" }])
  }

  function updateChapter(i: number, field: keyof ChapterDraft, value: string) {
    setChapters(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  function removeChapter(i: number) {
    if (chapters.length <= 1) return
    setChapters(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleCreateCourse() {
    if (!isConnected) { connect(); return }
    if (!courseTitle.trim()) { setError("Course title is required"); return }
    if (!courseDescription.trim()) { setError("Course description is required"); return }
    setError("")
    setPublishing(true)
    setPublishStep("Creating course on Celo...")
    try {
      const id = await createCourse(courseTitle.trim(), courseDescription.trim())
      setCourseId(id)
      setStep("chapters")
    } catch (err: any) {
      setError(err?.reason || err?.message || "Failed to create course")
    } finally {
      setPublishing(false)
      setPublishStep("")
    }
  }

  async function handlePublishChapters() {
    if (courseId === null) return
    const invalid = chapters.findIndex(c => !c.title.trim() || !c.contentEncoded || !c.priceUSD)
    if (invalid >= 0) {
      setError(`Chapter ${invalid + 1} is incomplete — add title, content, and price`)
      return
    }
    setError("")
    setPublishing(true)
    setStep("publishing")

    try {
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i]
        setPublishStep(`Publishing lesson ${i + 1} of ${chapters.length}...`)
        const priceFloat = parseFloat(ch.priceUSD) || 0.5
        const price6 = ethers.BigNumber.from(Math.round(priceFloat * 1_000_000))
        await addChapter(courseId, ch.title.trim(), ch.contentEncoded, price6)
      }
      setDone(true)
    } catch (err: any) {
      setError(err?.reason || err?.message || "Failed to publish chapters")
      setStep("chapters")
    } finally {
      setPublishing(false)
      setPublishStep("")
    }
  }

  if (done && courseId !== null) {
    return (
      <div style={{ background: "#F2ECE2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>🎉</div>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#0D0B08", marginBottom: 16, letterSpacing: "-0.02em" }}>
            Course published!
          </h2>
          <p style={{ fontSize: 15, color: "rgba(13,11,8,0.45)", lineHeight: 1.7, marginBottom: 40 }}>
            Your course is now live on Celo. Students can purchase and access your lessons immediately.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => router.push(`/course/${courseId}`)}
              style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#F2ECE2", background: "#C4622D", border: "none", padding: "14px 32px", cursor: "pointer", fontFamily: "inherit" }}
            >
              View my course
            </button>
            <button
              onClick={() => router.push("/")}
              style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#0D0B08", background: "transparent", border: "1px solid rgba(13,11,8,0.2)", padding: "14px 32px", cursor: "pointer", fontFamily: "inherit" }}
            >
              Browse courses
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "120px 24px 120px" }}>

        {/* Progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 64 }}>
          {["Course details", "Add chapters", "Publishing"].map((s, i) => {
            const stepKeys = ["details", "chapters", "publishing"]
            const active = stepKeys.indexOf(step) >= i
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: active ? "#0D0B08" : "rgba(13,11,8,0.1)",
                  color: active ? "#F2ECE2" : "rgba(13,11,8,0.3)",
                  fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ ...label, color: active ? "#0D0B08" : "rgba(13,11,8,0.25)" }}>{s}</span>
                {i < 2 && <div style={{ width: 32, height: 1, background: "rgba(13,11,8,0.1)" }} />}
              </div>
            )
          })}
        </div>

        {/* Step 1 — Course details */}
        {step === "details" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#0D0B08", marginBottom: 8 }}>
              Create your course
            </h1>
            <p style={{ fontSize: 14, color: "rgba(13,11,8,0.4)", lineHeight: 1.7, marginBottom: 56 }}>
              Start with the basics. You'll add chapters and pricing in the next step.
            </p>

            <div style={{ marginBottom: 36 }}>
              <label style={{ ...label, display: "block", marginBottom: 12 }}>Course title *</label>
              <input
                value={courseTitle}
                onChange={e => setCourseTitle(e.target.value)}
                placeholder="e.g. Introduction to Solidity on Celo"
                style={{ ...inputStyle, fontSize: 22, fontWeight: 600 }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = "#0D0B08")}
                onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(13,11,8,0.12)")}
              />
            </div>

            <div style={{ marginBottom: 48 }}>
              <label style={{ ...label, display: "block", marginBottom: 12 }}>Description *</label>
              <textarea
                value={courseDescription}
                onChange={e => setCourseDescription(e.target.value)}
                placeholder="What will students learn in this course? Who is it for?"
                rows={5}
                style={{ ...inputStyle, borderBottom: "none", border: "1px solid rgba(13,11,8,0.1)", padding: "16px", fontSize: 15, resize: "vertical", lineHeight: 1.7 }}
              />
            </div>

            {error && <p style={{ fontSize: 13, color: "#C4622D", marginBottom: 20 }}>{error}</p>}

            {!isConnected ? (
              <button onClick={connect} style={{ width: "100%", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#F2ECE2", background: "#0D0B08", border: "none", padding: "18px", cursor: "pointer", fontFamily: "inherit" }}>
                Connect wallet to continue
              </button>
            ) : (
              <button
                onClick={handleCreateCourse}
                disabled={publishing || !courseTitle.trim() || !courseDescription.trim()}
                style={{ width: "100%", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#F2ECE2", background: publishing ? "rgba(13,11,8,0.4)" : "#0D0B08", border: "none", padding: "18px", cursor: publishing ? "default" : "pointer", fontFamily: "inherit", opacity: !courseTitle.trim() || !courseDescription.trim() ? 0.5 : 1 }}
              >
                {publishing ? publishStep || "Creating..." : "Create course →"}
              </button>
            )}
          </motion.div>
        )}

        {/* Step 2 — Chapters */}
        {step === "chapters" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#0D0B08", marginBottom: 8 }}>
                Add your chapters
              </h2>
              <p style={{ fontSize: 14, color: "rgba(13,11,8,0.4)", lineHeight: 1.7 }}>
                Each chapter is a paid lesson. Students can buy individual chapters or the full course.
              </p>
            </div>

            {chapters.map((ch, i) => (
              <div key={i} style={{ borderTop: "1px solid rgba(13,11,8,0.08)", paddingTop: 40, marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div style={{ ...label }}>Chapter {i + 1}</div>
                  {chapters.length > 1 && (
                    <button onClick={() => removeChapter(i)} style={{ fontSize: 10, color: "rgba(13,11,8,0.25)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...label, display: "block", marginBottom: 10 }}>Chapter title *</label>
                  <input
                    value={ch.title}
                    onChange={e => updateChapter(i, "title", e.target.value)}
                    placeholder="e.g. What is a Smart Contract?"
                    style={{ ...inputStyle, fontSize: 17, fontWeight: 600 }}
                    onFocus={e => (e.currentTarget.style.borderBottomColor = "#0D0B08")}
                    onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(13,11,8,0.12)")}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...label, display: "block", marginBottom: 10 }}>Content *</label>
                  {ch.contentEncoded ? (
                    <div style={{ padding: "16px 20px", background: "rgba(196,98,45,0.06)", border: "1px solid rgba(196,98,45,0.15)" }}>
                      <div style={{ fontSize: 11, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8 }}>✓ Content saved</div>
                      <button onClick={() => updateChapter(i, "contentEncoded", "")} style={{ fontSize: 10, color: "rgba(13,11,8,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                        Replace content
                      </button>
                    </div>
                  ) : (
                    <ChapterEditor onSave={encoded => updateChapter(i, "contentEncoded", encoded)} />
                  )}
                </div>

                <div>
                  <label style={{ ...label, display: "block", marginBottom: 10 }}>Price (cUSD) *</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18, color: "rgba(13,11,8,0.3)", fontWeight: 300 }}>$</span>
                    <input
                      type="number"
                      value={ch.priceUSD}
                      onChange={e => updateChapter(i, "priceUSD", e.target.value)}
                      step="0.10"
                      min="0.01"
                      placeholder="0.50"
                      style={{ ...inputStyle, fontSize: 18, fontWeight: 600, width: 120 }}
                    />
                    <span style={{ fontSize: 13, color: "rgba(13,11,8,0.3)", fontWeight: 300 }}>cUSD per lesson</span>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addNewChapter}
              style={{ width: "100%", fontSize: 11, fontWeight: 400, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(13,11,8,0.4)", background: "transparent", border: "1px dashed rgba(13,11,8,0.15)", padding: "16px", cursor: "pointer", fontFamily: "inherit", marginBottom: 40 }}
            >
              + Add another chapter
            </button>

            {error && <p style={{ fontSize: 13, color: "#C4622D", marginBottom: 20 }}>{error}</p>}

            <button
              onClick={handlePublishChapters}
              disabled={publishing}
              style={{ width: "100%", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#F2ECE2", background: publishing ? "rgba(13,11,8,0.4)" : "#C4622D", border: "none", padding: "18px", cursor: publishing ? "default" : "pointer", fontFamily: "inherit" }}
            >
              {publishing ? "Publishing..." : `Publish ${chapters.length} ${chapters.length === 1 ? "chapter" : "chapters"} →`}
            </button>
          </motion.div>
        )}

        {/* Step 3 — Publishing */}
        {step === "publishing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "80px 0" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              style={{ width: 48, height: 48, border: "2px solid rgba(13,11,8,0.1)", borderTop: "2px solid #0D0B08", borderRadius: "50%", margin: "0 auto 32px" }}
            />
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0D0B08", marginBottom: 12 }}>{publishStep || "Publishing..."}</h3>
            <p style={{ fontSize: 14, color: "rgba(13,11,8,0.4)", lineHeight: 1.7 }}>
              Please confirm each transaction in your wallet.<br />
              This may take a few moments.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}