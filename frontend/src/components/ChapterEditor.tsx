"use client"

import { useState, useRef } from "react"

interface Block {
  type: "text" | "image" | "url"
  content: string
}

interface ChapterEditorProps {
  onSave: (encoded: string) => void
}

export function ChapterEditor({ onSave }: ChapterEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([{ type: "text", content: "" }])
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const label: React.CSSProperties = {
    fontSize: 10, color: "rgba(13,11,8,0.3)",
    textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 500,
  }

  function addBlock(type: "text" | "image" | "url") {
    setBlocks(prev => [...prev, { type, content: "" }])
    setSaved(false)
  }

  function updateBlock(index: number, content: string) {
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, content } : b))
    setSaved(false)
  }

  function removeBlock(index: number) {
    setBlocks(prev => prev.filter((_, i) => i !== index))
    setSaved(false)
  }

  function handleImageUpload(index: number, file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      updateBlock(index, reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleSave() {
    const validBlocks = blocks.filter(b => b.content.trim())
    if (validBlocks.length === 0) return
    // Encode all blocks as base64 JSON
    const json = JSON.stringify(validBlocks)
    const encoded = btoa(unescape(encodeURIComponent(json)))
    onSave(`data:application/json;base64,${encoded}`)
    setSaved(true)
  }

  const btnStyle = (active = false): React.CSSProperties => ({
    fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase",
    padding: "8px 16px", background: active ? "#0D0B08" : "transparent",
    border: "1px solid rgba(13,11,8,0.15)", color: active ? "#F2ECE2" : "rgba(13,11,8,0.4)",
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
  })

  return (
    <div>
      {/* Blocks */}
      <div style={{ marginBottom: 24 }}>
        {blocks.map((block, i) => (
          <div key={i} style={{ marginBottom: 20, position: "relative" }}>
            {/* Remove button */}
            {blocks.length > 1 && (
              <button
                onClick={() => removeBlock(i)}
                style={{ position: "absolute", top: 0, right: 0, fontSize: 10, color: "rgba(13,11,8,0.25)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Remove
              </button>
            )}

            {block.type === "text" && (
              <div>
                <div style={{ ...label, marginBottom: 8 }}>Text block {i + 1}</div>
                <textarea
                  value={block.content}
                  onChange={e => updateBlock(i, e.target.value)}
                  placeholder="Write your lesson content here..."
                  rows={6}
                  style={{ width: "100%", background: "rgba(13,11,8,0.02)", border: "1px solid rgba(13,11,8,0.08)", padding: "14px", fontSize: 14, color: "#0D0B08", fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.8, marginTop: 0 }}
                />
              </div>
            )}

            {block.type === "image" && (
              <div>
                <div style={{ ...label, marginBottom: 8 }}>Image block {i + 1}</div>
                {block.content ? (
                  <div>
                    <img src={block.content} alt="Lesson" style={{ width: "100%", maxHeight: 240, objectFit: "cover", marginBottom: 8 }} />
                    <button onClick={() => updateBlock(i, "")} style={{ fontSize: 10, color: "rgba(13,11,8,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                      Replace image
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(i, file)
                      }}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      style={{ width: "100%", padding: "32px", border: "1px dashed rgba(13,11,8,0.15)", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      <div style={{ ...label }}>Click to upload image</div>
                      <div style={{ fontSize: 11, color: "rgba(13,11,8,0.2)", marginTop: 6 }}>PNG, JPG, GIF, WEBP</div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {block.type === "url" && (
              <div>
                <div style={{ ...label, marginBottom: 8 }}>Link block {i + 1}</div>
                <input
                  value={block.content}
                  onChange={e => updateBlock(i, e.target.value)}
                  placeholder="https://youtube.com/... or https://docs.google.com/..."
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(13,11,8,0.15)", padding: "12px 0", fontSize: 13, color: "#0D0B08", fontFamily: "inherit", outline: "none" }}
                />
                <div style={{ fontSize: 11, color: "rgba(13,11,8,0.2)", marginTop: 6 }}>
                  YouTube, Google Drive, Notion, or any URL
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add block buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <div style={{ ...label, display: "flex", alignItems: "center", marginRight: 8 }}>Add:</div>
        <button onClick={() => addBlock("text")} style={btnStyle()}>+ Text</button>
        <button onClick={() => addBlock("image")} style={btnStyle()}>+ Image</button>
        <button onClick={() => addBlock("url")} style={btnStyle()}>+ Link</button>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={blocks.every(b => !b.content.trim())}
        style={{
          width: "100%", fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "#F2ECE2",
          background: saved ? "#C4622D" : "#0D0B08",
          border: "none", padding: "16px", cursor: "pointer",
          fontFamily: "inherit", opacity: blocks.every(b => !b.content.trim()) ? 0.4 : 1,
          transition: "background 0.3s",
        }}
      >
        {saved ? "✓ Content saved" : "Save chapter content"}
      </button>

      {saved && (
        <p style={{ marginTop: 10, fontSize: 11, color: "#C4622D", textAlign: "center" }}>
          Content ready — will be stored when you publish the chapter.
        </p>
      )}
    </div>
  )
}