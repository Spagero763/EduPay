"use client"

import { useEffect, useState, useCallback } from "react"
import { ethers } from "ethers"
import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { motion } from "framer-motion"
import { AddChapterPanel } from "@/components/AddChapterPanel"

type Chapter = {
  id: number
  title: string
  priceUSD6: ethers.BigNumber
  contentHash: string
  hasAccess: boolean
  content: string | null
}

type Course = {
  tutor: string
  title: string
  description: string
  isActive: boolean
  chapterCount: number
}

// ✅ UPDATED renderContent (Fix 5)
function renderContent(hash: string): React.ReactNode {
  if (!hash) return null

  if (hash.startsWith("data:application/json;base64,")) {
    try {
      const json = decodeURIComponent(escape(atob(hash.replace("data:application/json;base64,", ""))))
      const data = JSON.parse(json)

      return (
        <div>
          {data.blocks?.map((block: any, i: number) => {

            if (block.type === "imageUrl" && block.content) {
              return (
                <figure key={i} style={{ margin: "32px 0" }}>
                  <img
                    src={block.content}
                    alt="Lesson image"
                    style={{ width: "100%", display: "block", maxHeight: 500, objectFit: "contain" }}
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </figure>
              )
            }

            if (block.type === "image" && block.content) {
              if (block.content.startsWith("http")) {
                return (
                  <figure key={i} style={{ margin: "32px 0" }}>
                    <img src={block.content} alt="" style={{ width: "100%", display: "block" }} />
                  </figure>
                )
              }
              return null
            }

            if (block.type === "heading") {
              return <h2 key={i} style={{ fontSize: 22, fontWeight: 700, margin: "28px 0 8px" }}>{block.content}</h2>
            }

            if (block.type === "subheading") {
              return <h3 key={i} style={{ fontSize: 17, fontWeight: 600, margin: "20px 0 6px" }}>{block.content}</h3>
            }

            if (block.type === "text") {
              return <p key={i} style={{ lineHeight: 1.8, margin: "12px 0" }}>{block.content}</p>
            }

            if (block.type === "code") {
              return (
                <pre key={i} style={{ background: "rgba(13,11,8,0.04)", padding: "16px", fontFamily: "monospace", fontSize: 13, overflowX: "auto", margin: "16px 0", lineHeight: 1.7 }}>
                  <code>{block.content}</code>
                </pre>
              )
            }

            if (block.type === "url") {
              return (
                <div key={i} style={{ margin: "12px 0" }}>
                  <a href={block.content} target="_blank" rel="noopener noreferrer" style={{ color: "#C4622D", fontSize: 14, wordBreak: "break-all" }}>{block.content}</a>
                </div>
              )
            }

            return null
          })}
        </div>
      )
    } catch {
      return null
    }
  }

  return null
}

export default function CoursePage({ params }: { params: { id: string } }) {
  const courseId = Number(params.id)

  const {
    address,
    loading: walletLoading,
    connect,
    isConnected,
    purchaseChapter,
    purchaseFullCourse,
    getChapterContent,
  } = useMiniPay()

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [addingChapter, setAddingChapter] = useState(false)

  const loadData = useCallback(async () => {
    const provider = new ethers.providers.JsonRpcProvider("https://forno.celo.org")

    const eduPay = new ethers.Contract(
      "0xDBA56f8d23c69Dbd9659be4ca18133962BC86191",
      [
        "function courses(uint256) view returns (address,string,string,bool,uint256,uint256)",
        "function getChapter(uint256,uint256) view returns (string,uint256,bool)",
      ],
      provider
    )

    const c = await eduPay.courses(courseId)

    setCourse({
      tutor: c[0],
      title: c[1],
      description: c[2],
      isActive: c[3],
      chapterCount: Number(c[4]),
    })

    const list: Chapter[] = []

    for (let i = 0; i < Number(c[4]); i++) {
      const ch = await eduPay.getChapter(courseId, i)

      list.push({
        id: i,
        title: ch[0],
        priceUSD6: ethers.BigNumber.from(ch[1]),
        contentHash: "",
        hasAccess: false,
        content: null,
      })
    }

    setChapters(list)
  }, [courseId])

  useEffect(() => {
    if (!walletLoading) loadData()
  }, [walletLoading, loadData])

  if (!course) return <div>Loading...</div>

  return (
    <div>

      {/* HEADER */}
      <div>
        <h1>{course.title}</h1>
        <p>{course.description}</p>

        <div>{course.tutor}</div>

        {address && course && address.toLowerCase() === course.tutor.toLowerCase() && (
          <button
            onClick={() => setAddingChapter(true)}
            style={{
              marginTop: 20,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0D0B08",
              background: "transparent",
              border: "1px solid rgba(13,11,8,0.2)",
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            + Add chapter
          </button>
        )}
      </div>

      {/* CHAPTERS */}
      <section>
        {chapters.map(ch => (
          <div key={ch.id}>{ch.title}</div>
        ))}

        {addingChapter && (
          <AddChapterPanel
            courseId={courseId}
            existingCount={chapters.length}
            onDone={() => {
              setAddingChapter(false)
              loadData()
            }}
          />
        )}
      </section>
    </div>
  )
}