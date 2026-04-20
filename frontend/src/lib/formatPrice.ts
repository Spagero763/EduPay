import { ethers } from "ethers"

// Chapters created before the decimal fix were stored using parseEther (18 decimals).
// Chapters created after the fix use parseUnits(6). We detect which by checking if the
// raw value is above a threshold that would be unreasonable as a 6-decimal price.
// 1e10 in 6-decimal terms = $10,000 — no chapter should ever cost that much,
// so anything above it is legacy 18-decimal data.

const LEGACY_THRESHOLD = ethers.BigNumber.from("10000000000") // 1e10

export function formatPrice(rawPrice: string | ethers.BigNumber): string {
  const bn = ethers.BigNumber.from(rawPrice)
  if (bn.gt(LEGACY_THRESHOLD)) {
    return Number(ethers.utils.formatEther(bn)).toFixed(2)
  }
  return Number(ethers.utils.formatUnits(bn, 6)).toFixed(2)
}

export function isLegacyPrice(rawPrice: string | ethers.BigNumber): boolean {
  return ethers.BigNumber.from(rawPrice).gt(LEGACY_THRESHOLD)
}

export function formatTokenAmount(
  rawAmount: string | ethers.BigNumber,
  decimals: number,
  fractionDigits = 2
): string {
  try {
    const value = Number(ethers.utils.formatUnits(rawAmount, decimals))
    if (!Number.isFinite(value)) return "0.00"
    return value.toFixed(fractionDigits)
  } catch {
    return "0.00"
  }
}
