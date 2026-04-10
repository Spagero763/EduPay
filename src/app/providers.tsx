"use client"

import { wagmiAdapter, projectId } from "@/lib/wagmi"
import { createAppKit } from "@reown/appkit/react"
import { celo } from "@reown/appkit/networks"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, type Config } from "wagmi"
import { ReactNode, useState } from "react"

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [celo],
  defaultNetwork: celo,
  metadata: {
    name: "EduPay",
    description: "Pay-per-lesson education platform on Celo",
    url: "https://edupay.vercel.app",
    icons: ["https://edupay.vercel.app/favicon.ico"],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#C4622D",
    "--w3m-border-radius-master": "0px",
    "--w3m-font-family": "inherit",
  },
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}