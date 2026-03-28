export const CONTRACTS = {
  MABUUK: "0x53EC2fa7E120C4Ee85ab3f6F3296A44828F1870e" as `0x${string}`,
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