"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "genlayer-js";
import { testnetBradbury, studionet } from "genlayer-js/chains";
import { ACTIVE, ACTIVE_CONTRACT } from "./contracts";

const CHAIN_MAP: Record<string, any> = {
  testnetBradbury,
  studionet,
};

interface WalletContextType {
  address: string | null;
  connected: boolean;
  loading: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  read: (fn: string, args?: any[]) => Promise<any>;
  write: (fn: string, args?: any[]) => Promise<any>;
}

const WalletContext = createContext<WalletContextType | null>(null);
export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
}

function getEth(): any {
  if (typeof window !== "undefined") return (window as any).ethereum;
  return null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const initClient = useCallback((addr: string) => {
    const c = createClient({
      chain: CHAIN_MAP[ACTIVE.chainKey],
      account: addr as `0x${string}`,
      endpoint: ACTIVE.genLayerRpc,
      provider: typeof window !== "undefined" ? (window as any).ethereum : undefined,
    });
    setClient(c);
    setAddress(addr);
    localStorage.setItem("mabuuk_addr", addr);
  }, []);

  useEffect(() => {
    (async () => {
      const eth = getEth();
      if (eth) {
        try {
          const accs = await eth.request({ method: "eth_accounts" });
          if (accs?.length > 0) initClient(accs[0]);
        } catch {}
      }
      setLoading(false);
    })();
  }, [initClient]);

  useEffect(() => {
    const eth = getEth();
    if (!eth) return;
    const handler = (accs: string[]) => {
      if (accs.length === 0) { setAddress(null); setClient(null); }
      else initClient(accs[0]);
    };
    eth.on("accountsChanged", handler);
    return () => eth.removeListener("accountsChanged", handler);
  }, [initClient]);

  const connectWallet = useCallback(async () => {
    const eth = getEth();
    if (!eth) { window.open("https://metamask.io/download/", "_blank"); return; }
    try {
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: ACTIVE.chainIdHex,
            chainName: ACTIVE.chainName,
            rpcUrls: [ACTIVE.rpcUrl],
            nativeCurrency: ACTIVE.nativeCurrency,
            blockExplorerUrls: [ACTIVE.explorerUrl],
          }],
        });
      } catch {}
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ACTIVE.chainIdHex }],
        });
      } catch {}
      const accs = await eth.request({ method: "eth_requestAccounts" });
      if (accs?.length > 0) initClient(accs[0]);
    } catch (e: any) { console.error("Connect error:", e?.message); }
  }, [initClient]);

  const disconnect = useCallback(() => {
    setAddress(null); setClient(null);
    localStorage.removeItem("mabuuk_addr");
  }, []);

  const read = useCallback(async (fn: string, args: any[] = []) => {
    if (!client) throw new Error("Not connected");
    let attempt = 0;
    while (attempt < 5) {
      try {
        return await client.readContract({ address: ACTIVE_CONTRACT, functionName: fn, args });
      } catch (e: any) {
        attempt++;
        if (attempt >= 5) throw new Error("Read failed: " + (e?.message || e));
        await new Promise(r => setTimeout(r, 4000));
      }
    }
  }, [client]);

  const write = useCallback(async (fn: string, args: any[] = []) => {
    if (!client) throw new Error("Not connected");

    // Step 1: Send transaction
    const hash = await client.writeContract({
      address: ACTIVE_CONTRACT,
      functionName: fn,
      args,
      value: BigInt(0),
    });

    // Step 2: Manual polling — works across all genlayer-js versions
    for (let i = 0; i < 200; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const tx = await client.getTransaction({ hash });
        const s = tx?.status;
        console.log(`[Mabuuk] Poll #${i}: status=${s}`);

        // status 5 = ACCEPTED, 6 = FINALIZED (numeric enum in v0.23+)
        if (s === 5 || s === 6 || s === "ACCEPTED" || s === "FINALIZED") {
          console.log("[Mabuuk] TX accepted!", tx);
          return tx;
        }
        // status 7+ = failed states
        if (s === 7 || s === 8 || s === "CANCELED" || s === "UNDETERMINED") {
          throw new Error(`Transaction failed: status=${s}`);
        }
      } catch (e: any) {
        if (e?.message?.includes("failed")) throw e;
      }
    }
    throw new Error("Transaction timeout");
  }, [client]);

  return (
    <WalletContext.Provider value={{ address, connected: !!address, loading, connectWallet, disconnect, read, write }}>
      {children}
    </WalletContext.Provider>
  );
}