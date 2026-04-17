"use client"

import { useState } from "react"

interface Block {
  id: string
  type: "heading" | "subheading" | "text" | "imageUrl" | "url" | "code"
  content: string
}

interface ChapterEditorProps {
  onSave: (encoded: string) => void
}

const MAX_SIZE = 8000 // characters — safe for onchain storage

export function ChapterEditor({ onSave }: ChapterEditorProps) {
  const [chapterTitle, setChapterTitle] = useState("")
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "b1", type: "text", content: "" }
  ])
  const [saved, setSaved] = useState(false)
  const [warning, setWarning] = useState("")

  const L: React.CSSProperties = {
    fontSize: 10, color: "rgba(13,11,8,0.3)",
    textTransform: "uppercase" as const, letterSpacing: "0.22em", fontWeight: 500,
  }

  const inputBase: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(13,11,8,0.1)",
    padding: "10px 0", color: "#0D0B08",
    fontFamily: "inherit", outline: "none", lineHeight: 1.6,
  }

  function newId() { return Date.now().toString() }

  function addBlock(type: Block["type"]) {
    setBlocks(prev => [...prev, { id: newId(), type, content: "" }])
    setSaved(false)
    setWarning("")
  }

  function updateBlock(id: string, content: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))
    setSaved(false)
    setWarning("")
  }

  function removeBlock(id: string) {
    if (blocks.length <= 1) return
    setBlocks(prev => prev.filter(b => b.id !== id))
    setSaved(false)
  }

  function handleSave() {
    if (!chapterTitle.trim()) {
      setWarning("Please add a chapter title.")
      return
    }
    const validBlocks = blocks.filter(b => b.content.trim())
    if (validBlocks.length === 0) {
      setWarning("Please add some content to this chapter.")
      return
    }

    const payload = {
      title: chapterTitle.trim(),
      blocks: validBlocks,
      v: 2,
    }

    const json = JSON.stringify(payload)
    if (json.length > MAX_SIZE) {
      setWarning(
        `Content is ${json.length} characters — limit is ${MAX_SIZE}. ` +
        "Shorten your text or split into multiple chapters."
      )
      return
    }

    try {
      const b64 = btoa(unescape(encodeURIComponent(json)))
      onSave(`data:application/json;base64,${b64}`)
      setSaved(true)
      setWarning("")
    } catch {
      setWarning("Encoding failed. Try reducing content size.")
    }
  }

  const blockTypes = [
    { type: "heading" as const, label: "H1" },
    { type: "subheading" as const, label: "H2" },
    { type: "text" as const, label: "Paragraph" },
    { type: "imageUrl" as const, label: "Image URL" },
    { type: "url" as const, label: "Link" },
    { type: "code" as const, label: "Code" },
  ]

  return (
    <div style={{ fontFamily: "inherit" }}>

      {/* Chapter title */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...L, marginBottom: 8 }}>Chapter heading *</div>
        <input
          value={chapterTitle}
          onChange={e => { setChapterTitle(e.target.value); setSaved(false) }}
          placeholder="e.g. Introduction to Smart Contracts"
          style={{ ...inputBase, fontSize: 18, fontWeight: 600 }}
        />
      </div>

      {/* Content blocks */}
      <div style={{ marginBottom: 16 }}>
        {blocks.map((block) => (
          <div key={block.id} style={{ marginBottom: 20, paddingTop: 16, borderTop: "1px solid rgba(13,11,8,0.06)" }}>

            {/* Block header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ ...L, color: "#C4622D", fontSize: 9 }}>
                {block.type === "heading" ? "H1 Heading" :
                  block.type === "subheading" ? "H2 Subheading" :
                    block.type === "text" ? "Paragraph" :
                      block.type === "imageUrl" ? "Image (URL)" :
                        block.type === "url" ? "Link / Resource" : "Code block"}
              </div>
              {blocks.length > 1 && (
                <button onClick={() => removeBlock(block.id)}
                  style={{ fontSize: 9, color: "rgba(13,11,8,0.2)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.1em" }}>
                  Remove
                </button>
              )}
            </div>

            {/* Heading */}
            {block.type === "heading" && (
              <input
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="Section heading..."
                style={{ ...inputBase, fontSize: 20, fontWeight: 700 }}
              />
            )}

            {/* Subheading */}
            {block.type === "subheading" && (
              <input
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="Sub-section heading..."
                style={{ ...inputBase, fontSize: 16, fontWeight: 600 }}
              />
            )}

            {/* Text */}
            {block.type === "text" && (
              <textarea
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="Write your lesson content here. You can write multiple paragraphs."
                rows={6}
                style={{
                  ...inputBase,
                  borderBottom: "none",
                  border: "1px solid rgba(13,11,8,0.08)",
                  padding: "12px",
                  fontSize: 14,
                  resize: "vertical",
                  lineHeight: 1.8,
                }}
              />
            )}

            {/* Code */}
            {block.type === "code" && (
              <textarea
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="// Paste your code here..."
                rows={7}
                style={{
                  ...inputBase,
                  borderBottom: "none",
                  border: "1px solid rgba(13,11,8,0.08)",
                  padding: "12px",
                  fontSize: 13,
                  fontFamily: "monospace",
                  resize: "vertical",
                  lineHeight: 1.7,
                }}
              />
            )}

            {/* Image URL */}
            {block.type === "imageUrl" && (
              <div>
                <input
                  value={block.content}
                  onChange={e => updateBlock(block.id, e.target.value)}
                  placeholder="https://i.imgur.com/... or https://example.com/image.jpg"
                  style={{ ...inputBase, fontSize: 13 }}
                />
                <div style={{ fontSize: 10, color: "rgba(13,11,8,0.2)", marginTop: 6, lineHeight: 1.5 }}>
                  Paste a direct image URL. Upload your image to Imgur, Cloudinary, or Google Photos first,
                  then paste the direct link here. Do not upload image files directly.
                </div>
                {block.content?.startsWith("http") && (
                  <img
                    src={block.content}
                    alt="Preview"
                    style={{ marginTop: 12, maxWidth: "100%", maxHeight: 180, objectFit: "contain", display: "block" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                )}
              </div>
            )}

            {/* Link / URL */}
            {block.type === "url" && (
              <div>
                <input
                  value={block.content}
                  onChange={e => updateBlock(block.id, e.target.value)}
                  placeholder="https://youtube.com/... or https://docs.google.com/..."
                  style={{ ...inputBase, fontSize: 13 }}
                />
                <div style={{ fontSize: 10, color: "rgba(13,11,8,0.2)", marginTop: 6 }}>
                  YouTube, Google Drive, Notion, GitHub Gist, or any URL
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add block toolbar */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8,
        marginBottom: 20, paddingTop: 16,
        borderTop: "1px solid rgba(13,11,8,0.06)"
      }}>
        <span style={{ ...L, lineHeight: "30px", marginRight: 4 }}>Add block:</span>
        {blockTypes.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            style={{
              fontSize: 9, fontWeight: 500, letterSpacing: "0.15em",
              textTransform: "uppercase", padding: "7px 14px",
              background: "transparent",
              border: "1px solid rgba(13,11,8,0.12)",
              color: "rgba(13,11,8,0.45)",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#0D0B08"
              e.currentTarget.style.color = "#F2ECE2"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "rgba(13,11,8,0.45)"
            }}
          >
            + {label}
          </button>
        ))}
      </div>

      {/* Warning */}
      {warning && (
        <div style={{
          marginBottom: 16, padding: "12px 16px",
          background: "rgba(196,98,45,0.06)",
          border: "1px solid rgba(196,98,45,0.2)",
          fontSize: 12, color: "#C4622D", lineHeight: 1.6,
        }}>
          {warning}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        style={{
          width: "100%", fontSize: 10, fontWeight: 500,
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: "#F2ECE2",
          background: saved ? "#C4622D" : "#0D0B08",
          border: "none", padding: "16px",
          cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.3s",
        }}
      >
        {saved ? "✓ Content saved — ready to publish" : "Save chapter content"}
      </button>

      <div style={{ marginTop: 8, fontSize: 9, color: "rgba(13,11,8,0.2)", textAlign: "center", letterSpacing: "0.1em" }}>
        Images must be URLs — no file uploads (blockchain storage limit)
      </div>
    </div>
  )
}