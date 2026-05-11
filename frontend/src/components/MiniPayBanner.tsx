"use client"

import { useEffect, useState } from "react"
import { useMiniPay } from "@/hooks/useMiniPay"

export function MiniPayBanner() {
  const { isMiniPay } = useMiniPay()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isMiniPay) return
    const dismissed = localStorage.getItem("minipay-banner-dismissed")
    if (!dismissed) setVisible(true)
  }, [isMiniPay])

  function dismiss() {
    localStorage.setItem("minipay-banner-dismissed", "1")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: "fixed",
        top: 64,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "#C4622D",
        color: "#F2ECE2",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14 }}>⚡</span>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>
            You&apos;re in MiniPay.{" "}
          </span>
          <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 300 }}>
            Browse courses and pay with cUSD in one tap — no bank needed.
          </span>
        </div>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: "none",
          border: "none",
          color: "#F2ECE2",
          fontSize: 18,
          cursor: "pointer",
          opacity: 0.7,
          padding: "0 4px",
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
