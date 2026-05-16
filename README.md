# EduPay

> Pay-per-chapter education platform on Celo. Tutors earn instantly onchain when students unlock lessons. No subscriptions, no middlemen.

**Live:** https://edu-pay-one.vercel.app  
**Contract:** `0xDBA56f8d23c69Dbd9659be4ca18133962BC86191` (Celo Mainnet)  
**Celoscan:** https://celoscan.io/address/0xDBA56f8d23c69Dbd9659be4ca18133962BC86191

---

## What is EduPay?

EduPay lets tutors publish courses as on-chain chapters. Students pay per chapter — or buy the full course at once — using **USDC or cUSD** on Celo. Payment goes directly to the tutor's wallet. No bank, no payout delay, no middleman.

Built for African mobile users via **MiniPay** (Opera Mini), also works with MetaMask and WalletConnect.

---

## Pages

| Route | Purpose |
|---|---|
| `/` | Browse active courses, search, filter by category |
| `/course/[id]` | Course detail — read chapters, buy access |
| `/create` | Tutors create a course and add chapters |
| `/dashboard` | Personal activity — tutor courses + student purchases |
| `/earnings` | Tutor revenue breakdown per course |
| `/stats` | Global platform stats — total volume, top courses, recent activity |
| `/guide` | In-app FAQ for students and tutors |

---

## Local Development

### Prerequisites
- Node.js 18+
- A Reown (WalletConnect) project ID → [cloud.reown.com](https://cloud.reown.com)

### Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_REOWN_PROJECT_ID in .env.local

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Wallet:** Connect MetaMask, Valora, or MiniPay. Must be on **Celo Mainnet** (Chain ID 42220).  
> **Funds:** You need CELO for gas, and USDC or cUSD for purchases.

---

## For Tutors

### Create a course
1. Go to **Teach** in the navbar
2. Enter course title + description → confirm wallet transaction
3. Add chapters — each with a title, rich content (text / images / links / code), and a USDC price
4. Publish — one transaction per chapter
5. Course is live immediately at `/course/[id]`

### Manage courses
- **Dashboard → My Courses** — see all your courses and earnings per course
- **Earnings page** (`/earnings`) — full revenue breakdown with bar chart per course
- **Course page → Deactivate** — hides a course from the listing without deleting it

### Content blocks per chapter
| Block | Description |
|---|---|
| Heading | Large H1-style section title |
| Subheading | H2-style smaller title |
| Paragraph | Body text with line breaks |
| Image | Paste any image URL (auto-compressed) |
| Link | YouTube, Google Doc, Notion, GitHub, any URL |
| Code | Monospace code block |

---

## For Students

### Buy and read
1. Connect wallet (MiniPay, MetaMask, or WalletConnect)
2. Browse courses on the homepage — search or filter by category
3. Click a course → see all chapters with prices
4. Click **Buy** for a single chapter, or **Buy full course** for everything at once
5. After purchase → a receipt modal shows what was unlocked → click **Start reading**

### Track progress
- **Course page** — progress bar shows how many chapters you've unlocked
- **Dashboard → Purchased Lessons** — all your purchases grouped by course with a progress bar and "Complete ✓" badge

---

## Payments

| Item | Detail |
|---|---|
| Primary token | USDC (Circle) on Celo — `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` |
| Also accepted | cUSD — `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| Price storage | 6-decimal USD units (USDC base) |
| Gas | Paid in CELO |
| Tutor cut | 95% of every payment goes directly to the tutor's wallet |
| Platform fee | 5% |

---

## Smart Contracts

| Contract | Address |
|---|---|
| EduPay | `0xDBA56f8d23c69Dbd9659be4ca18133962BC86191` |
| cUSD | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| USDC (Circle) | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` |

All contracts are on **Celo Mainnet** (Chain ID 42220).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Blockchain | ethers.js v5 + Celo Mainnet |
| Wallet | Reown AppKit (WalletConnect v2) + MiniPay |
| Animations | Framer Motion |
| Deployment | Vercel |
| Smart contracts | Solidity + Foundry |

---

## Contributing / Issues

Open an issue: https://github.com/Spagero763/EduPay/issues
