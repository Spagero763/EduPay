import { cookieStorage, createStorage } from "wagmi"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { celo } from "@reown/appkit/networks"
import type { AppKitNetwork } from "@reown/appkit/networks"

export const projectId = "fe23730106f26d938267ccfe7fc56c2f"

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [celo]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
})

export const wagmiConfig = wagmiAdapter.wagmiConfig