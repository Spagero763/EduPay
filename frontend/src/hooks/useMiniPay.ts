"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import {
  EDUPAY_ADDRESS,
  CUSD_ADDRESS,
  EDUPAY_ABI,
  CUSD_ABI,
} from "@/lib/contract"
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react"

export function useMiniPay() {
  const { open } = useAppKit()
  const { address: wcAddress, isConnected: wcConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider("eip155")

  const [isMiniPay, setIsMiniPay] = useState(false)
  const [miniPayAddress, setMiniPayAddress] = useState<string | null>(null)
  const [cusdBalance, setCusdBalance] = useState("0")
  const [loading, setLoading] = useState(true)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)

  const [publicProvider] = useState(
    () => new ethers.providers.JsonRpcProvider(PUBLIC_RPC)
  )

  // Setup MiniPay
  useEffect(() => {
    async function detectMiniPay() {
      const eth = (window as any).ethereum

      if (eth?.isMiniPay) {
        setIsMiniPay(true)
        try {
          const web3Provider = new ethers.providers.Web3Provider(eth)
          await web3Provider.send("eth_requestAccounts", [])

          const _signer = web3Provider.getSigner()
          setSigner(_signer)

          const addr = await _signer.getAddress()
          const cusd = new ethers.Contract(
            CUSD_ADDRESS,
            CUSD_ABI,
            web3Provider
          )
          const bal = await cusd.balanceOf(addr)

          setCusdBalance(ethers.utils.formatEther(bal))
        } catch (err) {
          console.error("MiniPay setup error:", err)
        }
      }

      setLoading(false)
    }

    setup()
  }, [])

  // WalletConnect setup
  useEffect(() => {
    if (!walletProvider || !address) return

    async function setup() {
      try {
        const web3Provider = new ethers.providers.Web3Provider(
          walletProvider as any
        )

        const _signer = web3Provider.getSigner()
        setSigner(_signer)

        const cusd = new ethers.Contract(
          CUSD_ADDRESS,
          CUSD_ABI,
          web3Provider
        )
        const bal = await cusd.balanceOf(address)

        setCusdBalance(ethers.utils.formatEther(bal))
      } catch (e) {
        console.error("WC setup error:", e)
      }
    }

    setup()
  }, [walletProvider, address])

  function connect() {
    const eth = (window as any).ethereum
    if (eth?.isMiniPay) return
    open()
  }

  function getPublicEduPay(): ethers.Contract {
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, publicProvider)
  }

  function getSignedEduPay(): ethers.Contract {
    if (!signer) throw new Error("Wallet not connected")
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, signer)
  }

  async function ensureApproved(amount: ethers.BigNumber) {
    if (!signer) throw new Error("Wallet not connected")

    const signerAddress = await signer.getAddress()
    const cusd = getCusd(true)

    const allowance: ethers.BigNumber = await cusd.allowance(
      signerAddress,
      EDUPAY_ADDRESS
    )

    if (allowance.lt(amount)) {
      const tx = await cusd.approve(
        EDUPAY_ADDRESS,
        ethers.constants.MaxUint256,
        { gasLimit: 100000 }
      )
      await tx.wait()
    }
  }

  async function purchaseChapter(
    courseId: number,
    chapterId: number,
    priceIn18: ethers.BigNumber
  ) {
    if (!signer) throw new Error("Wallet not connected")

    await ensureApproved(priceIn18)

    const eduPay = getEduPay(true)
    const tx = await eduPay.purchaseChapter(
      courseId,
      chapterId,
      CUSD_ADDRESS,
      { gasLimit: 300000 }
    )

    return tx.wait()
  }

  async function purchaseFullCourse(
    courseId: number,
    priceIn18: ethers.BigNumber
  ) {
    if (!signer) throw new Error("Wallet not connected")

    await ensureApproved(priceIn18)

    const eduPay = getEduPay(true)
    const tx = await eduPay.purchaseFullCourse(
      courseId,
      CUSD_ADDRESS,
      { gasLimit: 500000 }
    )

    return tx.wait()
  }

  // ✅ FIXED createCourse (MiniPay + fallback)
  async function createCourse(
    title: string,
    description: string
  ): Promise<number> {
    if (!signer) throw new Error("Wallet not connected")

    const eth = (window as any).ethereum
    const isMiniPayEnv = !!eth?.isMiniPay

    if (isMiniPayEnv) {
      const iface = new ethers.utils.Interface([
        "function createCourse(string memory _title, string memory _description) external returns (uint256)",
      ])

      const data = iface.encodeFunctionData("createCourse", [
        title,
        description,
      ])

      const accounts: string[] = await eth.request({
        method: "eth_requestAccounts",
      })

      const txHash = await eth.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0],
            to: EDUPAY_ADDRESS,
            data,
            gas: "0x4C4B4",
            feeCurrency: CUSD_ADDRESS,
          },
        ],
      })

      const miniProvider = new ethers.providers.Web3Provider(eth)
      const receipt = await miniProvider.waitForTransaction(
        txHash,
        1,
        120000
      )

      const iface2 = new ethers.utils.Interface(EDUPAY_ABI as any)

      for (const log of receipt.logs) {
        try {
          const parsed = iface2.parseLog(log)
          if (parsed?.name === "CourseCreated") {
            return Number(parsed.args.courseId)
          }
        } catch {}
      }

      const contract = new ethers.Contract(
        EDUPAY_ADDRESS,
        EDUPAY_ABI,
        publicProvider
      )
      const count = await contract.courseCount()
      return Number(count) - 1
    }

    const eduPay = getEduPay(true)
    const tx = await eduPay.createCourse(title, description, {
      gasLimit: 300000,
    })

    const receipt = await tx.wait()
    const iface = new ethers.utils.Interface(EDUPAY_ABI as any)

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log)
        if (parsed?.name === "CourseCreated") {
          return Number(parsed.args.courseId)
        }
      } catch {}
    }

    const contract = new ethers.Contract(
      EDUPAY_ADDRESS,
      EDUPAY_ABI,
      publicProvider
    )
    const count = await contract.courseCount()
    return Number(count) - 1
  }

  // ✅ FIXED addChapter (MiniPay supported)
  async function addChapter(
    courseId: number,
    title: string,
    contentHash: string,
    priceIn6: ethers.BigNumber
  ) {
    if (!signer) throw new Error("Wallet not connected")

    if (contentHash.length > 10000) {
      throw new Error(
        "Content is too large. Please shorten your text or use image URLs instead."
      )
    }

    const eth = (window as any).ethereum
    const isMiniPayEnv = !!eth?.isMiniPay

    if (isMiniPayEnv) {
      const iface = new ethers.utils.Interface([
        "function addChapter(uint256 _courseId, string memory _title, string memory _contentHash, uint256 _price) external returns (uint256)",
      ])

      const data = iface.encodeFunctionData("addChapter", [
        courseId,
        title,
        contentHash,
        priceIn6,
      ])

      const accounts: string[] = await eth.request({
        method: "eth_requestAccounts",
      })

      const txHash = await eth.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0],
            to: EDUPAY_ADDRESS,
            data,
            gas: "0x7A120",
            feeCurrency: CUSD_ADDRESS,
          },
        ],
      })

      const miniProvider = new ethers.providers.Web3Provider(eth)
      return miniProvider.waitForTransaction(txHash, 1, 120000)
    }

    const eduPay = getEduPay(true)
    const tx = await eduPay.addChapter(
      courseId,
      title,
      contentHash,
      priceIn6,
      { gasLimit: 500000 }
    )

    return tx.wait()
  }

  async function getChapterContent(
    courseId: number,
    chapterId: number
  ): Promise<string> {
    if (signer) {
      try {
        const eduPay = getEduPay(true)
        return await eduPay.getChapterContent(courseId, chapterId)
      } catch {}
    }

    const eduPay = getEduPay(false)
    return await eduPay.getChapterContent(courseId, chapterId)
  }

  async function getAddress(): Promise<string | null> {
    if (signer) {
      try {
        return await signer.getAddress()
      } catch {}
    }
    const eduPay = getSignedEduPay()
    const tx = await eduPay.purchaseChapter(courseId, chapterId, CUSD_ADDRESS, { gasLimit: 300000 })
    return tx.wait()
  }

  return {
    isMiniPay,
    address: address ?? null,
    isConnected: isConnected || isMiniPay,
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