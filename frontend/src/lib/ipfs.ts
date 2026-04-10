export async function uploadToIPFS(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("/api/ipfs/upload", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "IPFS upload failed")
  }

  const data = await res.json()
  return data.ipfsHash
}

export async function uploadTextToIPFS(content: string, filename: string): Promise<string> {
  const res = await fetch("/api/ipfs/upload-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, filename }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "IPFS upload failed")
  }

  const data = await res.json()
  return data.ipfsHash
}