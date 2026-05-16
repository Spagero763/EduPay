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
        q: "How do I buy a chapter?",
        a: `1. Connect your wallet — click "Connect" in the navbar (MiniPay connects automatically in Opera Mini)\n2. Browse courses on the homepage — search or filter by category\n3. Click any course → choose a chapter → click "Buy"\n4. Approve USDC spend in your wallet (first time only)\n5. Confirm the purchase transaction\n6. A receipt modal confirms what was unlocked and the amount paid\n7. Click "Start reading →" to open the chapter immediately`,
      },
      {
        q: "What wallet do I need?",
        a: "Any Celo-compatible wallet works:\n• MiniPay — built into Opera Mini, auto-detects EduPay (recommended for mobile)\n• MetaMask — add Celo Mainnet manually (RPC: https://forno.celo.org, Chain ID: 42220)\n• WalletConnect — any WalletConnect-compatible wallet\n\nYou need USDC or cUSD on Celo to purchase chapters.",
      },
      {
        q: "What payment tokens are accepted?",
        a: "EduPay accepts both:\n• USDC (Circle) — default\n• cUSD (Celo Dollar)\n\nYou can switch between them on any course page using the USDC / CUSD toggle in the sidebar. Your choice is saved for future visits.",
      },
      {
        q: "How do I get USDC or cUSD?",
        a: "MiniPay: Open MiniPay → Add Money → buy cUSD with local mobile money (MTN, Airtel, etc.)\n\nMetaMask / other wallets:\n• Buy USDC on Binance, Coinbase, or any exchange that supports Celo → send to your Celo wallet address\n• Or swap on Ubeswap (app.ubeswap.org) — connect wallet → swap CELO to USDC or cUSD\n\nYou also need a small amount of CELO for gas fees (less than $0.01 per transaction).",
      },
      {
        q: "Can I buy the entire course at once?",
        a: "Yes. On any course page, click \"Buy full course\" in the sidebar to purchase all remaining chapters in a single transaction.",
      },
      {
        q: "How do I track my purchases?",
        a: "Go to Dashboard → Purchased Lessons tab. Your chapters are grouped by course with:\n• A progress bar showing chapters unlocked vs total\n• A green \"Complete ✓\" badge when you've unlocked all chapters\n\nYou can also see a progress bar on the course page itself whenever you're connected.",
      },
      {
        q: "Can I access purchased chapters from any device?",
        a: "Yes. Your purchase is recorded permanently on the Celo blockchain. Connect the same wallet address on any device to access all your chapters.",
      },
      {
        q: "I bought a chapter but can't read it",
        a: "Click the \"Read\" button next to the chapter (not \"Buy\" — that's for unpurchased chapters).\n\nMake sure you're connected with the same wallet address you used to purchase. If content takes more than 10 seconds to load, refresh the page — your purchase is permanent on-chain.",
      },
      {
        q: "MetaMask shows pending/queued transactions",
        a: "This is a nonce issue from a previous failed transaction.\n\nFix:\n1. Open MetaMask → Settings → Advanced\n2. Click \"Reset Account\" → Confirm\n3. This clears the nonce queue — it does NOT affect your balance or assets\n4. Try your transaction again",
      },
    ],
  },
  {
    id: "tutors",
    title: "For tutors",
    items: [
      {
        q: "How do I create a course?",
        a: `1. Click "Teach" in the navbar\n2. Connect your wallet if not already connected\n3. Enter course title and description\n4. Click "Create course on Celo" → confirm the wallet transaction\n5. Add chapters on the course page:\n   • Click "+ Add chapter"\n   • Enter title, content (use the block editor), and price in USD\n   • Click "Publish" → confirm each transaction\n6. Your course is live immediately`,
      },
      {
        q: "What content can I add to a chapter?",
        a: "Each chapter supports mixed content blocks in any order:\n• Heading — large section title\n• Subheading — smaller section title\n• Paragraph — body text with line breaks\n• Image — paste any image URL\n• Link — YouTube, Google Doc, Notion, GitHub, any URL\n• Code — monospace code block\n\nTip: mix blocks freely to create rich, structured lessons.",
      },
      {
        q: "How much should I charge per chapter?",
        a: "You set the price in USD per chapter. Suggested ranges:\n• Short lesson (5–10 min read): 0.25–0.50 USDC\n• Medium lesson: 0.50–2.00 USDC\n• Deep technical lesson: 2.00–5.00 USDC\n\nEduPay takes 5%. 95% goes directly to your wallet on every purchase.",
      },
      {
        q: "How do I see my earnings?",
        a: "Two ways:\n• Dashboard → My Courses tab — shows earnings per course\n• Earnings page (/earnings) — full breakdown with a revenue bar per course and your percentage share of total\n\nThe \"Total earned\" stat on the dashboard links directly to the Earnings page.",
      },
      {
        q: "Can I deactivate a course?",
        a: "Yes. Open the course page → click \"Deactivate course\". The course is hidden from the listing but not deleted. Click \"Reactivate course\" to make it visible again.\n\nThis is useful for courses you're still editing or want to temporarily unpublish.",
      },
      {
        q: "Can I edit a chapter after publishing?",
        a: "Chapter content is stored on-chain and cannot be edited after publishing. Plan your content before publishing.\n\nYou can add new chapters at any time using the \"+ Add chapter\" button on the course page.",
      },
      {
        q: "How do I get paid?",
        a: "Payment is instant and automatic. When a student buys your chapter:\n• 95% of the USDC/cUSD goes directly to your wallet\n• 5% goes to the EduPay platform\n• No withdrawal needed — it's in your wallet immediately after the transaction confirms (~5 seconds on Celo)",
      },
      {
        q: "Transactions are slow or pending",
        a: "Celo transactions normally confirm in 5 seconds. If stuck:\n1. Check celoscan.io for your transaction status\n2. If pending in MetaMask — Settings → Advanced → Reset Account\n3. Make sure you have enough CELO for gas (keep at least 0.05 CELO)\n4. Try again",
      },
    ],
  },
  {
    id: "technical",
    title: "Technical",
    items: [
      {
        q: "What blockchain is EduPay on?",
        a: "Celo Mainnet (Chain ID: 42220)\nContract: 0xDBA56f8d23c69Dbd9659be4ca18133962BC86191\nCeloscan: https://celoscan.io/address/0xDBA56f8d23c69Dbd9659be4ca18133962BC86191",
      },
      {
        q: "Where is the course content stored?",
        a: "Chapter content is stored directly on the Celo blockchain inside the smart contract. There is no external storage (no IPFS, no server). Content is permanent, censorship-resistant, and accessible to any wallet that has purchased access.",
      },
      {
        q: "Is EduPay open source?",
        a: "Yes. GitHub: https://github.com/Spagero763/EduPay\nAll smart contract code is verifiable on Celoscan.",
      },
      {
        q: "What tokens does EduPay accept?",
        a: "• USDC (Circle) — 0xcebA9300f2b948710d2653dD7B07f33A8B32118C\n• cUSD (Celo Dollar) — 0x765DE816845861e75A25fCA122bb6898B8B1282a\n\nSwitch between them on any course page.",
      },
      {
        q: "How does the platform fee work?",
        a: "Every purchase splits automatically in the smart contract:\n• 95% → tutor's wallet (instant)\n• 5% → EduPay platform address\n\nNo manual claiming or withdrawal needed on either side.",
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
            Buying and selling lessons on Celo — everything in one place.
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

        {/* Quick links */}
        <div style={{ background: "#0D0B08", padding: "40px", marginTop: 40 }}>
          <div style={{ ...L, color: "rgba(242,236,226,0.4)", marginBottom: 16 }}>Quick links</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: "#F2ECE2", marginBottom: 20, letterSpacing: "-0.01em" }}>
            Ready to begin?
          </h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#0D0B08", background: "#F2ECE2", padding: "12px 24px", textDecoration: "none", display: "inline-block" }}>
              Browse courses
            </Link>
            <Link href="/create" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#F2ECE2", background: "transparent", border: "1px solid rgba(242,236,226,0.2)", padding: "12px 24px", textDecoration: "none", display: "inline-block" }}>
              Create a course
            </Link>
            <Link href="/dashboard" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#F2ECE2", background: "transparent", border: "1px solid rgba(242,236,226,0.2)", padding: "12px 24px", textDecoration: "none", display: "inline-block" }}>
              Dashboard
            </Link>
            <Link href="/stats" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(242,236,226,0.5)", background: "transparent", border: "1px solid rgba(242,236,226,0.1)", padding: "12px 24px", textDecoration: "none", display: "inline-block" }}>
              Platform stats
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
