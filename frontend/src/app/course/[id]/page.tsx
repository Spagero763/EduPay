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
  const [addingChapter, setAddingChapter] = useState(false) // ✅ Fix 5
  const [editing, setEditing] = useState(false) // ✅ Fix 4

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

        {/* ✅ Fix 5 button */}
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

        {/* ✅ Fix 4 button */}
        {address && course && address.toLowerCase() === course.tutor.toLowerCase() && (
          <button onClick={() => setEditing(true)}>
            Add chapter
          </button>
        )}
      </div>

      {/* CHAPTERS */}
      <section>
        {chapters.map(ch => (
          <div key={ch.id}>{ch.title}</div>
        ))}

        {/* ✅ Fix 5 panel */}
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

        {/* ✅ Fix 4 panel */}
        {editing && address && course && address.toLowerCase() === course.tutor.toLowerCase() && (
          <AddChapterPanel
            courseId={courseId}
            existingCount={chapters.length}
            onDone={() => {
              setEditing(false)
              loadData()
            }}
          />
        )}
      </section>
    </div>
  )
}