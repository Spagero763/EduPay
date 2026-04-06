"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import { useMiniPay } from "@/hooks/useMiniPay"
import { parseError } from "@/lib/parseError"
import { motion, AnimatePresence } from "framer-motion"

type Chapter = {
  title: string
  contentHash: string
  price: string
}

type Step = "course" | "chapters" | "done"

export default function CreateCourse() {
  const router = useRouter()
  const { address, connect, createCourse, addChapter, loading } = useMiniPay()

  const [step, setStep] = useState<Step>("course")
  const [courseId, setCourseId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [chapters, setChapters] = useState<Chapter[]>([{ title: "", contentHash: "", price: "" }])

  function addChapterRow() {
    setChapters([...chapters, { title: "", contentHash: "", price: "" }])
  }

  function removeChapterRow(i: number) {
    setChapters(chapters.filter((_, idx) => idx !== i))
  }

  function updateChapter(i: number, field: keyof Chapter, value: string) {
    const updated = [...chapters]
    updated[i][field] = value
    setChapters(updated)
  }

  async function handleCreateCourse() {
    if (!title.trim() || !description.trim()) { setError("Title and description are required."); return }
    setError(null)
    setSubmitting(true)
    try {
      const id = await createCourse(title.trim(), description.trim())
      setCourseId(id)
      setStep("chapters")
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddChapters() {
    for (const ch of chapters) {
      if (!ch.title.trim() || !ch.contentHash.trim() || !ch.price) { setError("All chapter fields are required."); return }
      if (isNaN(Number(ch.price)) || Number(ch.price) <= 0) { setError("Price must be a positive number."); return }
    }
    setError(null)
    setSubmitting(true)
    try {
      for (const ch of chapters) {
        await addChapter(courseId!, ch.title.trim(), ch.contentHash.trim(), ethers.utils.parseUnits(ch.price, 6))
      }
      setStep("done")
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(13,11,8,0.15)",
    outline: "none",
    padding: "12px 0",
    fontSize: 14,
    color: "#0D0B08",
    fontFamily: "inherit",
  }

  const labelStyle = {
    fontSize: 10,
    color: "rgba(13,11,8,0.35)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.22em",
    fontWeight: 500,
    display: "block",
    marginBottom: 8,
  }

  if (loading) return null

  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh", paddingTop: 120, paddingBottom: 96 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 64px" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 64 }}
        >
          <div style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.28em", marginBottom: 20, fontWeight: 500 }}>
            {step === "course" ? "Step 1 of 2" : step === "chapters" ? "Step 2 of 2" : "Complete"}
          </div>
          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 600, color: "#0D0B08", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: 16 }}>
            {step === "course" && "Create your course."}
            {step === "chapters" && "Add your lessons."}
            {step === "done" && "Course is live."}
          </h1>
          {step !== "done" && (
            <p style={{ color: "rgba(13,11,8,0.38)", fontSize: 14, lineHeight: 1.7, maxWidth: 400 }}>
              {step === "course"
                ? "Give your course a title and description. Students will see this when browsing."
                : "Add chapters with IPFS content hashes and set your cUSD price per lesson."}
            </p>
          )}
        </motion.div>

        {/* No wallet */}
        {!address && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ border: "1px solid rgba(13,11,8,0.1)", padding: 48, textAlign: "center" }}
          >
            <p style={{ color: "rgba(13,11,8,0.4)", fontSize: 14, marginBottom: 24 }}>Connect your wallet to create a course.</p>
            <button onClick={connect} style={{ fontSize: 11, background: "#0D0B08", color: "#F2ECE2", padding: "14px 32px", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Connect wallet
            </button>
          </motion.div>
        )}

        {/* Step 1 */}
        {address && step === "course" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ marginBottom: 40 }}>
              <label style={labelStyle}>Course title</label>
              <input style={inputStyle} placeholder="e.g. Solidity for Beginners" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div style={{ marginBottom: 56 }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, resize: "none", height: 112 }} placeholder="What will students learn? Who is this for?" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            {error && <p style={{ color: "#C4622D", fontSize: 12, marginBottom: 24, letterSpacing: "0.02em" }}>{error}</p>}
            <button
              onClick={handleCreateCourse}
              disabled={submitting}
              style={{ width: "100%", fontSize: 11, background: "#0D0B08", color: "#F2ECE2", padding: "18px 32px", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit", opacity: submitting ? 0.5 : 1 }}
            >
              {submitting ? "Creating course..." : "Create course on Celo"}
            </button>
          </motion.div>
        )}

        {/* Step 2 */}
        {address && step === "chapters" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <AnimatePresence>
              {chapters.map((ch, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ marginBottom: 48, paddingBottom: 48, borderBottom: i < chapters.length - 1 ? "1px solid rgba(13,11,8,0.08)" : "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                    <span style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.22em" }}>Chapter {i + 1}</span>
                    {chapters.length > 1 && (
                      <button onClick={() => removeChapterRow(i)} style={{ fontSize: 10, color: "rgba(13,11,8,0.25)", textTransform: "uppercase", letterSpacing: "0.18em", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ marginBottom: 32 }}>
                    <label style={labelStyle}>Chapter title</label>
                    <input style={inputStyle} placeholder="e.g. Introduction to Solidity" value={ch.title} onChange={e => updateChapter(i, "title", e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 32 }}>
                    <label style={labelStyle}>IPFS content hash</label>
                    <input style={inputStyle} placeholder="ipfs://Qm..." value={ch.contentHash} onChange={e => updateChapter(i, "contentHash", e.target.value)} />
                    <p style={{ fontSize: 10, color: "rgba(13,11,8,0.22)", marginTop: 8, letterSpacing: "0.02em" }}>Upload your lesson to IPFS first, paste the hash here.</p>
                  </div>
                  <div>
                    <label style={labelStyle}>Price (cUSD)</label>
                    <input style={inputStyle} placeholder="e.g. 0.50" type="number" min="0.01" step="0.01" value={ch.price} onChange={e => updateChapter(i, "price", e.target.value)} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button onClick={addChapterRow} style={{ fontSize: 10, color: "rgba(13,11,8,0.35)", textTransform: "uppercase", letterSpacing: "0.2em", background: "none", border: "none", borderBottom: "1px solid rgba(13,11,8,0.1)", paddingBottom: 2, cursor: "pointer", fontFamily: "inherit", marginBottom: 48, display: "block" }}>
              + Add another chapter
            </button>

            {error && <p style={{ color: "#C4622D", fontSize: 12, marginBottom: 24 }}>{error}</p>}

            <button
              onClick={handleAddChapters}
              disabled={submitting}
              style={{ width: "100%", fontSize: 11, background: "#0D0B08", color: "#F2ECE2", padding: "18px 32px", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit", opacity: submitting ? 0.5 : 1 }}
            >
              {submitting ? `Publishing ${chapters.length} lesson${chapters.length > 1 ? "s" : ""}...` : `Publish ${chapters.length} lesson${chapters.length > 1 ? "s" : ""} on Celo`}
            </button>
          </motion.div>
        )}

        {/* Done */}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ textAlign: "center", paddingTop: 48 }}>
            <div style={{ fontSize: 10, color: "rgba(13,11,8,0.28)", textTransform: "uppercase", letterSpacing: "0.28em", marginBottom: 32 }}>
              Course #{courseId} is live
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 600, color: "#0D0B08", marginBottom: 16, letterSpacing: "-0.02em" }}>{title}</h2>
            <p style={{ color: "rgba(13,11,8,0.38)", fontSize: 14, marginBottom: 56, lineHeight: 1.7 }}>
              {chapters.length} lesson{chapters.length > 1 ? "s" : ""} published on Celo mainnet.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
              <button
                onClick={() => router.push(`/course/${courseId}`)}
                style={{ fontSize: 11, background: "#0D0B08", color: "#F2ECE2", padding: "14px 32px", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                View course
              </button>
              <button
                onClick={() => { setStep("course"); setTitle(""); setDescription(""); setChapters([{ title: "", contentHash: "", price: "" }]); setCourseId(null) }}
                style={{ fontSize: 10, color: "rgba(13,11,8,0.38)", textTransform: "uppercase", letterSpacing: "0.18em", background: "none", border: "none", borderBottom: "1px solid rgba(13,11,8,0.1)", paddingBottom: 2, cursor: "pointer", fontFamily: "inherit" }}
              >
                Create another
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}