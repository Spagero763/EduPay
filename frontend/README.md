# EduPay

> Pay-per-lesson education platform built on Celo and MiniPay.

African students pay tutors per chapter with stablecoins on Celo — no banks, no middlemen, instant onchain settlement.

## Deployed Contract

| Network | Address |
|---|---|
| Celo Mainnet | [`0xDBA56f8d23c69Dbd9659be4ca18133962BC86191`](https://celoscan.io/address/0xdba56f8d23c69dbd9659be4ca18133962bc86191) |

## Problem

Educational creators in Nigeria and across Africa cannot easily monetize content. Students have no credit cards, platforms like Gumroad are inaccessible, and paying full course prices upfront is not realistic for most learners.

## Solution

EduPay lets tutors publish courses with per-chapter USD pricing. Students pay only for what they want to learn — one chapter at a time — and can also buy all remaining chapters in one transaction. Tutors get paid instantly onchain with no intermediary.

## How It Works
```
Tutor → createCourse() → addChapter(title, ipfsHash, price)
Student → approve(EduPay, amount) → purchaseChapter(courseId, chapterId)
Contract → pays tutor instantly (95%) → holds 5% platform fee → unlocks content
```

Current frontend payment path:
- Token used for purchase: **Circle USDC on Celo** (`0xcebA9300f2b948710d2653dD7B07f33A8B32118C`)
- Price unit in contract storage: **6 decimals** (USDC base)
- Purchase gas token: **CELO** by default

## Features

- Pay per chapter or buy full course in one transaction
- Instant tutor payout from each purchase (95% tutor / 5% platform fee)
- Access-gated chapter content via `getChapterContent()`
- 5% platform fee (max 10%, owner configurable)
- MiniPay compatible (mobile-first)
- Self Protocol integration for tutor humanity verification


## Contract Architecture
```
EduPay.sol
├── createCourse()         — tutor registers a course
├── addChapter()           — tutor adds lesson with content hash + USD price (6 decimals)
├── purchaseChapter()      — student buys single chapter
├── purchaseFullCourse()   — student buys all remaining chapters
├── getChapterContent()    — returns content hash only if student has access
├── withdrawFees()         — owner collects platform fees
└── setPlatformFee()       — owner adjusts fee (max 10%)
```