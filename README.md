# 🍺 Mabuuk — AI Drunk Transfer Protection

> **Don't let drunk-you ruin sober-you's portfolio.**

Mabuuk is an AI-powered sobriety verification layer for crypto transfers, built on [GenLayer Bradbury Testnet](https://explorer-bradbury.genlayer.com). Before approving high-value transactions, the contract generates a logical riddle and uses AI validators to analyze your answer. If you sound drunk, panicked, or impaired — the transaction gets blocked and your wallet is locked for 4 hours.

No more waking up to regret.

---

## 🔴 The Problem

Crypto transactions are irreversible. One drunk transfer, one panic sell at 3 AM, and your portfolio takes a hit you can't undo. Traditional wallets have zero protection against impaired decision-making — there's no *"Are you sure you're sober?"* button.

## 🟢 The Solution

Mabuuk acts as an AI bodyguard for your wallet:

1. You initiate a transfer — if the amount is below the risk threshold, it goes through instantly
2. High-value transfer? — the contract generates a logical riddle via AI
3. You answer the riddle — AI validators analyze your response
4. ✅ **PASS** → transfer approved, you're verified sober
5. ❌ **FAIL** → transfer blocked, wallet locked for 4 hours, funds saved

The AI doesn't just check if the answer is correct — it analyzes whether the response shows signs of drunk typing, gibberish, panic, or incoherent reasoning.

---

## ⚙️ How It Works

### Architecture

```
User → MetaMask → GenLayer RPC → Mabuuk Contract → AI Validators
                                        ↓
                                 Riddle Generation (LLM)
                                 Sobriety Analysis (LLM)
                                 Auto-Lock Mechanism
                                 Per-Wallet Stats Tracking
```

### Core Features

| Feature | Description |
|---------|-------------|
| 🧩 AI Riddle Generation | Fresh riddle via `gl.nondet.exec_prompt()` for each verification |
| 🧠 Sobriety Verification | AI detects drunk typing, gibberish, and panic behavior |
| 🔒 Auto-Lock | Failed verification locks the wallet for 4 hours |
| 📊 Per-Wallet Stats | Tracks attempts, passes, rejections, and funds saved |
| ⚡ Risk Threshold | Low-value transfers (< 500 tokens) bypass AI checks |
| 🔤 Address Normalization | All addresses stored lowercase to prevent mismatch bugs |

### Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `generate_riddle()` | write | Generate a new riddle via AI |
| `get_last_riddle()` | view | Retrieve the current riddle |
| `execute_transfer()` | write | Submit transfer with riddle answer for AI verification |
| `get_user_profile()` | view | Get wallet stats (attempts, passes, rejections, funds saved) |
| `check_lock_status()` | view | Check if wallet is currently locked |
| `get_risk_threshold()` | view | Get current risk threshold value |
| `get_error()` | view | Get last operation status message |

---

## 🔗 GenLayer Integration

### Optimistic Democracy Consensus

Mabuuk uses `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` for both riddle generation and sobriety verification:

- **Leader node** — generates the result (riddle text or PASS/FAIL decision)
- **Validator nodes** — independently verify the leader's output

### Equivalence Principle

**Pattern: Partial Field Matching** — validators compare only the final `PASS`/`FAIL` status (not the full LLM reasoning), ensuring consensus on the binary outcome while allowing variation in analysis.

### GenLayer Patterns Used

| Pattern | Usage |
|---------|-------|
| `gl.nondet.exec_prompt()` | Free-text LLM outputs (riddle generation) |
| Binary PASS/FAIL extraction | Strict consensus matching |
| `TreeMap[str, ...]` | Per-wallet persistent storage |
| `.lower()` normalization | Consistent address key mapping |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contract | Python (GenLayer Intelligent Contract) |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Wallet | MetaMask + genlayer-js SDK |
| Network | GenLayer Testnet Bradbury (Chain ID `4221`) |

---

## 🚀 Deploy & Run

```bash
# 1. Install GenLayer CLI
npm install -g genlayer

# 2. Setup account
genlayer account import --private-key=0xYOUR_KEY
genlayer account unlock
genlayer network testnet-bradbury

# 3. Get testnet GEN tokens
# → https://testnet-faucet.genlayer.foundation/

# 4. Deploy the contract
cd mabuuk-frontend
npm install
genlayer deploy --contract contracts/mabuuk.py

# 5. Set your deployed contract address in contracts.ts
# MABUUK: "0xYOUR_CONTRACT_ADDRESS" as `0x${string}`

# 6. Run the frontend
npm run dev
```

---

## 📁 Project Structure

```
MABUUK-FRONTEND/
│
├── contracts/
│   └── mabuuk.py                # GenLayer Intelligent Contract
│
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Main page
│   │
│   ├── components/
│   │   ├── connect-wallet.tsx   # MetaMask wallet connection
│   │   ├── mabuuk-app.tsx       # Core app logic & UI
│   │   └── wallet-info.tsx      # Wallet stats display
│   │
│   └── lib/
│       ├── contracts.ts         # Contract address & ABI config
│       └── wallet-provider.tsx  # Wallet context provider
│
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔄 User Flow

```
Connect MetaMask
       ↓
Enter Transfer Details
       ↓
 Amount < 500? ─── YES ──→ ✅ APPROVED (instant)
       │
      NO
       ↓
AI Generates Riddle
       ↓
User Answers Riddle
       ↓
  AI Analyzes ─── PASS ──→ ✅ APPROVED (sober)
       │
     FAIL
       ↓
❌ REJECTED — Wallet locked 4 hours
```

---

## 🌐 Live Deployment

| | |
|---|---|
| **Deployer** | [`0x8E9F8ACE98dC84159F143ba00C934fAafE3D9bA8`](https://explorer-bradbury.genlayer.com/address/0x8E9F8ACE98dC84159F143ba00C934fAafE3D9bA8) |
| **Network** | GenLayer Testnet Bradbury |
| **Chain ID** | `4221` |
| **RPC** | `zksync-os-testnet-genlayer.zksync.dev` |
| **Explorer** | [explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com) |
| **Faucet** | [testnet-faucet.genlayer.foundation](https://testnet-faucet.genlayer.foundation/) |

---

## 🏆 Hackathon

**Track:** Agentic Economy Infrastructure — [GenLayer Bradbury Builders Hackathon](https://dorahacks.io/hackathon/genlayer-bradbury/detail)

| Requirement | Status |
|-------------|--------|
| Optimistic Democracy consensus | ✅ `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` |
| Equivalence Principle | ✅ Partial Field Matching (PASS/FAIL only) |
| Deployed on Bradbury Testnet | ✅ |
| Frontend + MetaMask integration | ✅ |
| GitHub repository | ✅ |
| Demo video | ✅ |

---

## 💡 Why "Mabuuk"?

**Mabuuk** (مابوك / mabuk) means **"drunk"** in Indonesian. The name captures exactly what this project protects you from — yourself, when you've had a few too many.

---

## 📄 License

MIT