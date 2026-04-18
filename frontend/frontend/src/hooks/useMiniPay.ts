import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { EDUPAY_ADDRESS, CUSD_ADDRESS, EDUPAY_ABI, CUSD_ABI } from "@/lib/contract"

const PUBLIC_RPC = "https://forno.celo.org"

export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [cusdBalance, setCusdBalance] = useState<string>("0")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const eth = (window as any).ethereum

        // Always set up a public provider for reading — no wallet needed
        const publicProvider = new ethers.providers.JsonRpcProvider(PUBLIC_RPC)
        setProvider(publicProvider)

        if (!eth) { setLoading(false); return }

        setIsMiniPay(eth.isMiniPay === true)

        // Silent check — do NOT request accounts automatically
        const accounts: string[] = await eth.request({ method: "eth_accounts" })
        if (!accounts.length) { setLoading(false); return }

        const web3Provider = new ethers.providers.Web3Provider(eth)
        const _signer = web3Provider.getSigner()
        setSigner(_signer)
        setProvider(web3Provider)

        const _address = await _signer.getAddress()
        setAddress(_address)

        const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, web3Provider)
        const bal = await cusd.balanceOf(_address)
        setCusdBalance(ethers.utils.formatEther(bal))
      } catch (err) {
        console.error("useMiniPay init error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function connect() {
    try {
      const eth = (window as any).ethereum
      if (!eth) return
      const web3Provider = new ethers.providers.Web3Provider(eth)
      await web3Provider.send("eth_requestAccounts", [])
      const _signer = web3Provider.getSigner()
      setSigner(_signer)
      setProvider(web3Provider)
      const _address = await _signer.getAddress()
      setAddress(_address)
      const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, web3Provider)
      const bal = await cusd.balanceOf(_address)
      setCusdBalance(ethers.utils.formatEther(bal))
    } catch (err) {
      console.error("connect error:", err)
    }
  }

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

  async function approveAndPurchase(amount: ethers.BigNumber, action: () => Promise<any>) {
    if (!signer || !address) throw new Error("Not connected")
    const cusd = getCusd(true)
    const allowance = await cusd.allowance(address, EDUPAY_ADDRESS)
    if (allowance.lt(amount)) {
      const tx = await cusd.approve(EDUPAY_ADDRESS, ethers.constants.MaxUint256)
      await tx.wait()
    }
    return action()
  }

  async function purchaseChapter(courseId: number, chapterId: number, price: ethers.BigNumber) {
    const eduPay = getEduPay(true)
    return approveAndPurchase(price, async () => {
      const tx = await eduPay.purchaseChapter(courseId, chapterId)
      return tx.wait()
    })
  }

  async function purchaseFullCourse(courseId: number, totalPrice: ethers.BigNumber) {
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
    const iface = new ethers.utils.Interface(EDUPAY_ABI as any)
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log)
        if (parsed?.name === "CourseCreated") return Number(parsed.args.courseId)
      } catch {}
    }
    throw new Error("CourseCreated event not found")
  }

  async function addChapter(courseId: number, title: string, contentHash: string, price: ethers.BigNumber) {
    const eduPay = getEduPay(true)
    const tx = await eduPay.addChapter(courseId, title, contentHash, price)
    return tx.wait()
  }

  return {
  isMiniPay,
  address,
  isConnected,
  cusdBalance,
  loading,
  signer,
  connect,
  getPublicEduPay,
  createCourse,
  addChapter,
  purchaseChapter,
  purchaseFullCourse,
  getChapterContent,
}
}