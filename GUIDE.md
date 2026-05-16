# EduPay — User Guide

Everything you need to use EduPay as a student or tutor. No prior Web3 experience required.

---

## Table of Contents

1. [What You Need Before You Start](#1-what-you-need-before-you-start)
2. [Setting Up Your Wallet](#2-setting-up-your-wallet)
3. [Getting USDC or cUSD](#3-getting-usdc-or-cusd)
4. [For Students — Buying a Chapter](#4-for-students--buying-a-chapter)
5. [For Tutors — Publishing a Course](#5-for-tutors--publishing-a-course)
6. [Tracking Your Activity](#6-tracking-your-activity)
7. [Common Issues and Fixes](#7-common-issues-and-fixes)

---

## 1. What You Need Before You Start

| Requirement | What it is |
|---|---|
| A Celo wallet | Where your money lives — MiniPay, MetaMask, or any WalletConnect wallet |
| USDC or cUSD | The stablecoin used to pay for chapters (1 USDC ≈ 1 USD) |
| CELO for gas | A tiny amount for transaction fees (usually less than $0.01) |
| Phone or browser | MiniPay works in Opera Mini; MetaMask works on desktop and mobile |

---

## 2. Setting Up Your Wallet

### Option A — MiniPay (Recommended for mobile)

MiniPay is the easiest option. It runs inside the Opera Mini browser and detects EduPay automatically.

1. Download **Opera Mini** from the Google Play Store or App Store
2. Open Opera Mini → tap the wallet icon at the bottom
3. Follow the setup steps — you get a wallet address automatically
4. Open EduPay inside Opera Mini — it connects automatically, no extra steps

### Option B — MetaMask (Desktop or mobile)

1. Install MetaMask from `https://metamask.io`
2. Create a wallet and save your seed phrase — never share it
3. Add the Celo network:
   - Network Name: `Celo`
   - RPC URL: `https://forno.celo.org`
   - Chain ID: `42220`
   - Currency Symbol: `CELO`
   - Block Explorer: `https://celoscan.io`
4. Go to EduPay → click **Connect** in the navbar → approve in MetaMask

### Option C — Any WalletConnect wallet

Click **Connect** on EduPay → scan the QR code with any WalletConnect-compatible wallet (Trust Wallet, Rainbow, etc.).

---

## 3. Getting USDC or cUSD

EduPay accepts both **USDC** (Circle) and **cUSD** (Celo Dollar). You can switch between them on any course page.

### If you are using MiniPay
- MiniPay lets you buy cUSD directly with mobile money (MTN, Airtel, etc.)
- Open MiniPay → **Add Money** → follow the steps
- Your balance shows in EduPay's navbar automatically

### If you are using MetaMask
- Buy USDC on any exchange that supports Celo (Binance, Coinbase) and send to your Celo address
- Or swap on **Ubeswap** (`https://app.ubeswap.org`) — connect wallet → swap CELO to USDC or cUSD

### Getting CELO for gas
- Buy CELO on any major exchange → send to your wallet
- Keep at least 0.05 CELO — gas on Celo is very cheap

---

## 4. For Students — Buying a Chapter

### Step by step

1. Go to [edu-pay-one.vercel.app](https://edu-pay-one.vercel.app)
2. Click **Connect** and approve the connection
3. Browse courses — use the search bar or category filters (Blockchain, Programming, Finance, Design, Language)
4. Click a course to open it
5. Choose a chapter → click **Buy**
6. Your wallet will ask you to:
   - **Approve** — allows EduPay to spend your USDC/cUSD (first time only per token)
   - **Confirm purchase** — sends the payment and unlocks the chapter
7. A receipt modal appears confirming what was unlocked and the amount paid
8. Click **Start reading →** to open the chapter immediately

### Buying a full course

On the course page, click **Buy full course** to purchase all remaining chapters in one transaction.

### Switching payment token

On any course page, toggle between **USDC** and **CUSD** using the buttons in the sidebar. Your choice is saved for future visits.

### Reading unlocked chapters

Click **Read** next to any chapter you own. Content opens in a clean reading layout — text, headings, images, code blocks, and links.

---

## 5. For Tutors — Publishing a Course

### Step 1 — Connect your wallet

Click **Connect** in the navbar. Use any Celo wallet on Celo mainnet.

### Step 2 — Go to Teach

Click **Teach** in the navbar or visit `/create`.

### Step 3 — Create the course

- Enter a **title** and **description**
- Click **Create course on Celo** → confirm the wallet transaction
- The course is created on-chain with your wallet as the tutor

### Step 4 — Add chapters

For each chapter:
- **Title** — chapter name
- **Content** — use the block editor to mix headings, paragraphs, images, links, and code
- **Price** — set in USD (e.g. `0.50` = $0.50 USDC)

Click **Publish chapters** → one wallet transaction per chapter.

### Step 5 — Share your course

Your course is live at `https://edu-pay-one.vercel.app/course/[id]`. Use the **Share** button on the course page to copy the link or share via the native share sheet.

### Managing your course

- **Add more chapters** — click "+ Add chapter" on the course page
- **Deactivate** — click "Deactivate course" to hide it from the listing (reversible)
- **Reactivate** — click "Reactivate course" to make it visible again

### Pricing guide

| Lesson length | Suggested price |
|---|---|
| Short (5–10 min read) | 0.25–0.50 USDC |
| Medium lesson | 0.50–2.00 USDC |
| Deep technical lesson | 2.00–5.00 USDC |

EduPay takes 5%. 95% goes directly to your wallet on every purchase.

---

## 6. Tracking Your Activity

### Dashboard (`/dashboard`)

- **Stats row** — Courses created, Total earned (links to Earnings), Lessons purchased
- **Continue Learning** — courses where you have partial access with progress bars
- **My Courses tab** — all your tutor courses with earnings per course
- **Purchased Lessons tab** — all chapters you have bought, grouped by course with a progress bar. Shows "Complete ✓" when all chapters are unlocked

### Earnings page (`/earnings`)

Linked from the "Total earned" stat on the dashboard. Shows:
- Total revenue across all your courses
- Revenue breakdown per course with a proportional bar
- Percentage share per course

### Stats page (`/stats`)

Global platform data — total volume, top courses by earnings, recent purchase activity. Data is pulled directly from the Celo blockchain.

---

## 7. Common Issues and Fixes

### "Wallet not connected" / nothing happens when I click Connect
- Make sure you are using a supported browser (Chrome, Brave, Opera Mini)
- If using MetaMask, make sure the extension is installed and unlocked
- Refresh the page and try connecting again

### "Insufficient balance" error before purchase
- You do not have enough USDC or cUSD in your wallet
- EduPay checks your balance before attempting the transaction to give a clear error
- Top up your wallet (see Section 3)

### Transaction stuck / pending
- Celo transactions confirm in ~5 seconds normally
- If stuck, check `https://celoscan.io` and search your wallet address
- In MetaMask: Settings → Advanced → Reset Account (clears nonce, does not affect funds)

### I bought a chapter but can't read it
- Make sure you're connected with the same wallet address used to purchase
- Click the **Read** button (not Buy) next to the chapter
- If it still doesn't appear, refresh the page — the purchase is permanently recorded on-chain

### Course not showing up after creation
- Confirm the `createCourse` transaction succeeded on celoscan.io
- Make sure you're connected with the same wallet you used to create it
- Inactive courses are hidden from the listing — check Dashboard → My Courses

### MetaMask shows the wrong network
- EduPay runs on Celo Mainnet (Chain ID 42220)
- Open MetaMask → click the network dropdown → select Celo
- If Celo is not in the list, add it manually using the RPC details in Section 2

---

## Need Help?

Open an issue: `https://github.com/Spagero763/EduPay/issues`
