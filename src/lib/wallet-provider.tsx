"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { CONTRACTS, BRADBURY } from "./contracts";

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
      chain: testnetBradbury,
      account: addr as `0x${string}`,
      endpoint: BRADBURY.genLayerRpc,
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
      try { await eth.request({ method: "wallet_addEthereumChain", params: [{ chainId: BRADBURY.chainIdHex, chainName: BRADBURY.chainName, rpcUrls: [BRADBURY.rpcUrl], nativeCurrency: BRADBURY.nativeCurrency, blockExplorerUrls: [BRADBURY.explorerUrl] }] }); } catch {}
      try { await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BRADBURY.chainIdHex }] }); } catch {}
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
        return await client.readContract({ address: CONTRACTS.MABUUK, functionName: fn, args });
      } catch (e: any) {
        attempt++;
        if (attempt >= 5) throw new Error("Read failed: " + (e?.message || e));
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }, [client]);

  const write = useCallback(async (fn: string, args: any[] = []) => {
    if (!client) throw new Error("Not connected");
    // Step 1: Send transaction
    const hash = await client.writeContract({
      address: CONTRACTS.MABUUK,
      functionName: fn,
      args,
      value: BigInt(0),
    });
    // Step 2: Wait for consensus — Bradbury needs long timeout (up to 5 min)
    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED",
      retries: 200,
      interval: 3000,
    } as any);
    return receipt;
  }, [client]);

  return (
    <WalletContext.Provider value={{ address, connected: !!address, loading, connectWallet, disconnect, read, write }}>
      {children}
    </WalletContext.Provider>
  );
}