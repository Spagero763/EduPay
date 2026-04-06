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

### Step 1 — Connect your wallet
Connect the wallet you want to receive payments in. All payouts go to this address.

### Step 2 — Create a course
1. Go to **Create Course** in the app
2. Enter a title and description
3. Click **Create** — this sends a transaction to the blockchain
4. Wait for confirmation (usually under 10 seconds on Celo)

### Step 3 — Upload your chapter content to IPFS
Before adding a chapter, you need to upload your content (PDF, video link, text) to IPFS and get a content hash. See [Section 6](#6-how-to-upload-content-to-ipfs-pinata) for how to do this.

### Step 4 — Add a chapter
1. Go to your course dashboard
2. Click **Add Chapter**
3. Fill in:
   - **Title** — the chapter name
   - **Content Hash** — the IPFS CID you got from Pinata (looks like `QmXyz...`)
   - **Price** — how much cUSD students pay for this chapter
4. Click **Add Chapter** and confirm the transaction

Repeat Step 3 and 4 for every chapter in your course.

---

## 6. How to Upload Content to IPFS (Pinata)

IPFS is a decentralized storage system. Instead of hosting files on a server you own, you upload them to IPFS and get a unique content hash (called a CID) back. That CID is what you store on-chain — students can only retrieve the file if they have purchased the chapter.

### Step 1 — Create a free Pinata account
1. Go to `https://pinata.cloud`
2. Click **Sign Up** and create a free account
3. Verify your email and log in

### Step 2 — Get your API key
1. In the Pinata dashboard, click **API Keys** in the left sidebar
2. Click **New Key**
3. Enable the **pinFileToIPFS** permission
4. Give it a name like `edupay`
5. Click **Generate Key**
6. Copy the **JWT token** shown — you will only see it once

### Step 3 — Upload your file
#### Manually (easiest way to start)
1. In the Pinata dashboard click **Upload** → **File**
2. Select your file (PDF, image, video, etc.)
3. Click **Upload**
4. Find your file in the list — copy the **CID** (looks like `QmXyz...abc`)
5. Paste that CID as the **Content Hash** when adding a chapter on EduPay

#### Via the app (when integrated)
The EduPay frontend will eventually handle uploads for you. Until then, upload manually on Pinata and paste the CID.

### Viewing uploaded content
Any uploaded file can be viewed at:
```
https://gateway.pinata.cloud/ipfs/YOUR_CID_HERE
```

---

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
