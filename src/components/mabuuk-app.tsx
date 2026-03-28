"use client";
import { useState } from "react";
import { useWallet } from "@/lib/wallet-provider";

type Tab = "transfer" | "stats" | "docs";

export default function MabuukApp() {
  const { read, write, address } = useWallet();
  const [tab, setTab] = useState<Tab>("transfer");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [riddle, setRiddle] = useState("");
  const [answer, setAnswer] = useState("");
  const [stats, setStats] = useState<any>(null);

  const now = () => Math.floor(Date.now() / 1000);

  async function generateRiddle() {
    setLoading(true);
    setStatus("Brewing your riddle...");
    try {
      await write("generate_riddle", []);
      const r = await read("get_last_riddle", []);
      setRiddle(typeof r === "string" ? r : String(r));
      setStatus("Riddle ready! Answer it to prove you're sober.");
    } catch (e: any) { setStatus("Error: " + (e?.message || "Failed")); }
    setLoading(false);
  }

  async function executeTransfer() {
    if (!destination || !amount) { setStatus("Fill destination and amount"); return; }
    setLoading(true);
    setStatus("AI validators checking if you're mabuuk...");
    try {
      await write("execute_transfer", [destination, parseInt(amount), riddle, answer, now()]);
      const err = await read("get_error", []);
      const msg = typeof err === "string" ? err : String(err);
      setStatus(msg);
    } catch (e: any) {
      const msg = e?.message || "Transfer failed";
      setStatus(msg);
    }
    setLoading(false);
  }

  async function loadStats() {
    if (!address) return;
    setLoading(true);
    try {
      const p = await read("get_user_profile", [address]);
      setStats(p);
    } catch {
      try {
        const err = await read("get_error", []);
        setStats({ last_action: typeof err === "string" ? err : String(err) });
      } catch { setStats(null); }
    }
    setLoading(false);
  }

  const isPass = status.includes("APPROVED");
  const isFail = status.includes("REJECTED") || status.includes("LOCKED");

  return (
    <div className="app-wrap">
      <div className="tab-bar">
        {(["transfer", "stats", "docs"] as Tab[]).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => { setTab(t); if (t === "stats") loadStats(); }}>
            {t === "transfer" ? "TRANSFER" : t === "stats" ? "STATS" : "DOCS"}
          </button>
        ))}
      </div>

      {tab === "transfer" && (
        <div className="panel">
          <h2 className="panel-title">SOBER CHECK TRANSFER</h2>
          <p className="panel-desc">Transfers above 500 tokens need an AI sobriety test.</p>

          <div className="step">
            <p className="step-label">STEP 1 — RIDDLE</p>
            <button className="px-btn px-gold" onClick={generateRiddle} disabled={loading}>
              {loading ? "BREWING..." : "GENERATE RIDDLE"}
            </button>
            {riddle && <div className="riddle-box">{riddle}</div>}
          </div>

          <div className="step">
            <p className="step-label">STEP 2 — DETAILS</p>
            <label className="inp-label">Destination</label>
            <input className="inp" placeholder="0x..." value={destination} onChange={e => setDestination(e.target.value)} />
            <label className="inp-label">Amount</label>
            <input className="inp" type="number" placeholder="1000" value={amount} onChange={e => setAmount(e.target.value)} />
            <label className="inp-label">Your Answer</label>
            <input className="inp" placeholder="Prove you're sober..." value={answer} onChange={e => setAnswer(e.target.value)} />
          </div>

          <div className="step">
            <p className="step-label">STEP 3 — SEND</p>
            <button className="px-btn px-green" onClick={executeTransfer} disabled={loading} style={{ width: "100%" }}>
              {loading ? "AI CHECKING..." : "SEND TRANSFER"}
            </button>
          </div>

          {status && <div className={`status-box ${isPass ? "s-pass" : isFail ? "s-fail" : "s-wait"}`}>{status}</div>}
        </div>
      )}

      {tab === "stats" && (
        <div className="panel">
          <h2 className="panel-title">YOUR SOBRIETY RECORD</h2>
          {stats && stats.last_action ? (
            <div className="status-box s-wait">Last action: {stats.last_action}</div>
          ) : stats && !stats.error ? (
            <div className="stats-grid">
              <div className="stat-card"><p className="stat-val">{stats.total_tx_attempted || "0"}</p><p className="stat-lbl">TOTAL TX</p></div>
              <div className="stat-card sc-pass"><p className="stat-val">{stats.total_tx_passed || "0"}</p><p className="stat-lbl">SOBER</p></div>
              <div className="stat-card sc-fail"><p className="stat-val">{stats.total_tx_rejected || "0"}</p><p className="stat-lbl">MABUUK</p></div>
              <div className="stat-card sc-gold"><p className="stat-val">{stats.total_funds_saved || "0"}</p><p className="stat-lbl">SAVED</p></div>
            </div>
          ) : <p className="panel-desc">No transactions yet.</p>}
          <button className="px-btn px-blue" onClick={loadStats} disabled={loading} style={{ marginTop: 16 }}>REFRESH</button>
        </div>
      )}

      {tab === "docs" && (
        <div className="panel docs">
          <h2 className="panel-title">HOW MABUUK WORKS</h2>
          <div className="doc-s">
            <h3>What is Mabuuk?</h3>
            <p>Mabuuk (Indonesian for "drunk") protects your crypto wallet from drunk, FOMO, or panic transfers. High-value transactions require passing an AI sobriety test.</p>
          </div>
          <div className="doc-s">
            <h3>The Flow</h3>
            <p><strong>1.</strong> AI generates a logic riddle on-chain via multi-validator consensus.</p>
            <p><strong>2.</strong> You answer the riddle and submit your transfer.</p>
            <p><strong>3.</strong> Multiple AI validators (GPT, Claude, Grok, Deepseek) independently analyze your answer.</p>
            <p><strong>4.</strong> Sober = approved. Mabuuk = rejected + wallet locked 4 hours.</p>
          </div>
          <div className="doc-s">
            <h3>Optimistic Democracy Consensus</h3>
            <p>Uses <code>gl.vm.run_nondet_unsafe(leader_fn, validator_fn)</code>. Multiple GenLayer validator nodes with different LLMs independently evaluate your answer. Majority vote determines outcome.</p>
          </div>
          <div className="doc-s">
            <h3>Equivalence Principle</h3>
            <p>Pattern 1: Partial Field Matching. Validators compare only <code>status</code> (PASS/FAIL), not <code>reasoning</code>. Different LLMs may explain differently but must agree on the verdict.</p>
          </div>
          <div className="doc-s">
            <h3>Links</h3>
            <p><a href="https://explorer-bradbury.genlayer.com" target="_blank" rel="noopener">GenLayer Explorer</a></p>
            <p><a href="https://testnet-faucet.genlayer.foundation/" target="_blank" rel="noopener">Bradbury Faucet</a></p>
            <p><a href="https://docs.genlayer.com" target="_blank" rel="noopener">GenLayer Docs</a></p>
          </div>
        </div>
      )}
    </div>
  );
}
