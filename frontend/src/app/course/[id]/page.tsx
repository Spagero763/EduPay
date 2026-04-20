"use client"

import { use, useEffect, useState, useCallback } from "react"
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

            if (block.type === "text") {
              return <p key={i}>{block.content}</p>
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

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const courseId = Number(id)
  const isValidCourseId = Number.isInteger(courseId) && courseId >= 0

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
  const [error, setError] = useState("")

  const loadData = useCallback(async () => {
    if (!isValidCourseId) {
      setError("Invalid course id")
      return
    }

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
      })
    }

    setChapters(list)
  }, [courseId, isValidCourseId])

  useEffect(() => {
    if (!walletLoading) loadData()
  }, [walletLoading, loadData])

  if (!isValidCourseId) return <div>Invalid course id</div>
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

        {error && <div style={{ marginTop: 12, color: "#C4622D", fontSize: 13 }}>{error}</div>}
      </section>
    </div>
  )
}