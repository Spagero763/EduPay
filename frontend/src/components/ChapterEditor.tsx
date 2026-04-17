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

const MAX_CONTENT_SIZE = 8000 // 8KB max per chapter to stay within gas limits

export function ChapterEditor({ onSave }: ChapterEditorProps) {
  const [title, setTitle] = useState("")
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "text", content: "" }
  ])
  const [saved, setSaved] = useState(false)
  const [sizeWarning, setSizeWarning] = useState("")

  const L: React.CSSProperties = {
    fontSize: 10, color: "rgba(13,11,8,0.3)",
    textTransform: "uppercase" as const, letterSpacing: "0.22em", fontWeight: 500,
  }

  function addBlock(type: Block["type"]) {
    const id = Date.now().toString()
    setBlocks(prev => [...prev, { id, type, content: "" }])
    setSaved(false)
  }

  function updateBlock(id: string, content: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))
    setSaved(false)
    setSizeWarning("")
  }

  function removeBlock(id: string) {
    if (blocks.length <= 1) return
    setBlocks(prev => prev.filter(b => b.id !== id))
    setSaved(false)
    setWarning("")
  }

  function handleSave() {
    if (!title.trim()) {
      alert("Please add a title for this chapter.")
      return
    }
    const validBlocks = blocks.filter(b => b.content.trim())
    if (validBlocks.length === 0) {
      alert("Please add some content.")
      return
    }

    const content = {
      title: title.trim(),
      blocks: validBlocks,
      v: 2,
    }

    const json = JSON.stringify(content)

    if (json.length > MAX_CONTENT_SIZE) {
      setSizeWarning(`Content is ${json.length} characters — limit is ${MAX_CONTENT_SIZE}. Please shorten your text or use fewer blocks.`)
      return
    }

    try {
      const encoded = btoa(unescape(encodeURIComponent(json)))
      const hash = `data:application/json;base64,${encoded}`
      onSave(hash)
      setSaved(true)
      setSizeWarning("")
    } catch {
      alert("Failed to encode content. Please shorten the text.")
    }
  }

  const inputBase: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(13,11,8,0.1)", padding: "10px 0",
    color: "#0D0B08", fontFamily: "inherit", outline: "none", lineHeight: 1.6,
  }

  return (
    <div>
      {/* Chapter title */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...L, marginBottom: 8 }}>Chapter title *</div>
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); setSaved(false) }}
          placeholder="e.g. Introduction to Smart Contracts"
          style={{ ...inputBase, fontSize: 18, fontWeight: 600 }}
        />
      </div>

      {/* Blocks */}
      <div style={{ marginBottom: 20 }}>
        {blocks.map((block) => (
          <div key={block.id} style={{ marginBottom: 20, paddingTop: 16, borderTop: "1px solid rgba(13,11,8,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ ...L, color: "#C4622D", fontSize: 9 }}>
                {block.type === "heading" ? "H1 Heading" :
                  block.type === "subheading" ? "H2 Subheading" :
                    block.type === "text" ? "Paragraph" :
                      block.type === "imageUrl" ? "Image URL" :
                        block.type === "url" ? "Link" : "Code"}
              </div>
              {blocks.length > 1 && (
                <button onClick={() => removeBlock(block.id)}
                  style={{ fontSize: 9, color: "rgba(13,11,8,0.2)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Remove
                </button>
              )}
            </div>

            {block.type === "heading" && (
              <input value={block.content} onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="Main heading..." style={{ ...inputBase, fontSize: 22, fontWeight: 700 }} />
            )}

            {block.type === "subheading" && (
              <input value={block.content} onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="Subheading..." style={{ ...inputBase, fontSize: 17, fontWeight: 600 }} />
            )}

            {/* Text */}
            {block.type === "text" && (
              <textarea value={block.content} onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="Write your lesson content here..." rows={6}
                style={{ ...inputBase, borderBottom: "none", border: "1px solid rgba(13,11,8,0.08)", padding: "12px", fontSize: 14, resize: "vertical", lineHeight: 1.8 }} />
            )}

            {block.type === "code" && (
              <textarea value={block.content} onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="// Paste code here..." rows={6}
                style={{ ...inputBase, borderBottom: "none", border: "1px solid rgba(13,11,8,0.08)", padding: "12px", fontSize: 13, fontFamily: "monospace", resize: "vertical", lineHeight: 1.7 }} />
            )}

            {block.type === "imageUrl" && (
              <div>
                <input value={block.content} onChange={e => updateBlock(block.id, e.target.value)}
                  placeholder="https://example.com/image.jpg or https://imgur.com/..."
                  style={{ ...inputBase, fontSize: 13 }} />
                <div style={{ fontSize: 11, color: "rgba(13,11,8,0.2)", marginTop: 6 }}>
                  Paste a direct image URL (Imgur, Cloudinary, Google Drive, etc.)
                </div>
                {block.content && block.content.startsWith("http") && (
                  <img src={block.content} alt="Preview" style={{ marginTop: 12, maxWidth: "100%", maxHeight: 160, objectFit: "cover", display: "block" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                )}
              </div>
            )}

            {/* Link / URL */}
            {block.type === "url" && (
              <div>
                <input value={block.content} onChange={e => updateBlock(block.id, e.target.value)}
                  placeholder="https://youtube.com/... or https://docs.google.com/..."
                  style={{ ...inputBase, fontSize: 13 }} />
                <div style={{ fontSize: 11, color: "rgba(13,11,8,0.2)", marginTop: 6 }}>
                  YouTube, Google Drive, Notion, GitHub, or any URL
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add block */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, paddingTop: 16, borderTop: "1px solid rgba(13,11,8,0.06)" }}>
        <span style={{ ...L, lineHeight: "30px" }}>Add:</span>
        {[
          { type: "heading" as const, label: "H1" },
          { type: "subheading" as const, label: "H2" },
          { type: "text" as const, label: "Paragraph" },
          { type: "imageUrl" as const, label: "Image URL" },
          { type: "url" as const, label: "Link" },
          { type: "code" as const, label: "Code" },
        ].map(({ type, label }) => (
          <button key={type} onClick={() => addBlock(type)}
            style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", padding: "6px 12px", background: "transparent", border: "1px solid rgba(13,11,8,0.12)", color: "rgba(13,11,8,0.45)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#0D0B08"; e.currentTarget.style.color = "#F2ECE2" }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(13,11,8,0.45)" }}
          >
            + {label}
          </button>
        ))}
      </div>

      {sizeWarning && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(196,98,45,0.08)", border: "1px solid rgba(196,98,45,0.2)", fontSize: 12, color: "#C4622D" }}>
          {sizeWarning}
        </div>
      )}

      <button onClick={handleSave}
        style={{ width: "100%", fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#F2ECE2", background: saved ? "#C4622D" : "#0D0B08", border: "none", padding: "16px", cursor: "pointer", fontFamily: "inherit", transition: "background 0.3s" }}>
        {saved ? "✓ Content saved" : "Save chapter content"}
      </button>

      {!saved && (
        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(13,11,8,0.2)", textAlign: "center", letterSpacing: "0.1em" }}>
          Images must be URLs — pasted links only, no file uploads
        </div>
      )}
    </div>
  )
}