"use client";
import { useState } from "react";
import { useWallet } from "@/lib/wallet-provider";

type Tab = "transfer" | "stats" | "docs";
type Phase = "input" | "riddle" | "done";
type DocSection = "how" | "why" | "faq" | "roadmap" | "arch";

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

  // Docs sub-navigation
  const [docSection, setDocSection] = useState<DocSection>("how");

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
        const riddleText = msg.replace("RIDDLE:", "").trim();
        setRiddle(riddleText);
        setPhase("riddle");
        setStatus("High-value transfer detected! Solve the riddle to prove you're sober.");
      } else if (msg.includes("APPROVED")) {
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

  // ── FAQ data ──
  const faqItems = [
    {
      q: "Transfer amounts are simulated — does this actually work with real tokens?",
      a: "Yes. The behavioral safety pattern is identical whether tracking u256 values or native tokens. The AI sobriety check, riddle generation, consensus verification, and wallet locking all work the same way. On mainnet, it's a matter of integrating with the native token transfer flow — the hard part (AI consensus on subjective judgment) is already proven.",
    },
    {
      q: "Why not just use a simple math quiz instead of AI?",
      a: "A static quiz can be memorized or brute-forced. Mabuuk generates fresh riddles every time using on-chain AI, and the sobriety analysis goes beyond right/wrong answers — it detects patterns like gibberish typing, panic behavior, and incoherent reasoning. This requires subjective judgment, which is exactly what GenLayer's Optimistic Democracy is built for.",
    },
    {
      q: "What if I'm sober but fail the riddle?",
      a: "The AI doesn't just check if the answer is correct — it analyzes HOW you answered. A sober person giving a wrong but logical answer will likely still pass. A drunk person giving the right answer but typing incoherently may still fail. The wallet lock is 4 hours as a safety window, not a permanent block.",
    },
    {
      q: "Why GenLayer and not BTC/Ethereum/Solana?",
      a: "Traditional blockchains are deterministic — every validator must produce the exact same output. Sobriety detection is inherently subjective and non-deterministic. GenLayer is the only chain where multiple AI validators with different LLMs can independently assess subjective conditions and reach consensus. You literally cannot build this on Ethereum.",
    },
    {
      q: "What's the revenue model?",
      a: "GenLayer's Dev Fee model gives contract creators up to 20% of all transaction fees their contract generates — permanently. Every sobriety check that runs through Mabuuk earns revenue for the developer. More users = more fees, no cap.",
    },
  ];

  // ── FAQ toggle state ──
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          {/* ── Docs sub-nav ── */}
          <div className="docs-nav">
            {[
              { id: "how" as DocSection, label: "How It Works" },
              { id: "why" as DocSection, label: "Why GenLayer" },
              { id: "faq" as DocSection, label: "FAQ" },
              { id: "roadmap" as DocSection, label: "Roadmap" },
              { id: "arch" as DocSection, label: "Architecture" },
            ].map((item) => (
              <button
                key={item.id}
                className={`docs-nav-btn ${docSection === item.id ? "active" : ""}`}
                onClick={() => setDocSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* ── HOW IT WORKS ── */}
          {docSection === "how" && (
            <>
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
                <div className="flow-steps">
                  <div className="flow-step">
                    <span className="flow-num">1</span>
                    <span>Enter destination and amount, then click Send.</span>
                  </div>
                  <div className="flow-step">
                    <span className="flow-num">2</span>
                    <span>If amount &lt; 500 → approved instantly. No riddle needed.</span>
                  </div>
                  <div className="flow-step">
                    <span className="flow-num">3</span>
                    <span>If amount ≥ 500 → AI generates a riddle on-chain. You must answer it.</span>
                  </div>
                  <div className="flow-step">
                    <span className="flow-num">4</span>
                    <span>Multiple AI validators independently analyze your answer.</span>
                  </div>
                  <div className="flow-step">
                    <span className="flow-num">5</span>
                    <span>Sober = approved. Mabuuk = rejected + wallet locked 4 hours.</span>
                  </div>
                </div>
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
                  Pattern: Partial Field Matching. Validators compare only the{" "}
                  <code>PASS/FAIL</code> status, not the full reasoning.
                  Different LLMs may explain differently but must agree on the
                  verdict.
                </p>
              </div>
              <div className="doc-s">
                <h3>Note on Transfer Amounts</h3>
                <p>
                  Transfer amounts are tracked as <code>u256</code> values inside
                  the contract, not as native GEN token transfers. This is a
                  proof-of-concept — the behavioral safety pattern works the same
                  way and can be extended to real token transfers on mainnet.
                </p>
              </div>
            </>
          )}

          {/* ── WHY GENLAYER ── */}
          {docSection === "why" && (
            <>
              <h2 className="panel-title">WHY GENLAYER?</h2>
              <div className="doc-s">
                <h3>The Problem with Traditional Chains</h3>
                <p>
                  Traditional smart contracts are deterministic — given the same
                  input, every validator produces the exact same output. This works
                  great for math, token transfers, and rule-based logic.
                </p>
                <p>
                  But sobriety detection is subjective. Is this person typing
                  gibberish because they&apos;re drunk, or because English isn&apos;t their
                  first language? Is this a panic sell or a calculated exit? These
                  questions require judgment, not computation.
                </p>
              </div>
              <div className="doc-s">
                <h3>GenLayer&apos;s Solution</h3>
                <p>
                  GenLayer uses Intelligent Contracts — smart contracts that can
                  use AI models as part of their execution logic. Multiple
                  validators running different LLMs (GPT-4, Claude, LLaMA, etc.)
                  independently assess the same input and vote on the outcome
                  through Optimistic Democracy consensus.
                </p>
              </div>
              <div className="doc-s">
                <h3>What This Means</h3>
                <div className="feature-list">
                  <div className="feature-item">
                    <span className="feature-icon">🛡️</span>
                    <div>
                      <strong>No single point of AI failure</strong>
                      <p>Diverse models reduce bias and manipulation risk</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🤝</span>
                    <div>
                      <strong>Subjective decisions become trustless</strong>
                      <p>Consensus replaces blind trust in one model</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">⚖️</span>
                    <div>
                      <strong>Equivalence Principle</strong>
                      <p>Validators agree on the verdict even if their reasoning differs</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="doc-s">
                <div className="highlight-box">
                  Mabuuk is only possible on GenLayer. The behavioral safety
                  pattern it demonstrates — AI consensus on subjective human
                  conditions — is a new primitive that doesn&apos;t exist on any other
                  chain.
                </div>
              </div>
            </>
          )}

          {/* ── FAQ ── */}
          {docSection === "faq" && (
            <>
              <h2 className="panel-title">FREQUENTLY ASKED QUESTIONS</h2>
              <div className="faq-list">
                {faqItems.map((item, i) => (
                  <div
                    key={i}
                    className={`faq-item ${openFaq === i ? "open" : ""}`}
                  >
                    <button
                      className="faq-q"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span>{item.q}</span>
                      <span className="faq-arrow">{openFaq === i ? "▾" : "▸"}</span>
                    </button>
                    {openFaq === i && (
                      <div className="faq-a">{item.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── ROADMAP ── */}
          {docSection === "roadmap" && (
            <>
              <h2 className="panel-title">VISION & ROADMAP</h2>
              <p className="panel-desc">
                Mabuuk is not just a hackathon project — it&apos;s a proof-of-concept
                for a new category: behavioral safety infrastructure for crypto.
              </p>
              <div className="roadmap">
                <div className="roadmap-phase current">
                  <div className="roadmap-marker">●</div>
                  <div className="roadmap-content">
                    <h3>Phase 1 — Hackathon MVP</h3>
                    <p>AI sobriety verification via riddle-based cognitive assessment</p>
                    <p>Simulated transfer amounts (u256 values)</p>
                    <p>Deployed on GenLayer Bradbury Testnet + Studionet</p>
                  </div>
                </div>
                <div className="roadmap-phase">
                  <div className="roadmap-marker">○</div>
                  <div className="roadmap-content">
                    <h3>Phase 2 — Mainnet Ready</h3>
                    <p>Integrate with native GEN token transfers</p>
                    <p>Priority mainnet deployment via GenLayer accelerator</p>
                    <p>Activate Dev Fee model — earn 20% of transaction fees permanently</p>
                  </div>
                </div>
                <div className="roadmap-phase">
                  <div className="roadmap-marker">○</div>
                  <div className="roadmap-content">
                    <h3>Phase 3 — Behavioral Safety SDK</h3>
                    <p>Expand beyond sobriety: panic selling, unusual patterns, flagged addresses</p>
                    <p>Package as embeddable middleware for any wallet or dApp</p>
                    <p>Composability: other devs building on Mabuuk amplify revenue</p>
                  </div>
                </div>
                <div className="roadmap-phase">
                  <div className="roadmap-marker">○</div>
                  <div className="roadmap-content">
                    <h3>Phase 4 — Agentic Economy Infrastructure</h3>
                    <p>AI agent guardrails for autonomous transaction execution</p>
                    <p>Cross-chain behavioral safety via LayerZero integration</p>
                    <p>Community-driven threshold and rule governance</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── ARCHITECTURE ── */}
          {docSection === "arch" && (
            <>
              <h2 className="panel-title">ARCHITECTURE</h2>
              <div className="doc-s">
                <h3>System Overview</h3>
                <div className="arch-diagram">
                  <div className="arch-layer">
                    <div className="arch-box arch-user">👛 User (MetaMask)</div>
                    <div className="arch-arrow">▼</div>
                  </div>
                  <div className="arch-layer">
                    <div className="arch-box arch-frontend">⚛️ Frontend (Next.js + genlayer-js)</div>
                    <div className="arch-arrow">▼</div>
                  </div>
                  <div className="arch-layer">
                    <div className="arch-box arch-network">🌐 GenLayer Network (Bradbury / Studionet)</div>
                    <div className="arch-arrow">▼</div>
                  </div>
                  <div className="arch-layer">
                    <div className="arch-box arch-contract">🐍 Intelligent Contract (Python)</div>
                  </div>
                  <div className="arch-split">
                    <div className="arch-branch">
                      <div className="arch-box arch-low">
                        <strong>execute_transfer()</strong>
                        <p>amount &lt; 500 → ✅ Auto-approve</p>
                        <p>amount ≥ 500 → 🧩 Generate Riddle</p>
                      </div>
                    </div>
                    <div className="arch-branch">
                      <div className="arch-box arch-high">
                        <strong>answer_riddle()</strong>
                        <p>Leader: analyze → PASS/FAIL</p>
                        <p>Validators: verify verdict</p>
                      </div>
                    </div>
                  </div>
                  <div className="arch-results">
                    <div className="arch-box arch-pass">✅ PASS → Transfer Approved</div>
                    <div className="arch-box arch-fail">🔒 FAIL → Locked 4 Hours</div>
                  </div>
                </div>
              </div>
              <div className="doc-s">
                <h3>Tech Stack</h3>
                <div className="tech-grid">
                  <div className="tech-item">
                    <span className="tech-label">Contract</span>
                    <span className="tech-value">Python (GenLayer Intelligent Contract)</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">Frontend</span>
                    <span className="tech-value">Next.js 14 + TypeScript + Tailwind CSS</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">Wallet</span>
                    <span className="tech-value">MetaMask + genlayer-js SDK</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">Network</span>
                    <span className="tech-value">GenLayer Bradbury (4221) + Studionet (61999)</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">Consensus</span>
                    <span className="tech-value">Optimistic Democracy + Partial Field Matching</span>
                  </div>
                </div>
              </div>
              <div className="doc-s">
                <h3>Links</h3>
                <div className="link-grid">
                  <a href="https://explorer-bradbury.genlayer.com" target="_blank" rel="noopener" className="link-card">
                    <span className="link-icon">🔗</span>
                    <span>GenLayer Explorer</span>
                  </a>
                  <a href="https://testnet-faucet.genlayer.foundation/" target="_blank" rel="noopener" className="link-card">
                    <span className="link-icon">🪙</span>
                    <span>Bradbury Faucet</span>
                  </a>
                  <a href="https://docs.genlayer.com" target="_blank" rel="noopener" className="link-card">
                    <span className="link-icon">📄</span>
                    <span>GenLayer Docs</span>
                  </a>
                  <a href="https://github.com/habiiyt31/mabuuk" target="_blank" rel="noopener" className="link-card">
                    <span className="link-icon">💻</span>
                    <span>GitHub Repo</span>
                  </a>
                  <a href="https://dorahacks.io/buidl/41987" target="_blank" rel="noopener" className="link-card">
                    <span className="link-icon">🏆</span>
                    <span>DoraHacks BUIDL</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}