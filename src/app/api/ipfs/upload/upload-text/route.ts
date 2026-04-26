import { NextRequest, NextResponse } from "next/server"

const MAX_TEXT_LENGTH = 500_000 // ~500 KB of text

export async function POST(req: NextRequest) {
  if (!process.env.PINATA_JWT) {
    return NextResponse.json({ error: "Upload service not configured" }, { status: 503 })
  }

  try {
    const { content, filename } = await req.json()

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 })
    }

    if (typeof content === "string" && content.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Content exceeds 500 KB limit" }, { status: 413 })
    }

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: { content, filename, timestamp: new Date().toISOString() },
        pinataMetadata: { name: filename || "lesson-content" },
        pinataOptions: { cidVersion: 1 },
      }),
    })

    if (!res.ok) {
      console.error("Pinata text upload failed:", res.status)
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({
      ipfsHash: `ipfs://${data.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      cid: data.IpfsHash,
    })
  } catch (err) {
    console.error("IPFS text upload error:", err)
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 })
  }
}