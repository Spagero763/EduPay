import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
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