"use client"

import { ChapterEditor } from "@/components/ChapterEditor"
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
  const [chapters, setChapters] = useState<Chapter[]>([
    { title: "", contentHash: "", price: "" }
  ])

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
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.")
      return
    }

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
      if (!ch.title.trim() || !ch.contentHash.trim() || !ch.price) {
        setError("All chapter fields are required.")
        return
      }

      if (isNaN(Number(ch.price)) || Number(ch.price) <= 0) {
        setError("Price must be a positive number.")
        return
      }
    }

    setError(null)
    setSubmitting(true)

    try {
      for (const ch of chapters) {
        await addChapter(
          courseId!,
          ch.title.trim(),
          ch.contentHash.trim(),
          ethers.utils.parseUnits(ch.price, 6)
        )
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
          <div style={{
            fontSize: 10,
            color: "rgba(13,11,8,0.28)",
            textTransform: "uppercase",
            letterSpacing: "0.28em",
            marginBottom: 20,
            fontWeight: 500
          }}>
            {step === "course" ? "Step 1 of 2" : step === "chapters" ? "Step 2 of 2" : "Complete"}
          </div>

          <h1 style={{
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 600,
            color: "#0D0B08",
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            marginBottom: 16
          }}>
            {step === "course" && "Create your course."}
            {step === "chapters" && "Add your lessons."}
            {step === "done" && "Course is live."}
          </h1>

          {step !== "done" && (
            <p style={{ color: "rgba(13,11,8,0.38)", fontSize: 14, lineHeight: 1.7, maxWidth: 400 }}>
              {step === "course"
                ? "Give your course a title and description. Students will see this when browsing."
                : "Add lessons with text, images, or links. Students get instant access after purchase."}
            </p>
          )}
        </motion.div>

        {/* Wallet */}
        {!address && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ border: "1px solid rgba(13,11,8,0.1)", padding: 48, textAlign: "center" }}
          >
            <p style={{ color: "rgba(13,11,8,0.4)", fontSize: 14, marginBottom: 24 }}>
              Connect your wallet to create a course.
            </p>
            <button
              onClick={connect}
              style={{
                fontSize: 11,
                background: "#0D0B08",
                color: "#F2ECE2",
                padding: "14px 32px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              Connect wallet
            </button>
          </motion.div>
        )}

        {/* Step 1 */}
        {address && step === "course" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ marginBottom: 40 }}>
              <label style={labelStyle}>Course title</label>
              <input
                style={inputStyle}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 56 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, height: 120, resize: "none" }}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {error && <p style={{ color: "#C4622D", fontSize: 12 }}>{error}</p>}

            <button
              onClick={handleCreateCourse}
              disabled={submitting}
              style={{
                width: "100%",
                fontSize: 11,
                background: "#0D0B08",
                color: "#F2ECE2",
                padding: "18px 32px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                opacity: submitting ? 0.5 : 1
              }}
            >
              {submitting ? "Creating course..." : "Create course"}
            </button>
          </motion.div>
        )}

        {/* Step 2 */}
        {address && step === "chapters" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AnimatePresence>
              {chapters.map((ch, i) => (
                <motion.div key={i} style={{ marginBottom: 48 }}>

                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Chapter title</label>
                    <input
                      style={inputStyle}
                      value={ch.title}
                      onChange={e => updateChapter(i, "title", e.target.value)}
                    />
                  </div>

                  {/* ✅ REPLACED IPFS WITH CHAPTER EDITOR */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={labelStyle}>Lesson content</div>

                    {ch.contentHash ? (
                      <div style={{ fontSize: 12, color: "#C4622D" }}>
                        ✓ Content saved
                        <button
                          onClick={() => updateChapter(i, "contentHash", "")}
                          style={{
                            marginLeft: 12,
                            fontSize: 10,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "rgba(13,11,8,0.4)"
                          }}
                        >
                          Replace
                        </button>
                      </div>
                    ) : (
                      <ChapterEditor
                        onSave={(hash) => updateChapter(i, "contentHash", hash)}
                      />
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Price (cUSD)</label>
                    <input
                      style={inputStyle}
                      value={ch.price}
                      onChange={e => updateChapter(i, "price", e.target.value)}
                    />
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>

            <button onClick={addChapterRow}>+ Add chapter</button>

            {error && <p style={{ color: "#C4622D", fontSize: 12 }}>{error}</p>}

            <button
              onClick={handleAddChapters}
              disabled={submitting}
              style={{
                width: "100%",
                marginTop: 24,
                background: "#0D0B08",
                color: "#F2ECE2",
                padding: 18,
                border: "none",
                cursor: "pointer"
              }}
            >
              Publish course
            </button>
          </motion.div>
        )}

        {/* Done */}
        {step === "done" && (
          <motion.div style={{ textAlign: "center" }}>
            <h2>Course is live 🎉</h2>
            <button onClick={() => router.push(`/course/${courseId}`)}>
              View course
            </button>
          </motion.div>
        )}

      </div>
    </div>
  )
}