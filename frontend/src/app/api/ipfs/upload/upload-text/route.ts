import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { content, filename } = await req.json()

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 })
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
      const err = await res.text()
      throw new Error(`Pinata error: ${err}`)
    }

    const data = await res.json()
    return NextResponse.json({
      ipfsHash: `ipfs://${data.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      cid: data.IpfsHash,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}