// ═══════════════════════════════════════════
// Toggle this to switch network
// ═══════════════════════════════════════════
const USE_NETWORK: "bradbury" | "studionet" = "studionet";

export const CONTRACTS = {
  MABUUK_BRADBURY: "0x2bFd2f9B48Ef488B8e8D0b3aCFB1af64C1868e1f" as `0x${string}`,
  MABUUK_STUDIONET: "0x58c02062753344baE0bb40796AB25CDeAF5c0D4A" as `0x${string}`,
} as const;

export const NETWORKS = {
  bradbury: {
    chainId: 4221,
    chainIdHex: "0x107D",
    chainName: "GenLayer Testnet Bradbury",
    rpcUrl: "https://zksync-os-testnet-genlayer.zksync.dev",
    genLayerRpc: "https://rpc-bradbury.genlayer.com",
    explorerUrl: "https://explorer-bradbury.genlayer.com",
    faucetUrl: "https://testnet-faucet.genlayer.foundation/",
    nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
    contract: CONTRACTS.MABUUK_BRADBURY,
    chainKey: "testnetBradbury" as const,
  },
  studionet: {
    chainId: 61999,
    chainIdHex: "0xF21F",
    chainName: "GenLayer Studio",
    rpcUrl: "https://studio.genlayer.com/api",
    genLayerRpc: "https://studio.genlayer.com/api",
    explorerUrl: "https://studio.genlayer.com",
    faucetUrl: "",
    nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
    contract: CONTRACTS.MABUUK_STUDIONET,
    chainKey: "studionet" as const,
  },
} as const;

// Active config exports (backward compatible)
export const ACTIVE = NETWORKS[USE_NETWORK];
export const BRADBURY = ACTIVE;
export const ACTIVE_CONTRACT = ACTIVE.contract;
export const CURRENT_NETWORK = USE_NETWORK;