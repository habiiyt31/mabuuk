"use client";
import { useWallet } from "@/lib/wallet-provider";
import ConnectWallet from "@/components/connect-wallet";
import WalletInfo from "@/components/wallet-info";
import MabuukApp from "@/components/mabuuk-app";

export default function Home() {
  const { connected, loading } = useWallet();
  if (loading) return <div className="loading"><p className="blink">LOADING...</p></div>;
  return (
    <main>
      <header className="header">
        <div className="h-left"><span className="h-icon">🍺</span><span className="h-title">MABUUK</span></div>
        <div className="h-right"><WalletInfo /></div>
      </header>
      {connected ? <MabuukApp /> : <ConnectWallet />}
      <footer className="footer">BUILT ON <a href="https://genlayer.com" target="_blank" rel="noopener">GENLAYER</a> · BRADBURY TESTNET · 2026</footer>
    </main>
  );
}
