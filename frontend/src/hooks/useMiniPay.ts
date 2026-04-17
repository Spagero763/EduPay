"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import {
  EDUPAY_ADDRESS, CUSD_ADDRESS,
  EDUPAY_ABI, CUSD_ABI, CELO_RPC,
} from "@/lib/contract"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"

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

  // Detect MiniPay on mount
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
            // Fetch cUSD balance
            const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, web3Provider)
            const bal = await cusd.balanceOf(accounts[0])
            setCusdBalance(ethers.utils.formatEther(bal))
          }
        } catch (e) {
          console.error("MiniPay init error:", e)
        }
      }
      setLoading(false)
    }
    detectMiniPay()
  }, [])

  // WalletConnect signer setup
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
        console.error("WC setup error:", e)
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

  function getPublicEduPay(): ethers.Contract {
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, publicProvider)
  }

  function getSignedEduPay(): ethers.Contract {
    if (!signer) throw new Error("Wallet not connected")
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, signer)
  }

  // Send tx via MiniPay raw method (uses feeCurrency for gasless cUSD)
  async function miniPaySend(data: string, gasHex = "0x7A120"): Promise<ethers.providers.TransactionReceipt> {
    const eth = (window as any).ethereum
    const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
    const txHash: string = await eth.request({
      method: "eth_sendTransaction",
      params: [{
        from: accounts[0],
        to: EDUPAY_ADDRESS,
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
    if (!signer && !isMiniPay) throw new Error("Wallet not connected")

    const iface = new ethers.utils.Interface([
      "function createCourse(string memory _title, string memory _description) external returns (uint256)",
    ])
    const data = iface.encodeFunctionData("createCourse", [title, description])

    let receipt: ethers.providers.TransactionReceipt

    if (isMiniPay) {
      receipt = await miniPaySend(data, "0x4C4B4") // 313268 gas
    } else {
      const eduPay = getSignedEduPay()
      const tx = await eduPay.createCourse(title, description, { gasLimit: 300000 })
      receipt = await tx.wait()
    }

    // Parse CourseCreated event
    const eventIface = new ethers.utils.Interface(EDUPAY_ABI as any)
    for (const log of receipt.logs) {
      try {
        const parsed = eventIface.parseLog(log)
        if (parsed?.name === "CourseCreated") {
          return Number(parsed.args.courseId)
        }
      } catch {}
    }

    // Fallback: return courseCount - 1
    const count = await publicProvider.call({
      to: EDUPAY_ADDRESS,
      data: new ethers.utils.Interface(["function courseCount() external view returns (uint256)"]).encodeFunctionData("courseCount"),
    })
    return Number(ethers.BigNumber.from(count)) - 1
  }

  async function addChapter(
    courseId: number,
    title: string,
    contentHash: string,
    priceIn6: ethers.BigNumber
  ): Promise<ethers.providers.TransactionReceipt> {
    if (!signer && !isMiniPay) throw new Error("Wallet not connected")

    // Validate size — contract string storage limit
    if (contentHash.length > 9000) {
      throw new Error(
        "Content is too large for blockchain storage. Please reduce text length or use shorter image URLs."
      )
    }

    const iface = new ethers.utils.Interface([
      "function addChapter(uint256 _courseId, string memory _title, string memory _contentHash, uint256 _price) external returns (uint256)",
    ])
    const data = iface.encodeFunctionData("addChapter", [courseId, title, contentHash, priceIn6])

    if (isMiniPay) {
      return miniPaySend(data, "0xF4240") // 1000000 gas
    }

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
    if (!signer && !isMiniPay) throw new Error("Wallet not connected")

    if (isMiniPay) {
      const eth = (window as any).ethereum
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
      const from = accounts[0]
      const miniProvider = new ethers.providers.Web3Provider(eth)

      // Step 1: approve cUSD
      const cusdIface = new ethers.utils.Interface([
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)",
      ])

      const cusdContract = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, miniProvider)
      const allowance: ethers.BigNumber = await cusdContract.allowance(from, EDUPAY_ADDRESS)
      if (allowance.lt(priceIn18)) {
        const approveData = cusdIface.encodeFunctionData("approve", [EDUPAY_ADDRESS, ethers.constants.MaxUint256])
        await miniPaySend(approveData.replace(EDUPAY_ADDRESS.toLowerCase(), CUSD_ADDRESS.toLowerCase()), "0x15F90")

        // Actually send approve to CUSD contract
        const approveHash: string = await eth.request({
          method: "eth_sendTransaction",
          params: [{
            from,
            to: CUSD_ADDRESS,
            data: approveData,
            gas: "0x15F90",
            feeCurrency: CUSD_ADDRESS,
          }]
        })
        await miniProvider.waitForTransaction(approveHash, 1, 60000)
      }

      // Step 2: purchaseChapter
      const iface = new ethers.utils.Interface([
        "function purchaseChapter(uint256 _courseId, uint256 _chapterId, address _token) external",
      ])
      const data = iface.encodeFunctionData("purchaseChapter", [courseId, chapterId, CUSD_ADDRESS])
      return miniPaySend(data, "0x4C4B4")
    }

    // MetaMask / WalletConnect
    if (!signer) throw new Error("No signer")
    const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, signer)
    const signerAddr = await signer.getAddress()
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
    if (!signer && !isMiniPay) throw new Error("Wallet not connected")

    if (isMiniPay) {
      const eth = (window as any).ethereum
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
      const from = accounts[0]
      const miniProvider = new ethers.providers.Web3Provider(eth)

      const cusdContract = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, miniProvider)
      const allowance: ethers.BigNumber = await cusdContract.allowance(from, EDUPAY_ADDRESS)
      if (allowance.lt(priceIn18)) {
        const cusdIface = new ethers.utils.Interface([
          "function approve(address spender, uint256 amount) external returns (bool)",
        ])
        const approveData = cusdIface.encodeFunctionData("approve", [EDUPAY_ADDRESS, ethers.constants.MaxUint256])
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
      return miniPaySend(data, "0x7A120")
    }

    if (!signer) throw new Error("No signer")
    const cusd = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, signer)
    const signerAddr = await signer.getAddress()
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
    // Try with signer (for signed view calls)
    if (signer) {
      try {
        const eduPay = getSignedEduPay()
        return await eduPay.getChapterContent(courseId, chapterId)
      } catch {}
    }
    // Fallback public
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