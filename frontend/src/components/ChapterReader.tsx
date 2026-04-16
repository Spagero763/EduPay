"use client"

interface Block {
  id: string
  type: "heading" | "subheading" | "text" | "image" | "url" | "code"
  content: string
}

interface ContentData {
  title?: string
  blocks: Block[]
  version?: number
}

interface ChapterReaderProps {
  contentHash: string
  chapterTitle: string
}

export function ChapterReader({ contentHash, chapterTitle }: ChapterReaderProps) {
  const data = decodeContent(contentHash)

  return (
    <article style={{ maxWidth: 680, margin: "0 auto", padding: "48px 0" }}>
      {/* Header */}
      <header style={{ marginBottom: 48, paddingBottom: 32, borderBottom: "1px solid rgba(13,11,8,0.08)" }}>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 600, color: "#0D0B08", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
          {data?.title || chapterTitle}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#C4622D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, color: "#F2ECE2", fontWeight: 600 }}>E</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0D0B08" }}>EduPay</div>
            <div style={{ fontSize: 11, color: "rgba(13,11,8,0.3)", letterSpacing: "0.05em" }}>Lesson content</div>
          </div>
        </div>
      </header>

      {/* Content blocks */}
      <div>
        {data?.blocks.map((block, i) => (
          <div key={block.id || i} style={{ marginBottom: 28 }}>
            {block.type === "heading" && (
              <h2 style={{ fontSize: "1.8rem", fontWeight: 600, color: "#0D0B08", lineHeight: 1.2, letterSpacing: "-0.015em", marginTop: 48, marginBottom: 8 }}>
                {block.content}
              </h2>
            )}
            {block.type === "subheading" && (
              <h3 style={{ fontSize: "1.3rem", fontWeight: 500, color: "#0D0B08", lineHeight: 1.3, marginTop: 32, marginBottom: 8 }}>
                {block.content}
              </h3>
            )}
            {block.type === "text" && (
              <p style={{ fontSize: 17, lineHeight: 1.85, color: "rgba(13,11,8,0.8)", whiteSpace: "pre-wrap", fontWeight: 300 }}>
                {block.content}
              </p>
            )}
            {block.type === "code" && (
              <pre style={{ background: "rgba(13,11,8,0.04)", border: "1px solid rgba(13,11,8,0.08)", padding: "20px 24px", fontSize: 13, lineHeight: 1.7, color: "#0D0B08", overflow: "auto", fontFamily: "monospace" }}>
                <code>{block.content}</code>
              </pre>
            )}
            {block.type === "image" && block.content && (
              <figure style={{ margin: "32px 0" }}>
                <img src={block.content} alt="" style={{ width: "100%", display: "block" }} />
              </figure>
            )}
            {block.type === "url" && block.content && (
              <div style={{ margin: "24px 0", padding: "16px 20px", border: "1px solid rgba(13,11,8,0.1)", background: "rgba(13,11,8,0.02)" }}>
                <div style={{ fontSize: 10, color: "rgba(13,11,8,0.3)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8 }}>Resource</div>
                <a href={block.content} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 14, color: "#C4622D", textDecoration: "none", wordBreak: "break-all", fontWeight: 400 }}
                >
                  {block.content}
                </a>
              </div>
            )}
          </div>
        ))}

        {/* Fallback for old format */}
        {!data && renderLegacy(contentHash)}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid rgba(13,11,8,0.08)" }}>
        <div style={{ fontSize: 12, color: "rgba(13,11,8,0.25)", textTransform: "uppercase", letterSpacing: "0.18em" }}>
          End of lesson · Powered by EduPay on Celo
        </div>
      </footer>
    </article>
  )
}

function decodeContent(contentHash: string): ContentData | null {
  if (!contentHash) return null

  try {
    // New format v2
    if (contentHash.startsWith("data:application/json;base64,")) {
      const json = decodeURIComponent(escape(atob(contentHash.replace("data:application/json;base64,", ""))))
      return JSON.parse(json) as ContentData
    }
    // Old text format
    if (contentHash.startsWith("data:text/plain;base64,")) {
      const text = decodeURIComponent(escape(atob(contentHash.replace("data:text/plain;base64,", ""))))
      return { blocks: [{ id: "1", type: "text", content: text }] }
    }
  } catch {}
  return null
}

function renderLegacy(contentHash: string) {
  if (contentHash.startsWith("data:image/")) {
    return <img src={contentHash} alt="Lesson" style={{ width: "100%" }} />
  }
  if (contentHash.startsWith("http")) {
    return (
      <a href={contentHash} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 14, color: "#C4622D", textDecoration: "none" }}
      >
        Open content →
      </a>
    )
  }
  if (contentHash.startsWith("ipfs://")) {
    const cid = contentHash.replace("ipfs://", "")
    return (
      <a href={`https://gateway.pinata.cloud/ipfs/${cid}`} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 14, color: "#C4622D", textDecoration: "none" }}
      >
        View on IPFS →
      </a>
    )
  }
  return null
}