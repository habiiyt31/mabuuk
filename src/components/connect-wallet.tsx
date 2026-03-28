"use client";
import { useWallet } from "@/lib/wallet-provider";
// import { BRADBURY } from "@/lib/contracts";

export default function ConnectWallet() {
  const { connectWallet } = useWallet();
  return (
    <div className="connect-screen">
      <div className="connect-card">
        <svg viewBox="0 0 32 32" width="96" height="96" style={{ imageRendering: "pixelated" as const, marginBottom: 20 }}>
          <rect x="6" y="10" width="14" height="16" fill="#f59e0b"/>
          <rect x="6" y="10" width="14" height="2" fill="#fbbf24"/>
          <rect x="6" y="24" width="14" height="2" fill="#d97706"/>
          <rect x="20" y="12" width="2" height="2" fill="#d97706"/>
          <rect x="22" y="14" width="2" height="6" fill="#d97706"/>
          <rect x="20" y="20" width="2" height="2" fill="#d97706"/>
          <rect x="5" y="8" width="16" height="2" fill="#fef3c7"/>
          <rect x="7" y="6" width="4" height="2" fill="#fef3c7"/>
          <rect x="13" y="6" width="4" height="2" fill="#fef3c7"/>
          <rect x="9" y="4" width="6" height="2" fill="#fef3c7"/>
          <rect x="9" y="15" width="2" height="2" fill="#7f1d1d"/>
          <rect x="11" y="17" width="2" height="2" fill="#7f1d1d"/>
          <rect x="13" y="15" width="2" height="2" fill="#7f1d1d"/>
          <rect x="15" y="17" width="2" height="2" fill="#7f1d1d"/>
          <rect x="10" y="21" width="6" height="1" fill="#7f1d1d"/>
        </svg>
        <h1 className="retro-title">MABUUK</h1>
        <p className="retro-sub">AI-Powered Drunk Transfer Protection</p>
        <p className="retro-tag">Don't let drunk-you ruin sober-you's portfolio</p>
        <button className="px-btn px-green" onClick={connectWallet}>CONNECT WALLET</button>
        {/* <div className="setup-box">
          <p className="setup-title">BRADBURY TESTNET</p>
          <p>Chain ID: {BRADBURY.chainId} | Symbol: GEN</p>
          <p>RPC: {BRADBURY.rpcUrl}</p>
          <a href={BRADBURY.faucetUrl} target="_blank" rel="noopener" className="faucet-link">Get Free GEN Tokens</a>
        </div> */}
      </div>
    </div>
  );
}
