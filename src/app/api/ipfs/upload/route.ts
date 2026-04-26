import { NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(req: NextRequest) {
  if (!process.env.PINATA_JWT) {
    return NextResponse.json({ error: "Upload service not configured" }, { status: 503 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 50 MB limit" }, { status: 413 })
    }

    const pinataFormData = new FormData()
    pinataFormData.append("file", file)
    pinataFormData.append(
      "pinataMetadata",
      JSON.stringify({ name: file.name })
    )
    pinataFormData.append(
      "pinataOptions",
      JSON.stringify({ cidVersion: 1 })
    )

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataFormData,
    })

    if (!res.ok) {
      console.error("Pinata upload failed:", res.status)
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({
      ipfsHash: `ipfs://${data.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      cid: data.IpfsHash,
    })
  } catch (err) {
    console.error("IPFS upload error:", err)
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 })
  }
}