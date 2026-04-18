"use client"

import { useState } from "react"

interface GuideModalProps {
  open: boolean
  onClose: () => void
}

const L: React.CSSProperties = {
  fontSize: 10, color: "rgba(13,11,8,0.28)",
  textTransform: "uppercase" as const, letterSpacing: "0.22em", fontWeight: 500,
}

const sections = [
  {
    id: "wallet",
    label: "Setup Wallet",
    title: "Setting Up Your Wallet",
    content: (
      <div>
        <div style={{ fontSize: 11, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 12 }}>
          Option A — MiniPay (Recommended)
        </div>
        <ol style={{ paddingLeft: 20, marginBottom: 28 }}>
          {[
            "Download Opera Mini from the Play Store or App Store",
            "Open Opera Mini → tap the wallet icon at the bottom",
            "Follow the setup steps — you will get a wallet address automatically",
            "Open EduPay inside Opera Mini — it detects MiniPay automatically",
          ].map((s, i) => (
            <li key={i} style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.8, marginBottom: 4, fontWeight: 300 }}>{s}</li>
          ))}
        </ol>

        <div style={{ fontSize: 11, color: "#C4622D", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 12 }}>
          Option B — MetaMask
        </div>
        <ol style={{ paddingLeft: 20, marginBottom: 20 }}>
          <li style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.8, marginBottom: 4, fontWeight: 300 }}>
            Install MetaMask at <strong>metamask.io</strong>
          </li>
          <li style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.8, marginBottom: 4, fontWeight: 300 }}>
            Create a wallet and save your seed phrase — never share it with anyone
          </li>
          <li style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.8, marginBottom: 12, fontWeight: 300 }}>
            Add the Celo network manually:
          </li>
        </ol>
        <div style={{ background: "rgba(13,11,8,0.04)", padding: "16px 20px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.8, color: "rgba(13,11,8,0.55)", marginBottom: 16 }}>
          Network: Celo<br />
          RPC URL: https://forno.celo.org<br />
          Chain ID: 42220<br />
          Symbol: CELO<br />
          Explorer: https://celoscan.io
        </div>
        <p style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.7, fontWeight: 300 }}>
          4. Open EduPay → click <strong>Connect Wallet</strong> → approve in MetaMask
        </p>
      </div>
    ),
  },
  {
    id: "cusd",
    label: "Get cUSD",
    title: "How to Get cUSD",
    content: (
      <div>
        <p style={{ fontSize: 14, color: "rgba(13,11,8,0.5)", lineHeight: 1.7, marginBottom: 24, fontWeight: 300 }}>
          cUSD (Celo Dollar) is the stablecoin used on EduPay. It is always worth $1 USD.
        </p>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08", marginBottom: 12 }}>Via MiniPay (easiest)</div>
          <ol style={{ paddingLeft: 20 }}>
            {[
              "Open MiniPay in Opera Mini",
              "Tap Add Money",
              "Select your local payment method (bank transfer, mobile money, card)",
              "Buy cUSD directly — it appears in your wallet instantly",
            ].map((s, i) => (
              <li key={i} style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.8, marginBottom: 4, fontWeight: 300 }}>{s}</li>
            ))}
          </ol>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08", marginBottom: 12 }}>Via Mento (swap CELO → cUSD)</div>
          <ol style={{ paddingLeft: 20 }}>
            {[
              "Go to mento.org",
              "Connect your MetaMask wallet",
              "Select CELO → cUSD",
              "Enter amount and swap",
            ].map((s, i) => (
              <li key={i} style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.8, marginBottom: 4, fontWeight: 300 }}>{s}</li>
            ))}
          </ol>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08", marginBottom: 12 }}>Via Exchange</div>
          <p style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.7, fontWeight: 300 }}>
            Buy CELO on Binance, Coinbase, or KuCoin → withdraw to your Celo wallet → swap to cUSD on Mento.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "buy",
    label: "Buy a Chapter",
    title: "How to Buy a Lesson",
    content: (
      <div>
        <ol style={{ paddingLeft: 20 }}>
          {[
            "Connect your wallet (MiniPay or MetaMask)",
            "Browse courses on the homepage",
            "Click any course to open its page",
            "You will see all chapters with their prices",
            "Click Buy lesson on a specific chapter — or Buy all for the full course",
            "First time: approve cUSD spending (one wallet confirmation)",
            "Confirm the purchase transaction",
            "Content unlocks instantly — click Read lesson to access it",
            "Use the Next / Prev buttons to navigate between purchased chapters",
          ].map((s, i) => (
            <li key={i} style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.8, marginBottom: 6, fontWeight: 300 }}>{s}</li>
          ))}
        </ol>

        <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(196,98,45,0.06)", border: "1px solid rgba(196,98,45,0.15)" }}>
          <div style={{ ...L, color: "#C4622D", marginBottom: 8 }}>Important</div>
          <p style={{ fontSize: 13, color: "rgba(13,11,8,0.55)", lineHeight: 1.7, fontWeight: 300 }}>
            Your purchase is recorded permanently on the Celo blockchain. You own the content forever.
            Connect the same wallet on any device to access purchased lessons.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "publish",
    label: "Publish a Course",
    title: "How to Create and Publish a Course",
    content: (
      <div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08", marginBottom: 12 }}>Step 1 — Course details</div>
          <ol style={{ paddingLeft: 20 }}>
            {[
              "Click Teach in the navbar",
              "Connect your wallet if not already connected",
              "Enter your course title (clear and descriptive)",
              "Enter a description — what will students learn?",
              "Click Create course → confirm the wallet transaction",
            ].map((s, i) => (
              <li key={i} style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.8, marginBottom: 4, fontWeight: 300 }}>{s}</li>
            ))}
          </ol>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08", marginBottom: 12 }}>Step 2 — Add chapters</div>
          <p style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.7, marginBottom: 12, fontWeight: 300 }}>
            Each chapter has a title, content, and price. Content blocks you can mix:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[
              ["H1 Heading", "Large section title"],
              ["H2 Subheading", "Smaller section title"],
              ["Paragraph", "Body text (any length)"],
              ["Image URL", "Paste a direct image link"],
              ["Link", "YouTube, Google Docs, Notion"],
              ["Code", "Monospace code block"],
            ].map(([name, desc]) => (
              <div key={name} style={{ padding: "10px 14px", background: "rgba(13,11,8,0.03)", border: "1px solid rgba(13,11,8,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#0D0B08", marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 11, color: "rgba(13,11,8,0.4)", fontWeight: 300 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 16px", background: "rgba(196,98,45,0.06)", border: "1px solid rgba(196,98,45,0.15)", fontSize: 12, color: "#C4622D", lineHeight: 1.6 }}>
            <strong>Images:</strong> Do not upload image files directly. Instead, upload your image to
            Imgur (imgur.com) or Google Photos, get a direct link, and paste it as an "Image URL" block.
            File uploads are too large for blockchain storage.
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08", marginBottom: 12 }}>Step 3 — Set price and publish</div>
          <ol style={{ paddingLeft: 20 }}>
            {[
              "Set a price in cUSD per chapter (e.g. 0.50 = $0.50)",
              "Add more chapters with + Add another chapter",
              "Click Publish chapters → confirm each wallet transaction",
              "Your course goes live immediately",
            ].map((s, i) => (
              <li key={i} style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.8, marginBottom: 4, fontWeight: 300 }}>{s}</li>
            ))}
          </ol>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08", marginBottom: 12 }}>Adding chapters later</div>
          <p style={{ fontSize: 14, color: "rgba(13,11,8,0.7)", lineHeight: 1.7, fontWeight: 300 }}>
            After publishing, open your course page. If you are the tutor, you will see an Add chapter button.
            Each new chapter requires a gas fee transaction.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "images",
    label: "Upload to IPFS",
    title: "Adding Images to Lessons",
    content: (
      <div>
        <p style={{ fontSize: 14, color: "rgba(13,11,8,0.5)", lineHeight: 1.7, marginBottom: 24, fontWeight: 300 }}>
          EduPay stores lesson content on the Celo blockchain. Because of blockchain storage limits,
          image files cannot be uploaded directly. Instead, use image hosting services and paste a URL.
        </p>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08", marginBottom: 12 }}>Free image hosting options</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                name: "Imgur",
                url: "imgur.com",
                steps: "Go to imgur.com → New Post → Upload image → Right-click image → Copy image address",
              },
              {
                name: "Google Photos",
                url: "photos.google.com",
                steps: "Upload → Share → Create link → Right-click → Copy image address",
              },
              {
                name: "Cloudinary (free tier)",
                url: "cloudinary.com",
                steps: "Sign up → Upload → Copy delivery URL",
              },
            ].map(img => (
              <div key={img.name} style={{ padding: "14px 16px", border: "1px solid rgba(13,11,8,0.08)", background: "rgba(13,11,8,0.02)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0D0B08", marginBottom: 4 }}>{img.name}</div>
                <div style={{ fontSize: 12, color: "rgba(13,11,8,0.4)", marginBottom: 6 }}>
                  <a href={`https://${img.url}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#C4622D", textDecoration: "none" }}>{img.url}</a>
                </div>
                <div style={{ fontSize: 12, color: "rgba(13,11,8,0.55)", lineHeight: 1.6, fontWeight: 300 }}>{img.steps}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 18px", background: "rgba(13,11,8,0.03)", border: "1px solid rgba(13,11,8,0.08)", fontSize: 13, color: "rgba(13,11,8,0.55)", lineHeight: 1.7 }}>
          Once you have the direct image URL (ending in .jpg, .png, or .webp), add an <strong>Image URL</strong> block
          in the chapter editor and paste the link. A preview will appear before you save.
        </div>
      </div>
    ),
  },
  {
    id: "issues",
    label: "Common Issues",
    title: "Fixing Common Problems",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {[
          {
            problem: "MetaMask shows queued or pending transactions",
            solution: "Open MetaMask → Settings → Advanced → Reset Account. This clears the stuck nonce without affecting your balance. Then retry.",
          },
          {
            problem: "Transaction says gas required exceeds allowance",
            solution: "This means the content you are trying to publish is too large. Shorten your text. If you used images, make sure they are URLs not file uploads.",
          },
          {
            problem: "Course shows not found after publishing",
            solution: "The blockchain needs a few seconds to confirm. Wait 5-10 seconds then refresh the page. If it still fails, check Celoscan for the transaction status.",
          },
          {
            problem: "MiniPay payment not triggering",
            solution: "Make sure you have cUSD in your MiniPay wallet. The payment is made in cUSD, not CELO. Open MiniPay → Add Money to get cUSD.",
          },
          {
            problem: "I bought a chapter but see nothing",
            solution: "Click the Read lesson button that appears after purchase. If it loads blank, the tutor may have used an invalid image URL. Contact the tutor.",
          },
          {
            problem: "Wallet not connecting",
            solution: "Try refreshing the page. For MetaMask, make sure you are on the Celo network (Chain ID 42220). For MiniPay, open EduPay inside Opera Mini — not a regular browser.",
          },
          {
            problem: "Balance shows 0.00 cUSD after connecting",
            solution: "Your wallet has no cUSD. See the Get cUSD section to add funds.",
          },
        ].map((item, i) => (
          <div key={i} style={{ padding: "20px 24px", background: "rgba(13,11,8,0.02)", border: "1px solid rgba(13,11,8,0.06)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0D0B08", marginBottom: 8 }}>
              {item.problem}
            </div>
            <div style={{ fontSize: 13, color: "rgba(13,11,8,0.55)", lineHeight: 1.7, fontWeight: 300 }}>
              {item.solution}
            </div>
          </div>
        ))}
      </div>
    ),
  },
]

export function GuideModal({ open, onClose }: GuideModalProps) {
  const [active, setActive] = useState("wallet")
  const current = sections.find(s => s.id === active) || sections[0]

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(13,11,8,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: "#F2ECE2",
        width: "100%", maxWidth: 860,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 28px",
          borderBottom: "1px solid rgba(13,11,8,0.08)",
        }}>
          <div style={{ ...L }}>Guide</div>
          <button onClick={onClose}
            style={{ fontSize: 20, color: "rgba(13,11,8,0.35)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Sidebar */}
          <div style={{
            width: 200, flexShrink: 0,
            borderRight: "1px solid rgba(13,11,8,0.08)",
            overflowY: "auto",
            padding: "12px 0",
          }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "10px 20px",
                  fontSize: 13, fontWeight: active === s.id ? 600 : 400,
                  color: active === s.id ? "#0D0B08" : "rgba(13,11,8,0.45)",
                  background: active === s.id ? "rgba(196,98,45,0.08)" : "none",
                  border: "none",
                  borderLeft: active === s.id ? "3px solid #C4622D" : "3px solid transparent",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}>
            <h2 style={{
              fontSize: "1.4rem", fontWeight: 700, color: "#0D0B08",
              marginBottom: 24, letterSpacing: "-0.015em",
            }}>
              {current.title}
            </h2>
            {current.content}
          </div>
        </div>
      </div>
    </div>
  )
}