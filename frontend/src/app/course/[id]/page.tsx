"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useParams, useRouter } from "next/navigation"
import { useMiniPay } from "@/hooks/useMiniPay"
import { parseError } from "@/lib/parseError"
import { formatPrice, isLegacyPrice } from "@/lib/formatPrice"
import { motion } from "framer-motion"

type Chapter = {
  id: number
  title: string
  price: string
  purchased: boolean
}

type CourseData = {
  tutor: string
  title: string
  description: string
  isActive: boolean
  chapterCount: number
  totalEarned: string
}

export default function CoursePage() {
  const { id } = useParams()
  const router = useRouter()
  const { address, connect, getEduPay, purchaseChapter, purchaseFullCourse, loading } = useMiniPay()

  const [course, setCourse] = useState<CourseData | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [fullPrice, setFullPrice] = useState<string>("0")
  const [fetching, setFetching] = useState(true)
  const [buying, setBuying] = useState<number | "full" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<Record<number, string>>({})

  const courseId = Number(id)

  // ✅ DECODE FUNCTION
  function decodeContent(contentHash: string): React.ReactNode {
    if (!contentHash) return null

    if (contentHash.startsWith("data:application/json;base64,")) {
      try {
        const json = decodeURIComponent(escape(atob(contentHash.replace("data:application/json;base64,", ""))))
        const blocks: Array<{ type: string; content: string }> = JSON.parse(json)
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {blocks.map((block, i) => {
              if (block.type === "text") {
                return (
                  <p key={i} style={{ fontSize: 15, lineHeight: 1.9, color: "#0D0B08", whiteSpace: "pre-wrap", fontWeight: 300 }}>
                    {block.content}
                  </p>
                )
              }
              if (block.type === "image") {
                return <img key={i} src={block.content} style={{ width: "100%" }} />
              }
              if (block.type === "url") {
                return (
                  <a key={i} href={block.content} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#C4622D", textDecoration: "none" }}
                  >
                    Open resource →
                  </a>
                )
              }
              return null
            })}
          </div>
        )
      } catch {
        return <p>Could not decode content.</p>
      }
    }

    if (contentHash.startsWith("data:text/plain;base64,")) {
      try {
        const text = decodeURIComponent(escape(atob(contentHash.replace("data:text/plain;base64,", ""))))
        return <p>{text}</p>
      } catch {
        return null
      }
    }

    if (contentHash.startsWith("data:image/")) {
      return <img src={contentHash} style={{ width: "100%" }} />
    }

    if (contentHash.startsWith("ipfs://")) {
      const cid = contentHash.replace("ipfs://", "")
      return (
        <a href={`https://gateway.pinata.cloud/ipfs/${cid}`} target="_blank">
          View on IPFS →
        </a>
      )
    }

    if (contentHash.startsWith("http")) {
      return (
        <a href={contentHash} target="_blank">
          Open lesson content →
        </a>
      )
    }

    return <p>{contentHash}</p>
  }

  async function fetchCourse() {
    try {
      const eduPay = getEduPay()
      const c = await eduPay.courses(courseId)

      setCourse({
        tutor: c.tutor,
        title: c.title,
        description: c.description,
        isActive: c.isActive,
        chapterCount: Number(c.chapterCount),
        totalEarned: c.totalEarned.toString(),
      })

      const chList: Chapter[] = []

      for (let i = 0; i < Number(c.chapterCount); i++) {
        const ch = await eduPay.getChapter(courseId, i)

        chList.push({
          id: i,
          title: ch.title,
          price: ch.priceUSD.toString(),
          purchased: ch.purchased,
        })

        // ✅ AUTO LOAD CONTENT IF PURCHASED
        if (ch.purchased) {
          try {
            const hash = await eduPay.getChapterContent(courseId, i)
            setContent(prev => ({ ...prev, [i]: hash }))
          } catch {}
        }
      }

      setChapters(chList)

      if (address) {
        const fp = await eduPay.getFullCoursePrice(courseId, address)
        setFullPrice(fp.toString())
      }

    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (loading) return
    fetchCourse()
  }, [loading, address])

  async function handleBuyChapter(chapterId: number, price: string) {
    if (!address) { connect(); return }

    setBuying(chapterId)
    setError(null)

    try {
      await purchaseChapter(courseId, chapterId, ethers.BigNumber.from(price))
      await fetchCourse()
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setBuying(null)
    }
  }

  async function handleBuyFull() {
    if (!address) { connect(); return }

    setBuying("full")
    setError(null)

    try {
      await purchaseFullCourse(courseId, ethers.BigNumber.from(fullPrice))
      await fetchCourse()
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setBuying(null)
    }
  }

  if (!course) return null

  return (
    <div style={{ padding: 40 }}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      {chapters.map((ch) => (
        <div key={ch.id} style={{ marginBottom: 40 }}>
          <h3>{ch.title}</h3>

          {ch.purchased ? (
            <>
              {!content[ch.id] && (
                <button onClick={() => handleBuyChapter(ch.id, ch.price)}>
                  Load lesson
                </button>
              )}

              {content[ch.id] && (
                <div style={{ marginTop: 20 }}>
                  {decodeContent(content[ch.id])}
                </div>
              )}
            </>
          ) : (
            <button onClick={() => handleBuyChapter(ch.id, ch.price)}>
              Buy
            </button>
          )}
        </div>
      ))}
    </div>
  )
}