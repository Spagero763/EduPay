# EduPay

> Pay-per-lesson education platform on Celo. Tutors earn in cUSD. Students own their lessons forever.

**Live:** https://edupay.vercel.app  
**Contract:** `0xDBA56f8d23c69Dbd9659be4ca18133962BC86191` (Celo Mainnet)  
**Accepts:** cUSD + USDC (Circle)

---

## For Tutors — How to Create a Course

### Step 1 — Connect wallet
Click **Connect** in the navbar. Use MetaMask, Valora, or MiniPay on Celo mainnet.

### Step 2 — Go to Teach
Click **Teach** in the navbar.

### Step 3 — Fill in course details
- **Title** — clear name for your course
- **Description** — what students will learn

Click **Create course** — confirm the transaction in your wallet.

### Step 4 — Add chapters
For each chapter you can add **any combination** of:
- **H1 Heading** — main section title
- **H2 Subheading** — sub-section title  
- **Paragraph** — text content
- **Image** — auto-compressed for blockchain storage (JPG/PNG/WEBP)
- **Link** — YouTube, Google Drive, Notion, or any URL
- **Code** — code snippets with monospace styling

Set a **price in cUSD** (e.g. 0.50 = $0.50 USD).

Click **Publish chapters** — one transaction.

### Step 5 — Share
Your course is live at `edupay.vercel.app/course/[id]`.

---

## For Students — How to Buy a Lesson

### Step 1 — Browse
Go to the homepage and click any course.

### Step 2 — Connect wallet
Click **Connect** — needs cUSD balance.

### Step 3 — Buy
Click **Buy lesson** → approve cUSD → purchase. Two wallet confirmations.

### Step 4 — Read instantly
Content unlocks immediately after purchase. No waiting, no downloading.

---

## How to Get cUSD

| Method | Steps |
|---|---|
| MiniPay | Open MiniPay → Add Money → Buy cUSD directly |
| Valora | Open Valora → Buy → Select cUSD |
| Mento | mento.org → Swap CELO → cUSD |
| Binance | Buy USDT → Bridge to Celo → Swap to cUSD |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Smart contract | Solidity + Foundry |
| Frontend | Next.js + Tailwind |
| Wallet | Reown AppKit (WalletConnect) |
| Content | Onchain (base64 encoded blocks) |
| Chain | Celo Mainnet |
| Deploy | Vercel |

---

## Smart Contracts

| Contract | Address |
|---|---|
| EduPay | `0xDBA56f8d23c69Dbd9659be4ca18133962BC86191` |
| AgentRegistry | `0xBe9Ddf20E2a0191232a5bf57003ea7A512851391` |