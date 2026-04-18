import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { EDUPAY_ADDRESS, USDC_ADDRESS, EDUPAY_ABI, USDC_ABI } from "@/lib/contract"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"

const PUBLIC_RPC = "https://forno.celo.org"

export function useMiniPay() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider("eip155")

  const [isMiniPay, setIsMiniPay] = useState(false)
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [cusdBalance, setCusdBalance] = useState<string>("0")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const publicProvider = new ethers.providers.JsonRpcProvider(PUBLIC_RPC)
    setProvider(publicProvider)
    setLoading(false)

    const eth = (window as any).ethereum
    if (eth?.isMiniPay) setIsMiniPay(true)
  }, [])

  useEffect(() => {
    if (!walletProvider || !address) return
    async function setup() {
      try {
        const web3Provider = new ethers.providers.Web3Provider(
          walletProvider as any
        )
        const _signer = web3Provider.getSigner()
        setSigner(_signer)
        setProvider(web3Provider)

        const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, web3Provider)
        const bal = await usdc.balanceOf(address)
        setCusdBalance(ethers.utils.formatUnits(bal, 6))
      } catch (err) {
        console.error("wallet setup error:", err)
      }
    }
    setup()
  }, [walletProvider, address])

  function connect() {
    open()
  }

  function getEduPay(withSigner = false) {
    const runner = withSigner ? signer : provider
    if (!runner) throw new Error("No provider")
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, runner)
  }

  // ✅ ADD THIS (this is the only missing piece)
  function getPublicEduPay() {
    if (!provider) throw new Error("No provider")
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, provider)
  }

  function getUsdc(withSigner = false) {
    const runner = withSigner ? signer : provider
    if (!runner) throw new Error("No provider")
    return new ethers.Contract(USDC_ADDRESS, USDC_ABI, runner)
  }

  async function approveAndPurchase(amount: ethers.BigNumber, action: () => Promise<unknown>) {
    if (!signer || !address) throw new Error("Not connected")
    const usdc = getUsdc(true)
    const allowance = await usdc.allowance(address, EDUPAY_ADDRESS)
    if (allowance.lt(amount)) {
      const tx = await usdc.approve(EDUPAY_ADDRESS, ethers.constants.MaxUint256)
      await tx.wait()
    }
    return action()
  }

  async function purchaseChapter(courseId: number, chapterId: number, price: ethers.BigNumber) {
    const eduPay = getEduPay(true)
    return approveAndPurchase(price, async () => {
      const tx = await eduPay.purchaseChapter(courseId, chapterId, USDC_ADDRESS)
      return tx.wait()
    })
  }

  async function purchaseFullCourse(courseId: number, totalPrice: ethers.BigNumber) {
    const eduPay = getEduPay(true)
    return approveAndPurchase(totalPrice, async () => {
      const tx = await eduPay.purchaseFullCourse(courseId, USDC_ADDRESS)
      return tx.wait()
    })
  }

  async function createCourse(title: string, description: string): Promise<number> {
    const eduPay = getEduPay(true)
    const tx = await eduPay.createCourse(title, description)
    const receipt = await tx.wait() as ethers.ContractReceipt
    const iface = new ethers.utils.Interface(EDUPAY_ABI)
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
    price: ethers.BigNumber
  ) {
    const eduPay = getEduPay(true)
    const tx = await eduPay.addChapter(courseId, title, contentHash, price)
    return tx.wait()
  }

  async function updateChapter(
    courseId: number,
    chapterId: number,
    price: ethers.BigNumber
  ) {
    const eduPay = getEduPay(true)
    const tx = await eduPay.updateChapter(courseId, chapterId, "", price)
    return tx.wait()
  }

  async function getChapterContent(courseId: number, chapterId: number): Promise<string> {
    if (!signer || !address) throw new Error("Not connected")
    const eduPay = getEduPay(true)
    return eduPay.getChapterContent(courseId, chapterId)
  }

  return {
    isMiniPay,
    address: address ?? null,
    isConnected,
    provider,
    signer,
    cusdBalance,
    loading,
    connect,
    getEduPay,
    getPublicEduPay, // ✅ NOW EXISTS
    getUsdc,
    getChapterContent,
    purchaseChapter,
    purchaseFullCourse,
    createCourse,
    addChapter,
    updateChapter,
  }
}