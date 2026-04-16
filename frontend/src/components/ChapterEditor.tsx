"use client"

import { useState, useRef } from "react"

interface Block {
  id: string
  type: "heading" | "subheading" | "text" | "image" | "url" | "code"
  content: string
}

interface ChapterEditorProps {
  onSave: (encoded: string) => void
}

export function ChapterEditor({ onSave }: ChapterEditorProps) {
  const [title, setTitle] = useState("")
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "text", content: "" }
  ])
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  const label: React.CSSProperties = {
    fontSize: 10, color: "rgba(13,11,8,0.3)",
    textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 500,
  }

  function addBlock(type: Block["type"]) {
    const id = Date.now().toString()
    setBlocks(prev => [...prev, { id, type, content: "" }])
    setSaved(false)
  }

  function updateBlock(id: string, content: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))
    setSaved(false)
  }

  function removeBlock(id: string) {
    if (blocks.length <= 1) return
    setBlocks(prev => prev.filter(b => b.id !== id))
    setSaved(false)
  }

  async function handleImageUpload(index: number, blockId: string, file: File) {
    // Resize image to max 800px wide and compress to keep under 50KB
    setUploadingIdx(index)
    try {
      const url = await compressImage(file, 800, 0.6)
      updateBlock(blockId, url)
    } catch {
      alert("Image too large. Please use an image under 2MB.")
    } finally {
      setUploadingIdx(null)
    }
  }

  function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")!
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL("image/jpeg", quality)
          // Check size — must be under 200KB for contract storage
          if (dataUrl.length > 200000) {
            // Compress more
            const dataUrl2 = canvas.toDataURL("image/jpeg", 0.3)
            resolve(dataUrl2)
          } else {
            resolve(dataUrl)
          }
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function handleSave() {
    if (!title.trim()) {
      alert("Please add a chapter title.")
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
      version: 2,
      createdAt: new Date().toISOString(),
    }

    try {
      const json = JSON.stringify(content)
      const encoded = btoa(unescape(encodeURIComponent(json)))
      const hash = `data:application/json;base64,${encoded}`

      // Check total size — contract has limits
      if (hash.length > 50000) {
        alert("Content is too large. Please reduce image sizes or text length.")
        return
      }

      onSave(hash)
      setSaved(true)
    } catch {
      alert("Failed to encode content. Please reduce image sizes.")
    }
  }

  return (
    <div style={{ fontFamily: "inherit" }}>

      {/* Chapter title */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ ...label, marginBottom: 10 }}>Chapter title *</div>
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); setSaved(false) }}
          placeholder="e.g. Introduction to Smart Contracts"
          style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(13,11,8,0.15)", padding: "12px 0", fontSize: 18, fontWeight: 500, color: "#0D0B08", fontFamily: "inherit", outline: "none" }}
        />
      </div>

      {/* Content blocks */}
      <div style={{ marginBottom: 24 }}>
        {blocks.map((block, i) => (
          <div key={block.id} style={{ marginBottom: 20, position: "relative", paddingTop: 8 }}>

            {/* Block type label + remove */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ ...label, color: "#C4622D" }}>
                {block.type === "heading" ? "Heading" :
                  block.type === "subheading" ? "Subheading" :
                    block.type === "text" ? "Paragraph" :
                      block.type === "image" ? "Image" :
                        block.type === "url" ? "Link / Resource" :
                          "Code"}
              </div>
              {blocks.length > 1 && (
                <button onClick={() => removeBlock(block.id)}
                  style={{ fontSize: 10, color: "rgba(13,11,8,0.2)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Heading */}
            {block.type === "heading" && (
              <input
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="Main heading..."
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(13,11,8,0.1)", padding: "10px 0", fontSize: 24, fontWeight: 600, color: "#0D0B08", fontFamily: "inherit", outline: "none" }}
              />
            )}

            {/* Subheading */}
            {block.type === "subheading" && (
              <input
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="Subheading..."
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(13,11,8,0.1)", padding: "10px 0", fontSize: 18, fontWeight: 500, color: "#0D0B08", fontFamily: "inherit", outline: "none" }}
              />
            )}

            {/* Text */}
            {block.type === "text" && (
              <textarea
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="Write your lesson content here..."
                rows={6}
                style={{ width: "100%", background: "rgba(13,11,8,0.02)", border: "1px solid rgba(13,11,8,0.07)", padding: "14px", fontSize: 14, color: "#0D0B08", fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.8 }}
              />
            )}

            {/* Code */}
            {block.type === "code" && (
              <textarea
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="// Paste your code here..."
                rows={8}
                style={{ width: "100%", background: "rgba(13,11,8,0.04)", border: "1px solid rgba(13,11,8,0.1)", padding: "14px", fontSize: 13, color: "#0D0B08", fontFamily: "monospace", outline: "none", resize: "vertical", lineHeight: 1.7 }}
              />
            )}

            {/* Image */}
            {block.type === "image" && (
              <div>
                {block.content ? (
                  <div>
                    <img src={block.content} alt={`Block ${i + 1}`} style={{ width: "100%", maxHeight: 300, objectFit: "cover", marginBottom: 8 }} />
                    <button onClick={() => updateBlock(block.id, "")}
                      style={{ fontSize: 10, color: "rgba(13,11,8,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.18em" }}
                    >
                      Replace image
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      ref={uploadingIdx === i ? fileRef : undefined}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(i, block.id, file)
                      }}
                    />
                    <button
                      onClick={() => {
                        setUploadingIdx(i)
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = "image/jpeg,image/png,image/webp"
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) handleImageUpload(i, block.id, file)
                        }
                        input.click()
                      }}
                      disabled={uploadingIdx === i}
                      style={{ width: "100%", padding: "32px", border: "1px dashed rgba(13,11,8,0.12)", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      <div style={{ ...label }}>
                        {uploadingIdx === i ? "Compressing image..." : "Click to upload image"}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(13,11,8,0.18)", marginTop: 6 }}>
                        JPG, PNG, WEBP · Auto-compressed for blockchain storage
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* URL */}
            {block.type === "url" && (
              <div>
                <input
                  value={block.content}
                  onChange={e => updateBlock(block.id, e.target.value)}
                  placeholder="https://youtube.com/... or https://docs.google.com/..."
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(13,11,8,0.12)", padding: "12px 0", fontSize: 13, color: "#0D0B08", fontFamily: "inherit", outline: "none" }}
                />
                <div style={{ fontSize: 11, color: "rgba(13,11,8,0.2)", marginTop: 6 }}>
                  YouTube, Google Drive, Notion, GitHub, or any URL
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add block toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28, paddingTop: 16, borderTop: "1px solid rgba(13,11,8,0.06)" }}>
        <span style={{ ...label, lineHeight: "32px" }}>Add block:</span>
        {[
          { type: "heading", label: "H1 Heading" },
          { type: "subheading", label: "H2 Subheading" },
          { type: "text", label: "Paragraph" },
          { type: "image", label: "Image" },
          { type: "url", label: "Link" },
          { type: "code", label: "Code" },
        ].map(({ type, label: btnLabel }) => (
          <button
            key={type}
            onClick={() => addBlock(type as Block["type"])}
            style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", padding: "7px 14px", background: "transparent", border: "1px solid rgba(13,11,8,0.12)", color: "rgba(13,11,8,0.45)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#0D0B08"; e.currentTarget.style.color = "#F2ECE2" }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(13,11,8,0.45)" }}
          >
            + {btnLabel}
          </button>
        ))}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        style={{
          width: "100%", fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "#F2ECE2",
          background: saved ? "#C4622D" : "#0D0B08",
          border: "none", padding: "16px", cursor: "pointer",
          fontFamily: "inherit", transition: "background 0.3s",
        }}
      >
        {saved ? "✓ Content saved — ready to publish" : "Save chapter content"}
      </button>

      {saved && (
        <p style={{ marginTop: 8, fontSize: 11, color: "#C4622D", textAlign: "center", letterSpacing: "0.1em" }}>
          Content will be stored onchain when you publish.
        </p>
      )}
    </div>
  )
}