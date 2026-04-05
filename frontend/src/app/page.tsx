"use client"

import { useEffect, useRef, useState } from "react"
import { ethers } from "ethers"
import Link from "next/link"
import { useMiniPay } from "@/hooks/useMiniPay"
import { motion, useScroll, useTransform, useInView } from "framer-motion"

type Course = {
  id: number
  tutor: string
  title: string
  description: string
  chapterCount: number
  totalEarned: string
}

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  return (
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-30px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/course/${course.id}`}>
        <div className="group border-t border-[#0D0B08]/10 py-10 flex items-start justify-between gap-12 hover:border-[#C4622D]/30 transition-all duration-500 cursor-pointer">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-[#0D0B08]/30 mb-5 uppercase tracking-[0.22em] font-medium">
              {course.chapterCount} {course.chapterCount === 1 ? "lesson" : "lessons"}
            </div>
            <h3 className="text-xl font-medium text-[#0D0B08]/85 mb-3 group-hover:text-[#C4622D] transition-colors duration-400 leading-snug">
              {course.title}
            </h3>
            <p className="text-[#0D0B08]/40 text-sm leading-relaxed max-w-lg line-clamp-2">
              {course.description}
            </p>
          </div>
          <div className="text-right shrink-0 pt-9">
            <div className="text-[10px] text-[#0D0B08]/22 mb-2 uppercase tracking-widest">Tutor</div>
            <div className="text-xs text-[#0D0B08]/38 font-mono">
              {course.tutor.slice(0, 6)}...{course.tutor.slice(-4)}
            </div>
            <div className="mt-4 text-[#C4622D] text-sm font-medium tabular-nums">
              {Number(ethers.utils.formatEther(course.totalEarned)).toFixed(2)}
              <span className="text-[#C4622D]/45 text-xs ml-1">cUSD</span>
            </div>
          </div>
          <div className="self-center shrink-0 pt-9 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 group-hover:translate-x-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#C4622D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Home() {
  const { getEduPay, loading } = useMiniPay()
  const [courses, setCourses] = useState<Course[]>([])
  const [fetching, setFetching] = useState(true)

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  useEffect(() => {
    if (loading) return
    async function fetchCourses() {
      try {
        const eduPay = getEduPay()
        const count = await eduPay.courseCount()
        const list: Course[] = []
        for (let i = 0; i < Number(count); i++) {
          const c = await eduPay.courses(i)
          if (c.isActive) {
            list.push({
              id: i,
              tutor: c.tutor,
              title: c.title,
              description: c.description,
              chapterCount: Number(c.chapterCount),
              totalEarned: c.totalEarned.toString(),
            })
          }
        }
        setCourses(list)
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchCourses()
  }, [loading])

  return (
    <div className="min-h-screen bg-[#F2ECE2] text-[#0D0B08]">

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-8 md:px-16 overflow-hidden"
      >
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative w-full max-w-5xl mx-auto flex flex-col items-center">

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[10px] text-[#0D0B08]/35 uppercase tracking-[0.32em] mb-12 font-medium"
          >
            Education on Celo
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 44 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3rem,8vw,7rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-[#0D0B08] mb-8"
          >
            Learn what<br />
            you need.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-[#C4622D] mb-14"
          >
            Pay per lesson.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="text-[#0D0B08]/40 text-base max-w-sm leading-relaxed mb-12"
          >
            African students pay tutors in cUSD,
            one chapter at a time. No banks. No middlemen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="flex items-center gap-5"
          >
            <Link
              href="#courses"
              className="text-xs text-[#0D0B08]/45 hover:text-[#0D0B08]/75 tracking-widest uppercase transition-colors duration-200 border-b border-[#0D0B08]/15 hover:border-[#0D0B08]/35 pb-px"
            >
              Browse courses
            </Link>
            <Link
              href="/create"
              className="text-xs bg-[#0D0B08] hover:bg-[#C4622D] text-[#F2ECE2] px-7 py-3.5 tracking-widest uppercase font-medium transition-colors duration-300"
            >
              Start teaching
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <span className="text-[9px] text-[#0D0B08]/20 uppercase tracking-[0.3em]">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-px h-10 bg-gradient-to-b from-[#0D0B08]/15 to-transparent"
          />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-t border-[#0D0B08]/8 px-8 md:px-16 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-3">
          {[
            { value: "cUSD", label: "Mento stablecoin" },
            { value: "95%", label: "Goes to tutors" },
            { value: "IPFS", label: "Decentralised content" },
          ].map((stat, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className={`text-center ${i === 1 ? "border-x border-[#0D0B08]/8 px-10" : "px-10"}`}>
                <div className="text-[2.2rem] font-semibold text-[#0D0B08] mb-2 tracking-tight">{stat.value}</div>
                <div className="text-xs text-[#0D0B08]/30 uppercase tracking-widest">{stat.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="border-t border-[#0D0B08]/8 px-8 md:px-16 py-24">
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="flex items-end justify-between mb-16">
              <div>
                <div className="text-[10px] text-[#0D0B08]/28 uppercase tracking-[0.24em] mb-5 font-medium">Available now</div>
                <h2 className="text-4xl font-semibold text-[#0D0B08] tracking-tight">Courses</h2>
              </div>
              <Link
                href="/create"
                className="text-xs text-[#0D0B08]/32 hover:text-[#C4622D] tracking-widest uppercase transition-colors duration-200 border-b border-[#0D0B08]/10 hover:border-[#C4622D]/40 pb-px mb-1"
              >
                Add yours
              </Link>
            </div>
          </FadeUp>

          {fetching ? (
            <div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-t border-[#0D0B08]/8 py-10 animate-pulse">
                  <div className="h-2.5 bg-[#0D0B08]/5 rounded w-14 mb-5" />
                  <div className="h-5 bg-[#0D0B08]/5 rounded w-52 mb-4" />
                  <div className="h-3 bg-[#0D0B08]/5 rounded w-72" />
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <FadeUp>
              <div className="border-t border-[#0D0B08]/8 py-28 text-center">
                <p className="text-[#0D0B08]/25 text-base mb-3 font-light">No courses yet</p>
                <p className="text-[#0D0B08]/15 text-sm mb-10">Be the first educator on EduPay</p>
                <Link
                  href="/create"
                  className="text-xs text-[#C4622D] border-b border-[#C4622D]/30 hover:border-[#C4622D] pb-px transition-colors tracking-widest uppercase"
                >
                  Create a course
                </Link>
              </div>
            </FadeUp>
          ) : (
            <div>
              {courses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
              <div className="border-t border-[#0D0B08]/8" />
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#0D0B08]/8 px-8 md:px-16 py-32">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <div className="text-[10px] text-[#0D0B08]/28 uppercase tracking-[0.28em] mb-8 font-medium">
              For educators
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold text-[#0D0B08] leading-[1.06] tracking-tight mb-6 max-w-xl mx-auto">
              Share your knowledge.
            </h2>
            <p className="text-[#0D0B08]/35 text-base mb-12 max-w-sm mx-auto leading-relaxed">
              Publish your course, set your price per chapter, get paid instantly in cUSD.
            </p>
            <Link
              href="/create"
              className="inline-block text-xs bg-[#0D0B08] hover:bg-[#C4622D] text-[#F2ECE2] px-10 py-4 tracking-widest uppercase font-medium transition-colors duration-300"
            >
              Create your course
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0D0B08]/8 px-8 md:px-16 py-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-[#0D0B08]/30 text-xs font-medium uppercase tracking-widest">EduPay</span>
          <span className="text-[#0D0B08]/18 text-[10px] uppercase tracking-[0.2em]">2026</span>
          
          <a  href="https://celoscan.io/address/0x8A2D3A806f932616ba07D3Fc42bAb1Bdf6f312a1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0D0B08]/22 text-[10px] hover:text-[#C4622D] transition-colors duration-200 font-mono"
          >
            0x8A2D...12a1
          </a>
        </div>
      </footer>
    </div>
  )
}
