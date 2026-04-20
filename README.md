# EduPay

> Pay-per-lesson education platform on Celo. Tutors earn instantly onchain when students unlock lessons.

**Live:** https://edu-pay-one.vercel.app  
**Contract:** `0xDBA56f8d23c69Dbd9659be4ca18133962BC86191`  
**Network:** Celo Mainnet

---

## For Tutors

### Create a course
1. Go to **Teach** in the navbar
2. Fill in title + description → confirm wallet transaction
3. Add chapters — each with title, content (text/image/links/code), and USDC price (6 decimals)
4. Publish — one transaction per chapter
5. Your course is live immediately

### Content editor
Each chapter supports mixed content blocks:
- **Heading** — large section title
- **Subheading** — smaller section title
- **Paragraph** — body text (supports line breaks)
- **Image URL** — paste image links
- **Link** — YouTube, Google Doc, Notion, or any URL
- **Code** — monospace code block

---

## For Students

### Buy and read
1. Connect wallet (MetaMask, Valora, or MiniPay)
2. Browse courses on the homepage
3. Click a course → see all chapters with prices
4. Click **Buy** for individual chapters, or **Buy full course** for all remaining chapters
5. After purchase → click **Read** → content opens in a clean reading view

### Reading experience
Content displays in a clean article format — large serif typography, structured headings, images, and resource links. Like reading a Substack post.

---

## Payments And Gas

- Purchase token: **Circle USDC on Celo** (`0xcebA9300f2b948710d2653dD7B07f33A8B32118C`)
- Course/chapter prices are stored in **6-decimal USD units** (USDC base)
- Gas fees are paid in **CELO** by default for purchase transactions
- Contract still supports cUSD as a valid token path, but current frontend purchase flow uses USDC

---

## Contracts

| Contract | Address |
|---|---|
| EduPay | `0xDBA56f8d23c69Dbd9659be4ca18133962BC86191` |
| AgentRegistry | `0xBe9Ddf20E2a0191232a5bf57003ea7A512851391` |