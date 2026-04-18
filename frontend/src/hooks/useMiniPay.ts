"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import {
  EDUPAY_ADDRESS,
  CUSD_ADDRESS,
  EDUPAY_ABI,
  CUSD_ABI,
} from "@/lib/contract"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"

const CELO_RPC = "https://forno.celo.org"

export function useMiniPay() {
  const { open } = useAppKit()
  const { address: wcAddress, isConnected: wcConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider("eip155")

  const [isMiniPay, setIsMiniPay] = useState(false)
  const [miniPayAddress, setMiniPayAddress] = useState<string | null>(null)
  const [cusdBalance, setCusdBalance] = useState("0")
  const [loading, setLoading] = useState(true)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)

  const publicProvider = new ethers.providers.JsonRpcProvider(CELO_RPC)

  // Detect MiniPay
  useEffect(() => {
    async function detectMiniPay() {
      const eth = (window as any).ethereum
      if (eth?.isMiniPay) {
        setIsMiniPay(true)
        try {
          const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
          if (accounts[0]) {
            setMiniPayAddress(accounts[0])
            const web3Provider = new ethers.providers.Web3Provider(eth)
            const _signer = web3Provider.getSigner()
            setSigner(_signer)
            const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, web3Provider)
            const bal = await cusd.balanceOf(accounts[0])
            setCusdBalance(ethers.utils.formatEther(bal))
          }
        } catch (e) {
          console.warn("MiniPay init:", e)
        }
      }
      setLoading(false)
    }
    detectMiniPay()
  }, [])

  // WalletConnect signer
  useEffect(() => {
    if (!walletProvider || !wcAddress) return
    async function setupWC() {
      try {
        const web3Provider = new ethers.providers.Web3Provider(walletProvider as any)
        const _signer = web3Provider.getSigner()
        setSigner(_signer)
        const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, web3Provider)
        const bal = await cusd.balanceOf(wcAddress)
        setCusdBalance(ethers.utils.formatEther(bal))
      } catch (e) {
        console.warn("WC setup:", e)
      }
    }
    setupWC()
  }, [walletProvider, wcAddress])

  const address = miniPayAddress ?? wcAddress ?? null
  const isConnected = isMiniPay || wcConnected

  function connect() {
    if (isMiniPay) return
    open()
  }

  // Public read-only contract (no wallet needed)
  function getPublicEduPay(): ethers.Contract {
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, publicProvider)
  }

  // Signed contract (wallet needed for writes)
  function getSignedEduPay(): ethers.Contract {
    if (!signer) throw new Error("Wallet not connected")
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, signer)
  }

  // Helper: send tx via MiniPay with feeCurrency (gas paid in cUSD)
  async function miniPayTx(
    toAddress: string,
    data: string,
    gasHex = "0x7A120"
  ): Promise<ethers.providers.TransactionReceipt> {
    const eth = (window as any).ethereum
    const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
    const from = accounts[0]

    const txHash: string = await eth.request({
      method: "eth_sendTransaction",
      params: [{
        from,
        to: toAddress,
        data,
        gas: gasHex,
        feeCurrency: CUSD_ADDRESS,
      }]
    })

    const provider = new ethers.providers.Web3Provider(eth)
    const receipt = await provider.waitForTransaction(txHash, 1, 120000)
    if (!receipt || receipt.status !== 1) throw new Error("Transaction failed on chain")
    return receipt
  }

  async function createCourse(title: string, description: string): Promise<number> {
    if (!isConnected) throw new Error("Wallet not connected")

    const iface = new ethers.utils.Interface([
      "function createCourse(string memory _title, string memory _description) external returns (uint256)",
    ])
    const data = iface.encodeFunctionData("createCourse", [title, description])

    let receipt: ethers.providers.TransactionReceipt

    if (isMiniPay) {
      receipt = await miniPayTx(EDUPAY_ADDRESS, data, "0x4C4B4")
    } else {
      if (!signer) throw new Error("No signer")
      const eduPay = getSignedEduPay()
      const tx = await eduPay.createCourse(title, description, { gasLimit: 300000 })
      receipt = await tx.wait()
    }

    // Parse CourseCreated event to get courseId
    const eventIface = new ethers.utils.Interface(EDUPAY_ABI as any)
    for (const log of receipt.logs) {
      try {
        const parsed = eventIface.parseLog(log)
        if (parsed?.name === "CourseCreated") return Number(parsed.args.courseId)
      } catch {}
    }

    // Fallback: courseCount - 1
    try {
      const countData = await publicProvider.call({
        to: EDUPAY_ADDRESS,
        data: new ethers.utils.Interface([
          "function courseCount() external view returns (uint256)"
        ]).encodeFunctionData("courseCount"),
      })
      return Number(ethers.BigNumber.from(countData)) - 1
    } catch {
      return 0
    }
  }

  async function addChapter(
    courseId: number,
    title: string,
    contentHash: string,
    priceIn6: ethers.BigNumber
  ): Promise<ethers.providers.TransactionReceipt> {
    if (!isConnected) throw new Error("Wallet not connected")

    // Strict size limit — blockchain string storage is expensive
    if (contentHash.length > 9000) {
      throw new Error(
        "Content is too large. Please shorten your text or use shorter image URLs. " +
        `Current size: ${contentHash.length} chars, limit: 9000.`
      )
    }

    const iface = new ethers.utils.Interface([
      "function addChapter(uint256 _courseId, string memory _title, string memory _contentHash, uint256 _price) external returns (uint256)",
    ])
    const data = iface.encodeFunctionData("addChapter", [courseId, title, contentHash, priceIn6])

    if (isMiniPay) {
      return miniPayTx(EDUPAY_ADDRESS, data, "0xF4240") // 1,000,000 gas
    }

    if (!signer) throw new Error("No signer")
    const eduPay = getSignedEduPay()
    const tx = await eduPay.addChapter(courseId, title, contentHash, priceIn6, {
      gasLimit: 800000,
    })
    return tx.wait()
  }

  async function purchaseChapter(
    courseId: number,
    chapterId: number,
    priceIn18: ethers.BigNumber
  ): Promise<ethers.providers.TransactionReceipt> {
    if (!isConnected) throw new Error("Wallet not connected")

    if (isMiniPay) {
      const eth = (window as any).ethereum
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
      const from = accounts[0]
      const miniProvider = new ethers.providers.Web3Provider(eth)

      // Check allowance
      const cusdContract = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, miniProvider)
      const allowance: ethers.BigNumber = await cusdContract.allowance(from, EDUPAY_ADDRESS)

      if (allowance.lt(priceIn18)) {
        // Approve
        const approveIface = new ethers.utils.Interface([
          "function approve(address spender, uint256 amount) external returns (bool)",
        ])
        const approveData = approveIface.encodeFunctionData("approve", [EDUPAY_ADDRESS, ethers.constants.MaxUint256])
        const approveHash: string = await eth.request({
          method: "eth_sendTransaction",
          params: [{ from, to: CUSD_ADDRESS, data: approveData, gas: "0x15F90", feeCurrency: CUSD_ADDRESS }],
        })
        await miniProvider.waitForTransaction(approveHash, 1, 60000)
      }

      // Purchase
      const iface = new ethers.utils.Interface([
        "function purchaseChapter(uint256 _courseId, uint256 _chapterId, address _token) external",
      ])
      const data = iface.encodeFunctionData("purchaseChapter", [courseId, chapterId, CUSD_ADDRESS])
      return miniPayTx(EDUPAY_ADDRESS, data, "0x4C4B4")
    }

    // MetaMask / WalletConnect
    if (!signer) throw new Error("No signer")
    const signerAddr = await signer.getAddress()
    const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, signer)
    const allowance: ethers.BigNumber = await cusd.allowance(signerAddr, EDUPAY_ADDRESS)
    if (allowance.lt(priceIn18)) {
      const approveTx = await cusd.approve(EDUPAY_ADDRESS, ethers.constants.MaxUint256, { gasLimit: 100000 })
      await approveTx.wait()
    }
    const eduPay = getSignedEduPay()
    const tx = await eduPay.purchaseChapter(courseId, chapterId, CUSD_ADDRESS, { gasLimit: 300000 })
    return tx.wait()
  }

  async function purchaseFullCourse(
    courseId: number,
    priceIn18: ethers.BigNumber
  ): Promise<ethers.providers.TransactionReceipt> {
    if (!isConnected) throw new Error("Wallet not connected")

    if (isMiniPay) {
      const eth = (window as any).ethereum
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
      const from = accounts[0]
      const miniProvider = new ethers.providers.Web3Provider(eth)

      const cusdContract = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, miniProvider)
      const allowance: ethers.BigNumber = await cusdContract.allowance(from, EDUPAY_ADDRESS)
      if (allowance.lt(priceIn18)) {
        const approveIface = new ethers.utils.Interface([
          "function approve(address spender, uint256 amount) external returns (bool)",
        ])
        const approveData = approveIface.encodeFunctionData("approve", [EDUPAY_ADDRESS, ethers.constants.MaxUint256])
        const approveHash: string = await eth.request({
          method: "eth_sendTransaction",
          params: [{ from, to: CUSD_ADDRESS, data: approveData, gas: "0x15F90", feeCurrency: CUSD_ADDRESS }],
        })
        await miniProvider.waitForTransaction(approveHash, 1, 60000)
      }

      const iface = new ethers.utils.Interface([
        "function purchaseFullCourse(uint256 _courseId, address _token) external",
      ])
      const data = iface.encodeFunctionData("purchaseFullCourse", [courseId, CUSD_ADDRESS])
      return miniPayTx(EDUPAY_ADDRESS, data, "0x7A120")
    }

    if (!signer) throw new Error("No signer")
    const signerAddr = await signer.getAddress()
    const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, signer)
    const allowance: ethers.BigNumber = await cusd.allowance(signerAddr, EDUPAY_ADDRESS)
    if (allowance.lt(priceIn18)) {
      const approveTx = await cusd.approve(EDUPAY_ADDRESS, ethers.constants.MaxUint256, { gasLimit: 100000 })
      await approveTx.wait()
    }
    const eduPay = getSignedEduPay()
    const tx = await eduPay.purchaseFullCourse(courseId, CUSD_ADDRESS, { gasLimit: 500000 })
    return tx.wait()
  }

  async function getChapterContent(courseId: number, chapterId: number): Promise<string> {
    if (signer) {
      try {
        const eduPay = getSignedEduPay()
        return await eduPay.getChapterContent(courseId, chapterId)
      } catch {}
    }
    const eduPay = getPublicEduPay()
    return await eduPay.getChapterContent(courseId, chapterId)
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