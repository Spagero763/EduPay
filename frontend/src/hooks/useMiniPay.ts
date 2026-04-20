import { useState, useEffect } from "react"
import { ethers } from "ethers"
import {
  EDUPAY_ADDRESS,
  CUSD_ADDRESS,
  USDC_ADDRESS,
  EDUPAY_ABI,
  CUSD_ABI,
  USDC_ABI,
} from "@/lib/contract"
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react"

const PUBLIC_RPC = "https://forno.celo.org"

export function useMiniPay() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider("eip155")

  const [isMiniPay, setIsMiniPay] = useState(false)
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [usdcBalance, setUsdcBalance] = useState("0")
  const [cusdBalance, setCusdBalance] = useState("0")
  const [loading, setLoading] = useState(true)

  const [publicProvider] = useState(
    () => new ethers.providers.JsonRpcProvider(PUBLIC_RPC)
  )

  useEffect(() => {
    async function setup() {
      setProvider(publicProvider)
      const eth = (window as { ethereum?: { isMiniPay?: boolean } }).ethereum

      if (eth?.isMiniPay) {
        setIsMiniPay(true)
        try {
          const web3Provider = new ethers.providers.Web3Provider(eth as ethers.providers.ExternalProvider)
          await web3Provider.send("eth_requestAccounts", [])

          const _signer = web3Provider.getSigner()
          setSigner(_signer)
          setProvider(web3Provider)

          const addr = await _signer.getAddress()
          const cusd = new ethers.Contract(
            CUSD_ADDRESS,
            CUSD_ABI,
            web3Provider
          )
          const bal = await cusd.balanceOf(addr)

          setCusdBalance(ethers.utils.formatEther(bal))

          const usdc = new ethers.Contract(
            USDC_ADDRESS,
            USDC_ABI,
            web3Provider
          )
          const usdcBal = await usdc.balanceOf(addr)
          setUsdcBalance(ethers.utils.formatUnits(usdcBal, 6))
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
          walletProvider as ethers.providers.ExternalProvider
        )

        const _signer = web3Provider.getSigner()
        setSigner(_signer)
        setProvider(web3Provider)

        const cusd = new ethers.Contract(
          CUSD_ADDRESS,
          CUSD_ABI,
          web3Provider
        )
        const bal = await cusd.balanceOf(address)

        setCusdBalance(ethers.utils.formatEther(bal))

        const usdc = new ethers.Contract(
          USDC_ADDRESS,
          USDC_ABI,
          web3Provider
        )
        const usdcBal = await usdc.balanceOf(address)
        setUsdcBalance(ethers.utils.formatUnits(usdcBal, 6))
      } catch (err) {
        console.error("wallet setup error:", err)
      }
    }

    setup()
  }, [walletProvider, address])

  function connect() {
    const eth = (window as { ethereum?: { isMiniPay?: boolean } }).ethereum
    if (eth?.isMiniPay) return
    open()
  }

  function getEduPay(withSigner = false) {
    const runner = withSigner ? signer : provider
    if (!runner) throw new Error("No provider")
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, runner)
  }

  // ✅ ADD THIS (this is the only missing piece)
  function getPublicEduPay() {
    return new ethers.Contract(EDUPAY_ADDRESS, EDUPAY_ABI, publicProvider)
  }

  function getCusd(withSigner = false) {
    const runner = withSigner ? signer : (provider ?? publicProvider)
    if (!runner) throw new Error("No provider")
    return new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, runner)
  }

  function getUsdc(withSigner = false) {
    const runner = withSigner ? signer : (provider ?? publicProvider)
    if (!runner) throw new Error("No provider")
    return new ethers.Contract(USDC_ADDRESS, USDC_ABI, runner)
  }

  async function ensureApproved(amount: ethers.BigNumber) {
    if (!signer) throw new Error("Wallet not connected")

    const signerAddress = await signer.getAddress()
    const usdc = getUsdc(true)

    const allowance: ethers.BigNumber = await usdc.allowance(
      signerAddress,
      EDUPAY_ADDRESS
    )

    if (allowance.lt(amount)) {
      const tx = await usdc.approve(
        EDUPAY_ADDRESS,
        ethers.constants.MaxUint256
      )
      await tx.wait()
    }
  }

  async function purchaseChapter(
    courseId: number,
    chapterId: number,
    priceIn6: ethers.BigNumber
  ) {
    if (!signer) throw new Error("Wallet not connected")

    await ensureApproved(priceIn6)

    const eduPay = getEduPay(true)
    const tx = await eduPay.purchaseChapter(courseId, chapterId, USDC_ADDRESS)

    return tx.wait()
  }

  async function purchaseFullCourse(
    courseId: number,
    priceIn6: ethers.BigNumber
  ) {
    if (!signer) throw new Error("Wallet not connected")

    await ensureApproved(priceIn6)

    const eduPay = getEduPay(true)
    const tx = await eduPay.purchaseFullCourse(courseId, USDC_ADDRESS)

    return tx.wait()
  }

  // ✅ FIXED createCourse (MiniPay + fallback)
  async function createCourse(
    title: string,
    description: string
  ): Promise<number> {
    if (!signer) throw new Error("Wallet not connected")

    const eth = (window as { ethereum?: { isMiniPay?: boolean; request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum
    const isMiniPayEnv = !!eth?.isMiniPay

    if (isMiniPayEnv && eth?.request) {
      const iface = new ethers.utils.Interface([
        "function createCourse(string memory _title, string memory _description) external returns (uint256)",
      ])

      const data = iface.encodeFunctionData("createCourse", [
        title,
        description,
      ])

      try {
        const existingAccounts = await eth.request({ method: "eth_accounts" }) as string[]
        const accounts = existingAccounts.length
          ? existingAccounts
          : (await eth.request({ method: "eth_requestAccounts" }) as string[])

        const txHash = await eth.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: accounts[0],
              to: EDUPAY_ADDRESS,
              data,
              gas: "0x4C4B4",
            },
          ],
        }) as string

        const miniProvider = new ethers.providers.Web3Provider(eth as ethers.providers.ExternalProvider)
        const receipt = await miniProvider.waitForTransaction(
          txHash,
          1,
          120000
        )

        const iface2 = new ethers.utils.Interface(EDUPAY_ABI)

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
      } catch {
        // Fallback to signer-based call if RPC/provider wallet path is rate-limited.
      }
    }

    const eduPay = getEduPay(true)
    const tx = await eduPay.createCourse(title, description)

    const receipt = await tx.wait() as ethers.ContractReceipt
    const iface = new ethers.utils.Interface(EDUPAY_ABI)

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

    const eth = (window as { ethereum?: { isMiniPay?: boolean; request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum
    const isMiniPayEnv = !!eth?.isMiniPay

    if (isMiniPayEnv && eth?.request) {
      const iface = new ethers.utils.Interface([
        "function addChapter(uint256 _courseId, string memory _title, string memory _contentHash, uint256 _price) external returns (uint256)",
      ])

      const data = iface.encodeFunctionData("addChapter", [
        courseId,
        title,
        contentHash,
        priceIn6,
      ])

      try {
        const existingAccounts = await eth.request({ method: "eth_accounts" }) as string[]
        const accounts = existingAccounts.length
          ? existingAccounts
          : (await eth.request({ method: "eth_requestAccounts" }) as string[])

        const txHash = await eth.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: accounts[0],
              to: EDUPAY_ADDRESS,
              data,
              gas: "0x7A120",
            },
          ],
        }) as string

        const miniProvider = new ethers.providers.Web3Provider(eth as ethers.providers.ExternalProvider)
        return miniProvider.waitForTransaction(txHash, 1, 120000)
      } catch {
        // Fallback to signer-based call if RPC/provider wallet path is rate-limited.
      }
    }

    const eduPay = getEduPay(true)
    const tx = await eduPay.addChapter(courseId, title, contentHash, priceIn6)

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
    return null
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

  return {
    isMiniPay,
    address: address ?? null,
    isConnected: isConnected || isMiniPay,
    provider,
    signer,
    usdcBalance,
    cusdBalance,
    loading,
    connect,
    getEduPay,
    getPublicEduPay,
    getCusd,
    getUsdc,
    getChapterContent,
    purchaseChapter,
    purchaseFullCourse,
    createCourse,
    getAddress,
    addChapter,
    updateChapter,
  }
}