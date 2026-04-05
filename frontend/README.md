# EduPay

> Pay-per-lesson education platform built on Celo and MiniPay.

African students pay tutors in cUSD per chapter — no banks, no middlemen, instant stablecoin settlement on Celo.

## Deployed Contract

| Network | Address |
|---|---|
| Celo Mainnet | [`0x8A2D3A806f932616ba07D3Fc42bAb1Bdf6f312a1`](https://celoscan.io/address/0x8a2d3a806f932616ba07d3fc42bab1bdf6f312a1) |

## Problem

Educational creators in Nigeria and across Africa cannot easily monetize content. Students have no credit cards, platforms like Gumroad are inaccessible, and paying full course prices upfront is not realistic for most learners.

## Solution

EduPay lets tutors publish courses with per-chapter cUSD pricing. Students pay only for what they want to learn — one chapter at a time — directly from MiniPay. Tutors get paid instantly onchain with no intermediary.

## How It Works
```
Tutor → createCourse() → addChapter(title, ipfsHash, price)
Student → approve(EduPay, amount) → purchaseChapter(courseId, chapterId)
Contract → pays tutor instantly (95%) → holds 5% platform fee → unlocks content
```

## Features

- Pay per chapter or buy full course in one transaction
- Instant tutor payout in cUSD (Mento stablecoin)
- Content stored on IPFS — only access gated onchain
- 5% platform fee (max 10%, owner configurable)
- MiniPay compatible (mobile-first)
- Self Protocol integration for tutor humanity verification


## Contract Architecture
```
EduPay.sol
├── createCourse()         — tutor registers a course
├── addChapter()           — tutor adds lesson with IPFS hash + cUSD price
├── purchaseChapter()      — student buys single chapter
├── purchaseFullCourse()   — student buys all remaining chapters
├── getChapterContent()    — returns IPFS hash only if student has access
├── withdrawFees()         — owner collects platform fees
└── setPlatformFee()       — owner adjusts fee (max 10%)
```