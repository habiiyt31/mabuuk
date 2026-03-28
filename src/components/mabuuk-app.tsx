"use client";
import { useState } from "react";
import { useWallet } from "@/lib/wallet-provider";

type Tab = "transfer" | "stats" | "docs";
type Phase = "input" | "riddle" | "done";

export default function MabuukApp() {
  const { read, write, address } = useWallet();
  const [tab, setTab] = useState<Tab>("transfer");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Transfer form
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");

  // Riddle phase
  const [phase, setPhase] = useState<Phase>("input");
  const [riddle, setRiddle] = useState("");
  const [answer, setAnswer] = useState("");

  // Stats
  const [stats, setStats] = useState<any>(null);

  const now = () => Math.floor(Date.now() / 1000);

  // ── STEP 1: Attempt transfer ──
  async function handleTransfer() {
    if (!destination || !amount) {
      setStatus("Fill destination and amount!");
      return;
    }
    setLoading(true);
    setStatus("Submitting transfer to AI validators...");
    try {
      await write("execute_transfer", [destination, parseInt(amount), now()]);
      const err = await read("get_error", []);
      const msg = typeof err === "string" ? err : String(err);

      if (msg.startsWith("RIDDLE:")) {
        // High-risk: AI generated a riddle, need user answer
        const riddleText = msg.replace("RIDDLE:", "").trim();
        setRiddle(riddleText);
        setPhase("riddle");
        setStatus("High-value transfer detected! Solve the riddle to prove you're sober.");
      } else if (msg.includes("APPROVED")) {
        // Low-risk: approved instantly
        setStatus(msg);
        setPhase("done");
      } else if (msg.includes("LOCKED")) {
        setStatus(msg);
        setPhase("done");
      } else {
        setStatus(msg);
      }
    } catch (e: any) {
      const msg = e?.message || "Transfer failed";
      setStatus(msg);
    }
    setLoading(false);
  }

  // ── STEP 2: Answer riddle ──
  async function handleAnswer() {
    if (!answer.trim()) {
      setStatus("Type your answer first!");
      return;
    }
    setLoading(true);
    setStatus("AI validators checking your sobriety...");
    try {
      await write("answer_riddle", [answer, now()]);
      const err = await read("get_error", []);
      const msg = typeof err === "string" ? err : String(err);
      setStatus(msg);
      setPhase("done");
    } catch (e: any) {
      const msg = e?.message || "Verification failed";
      setStatus(msg);
    }
    setLoading(false);
  }

  // ── Reset for new transfer ──
  function resetTransfer() {
    setPhase("input");
    setDestination("");
    setAmount("");
    setRiddle("");
    setAnswer("");
    setStatus("");
  }

  // ── Load stats ──
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
      } catch {
        setStats(null);
      }
    }
    setLoading(false);
  }

  const isPass = status.includes("APPROVED");
  const isFail = status.includes("REJECTED") || status.includes("LOCKED");

  return (
    <div className="app-wrap">
      <div className="tab-bar">
        {(["transfer", "stats", "docs"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => {
              setTab(t);
              if (t === "stats") loadStats();
            }}
          >
            {t === "transfer" ? "TRANSFER" : t === "stats" ? "STATS" : "DOCS"}
          </button>
        ))}
      </div>

      {/* ════════ TRANSFER TAB ════════ */}
      {tab === "transfer" && (
        <div className="panel">
          <h2 className="panel-title">SOBER CHECK TRANSFER</h2>
          <p className="panel-desc">
            Transfers above 500 tokens trigger an AI sobriety test automatically.
          </p>

          {/* ── Phase: Input ── */}
          {phase === "input" && (
            <>
              <div className="step">
                <p className="step-label">DESTINATION</p>
                <input
                  className="inp"
                  placeholder="0x..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="step">
                <p className="step-label">AMOUNT</p>
                <input
                  className="inp"
                  type="number"
                  placeholder="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="hint">
                  {parseInt(amount) >= 500
                    ? "⚠️ High-value — AI sobriety check will activate"
                    : amount
                    ? "✅ Low-value — will approve instantly"
                    : ""}
                </p>
              </div>

              <div className="step">
                <button
                  className="px-btn px-green"
                  onClick={handleTransfer}
                  disabled={loading}
                  style={{ width: "100%" }}
                >
                  {loading ? "SUBMITTING..." : "SEND TRANSFER"}
                </button>
              </div>
            </>
          )}

          {/* ── Phase: Riddle ── */}
          {phase === "riddle" && (
            <>
              <div className="step">
                <p className="step-label">AI RIDDLE CHALLENGE</p>
                <div className="riddle-box">{riddle}</div>
              </div>

              <div className="step">
                <p className="step-label">YOUR ANSWER</p>
                <input
                  className="inp"
                  placeholder="Prove you're sober..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </div>

              <div className="step">
                <button
                  className="px-btn px-gold"
                  onClick={handleAnswer}
                  disabled={loading}
                  style={{ width: "100%" }}
                >
                  {loading ? "AI CHECKING..." : "SUBMIT ANSWER"}
                </button>
              </div>
            </>
          )}

          {/* ── Phase: Done ── */}
          {phase === "done" && (
            <div className="step">
              <button
                className="px-btn px-blue"
                onClick={resetTransfer}
                style={{ width: "100%" }}
              >
                NEW TRANSFER
              </button>
            </div>
          )}

          {/* ── Status bar ── */}
          {status && (
            <div
              className={`status-box ${
                isPass ? "s-pass" : isFail ? "s-fail" : "s-wait"
              }`}
            >
              {status}
            </div>
          )}
        </div>
      )}

      {/* ════════ STATS TAB ════════ */}
      {tab === "stats" && (
        <div className="panel">
          <h2 className="panel-title">YOUR SOBRIETY RECORD</h2>
          {stats && stats.last_action ? (
            <div className="status-box s-wait">
              Last action: {stats.last_action}
            </div>
          ) : stats && !stats.error ? (
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-val">{stats.total_tx_attempted || "0"}</p>
                <p className="stat-lbl">TOTAL TX</p>
              </div>
              <div className="stat-card sc-pass">
                <p className="stat-val">{stats.total_tx_passed || "0"}</p>
                <p className="stat-lbl">SOBER</p>
              </div>
              <div className="stat-card sc-fail">
                <p className="stat-val">{stats.total_tx_rejected || "0"}</p>
                <p className="stat-lbl">MABUUK</p>
              </div>
              <div className="stat-card sc-gold">
                <p className="stat-val">{stats.total_funds_saved || "0"}</p>
                <p className="stat-lbl">SAVED</p>
              </div>
            </div>
          ) : (
            <p className="panel-desc">No transactions yet.</p>
          )}
          <button
            className="px-btn px-blue"
            onClick={loadStats}
            disabled={loading}
            style={{ marginTop: 16 }}
          >
            REFRESH
          </button>
        </div>
      )}

      {/* ════════ DOCS TAB ════════ */}
      {tab === "docs" && (
        <div className="panel docs">
          <h2 className="panel-title">HOW MABUUK WORKS</h2>
          <div className="doc-s">
            <h3>What is Mabuuk?</h3>
            <p>
              Mabuuk (Indonesian for &quot;drunk&quot;) protects your crypto
              wallet from drunk, FOMO, or panic transfers. High-value
              transactions require passing an AI sobriety test.
            </p>
          </div>
          <div className="doc-s">
            <h3>The Flow</h3>
            <p>
              <strong>1.</strong> Enter destination and amount, then click Send.
            </p>
            <p>
              <strong>2.</strong> If amount &lt; 500 → approved instantly. No
              riddle needed.
            </p>
            <p>
              <strong>3.</strong> If amount ≥ 500 → AI generates a riddle
              on-chain. You must answer it.
            </p>
            <p>
              <strong>4.</strong> Multiple AI validators independently analyze
              your answer.
            </p>
            <p>
              <strong>5.</strong> Sober = approved. Mabuuk = rejected + wallet
              locked 4 hours.
            </p>
          </div>
          <div className="doc-s">
            <h3>Optimistic Democracy Consensus</h3>
            <p>
              Uses <code>gl.vm.run_nondet_unsafe(leader_fn, validator_fn)</code>.
              Multiple GenLayer validator nodes with different LLMs independently
              evaluate your answer. Majority vote determines outcome.
            </p>
          </div>
          <div className="doc-s">
            <h3>Equivalence Principle</h3>
            <p>
              Pattern 1: Partial Field Matching. Validators compare only{" "}
              <code>status</code> (PASS/FAIL), not <code>reasoning</code>.
              Different LLMs may explain differently but must agree on the
              verdict.
            </p>
          </div>
          <div className="doc-s">
            <h3>Links</h3>
            <p>
              <a
                href="https://explorer-bradbury.genlayer.com"
                target="_blank"
                rel="noopener"
              >
                GenLayer Explorer
              </a>
            </p>
            <p>
              <a
                href="https://testnet-faucet.genlayer.foundation/"
                target="_blank"
                rel="noopener"
              >
                Bradbury Faucet
              </a>
            </p>
            <p>
              <a
                href="https://docs.genlayer.com"
                target="_blank"
                rel="noopener"
              >
                GenLayer Docs
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}