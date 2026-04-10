"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const sections = [
  { id: "wallet", label: "Setup Wallet" },
  { id: "cusd", label: "Get cUSD" },
  { id: "student", label: "Buy a Chapter" },
  { id: "tutor", label: "Publish a Course" },
  { id: "ipfs", label: "Upload to IPFS" },
  { id: "issues", label: "Common Issues" },
]

const content: Record<string, { title: string; body: React.ReactNode }> = {
  wallet: {
    title: "Setting Up Your Wallet",
    body: (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#C4622D] mb-2">Option A — MiniPay (Recommended)</p>
          <ol className="space-y-2 text-sm text-[#0D0B08]/70 list-decimal list-inside">
            <li>Download <strong className="text-[#0D0B08]">Opera Mini</strong> from the Play Store or App Store</li>
            <li>Open Opera Mini → tap the wallet icon at the bottom</li>
            <li>Follow the setup steps — you will get a wallet address automatically</li>
            <li>Open EduPay inside Opera Mini — it detects MiniPay automatically</li>
          </ol>
        </div>
        <div className="border-t border-[#0D0B08]/8 pt-5">
          <p className="text-xs uppercase tracking-widest text-[#C4622D] mb-2">Option B — MetaMask</p>
          <ol className="space-y-2 text-sm text-[#0D0B08]/70 list-decimal list-inside">
            <li>Install MetaMask at <strong className="text-[#0D0B08]">metamask.io</strong></li>
            <li>Create a wallet and save your seed phrase — never share it with anyone</li>
            <li>Add the Celo network manually:</li>
          </ol>
          <div className="mt-3 bg-[#0D0B08]/4 rounded-xl p-4 font-mono text-xs space-y-1 text-[#0D0B08]/70">
            <p><span className="text-[#0D0B08]/40">Network:</span> Celo</p>
            <p><span className="text-[#0D0B08]/40">RPC URL:</span> https://forno.celo.org</p>
            <p><span className="text-[#0D0B08]/40">Chain ID:</span> 42220</p>
            <p><span className="text-[#0D0B08]/40">Symbol:</span> CELO</p>
            <p><span className="text-[#0D0B08]/40">Explorer:</span> https://celoscan.io</p>
          </div>
          <p className="mt-3 text-sm text-[#0D0B08]/70">4. Open EduPay → click <strong className="text-[#0D0B08]">Connect Wallet</strong> → approve in MetaMask</p>
        </div>
      </div>
    ),
  },
  cusd: {
    title: "Getting cUSD",
    body: (
      <div className="space-y-6">
        <p className="text-sm text-[#0D0B08]/60">cUSD is the stablecoin used on EduPay. 1 cUSD ≈ 1 USD. You need it to buy chapters.</p>
        <div>
          <p className="text-xs uppercase tracking-widest text-[#C4622D] mb-2">MiniPay Users</p>
          <p className="text-sm text-[#0D0B08]/70">Open the MiniPay wallet → tap <strong className="text-[#0D0B08]">Add Money</strong> → buy cUSD with mobile money (MTN, Airtel, etc.) directly.</p>
        </div>
        <div className="border-t border-[#0D0B08]/8 pt-5">
          <p className="text-xs uppercase tracking-widest text-[#C4622D] mb-2">MetaMask Users</p>
          <ol className="space-y-2 text-sm text-[#0D0B08]/70 list-decimal list-inside">
            <li>Buy CELO on Binance, Coinbase, or any exchange that supports it</li>
            <li>Send CELO to your wallet address</li>
            <li>Go to <strong className="text-[#0D0B08]">app.ubeswap.org</strong> → connect wallet → swap CELO to cUSD</li>
          </ol>
        </div>
        <div className="border-t border-[#0D0B08]/8 pt-5">
          <p className="text-xs uppercase tracking-widest text-[#C4622D] mb-2">Testing Only (Alfajores Testnet)</p>
          <p className="text-sm text-[#0D0B08]/70">Go to <strong className="text-[#0D0B08]">faucet.celo.org</strong> → enter your wallet address → request free test cUSD.</p>
        </div>
      </div>
    ),
  },
  student: {
    title: "Buying a Chapter",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-[#0D0B08]/60">Once your wallet is connected and you have cUSD, buying is straightforward.</p>
        <ol className="space-y-3">
          {[
            "Click Connect Wallet and approve the connection",
            "Browse available courses and pick one",
            "Click on the chapter you want to buy and check the price",
            "Click Buy Chapter — your wallet will prompt two approvals:",
            "Once confirmed, the chapter content unlocks instantly",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-[#0D0B08]/70">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#C4622D]/10 text-[#C4622D] text-xs flex items-center justify-center font-medium mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="bg-[#0D0B08]/4 rounded-xl p-4 text-xs text-[#0D0B08]/60 space-y-1">
          <p><strong className="text-[#0D0B08]">Approve</strong> — lets EduPay spend your cUSD (one-time per session)</p>
          <p><strong className="text-[#0D0B08]">Purchase</strong> — sends cUSD and unlocks the chapter</p>
        </div>
        <div className="border-t border-[#0D0B08]/8 pt-4">
          <p className="text-xs uppercase tracking-widest text-[#C4622D] mb-2">Buy a Full Course</p>
          <p className="text-sm text-[#0D0B08]/70">On the course page click <strong className="text-[#0D0B08]">Buy Full Course</strong> to unlock all chapters in one transaction — usually cheaper than buying one by one.</p>
        </div>
        <p className="text-xs text-[#0D0B08]/40 pt-1">The tutor receives 95% of your payment instantly. EduPay keeps 5% as a platform fee.</p>
      </div>
    ),
  },
  tutor: {
    title: "Publishing a Course",
    body: (
      <div className="space-y-5">
        <p className="text-sm text-[#0D0B08]/60">As a tutor, you create a course on-chain and add chapters with pricing. Payouts go directly to your wallet.</p>
        <div className="space-y-4">
          {[
            {
              step: "1. Connect your wallet",
              desc: "Connect the wallet you want to receive payments in. All payouts go to this address permanently.",
            },
            {
              step: "2. Create a course",
              desc: 'Go to Teach → fill in a title and description → click Create. This sends a transaction to the blockchain. Wait a few seconds for confirmation.',
            },
            {
              step: "3. Upload chapter content to IPFS",
              desc: "Before adding a chapter you need a content hash from IPFS. See the Upload to IPFS section for step-by-step instructions.",
            },
            {
              step: "4. Add a chapter",
              desc: "Go to your course → Add Chapter → fill in the title, the IPFS content hash, and the cUSD price → confirm the transaction. Repeat for every chapter.",
            },
          ].map(({ step, desc }) => (
            <div key={step} className="border-l-2 border-[#C4622D]/30 pl-4">
              <p className="text-sm font-medium text-[#0D0B08]">{step}</p>
              <p className="text-sm text-[#0D0B08]/60 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  ipfs: {
    title: "Uploading Content to IPFS",
    body: (
      <div className="space-y-6">
        <p className="text-sm text-[#0D0B08]/60">
          IPFS stores your files in a decentralized way. You upload a file and get a unique content hash (CID) back. That CID is stored on-chain — students can only access the file after purchasing.
        </p>
        <div>
          <p className="text-xs uppercase tracking-widest text-[#C4622D] mb-3">Step 1 — Create a free Pinata account</p>
          <ol className="space-y-1.5 text-sm text-[#0D0B08]/70 list-decimal list-inside">
            <li>Go to <strong className="text-[#0D0B08]">pinata.cloud</strong> and sign up</li>
            <li>Verify your email and log in</li>
          </ol>
        </div>
        <div className="border-t border-[#0D0B08]/8 pt-5">
          <p className="text-xs uppercase tracking-widest text-[#C4622D] mb-3">Step 2 — Get your API key</p>
          <ol className="space-y-1.5 text-sm text-[#0D0B08]/70 list-decimal list-inside">
            <li>Click <strong className="text-[#0D0B08]">API Keys</strong> in the sidebar → New Key</li>
            <li>Enable the <strong className="text-[#0D0B08]">pinFileToIPFS</strong> permission</li>
            <li>Click Generate Key → copy the JWT token (you only see it once)</li>
          </ol>
        </div>
        <div className="border-t border-[#0D0B08]/8 pt-5">
          <p className="text-xs uppercase tracking-widest text-[#C4622D] mb-3">Step 3 — Upload your file</p>
          <ol className="space-y-1.5 text-sm text-[#0D0B08]/70 list-decimal list-inside">
            <li>In the Pinata dashboard click <strong className="text-[#0D0B08]">Upload → File</strong></li>
            <li>Select your file (PDF, video, image, etc.) → click Upload</li>
            <li>Find your file in the list → copy the <strong className="text-[#0D0B08]">CID</strong></li>
          </ol>
          <div className="mt-3 bg-[#0D0B08]/4 rounded-xl p-3 text-xs font-mono text-[#0D0B08]/50">
            CID looks like: <span className="text-[#C4622D]">QmXoypizjW3WknFiJnKLwHCnL72ved...</span>
          </div>
        </div>
        <div className="border-t border-[#0D0B08]/8 pt-5">
          <p className="text-xs uppercase tracking-widest text-[#C4622D] mb-2">Step 4 — Paste it into EduPay</p>
          <p className="text-sm text-[#0D0B08]/70">When adding a chapter, paste the CID as the <strong className="text-[#0D0B08]">Content Hash</strong>. You can test it first at:</p>
          <div className="mt-2 bg-[#0D0B08]/4 rounded-xl p-3 text-xs font-mono text-[#0D0B08]/50 break-all">
            https://gateway.pinata.cloud/ipfs/<span className="text-[#C4622D]">YOUR_CID</span>
          </div>
        </div>
      </div>
    ),
  },
  issues: {
    title: "Common Issues & Fixes",
    body: (
      <div className="space-y-4">
        {[
          {
            q: "Wallet not connected / nothing happens",
            a: "Use Chrome, Brave, or Opera Mini. Make sure MetaMask is installed and unlocked. Refresh the page and try connecting again.",
          },
          {
            q: "Insufficient funds error",
            a: "You do not have enough cUSD. Check your balance and top up — see the Get cUSD section.",
          },
          {
            q: "Transaction stuck / pending too long",
            a: "Celo is usually fast. Wait 1–2 minutes. Check celoscan.io → search your wallet address to see the transaction status.",
          },
          {
            q: "Bought a chapter but content is not showing",
            a: "Wait for the transaction to fully confirm on-chain (check celoscan.io), then refresh. Make sure you are connected with the same wallet you purchased with.",
          },
          {
            q: "IPFS content hash not working",
            a: "Make sure you copied the full CID from Pinata. It should start with Qm... or bafy... Test it at gateway.pinata.cloud/ipfs/YOUR_CID before pasting.",
          },
          {
            q: "MetaMask shows wrong network",
            a: "EduPay runs on Celo Mainnet (Chain ID: 42220). Open MetaMask → click the network dropdown → select Celo. If not listed, add it manually using the details in Setup Wallet.",
          },
          {
            q: "My course is not showing up",
            a: "Confirm the createCourse transaction succeeded on celoscan.io. Make sure you are connected with the same wallet you used to create the course, then refresh.",
          },
        ].map(({ q, a }) => (
          <div key={q} className="border border-[#0D0B08]/8 rounded-xl p-4 space-y-1.5">
            <p className="text-sm font-medium text-[#0D0B08]">{q}</p>
            <p className="text-sm text-[#0D0B08]/60">{a}</p>
          </div>
        ))}
      </div>
    ),
  },
}

interface GuideModalProps {
  open: boolean
  onClose: () => void
}

export function GuideModal({ open, onClose }: GuideModalProps) {
  const [active, setActive] = useState("wallet")

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#0D0B08]/30 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-4 md:inset-12 z-50 bg-[#F2ECE2] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl"
          >
            {/* Sidebar */}
            <div className="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-[#0D0B08]/8 p-5 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
              <p className="hidden md:block text-[10px] uppercase tracking-widest text-[#0D0B08]/30 mb-2 px-2">Guide</p>
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`shrink-0 text-left text-xs px-3 py-2 rounded-lg transition-all duration-150 tracking-wide cursor-pointer ${
                    active === s.id
                      ? "bg-[#C4622D] text-white"
                      : "text-[#0D0B08]/50 hover:text-[#0D0B08]/80 hover:bg-[#0D0B08]/5"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-medium text-[#0D0B08]">{content[active].title}</h2>
                <button
                  onClick={onClose}
                  className="shrink-0 ml-4 text-[#0D0B08]/30 hover:text-[#0D0B08]/70 transition-colors text-lg leading-none cursor-pointer"
                  aria-label="Close guide"
                >
                  ✕
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {content[active].body}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
