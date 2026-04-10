"use client"

import { useState, useRef } from "react"
import { uploadToIPFS, uploadTextToIPFS } from "@/lib/ipfs"

interface IPFSUploadProps {
  onUpload: (ipfsHash: string) => void
  label?: string
}

export function IPFSUpload({ onUpload, label = "Lesson content" }: IPFSUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<"file" | "text">("file")
  const [textContent, setTextContent] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const hash = await uploadToIPFS(file)
      setUploaded(hash)
      onUpload(hash)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleText() {
    if (!textContent.trim()) return
    setUploading(true)
    setError(null)
    try {
      const hash = await uploadTextToIPFS(textContent, `lesson-${Date.now()}.txt`)
      setUploaded(hash)
      onUpload(hash)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const labelStyle = {
    fontSize: 10,
    color: "rgba(13,11,8,0.35)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.22em",
    fontWeight: 500,
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
        {(["file", "text"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "8px 20px",
              background: "none",
              border: "none",
              borderBottom: tab === t ? "1.5px solid #0D0B08" : "1.5px solid rgba(13,11,8,0.1)",
              color: tab === t ? "#0D0B08" : "rgba(13,11,8,0.3)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {t === "file" ? "Upload file" : "Write text"}
          </button>
        ))}
      </div>

      {tab === "file" && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.mp4,.mov,.png,.jpg,.jpeg,.md,.txt,.html"
            onChange={handleFile}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              width: "100%",
              padding: "28px",
              border: "1px dashed rgba(13,11,8,0.15)",
              background: "transparent",
              cursor: uploading ? "default" : "pointer",
              fontFamily: "inherit",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = "rgba(13,11,8,0.3)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(13,11,8,0.15)")}
          >
            <div style={{ ...labelStyle, marginBottom: 8 }}>
              {uploading ? "Uploading to IPFS..." : "Click to upload"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(13,11,8,0.2)", fontWeight: 400 }}>
              PDF, MP4, PNG, MD, TXT, HTML
            </div>
          </button>
        </div>
      )}

      {tab === "text" && (
        <div>
          <label style={{ ...labelStyle, display: "block", marginBottom: 8 }}>
            {label}
          </label>
          <textarea
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
            placeholder="Write your lesson content here..."
            rows={8}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(13,11,8,0.15)",
              padding: "12px 0",
              fontSize: 13,
              color: "#0D0B08",
              fontFamily: "inherit",
              outline: "none",
              resize: "none",
              lineHeight: 1.7,
            }}
          />
          <button
            onClick={handleText}
            disabled={uploading || !textContent.trim()}
            style={{
              marginTop: 16,
              width: "100%",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#F2ECE2",
              background: uploading ? "rgba(13,11,8,0.4)" : "#0D0B08",
              border: "none",
              padding: "14px",
              cursor: uploading ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: !textContent.trim() ? 0.4 : 1,
            }}
          >
            {uploading ? "Uploading..." : "Upload to IPFS"}
          </button>
        </div>
      )}

      {uploaded && (
        <div style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "rgba(196,98,45,0.05)",
          border: "1px solid rgba(196,98,45,0.15)",
        }}>
          <div style={{ ...labelStyle, color: "#C4622D", marginBottom: 4 }}>
            Uploaded to IPFS
          </div>
          <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(13,11,8,0.5)", wordBreak: "break-all" }}>
            {uploaded}
          </div>
        </div>
      )}

      {error && (
        <p style={{ marginTop: 12, fontSize: 11, color: "#C4622D" }}>{error}</p>
      )}
    </div>
  )
}