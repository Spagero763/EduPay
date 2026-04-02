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
  totalEarned: bigint
}

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/course/${course.id}`}>
        <div className="group border-t border-white/10 py-8 flex items-start justify-between gap-8 hover:border-white/30 transition-all duration-300 cursor-pointer">
          <div className="flex-1">
            <div className="text-xs text-white/30 mb-3 uppercase tracking-widest">
              {course.chapterCount} {course.chapterCount === 1 ? "lesson" : "lessons"}
            </div>
            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-green-400 transition-colors duration-300">
              {course.title}
            </h3>
            <p className="text-white/40 text-sm leading-relaxed max-w-lg line-clamp-2">
              {course.description}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-white/20 mb-1">Tutor</div>
            <div className="text-sm text-white/50 font-mono">
              {course.tutor.slice(0, 6)}...{course.tutor.slice(-4)}
            </div>
            <div className="mt-4 text-green-400 text-sm font-medium">
              {Number(ethers.formatEther(course.totalEarned)).toFixed(2)} cUSD
            </div>
            <div className="text-xs text-white/20">earned</div>
          </div>
          <div className="self-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M12 6l4 4-4 4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

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
              totalEarned: c.totalEarned,
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
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-end pb-24 px-6 overflow-hidden">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-6xl mx-auto w-full"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs text-green-400/80 uppercase tracking-[0.2em] mb-8"
          >
            Built on Celo + MiniPay
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3rem,8vw,7rem)] font-semibold leading-[1.02] tracking-tight text-white mb-8 max-w-4xl"
          >
            Learn what<br />
            you need.<br />
            <span className="text-green-400">Pay per lesson.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-end justify-between gap-8 flex-wrap"
          >
            <p className="text-white/40 text-lg max-w-md leading-relaxed">
              African students pay tutors in cUSD, one chapter at a time.
              No banks. No middlemen. Instant settlement.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="#courses"
                className="text-sm text-white/50 hover:text-white transition-colors border-b border-white/20 hover:border-white pb-0.5"
              >
                Browse courses
              </Link>
              <Link
                href="/create"
                className="text-sm bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 transition-colors duration-200"
              >
                Start teaching
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/20 uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent"
          />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/5 px-6 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-0 divide-x divide-white/5">
          {[
            { value: "cUSD", label: "Mento stablecoin" },
            { value: "95%", label: "Goes to tutors" },
            { value: "IPFS", label: "Decentralised content" },
          ].map((stat, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className="px-10 first:pl-0 last:pr-0">
                <div className="text-4xl font-semibold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-white/30">{stat.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <div className="flex items-end justify-between mb-16">
              <div>
                <div className="text-xs text-white/30 uppercase tracking-widest mb-4">Available now</div>
                <h2 className="text-5xl font-semibold text-white">Courses</h2>
              </div>
              <Link
                href="/create"
                className="text-sm text-white/40 hover:text-green-400 transition-colors border-b border-white/10 hover:border-green-400 pb-0.5"
              >
                Add yours
              </Link>
            </div>
          </FadeUp>

          {fetching ? (
            <div className="space-y-0">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-t border-white/10 py-8 animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-20 mb-3" />
                  <div className="h-7 bg-white/5 rounded w-64 mb-3" />
                  <div className="h-4 bg-white/5 rounded w-96" />
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <FadeUp>
              <div className="border-t border-white/10 py-24 text-center">
                <p className="text-white/20 text-lg mb-2">No courses yet</p>
                <p className="text-white/10 text-sm mb-8">Be the first to teach on EduPay</p>
                <Link
                  href="/create"
                  className="text-sm text-green-400 border-b border-green-400/40 hover:border-green-400 pb-0.5 transition-colors"
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
              <div className="border-t border-white/10" />
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-32 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
              <h2 className="text-5xl md:text-6xl font-semibold text-white leading-tight max-w-xl">
                Share your knowledge.<br />
                <span className="text-white/30">Get paid instantly.</span>
              </h2>
              <Link
                href="/create"
                className="shrink-0 text-sm bg-green-600 hover:bg-green-500 text-white px-8 py-4 transition-colors duration-200 font-medium"
              >
                Create your course
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-white/20 text-sm">EduPay</span>
          <span className="text-white/20 text-sm">Built on Celo</span>
          
            href="https://celoscan.io/address/0x8A2D3A806f932616ba07D3Fc42bAb1Bdf6f312a1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/20 text-sm hover:text-white/50 transition-colors"
          >
            Contract
          </a>
        </div>
      </footer>
    </div>
  )
}
