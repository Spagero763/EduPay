"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export type ToastType = "success" | "error" | "info"

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

let listeners: ((t: ToastMessage) => void)[] = []

export function toast(message: string, type: ToastType = "info") {
  const t: ToastMessage = { id: Math.random().toString(36).slice(2), type, message }
  listeners.forEach(fn => fn(t))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const add = (t: ToastMessage) => {
      setToasts(prev => [...prev.slice(-2), t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000)
    }
    listeners.push(add)
    return () => { listeners = listeners.filter(fn => fn !== add) }
  }, [])

  const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: "#F2ECE2", border: "rgba(45,196,122,0.4)", icon: "✓" },
    error:   { bg: "#F2ECE2", border: "rgba(196,98,45,0.5)", icon: "✕" },
    info:    { bg: "#F2ECE2", border: "rgba(13,11,8,0.15)", icon: "·" },
  }

  return (
    <div style={{ position: "fixed", bottom: 80, right: 20, zIndex: 200, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      <AnimatePresence>
        {toasts.map(t => {
          const c = colors[t.type]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                maxWidth: 300,
                boxShadow: "0 4px 20px rgba(13,11,8,0.1)",
                pointerEvents: "auto",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: t.type === "success" ? "#2DC47A" : t.type === "error" ? "#C4622D" : "#0D0B08" }}>
                {c.icon}
              </span>
              <span style={{ fontSize: 12, color: "#0D0B08", lineHeight: 1.4 }}>{t.message}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
