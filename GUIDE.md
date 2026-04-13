# EduPay — Beginner's Guide

This guide walks you through everything you need to use EduPay, whether you are a student buying chapters or a tutor publishing a course. No prior Web3 experience needed.

---

## Table of Contents

1. [What You Need Before You Start](#1-what-you-need-before-you-start)
2. [Setting Up Your Wallet](#2-setting-up-your-wallet)
3. [Getting cUSD (the payment currency)](#3-getting-cusd)
4. [For Students — Buying a Chapter](#4-for-students--buying-a-chapter)
5. [For Tutors — Publishing a Course](#5-for-tutors--publishing-a-course)
6. [How to Upload Content to IPFS (Pinata)](#6-how-to-upload-content-to-ipfs-pinata)
7. [Common Issues and Fixes](#7-common-issues-and-fixes)

---

## 1. What You Need Before You Start

| Requirement | What it is |
|---|---|
| A Celo wallet | Where your money lives (MiniPay, MetaMask, or any Celo-compatible wallet) |
| cUSD balance | The stablecoin used to pay for chapters (1 cUSD ≈ 1 USD) |
| A phone or browser | MiniPay works on mobile; MetaMask works on desktop and mobile |

---

## 2. Setting Up Your Wallet

### Option A — MiniPay (Recommended, Mobile)

MiniPay is the easiest wallet for EduPay. It runs inside the Opera Mini browser.

1. Download **Opera Mini** from the Google Play Store or App Store
2. Open Opera Mini → tap the wallet icon at the bottom
3. Follow the setup steps to create your MiniPay wallet
4. You will get a wallet address automatically (looks like `0xAbc...`)
5. Open EduPay inside Opera Mini — it will detect MiniPay automatically

### Option B — MetaMask (Desktop or Mobile)

1. Install MetaMask from `https://metamask.io`
2. Create a new wallet and save your seed phrase somewhere safe — never share it
3. Add the Celo network manually:
   - Network Name: `Celo`
   - RPC URL: `https://forno.celo.org`
   - Chain ID: `42220`
   - Currency Symbol: `CELO`
   - Block Explorer: `https://celoscan.io`
4. Open EduPay in your browser and click **Connect Wallet**
5. Approve the connection in MetaMask

---

## 3. Getting cUSD

cUSD is the stablecoin used on EduPay. You need it to buy chapters.

### If you are using MiniPay
- MiniPay lets you buy cUSD directly with your local currency via mobile money (MTN, Airtel, etc.)
- Open the MiniPay wallet → tap **Add Money** → follow the steps

### If you are using MetaMask
- Buy CELO on any exchange that supports it (Binance, Coinbase, etc.) and send it to your wallet address
- Then swap CELO to cUSD on **Ubeswap** (`https://app.ubeswap.org`)
- Connect your wallet → swap CELO → cUSD

### For testing only
- Go to the Celo faucet: `https://faucet.celo.org`
- Enter your wallet address → request test cUSD (works on Alfajores testnet only)

---

## 4. For Students — Buying a Chapter

1. Open the EduPay app
2. Click **Connect Wallet** and approve the connection
3. Browse available courses and pick one
4. Click on a chapter you want to buy
5. You will see the price in cUSD
6. Click **Buy Chapter** — your wallet will ask you to approve two things:
   - **Approve** — allows EduPay to spend your cUSD (one-time per session)
   - **Purchase** — sends the cUSD and unlocks the chapter
7. Once confirmed, the chapter content becomes available to you instantly

> The tutor receives 95% of your payment immediately. EduPay keeps 5% as a platform fee.

### Buying a Full Course
- On the course page click **Buy Full Course**
- This purchases all chapters at once in a single transaction, often cheaper than buying individually

---

## 5. For Tutors — Publishing a Course

## How to Create a Course (Step by Step)

### Step 1 — Connect your wallet
Click **Connect** in the navbar. Use MetaMask, Valora, or MiniPay on Celo mainnet.

### Step 2 — Go to Teach
Click **Teach** in the navbar or go to `/create`.

### Step 3 — Fill in course details
- **Title** — clear, descriptive name
- **Description** — what students will learn

Click **Create course on Celo** — this sends a transaction. Confirm in your wallet.

### Step 4 — Add chapters
For each chapter:
- **Title** — chapter name
- **Content** — upload a file (PDF, video, text) OR write directly in the editor. Content is uploaded to IPFS automatically — no Pinata account needed.
- **Price** — set in cUSD (e.g. 0.50 = $0.50)

Click **Publish lessons on Celo** — one transaction per chapter.

### Step 5 — Share your course
Your course is now live at `edupay.vercel.app/course/[id]`. Share the link with students.

---

## How to Buy a Lesson

### Step 1 — Browse courses
Go to the homepage and click any course.

### Step 2 — Connect wallet
Click **Connect** — use any Celo-compatible wallet. Students need cUSD.

### Step 3 — Buy a chapter
Click **Buy lesson** next to any chapter. Two transactions:
1. Approve cUSD spend
2. Purchase the chapter

### Step 4 — Access content
After purchase, click **Read lesson** to access the IPFS content.

---

## How to Get cUSD

| Method | Steps |
|---|---|
| MiniPay | Open MiniPay → Add Money → Buy cUSD |
| Valora | Open Valora → Buy → Select cUSD |
| Mento | Go to mento.org → Swap CELO to cUSD |

---

## Farcaster Mini App

EduPay is available as a Farcaster Mini App. Share `https://edupay.vercel.app` in any Farcaster client to embed the app directly in your feed.

---

## Smart Contracts

| Contract | Network | Address |
|---|---|---|
| EduPay | Celo Mainnet | `0xDBA56f8d23c69Dbd9659be4ca18133962BC86191` |

Accepts: cUSD + USDC (Circle)

## 7. Common Issues and Fixes

### "Wallet not connected" / nothing happens when I click Connect
- Make sure you are using a supported browser (Chrome, Brave, Opera Mini)
- If using MetaMask, make sure the extension is installed and unlocked
- Try refreshing the page and connecting again

### "Insufficient funds" error
- You do not have enough cUSD in your wallet
- Check your balance and top up (see Section 3)

### Transaction is stuck / pending for a long time
- Celo transactions are usually fast. If it is stuck, wait 1–2 minutes
- If still stuck, check `https://celoscan.io` and search your wallet address to see the transaction status

### I bought a chapter but cannot see the content
- Wait for the transaction to be fully confirmed on-chain (check celoscan.io)
- Refresh the page after confirmation
- Make sure you are connected with the same wallet address you used to purchase

### I uploaded to IPFS but the content hash does not work
- Make sure you copied the full CID from Pinata, not just part of it
- The CID should start with `Qm` (CIDv0) or `bafy` (CIDv1)
- Test your link first: `https://gateway.pinata.cloud/ipfs/YOUR_CID`

### MetaMask shows the wrong network
- EduPay runs on **Celo Mainnet** (Chain ID: 42220)
- Open MetaMask → click the network dropdown at the top → select Celo
- If Celo is not listed, add it manually using the details in Section 2

### I am a tutor and my course is not showing up
- Confirm the `createCourse` transaction was successful on celoscan.io
- Make sure you are connected with the same wallet you used to create the course
- Try refreshing the app

---

## Need Help?

Open an issue on GitHub: `https://github.com/Spagero763/EduPay/issues`
