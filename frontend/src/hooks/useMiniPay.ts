import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { EDUPAY_ADDRESS, CUSD_ADDRESS, EDUPAY_ABI, CUSD_ABI } from "@/lib/contract"

export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [cusdBalance, setCusdBalance] = useState<string>("0")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const eth = (window as any).ethereum
        if (!eth) { setLoading(false); return }

        const miniPay = eth.isMiniPay === true
        setIsMiniPay(miniPay)

        const _provider = new ethers.BrowserProvider(eth)
        setProvider(_provider)

        const accounts = await _provider.send("eth_requestAccounts", [])
        if (!accounts.length) { setLoading(false); return }

        const _signer = await _provider.getSigner()
        setSigner(_signer)
        setAddress(accounts[0])

        const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, _provider)
        const bal = await cusd.balanceOf(accounts[0])
        setCusdBalance(ethers.formatEther(bal))
      } catch (err) {
        console.error("useMiniPay init error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  function getEduPay(withSigner = false) {
    const runner = withSigner ? signer : provider
    if (!runner) throw new Error("No provider")
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, runner)
  }

  function getCusd(withSigner = false) {
    const runner = withSigner ? signer : provider
    if (!runner) throw new Error("No provider")
    return new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, runner)
  }

  async function approveAndPurchase(amount: bigint, action: () => Promise<any>) {
    if (!signer || !address) throw new Error("Not connected")
    const cusd = getCusd(true)
    const allowance = await cusd.allowance(address, EDUPAY_ADDRESS)
    if (BigInt(allowance) < amount) {
      const tx = await cusd.approve(EDUPAY_ADDRESS, ethers.MaxUint256)
      await tx.wait()
    }
    return action()
  }

  async function purchaseChapter(courseId: number, chapterId: number, price: bigint) {
    const eduPay = getEduPay(true)
    return approveAndPurchase(price, async () => {
      const tx = await eduPay.purchaseChapter(courseId, chapterId)
      return tx.wait()
    })
  }

  async function purchaseFullCourse(courseId: number, totalPrice: bigint) {
    const eduPay = getEduPay(true)
    return approveAndPurchase(totalPrice, async () => {
      const tx = await eduPay.purchaseFullCourse(courseId)
      return tx.wait()
    })
  }

  async function createCourse(title: string, description: string): Promise<number> {
    const eduPay = getEduPay(true)
    const tx = await eduPay.createCourse(title, description)
    const receipt = await tx.wait()
    const iface = new ethers.Interface(EDUPAY_ABI as any)
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log)
        if (parsed?.name === "CourseCreated") return Number(parsed.args.courseId)
      } catch {}
    }
    throw new Error("CourseCreated event not found")
  }

  async function addChapter(
    courseId: number,
    title: string,
    contentHash: string,
    price: bigint
  ) {
    const eduPay = getEduPay(true)
    const tx = await eduPay.addChapter(courseId, title, contentHash, price)
    return tx.wait()
  }

  return {
    isMiniPay,
    address,
    provider,
    signer,
    cusdBalance,
    loading,
    getEduPay,
    getCusd,
    purchaseChapter,
    purchaseFullCourse,
    createCourse,
    addChapter,
  }
}
