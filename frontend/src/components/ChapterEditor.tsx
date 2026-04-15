"use client"

import { useState, useRef } from "react"

interface ChapterEditorProps {
  onSave: (contentHash: string) => void
  value?: string
}

export function ChapterEditor({ onSave, value }: ChapterEditorProps) {
  const [tab, setTab] = useState<"write" | "image" | "link">("write")
  const [text, setText] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [link, setLink] = useState("")
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const labelStyle = {
    fontSize: 10,
    color: "rgba(13,11,8,0.3)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.22em",
    fontWeight: 500,
  }

  function handleSaveText() {
    if (!text.trim()) return
    // Encode text as base64 data URI
    const encoded = btoa(unescape(encodeURIComponent(text)))
    const hash = `data:text/plain;base64,${encoded}`
    onSave(hash)
    setSaved(true)
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setImagePreview(dataUrl)
      onSave(dataUrl) // store image as base64 data URI
      setSaved(true)
    }
    reader.readAsDataURL(file)
  }

  function handleLink() {
    if (!link.trim()) return
    onSave(link.trim())
    setSaved(true)
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid rgba(13,11,8,0.08)" }}>
        {[
          { key: "write", label: "Write text" },
          { key: "image", label: "Upload image" },
          { key: "link", label: "Paste link" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as any); setSaved(false) }}
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "10px 20px",
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? "2px solid #0D0B08" : "2px solid transparent",
              color: tab === t.key ? "#0D0B08" : "rgba(13,11,8,0.3)",
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: -1,
              transition: "all 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Write text */}
      {tab === "write" && (
        <div>
          <div style={{ ...labelStyle, marginBottom: 12 }}>Chapter content</div>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setSaved(false) }}
            placeholder={`Write your lesson content here.\n\nSupports:\n- Plain text\n- Bullet points\n- Code snippets\n\nStudents get instant access after purchase.`}
            rows={12}
            style={{
              width: "100%",
              background: "rgba(13,11,8,0.02)",
              border: "1px solid rgba(13,11,8,0.08)",
              padding: "16px",
              fontSize: 14,
              color: "#0D0B08",
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical",
              lineHeight: 1.8,
              borderRadius: 0,
            }}
          />
          <button
            onClick={handleSaveText}
            disabled={!text.trim()}
            style={{
              marginTop: 16,
              width: "100%",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#F2ECE2",
              background: saved ? "#C4622D" : "#0D0B08",
              border: "none",
              padding: "16px",
              cursor: "pointer",
              fontFamily: "inherit",
              opacity: !text.trim() ? 0.4 : 1,
              transition: "background 0.3s",
            }}
          >
            {saved ? "✓ Content saved" : "Save content"}
          </button>
        </div>
      )}

      {/* Upload image */}
      {tab === "image" && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleImage}
            style={{ display: "none" }}
          />
          {imagePreview ? (
            <div>
              <img
                src={imagePreview}
                alt="Chapter content"
                style={{ width: "100%", maxHeight: 300, objectFit: "cover", marginBottom: 16 }}
              />
              <div style={{ fontSize: 11, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 }}>
                ✓ Image saved
              </div>
              <button
                onClick={() => { setImagePreview(null); setSaved(false) }}
                style={{ fontSize: 10, color: "rgba(13,11,8,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.18em" }}
              >
                Replace image
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%",
                padding: "48px 24px",
                border: "1px dashed rgba(13,11,8,0.15)",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div style={{ ...labelStyle, marginBottom: 8 }}>Click to upload image</div>
              <div style={{ fontSize: 11, color: "rgba(13,11,8,0.2)" }}>PNG, JPG, GIF, WEBP · Max 2MB</div>
            </button>
          )}
        </div>
      )}

      {/* Paste link */}
      {tab === "link" && (
        <div>
          <div style={{ ...labelStyle, marginBottom: 12 }}>Content URL</div>
          <input
            value={link}
            onChange={e => { setLink(e.target.value); setSaved(false) }}
            placeholder="https://docs.google.com/... or https://youtube.com/..."
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(13,11,8,0.15)",
              padding: "14px 0",
              fontSize: 13,
              color: "#0D0B08",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <div style={{ fontSize: 11, color: "rgba(13,11,8,0.25)", marginTop: 8, lineHeight: 1.6 }}>
            Paste a Google Doc, YouTube video, Notion page, or any URL.
            Students get instant access after purchase.
          </div>
          <button
            onClick={handleLink}
            disabled={!link.trim()}
            style={{
              marginTop: 16,
              width: "100%",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#F2ECE2",
              background: saved ? "#C4622D" : "#0D0B08",
              border: "none",
              padding: "16px",
              cursor: "pointer",
              fontFamily: "inherit",
              opacity: !link.trim() ? 0.4 : 1,
            }}
          >
            {saved ? "✓ Link saved" : "Save link"}
          </button>
        </div>
      )}
    </div>
  )
}