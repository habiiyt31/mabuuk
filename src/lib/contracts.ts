export const CONTRACTS = {
  MABUUK: "0x2bFd2f9B48Ef488B8e8D0b3aCFB1af64C1868e1f" as `0x${string}`,
} as const;

export const BRADBURY = {
  chainId: 4221,
  chainIdHex: "0x107D",
  chainName: "GenLayer Testnet Bradbury",
  rpcUrl: "https://zksync-os-testnet-genlayer.zksync.dev",
  genLayerRpc: "https://rpc-bradbury.genlayer.com",
  explorerUrl: "https://explorer-bradbury.genlayer.com",
  faucetUrl: "https://testnet-faucet.genlayer.foundation/",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
} as const;