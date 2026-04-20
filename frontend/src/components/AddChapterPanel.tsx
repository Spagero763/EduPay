"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { useMiniPay } from "@/hooks/useMiniPay"
import { ChapterEditor } from "@/components/ChapterEditor"
import { motion } from "framer-motion"

interface Props {
  courseId: number
  existingCount: number
  onDone: () => void
}

const L: React.CSSProperties = {
  fontSize: 10, color: "rgba(13,11,8,0.28)",
  textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 500,
}

export function AddChapterPanel({ courseId, existingCount, onDone }: Props) {
  const { addChapter } = useMiniPay()
  const [title, setTitle] = useState("")
  const [contentEncoded, setContentEncoded] = useState("")
  const [price, setPrice] = useState("0.50")
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handlePublish() {
    if (!title.trim()) { setError("Chapter title is required"); return }
    if (!contentEncoded) { setError("Content is required"); return }
    if (!Number.isInteger(courseId) || courseId < 0) { setError("Invalid course id"); return }

    const priceFloat = Number(price)
    if (!Number.isFinite(priceFloat) || priceFloat <= 0) {
      setError("Enter a valid chapter price")
      return
    }

    setError("")
    setPublishing(true)

    try {
      const price6 = ethers.BigNumber.from(Math.round(priceFloat * 1_000_000))
      await addChapter(courseId, title.trim(), contentEncoded, price6)
      setSuccess(true)
      setTimeout(() => {
        onDone()
      }, 2000)
    } catch (err: any) {
      setError(err?.reason || err?.message || "Failed to publish chapter")
    } finally {
      setPublishing(false)
    }
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ marginTop: 40, padding: "32px", background: "rgba(196,98,45,0.06)", border: "1px solid rgba(196,98,45,0.2)", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#C4622D" }}>Chapter published!</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginTop: 40, padding: "40px", background: "rgba(13,11,8,0.02)", border: "1px solid rgba(13,11,8,0.08)" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ ...L, color: "#C4622D", marginBottom: 8 }}>Add new chapter</div>
          <div style={{ fontSize: 14, color: "rgba(13,11,8,0.4)", fontWeight: 300 }}>
            Chapter {existingCount + 1} · Gas fee required
          </div>
        </div>
        <button onClick={onDone} style={{ fontSize: 10, color: "rgba(13,11,8,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          Cancel
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ ...L, marginBottom: 10 }}>Chapter title *</div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Advanced Smart Contracts"
          style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(13,11,8,0.12)", padding: "10px 0", fontSize: 18, fontWeight: 600, color: "#0D0B08", fontFamily: "inherit", outline: "none" }}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ ...L, marginBottom: 10 }}>Content *</div>
        {contentEncoded ? (
          <div style={{ padding: "16px", background: "rgba(196,98,45,0.06)", border: "1px solid rgba(196,98,45,0.15)" }}>
            <div style={{ fontSize: 11, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8 }}>✓ Content saved</div>
            <button onClick={() => setContentEncoded("")} style={{ fontSize: 10, color: "rgba(13,11,8,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Replace
            </button>
          </div>
        ) : (
          <ChapterEditor onSave={setContentEncoded} />
        )}
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ ...L, marginBottom: 10 }}>Price (USDC) *</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, color: "rgba(13,11,8,0.3)" }}>$</span>
          <input
            type="number" value={price}
            onChange={e => setPrice(e.target.value)}
            step="0.10" min="0.01" placeholder="0.50"
            style={{ width: 120, background: "transparent", border: "none", borderBottom: "1px solid rgba(13,11,8,0.12)", padding: "8px 0", fontSize: 18, fontWeight: 600, color: "#0D0B08", fontFamily: "inherit", outline: "none" }}
          />
          <span style={{ fontSize: 13, color: "rgba(13,11,8,0.3)", fontWeight: 300 }}>USDC per lesson</span>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 20, fontSize: 13, color: "#C4622D" }}>{error}</div>
      )}

      <button
        onClick={handlePublish}
        disabled={publishing}
        style={{ width: "100%", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#F2ECE2", background: publishing ? "rgba(196,98,45,0.5)" : "#C4622D", border: "none", padding: "16px", cursor: publishing ? "default" : "pointer", fontFamily: "inherit" }}
      >
        {publishing ? "Publishing chapter..." : "Publish chapter (requires gas)"}
      </button>
    </motion.div>
  )
}