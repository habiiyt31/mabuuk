"use client";
import { useState } from "react";
import { useWallet } from "@/lib/wallet-provider";

export default function WalletInfo() {
  const { address, connected, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  if (!connected || !address) return null;
  const short = address.slice(0, 6) + "..." + address.slice(-4);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} className="wallet-chip">
        <span className="wallet-dot" /> {short}
      </button>
      {open && <>
        <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />
        <div className="wallet-dd">
          <p className="wallet-dd-label">WALLET</p>
          <p className="wallet-dd-addr">{address}</p>
          <button className="px-btn px-red" style={{ width: "100%", marginTop: 10 }} onClick={() => { disconnect(); setOpen(false); }}>DISCONNECT</button>
        </div>
      </>}
    </div>
  );
}
