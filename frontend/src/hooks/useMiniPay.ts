import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { EDUPAY_ADDRESS, CUSD_ADDRESS, EDUPAY_ABI, CUSD_ABI } from "@/lib/contract"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import type { Eip1193Provider } from "ethers"

const PUBLIC_RPC = "https://forno.celo.org"

export function useMiniPay() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider("eip155")

  const [isMiniPay, setIsMiniPay] = useState(false)
  const [cusdBalance, setCusdBalance] = useState("0")
  const [loading, setLoading] = useState(true)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [publicProvider] = useState(() => new ethers.providers.JsonRpcProvider(PUBLIC_RPC))

  useEffect(() => {
    const eth = (window as any).ethereum
    if (eth?.isMiniPay) setIsMiniPay(true)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!walletProvider || !address) return
    async function setup() {
      try {
        const web3Provider = new ethers.providers.Web3Provider(walletProvider as Eip1193Provider)
        const _signer = web3Provider.getSigner()
        setSigner(_signer)

        const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, web3Provider)
        const bal = await cusd.balanceOf(address)
        setCusdBalance(ethers.utils.formatEther(bal))
      } catch (err) {
        console.error("wallet setup error:", err)
      }
    }
    setup()
  }, [walletProvider, address])

  function connect() { open() }

  function getEduPay(withSigner = false): ethers.Contract {
    const runner = withSigner ? signer : publicProvider
    if (!runner) throw new Error("No provider")
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, runner)
  }

  function getCusd(withSigner = false): ethers.Contract {
    const runner = withSigner ? signer : publicProvider
    if (!runner) throw new Error("No provider")
    return new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, runner)
  }

  async function ensureApproved(amount: ethers.BigNumber) {
    if (!signer || !address) throw new Error("Not connected")
    const cusd = getCusd(true)
    const allowance: ethers.BigNumber = await cusd.allowance(address, EDUPAY_ADDRESS)
    if (allowance.lt(amount)) {
      const tx = await cusd.approve(EDUPAY_ADDRESS, ethers.constants.MaxUint256)
      await tx.wait()
    }
  }

  async function purchaseChapter(courseId: number, chapterId: number, priceIn18: ethers.BigNumber) {
    if (!signer) throw new Error("Not connected")
    await ensureApproved(priceIn18)
    const eduPay = getEduPay(true)
    const tx = await eduPay.purchaseChapter(courseId, chapterId, CUSD_ADDRESS)
    return tx.wait()
  }

  async function purchaseFullCourse(courseId: number, totalIn18: ethers.BigNumber) {
    if (!signer) throw new Error("Not connected")
    await ensureApproved(totalIn18)
    const eduPay = getEduPay(true)
    const tx = await eduPay.purchaseFullCourse(courseId, CUSD_ADDRESS)
    return tx.wait()
  }

  async function createCourse(title: string, description: string): Promise<number> {
    if (!signer) throw new Error("Not connected")
    const eduPay = getEduPay(true)
    const tx = await eduPay.createCourse(title, description)
    const receipt = await tx.wait()
    const iface = new ethers.utils.Interface(EDUPAY_ABI as any)
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log)
        if (parsed?.name === "CourseCreated") return Number(parsed.args.courseId)
      } catch {}
    }
    throw new Error("CourseCreated event not found")
  }

  async function addChapter(courseId: number, title: string, contentHash: string, priceIn6: ethers.BigNumber) {
    if (!signer) throw new Error("Not connected")
    const eduPay = getEduPay(true)
    const tx = await eduPay.addChapter(courseId, title, contentHash, priceIn6)
    return tx.wait()
  }

  async function getChapterContent(courseId: number, chapterId: number): Promise<string> {
    if (!signer) throw new Error("Not connected")
    const eduPay = getEduPay(true)
    return eduPay.getChapterContent(courseId, chapterId)
  }

  return {
    isMiniPay, address: address ?? null, isConnected,
    cusdBalance, loading, connect, signer,
    getEduPay, getCusd,
    purchaseChapter, purchaseFullCourse,
    createCourse, addChapter, getChapterContent,
  }
}