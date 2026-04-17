"use client"

import { useState } from "react"
import Link from "next/link"

const L: React.CSSProperties = {
  fontSize: 10, color: "rgba(13,11,8,0.28)",
  textTransform: "uppercase", letterSpacing: "0.24em", fontWeight: 500,
}

const sections = [
  {
    id: "students",
    title: "For students",
    items: [
      {
        q: "How do I buy a lesson?",
        a: `1. Connect your wallet (MetaMask, Valora, or MiniPay)\n2. Browse courses on the homepage\n3. Click any course\n4. Click "Buy lesson" on the chapter you want, or "Buy all" for the full course\n5. Approve cUSD spend in your wallet (first time only)\n6. Confirm the purchase transaction\n7. Click "Read lesson" — content unlocks instantly`,
      },
      {
        q: "What wallet do I need?",
        a: "Any Celo-compatible wallet works:\n• MetaMask (add Celo network manually)\n• MiniPay (built into Opera Mini)\n• Valora (Celo's mobile wallet)\n\nYou need cUSD (Celo Dollar) to purchase lessons.",
      },
      {
        q: "How do I get cUSD?",
        a: "• MiniPay: Open MiniPay → Add Money → Buy cUSD directly with local currency\n• Valora: Buy within the app\n• Mento: Go to mento.org → Connect wallet → Swap CELO to cUSD\n• Binance/Coinbase: Buy CELO → send to your Celo wallet → swap on Mento",
      },
      {
        q: "MetaMask shows pending/queued transactions",
        a: "This is a nonce issue from a previous failed transaction.\n\nFix it:\n1. Open MetaMask\n2. Go to Settings → Advanced\n3. Click 'Reset Account'\n4. Confirm — this clears the nonce, not your funds\n5. Try your transaction again\n\nImportant: Reset Account does NOT affect your balance or assets.",
      },
      {
        q: "I bought a lesson but can't read it",
        a: "Click 'Read lesson' button next to the chapter. The content loads from the blockchain — if it takes more than 10 seconds, refresh the page and try again.\n\nMake sure you're connected with the same wallet address you used to purchase.",
      },
      {
        q: "Can I access purchased lessons from any device?",
        a: "Yes. Your purchase is recorded permanently on the Celo blockchain. Connect the same wallet address on any device to access your lessons.",
      },
    ],
  },
  {
    id: "tutors",
    title: "For tutors",
    items: [
      {
        q: "How do I create a course?",
        a: `1. Click "Teach" in the navbar\n2. Connect your wallet if not already connected\n3. Enter course title and description\n4. Click "Create course" → confirm wallet transaction\n5. Add your first chapter:\n   • Enter chapter title\n   • Add content (text, images, links — mix and match)\n   • Set price in cUSD\n6. Add more chapters with "+ Add another chapter"\n7. Click "Publish chapters" → confirm each transaction\n8. Your course is live immediately`,
      },
      {
        q: "What content can I add to a chapter?",
        a: "Each chapter supports multiple content blocks mixed together:\n• Heading (H1) — large section title\n• Subheading (H2) — smaller section title\n• Paragraph — body text with line breaks\n• Image — auto-compressed JPG/PNG/WEBP\n• Link — YouTube, Google Doc, Notion, GitHub, any URL\n• Code — monospace code block\n\nYou can add as many blocks as you want in any order.",
      },
      {
        q: "How much should I charge?",
        a: "You set the price in cUSD per chapter. Recommended:\n• Short lesson (5-10 min read): 0.25–0.50 cUSD\n• Medium lesson: 0.50–2.00 cUSD\n• Deep technical lesson: 2.00–5.00 cUSD\n\nEduPay takes a 5% platform fee. 95% goes directly to your wallet.",
      },
      {
        q: "Transactions are slow or pending",
        a: "Celo transactions normally confirm in 5 seconds. If stuck:\n1. Check Celoscan.io for transaction status\n2. If pending in MetaMask — go to Settings → Advanced → Reset Account\n3. Make sure you have enough CELO for gas (keep at least 0.1 CELO)\n4. Try again — the content is saved locally until published",
      },
      {
        q: "Can I edit a chapter after publishing?",
        a: "Currently chapters are stored onchain and cannot be edited after publishing. Plan your content carefully before publishing.\n\nYou can create new chapters and set the old one as inactive using the dashboard.",
      },
      {
        q: "How do I get paid?",
        a: "Payment is instant and automatic. When a student buys your chapter:\n• 95% of the cUSD goes directly to your wallet\n• 5% goes to the EduPay platform\n• No withdrawal needed — it's in your wallet immediately",
      },
    ],
  },
  {
    id: "technical",
    title: "Technical",
    items: [
      {
        q: "What blockchain is EduPay on?",
        a: "Celo Mainnet (Chain ID: 42220)\nContract: 0xDBA56f8d23c69Dbd9659be4ca18133962BC86191",
      },
      {
        q: "Is EduPay open source?",
        a: "Yes. GitHub: https://github.com/Spagero763/EduPay\nAll smart contract code is verifiable on Celoscan.",
      },
      {
        q: "What tokens does EduPay accept?",
        a: "cUSD (Celo Dollar) — the primary stable coin on Celo.\nThe contract also supports USDC (Circle).",
      },
    ],
  },
]

export default function GuidePage() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div style={{ background: "#F2ECE2", minHeight: "100vh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "120px 24px 120px" }}>

        <div style={{ marginBottom: 64 }}>
          <div style={{ ...L, marginBottom: 20 }}>Help & Guide</div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#0D0B08", marginBottom: 16 }}>
            How to use EduPay
          </h1>
          <p style={{ fontSize: 15, color: "rgba(13,11,8,0.45)", lineHeight: 1.8, fontWeight: 300 }}>
            Everything you need to know about buying and selling lessons on Celo.
          </p>
        </div>

        {sections.map(section => (
          <div key={section.id} style={{ marginBottom: 64 }}>
            <div style={{ ...L, color: "#C4622D", marginBottom: 24 }}>{section.title}</div>

            {section.items.map((item, i) => {
              const key = `${section.id}-${i}`
              const isOpen = open === key

              return (
                <div key={key} style={{ borderTop: "1px solid rgba(13,11,8,0.08)" }}>
                  <button
                    onClick={() => setOpen(isOpen ? null : key)}
                    style={{
                      width: "100%", textAlign: "left", background: "none", border: "none",
                      padding: "20px 0", cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0D0B08", lineHeight: 1.3 }}>
                      {item.q}
                    </span>
                    <span style={{ fontSize: 18, color: "rgba(13,11,8,0.3)", flexShrink: 0, transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                  </button>

                  {isOpen && (
                    <div style={{ paddingBottom: 24 }}>
                      <p style={{ fontSize: 14, color: "rgba(13,11,8,0.55)", lineHeight: 1.85, fontWeight: 300, whiteSpace: "pre-wrap" }}>
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
            <div style={{ borderTop: "1px solid rgba(13,11,8,0.08)" }} />
          </div>
        ))}

        {/* Quick start */}
        <div style={{ background: "#0D0B08", padding: "40px", marginTop: 40 }}>
          <div style={{ ...L, color: "rgba(242,236,226,0.4)", marginBottom: 16 }}>Quick start</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: "#F2ECE2", marginBottom: 20, letterSpacing: "-0.01em" }}>
            Ready to begin?
          </h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#0D0B08", background: "#F2ECE2", padding: "12px 24px", textDecoration: "none", display: "inline-block" }}>
              Browse courses
            </Link>
            <Link href="/create" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#F2ECE2", background: "transparent", border: "1px solid rgba(242,236,226,0.2)", padding: "12px 24px", textDecoration: "none", display: "inline-block" }}>
              Create a course
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}