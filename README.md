# 🍺 Mabuuk — AI Drunk Transfer Protection

> **Don't let drunk-you ruin sober-you's portfolio.**

Mabuuk is an AI-powered sobriety verification layer for crypto transfers, built on [GenLayer](https://genlayer.com). When you attempt a high-value transaction, the contract automatically generates a logical riddle and uses AI validators to analyze your answer. If you sound drunk, panicked, or impaired — the transaction gets blocked and your wallet is locked for 4 hours.

No more waking up to regret.

**Demo Video:** [Watch on YouTube](https://www.youtube.com/watch?v=hPYbPW6uoow)

---

## 🔴 The Problem

Crypto transactions are irreversible. One drunk transfer, one panic sell at 3 AM, and your portfolio takes a hit you can't undo. Traditional wallets have zero protection against impaired decision-making — there's no *"Are you sure you're sober?"* button.

## 🟢 The Solution

Mabuuk acts as an AI bodyguard for your wallet:

1. You initiate a transfer with destination and amount
2. Amount below 500? → approved instantly, no checks needed
3. Amount ≥ 500? → AI automatically generates a riddle on-chain
4. You answer the riddle → AI validators analyze your response
5. ✅ **PASS** → transfer approved, you're verified sober
6. ❌ **FAIL** → transfer blocked, wallet locked for 4 hours, funds saved

The AI doesn't just check if the answer is correct — it analyzes whether the response shows signs of drunk typing, gibberish, panic, or incoherent reasoning.

> **Note:** Transfer amounts are tracked as `u256` values inside the contract, not as native GEN token transfers. This is a proof-of-concept — the behavioral safety pattern works the same way and can be extended to real token transfers on mainnet.

---

## 🚀 Quick Start (For Hackathon Reviewers)

### Prerequisites

- **Node.js** 18+ and **npm**
- **MetaMask** browser extension

### Step 1: Clone & Install

```bash
git clone https://github.com/habiiyt31/mabuuk.git
cd mabuuk/mabuuk-frontend
npm install
```

### Step 2: Choose Network

Mabuuk supports two networks. Open `src/lib/contracts.ts` and set the network:

```typescript
// Line 3 — change this value to switch networks
const USE_NETWORK: "bradbury" | "studionet" = "studionet";
```

| Network | Best For | Consensus Speed | Explorer |
|---------|----------|----------------|----------|
| **Studionet** (recommended first) | Quick testing & review | ~10-30 seconds | [studio.genlayer.com](https://studio.genlayer.com) |
| **Bradbury** | Production testnet | ~3-7 minutes | [explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com) |

> **💡 Recommendation:** Start with **Studionet** to quickly see the full flow (transfer → riddle → answer → result). Then switch to **Bradbury** to verify the production deployment.

### Step 3: Run the Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Connect MetaMask

1. Click **"CONNECT WALLET"** on the Mabuuk homepage
2. MetaMask will automatically prompt you to add the correct network
3. Approve the network addition and account connection

**Network details (auto-configured by the app):**

| Setting | Studionet | Bradbury |
|---------|-----------|----------|
| Chain ID | `61999` | `4221` |
| RPC URL | `https://studio.genlayer.com/api` | `https://zksync-os-testnet-genlayer.zksync.dev` |
| Currency | GEN | GEN |
| Faucet | Built-in (Studio) | [testnet-faucet.genlayer.foundation](https://testnet-faucet.genlayer.foundation/) |

> **If using Bradbury:** Visit the [Bradbury Faucet](https://testnet-faucet.genlayer.foundation/) first to get free GEN tokens.

### Step 5: Test a Transfer

**Low-value transfer (instant approval, no riddle):**
1. Go to the **TRANSFER** tab
2. Enter any destination address (e.g. `0x8E9F8ACE98dC84159F143ba00C934fAafE3D9bA8`)
3. Enter amount: `100` (below 500 threshold)
4. Click **SEND TRANSFER**
5. Wait for AI validator consensus
6. Result: ✅ **APPROVED** — no riddle needed

**High-value transfer (sobriety test):**
1. Enter the same destination address
2. Enter amount: `1000` (above 500 threshold)
3. Click **SEND TRANSFER**
4. Wait for consensus — AI generates a riddle on-chain
5. A riddle appears on screen — answer it coherently to prove sobriety
6. Click **SUBMIT ANSWER**
7. Wait for a second consensus round
8. Result: ✅ **APPROVED** if sober, or ❌ **REJECTED** + wallet locked 4hrs if drunk

> **⏱ Consensus timing:**
> - **Studionet:** ~10-30 seconds per transaction
> - **Bradbury:** ~3-7 minutes per transaction (this is normal for the production testnet)

### Step 6: Switch to Bradbury (Optional)

After testing on Studionet, verify the production deployment:

1. In `src/lib/contracts.ts`, change:
   ```typescript
   const USE_NETWORK: "bradbury" | "studionet" = "bradbury";
   ```
2. Restart the dev server (`Ctrl+C`, then `npm run dev`)
3. In MetaMask: switch to **GenLayer Testnet Bradbury** network (or reconnect via the app)
4. Make sure you have GEN tokens from the [Bradbury Faucet](https://testnet-faucet.genlayer.foundation/)
5. Test again — same flow, just slower consensus

---

## ⚙️ How It Works

### Architecture

```
User → MetaMask → GenLayer RPC → Mabuuk Contract → AI Validators
                                        ↓
                              ┌─────────────────────┐
                              │  execute_transfer()  │
                              │         ↓            │
                              │  amount < 500?       │
                              │  YES → approve       │
                              │  NO  → generate      │
                              │        riddle &      │
                              │        store pending │
                              └─────────────────────┘
                                        ↓
                              ┌─────────────────────┐
                              │   answer_riddle()    │
                              │         ↓            │
                              │  AI evaluates answer │
                              │  PASS → approved     │
                              │  FAIL → locked 4hr   │
                              └─────────────────────┘
```

### Two-Step Flow

**Step 1: `execute_transfer(destination, amount, current_time)`**
- If `amount < 500` → AI validators approve instantly, no riddle needed
- If `amount ≥ 500` → AI generates a logical riddle via `gl.nondet.exec_prompt()`, stores the transfer as pending

**Step 2: `answer_riddle(user_answer, current_time)`**
- User submits their answer to the riddle
- AI validators independently evaluate the answer for signs of impairment
- `PASS` → transfer approved, stats updated
- `FAIL` → transfer rejected, wallet locked for 4 hours, funds saved counter incremented

### Core Features

| Feature | Description |
|---------|-------------|
| 🧩 AI Riddle Generation | Automatically triggered during high-value transfers via `gl.nondet.exec_prompt()` |
| 🧠 Sobriety Verification | AI detects drunk typing, gibberish, and panic behavior |
| 🔒 Auto-Lock | Failed verification locks the wallet for 4 hours |
| 📊 Per-Wallet Stats | Tracks attempts, passes, rejections, and funds saved |
| ⚡ Risk Threshold | Low-value transfers (< 500) bypass AI checks instantly |
| 🔤 Address Normalization | All addresses stored lowercase to prevent mismatch bugs |
| 📝 Pending Transfer State | High-risk transfers stored as pending until riddle is answered |

### Contract Methods

| Method | Type | Parameters | Description |
|--------|------|------------|-------------|
| `execute_transfer()` | write | `destination`, `amount`, `current_time` | Attempt transfer — low-risk auto-approves, high-risk generates riddle |
| `answer_riddle()` | write | `user_answer`, `current_time` | Submit riddle answer for AI sobriety verification |
| `get_pending_riddle()` | view | `user_address` | Get the active riddle for a pending transfer |
| `get_last_riddle()` | view | — | Retrieve the most recently generated riddle |
| `get_user_profile()` | view | `user_address` | Get wallet stats (attempts, passes, rejections, funds saved) |
| `check_lock_status()` | view | `user_address`, `current_time` | Check if wallet is currently locked |
| `get_risk_threshold()` | view | — | Get current risk threshold value |
| `get_error()` | view | — | Get last operation status message |

---

## 🔗 GenLayer Integration

### Optimistic Democracy Consensus

Mabuuk uses `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` for both riddle generation and sobriety verification:

- **Leader node** — generates the result (riddle text or PASS/FAIL decision)
- **Validator nodes** — independently verify the leader's output using different LLMs
- **Consensus** — majority vote determines the final outcome

This means the sobriety check isn't relying on a single AI model — multiple independent AI validators must agree on whether you're sober or not.

### Equivalence Principle

**Pattern: Partial Field Matching** — validators compare only the final `PASS`/`FAIL` status (not the full LLM reasoning), ensuring consensus on the binary outcome while allowing variation in analysis.

This is critical because different LLMs (GPT-4, Claude, LLaMA, etc.) will explain their reasoning differently, but they must agree on the verdict: is this person sober enough to make this transfer?

### GenLayer Patterns Used

| Pattern | Usage |
|---------|-------|
| `gl.nondet.exec_prompt()` | Free-text LLM outputs (riddle generation) |
| Binary PASS/FAIL extraction | Strict consensus matching |
| `TreeMap[str, ...]` | Per-wallet persistent storage (stats, locks, pending transfers) |
| `.lower()` normalization | Consistent address key mapping |
| Pending state pattern | `pending_dest`, `pending_amt`, `pending_riddle` per user |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contract | Python (GenLayer Intelligent Contract) |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Wallet | MetaMask + genlayer-js SDK v0.23.1 |
| Network | GenLayer Studionet + Testnet Bradbury |
| Consensus | Optimistic Democracy with Partial Field Matching |

---

## 🔧 Contract Deployment (Optional)

If you want to deploy your own instance of the contract:

```bash
# 1. Install GenLayer CLI
npm install -g genlayer

# 2. Setup account
genlayer account create
genlayer account unlock

# 3. Deploy to Studionet (fast testing)
genlayer network set studionet
genlayer deploy --contract contracts/mabuuk.py
# → Copy the contract address from output

# 4. Deploy to Bradbury (production testnet)
genlayer network set testnet-bradbury
# Get GEN tokens first: https://testnet-faucet.genlayer.foundation/
genlayer deploy --contract contracts/mabuuk.py
# → Copy the contract address from output

# 5. Update contract addresses in src/lib/contracts.ts
# Set MABUUK_STUDIONET and/or MABUUK_BRADBURY to your new addresses

# 6. Run frontend
npm run dev
```

### Network Switching

The app supports both **Studionet** (fast testing) and **Bradbury** (production testnet). Toggle in `src/lib/contracts.ts`:

```typescript
// One line controls everything: chain, RPC, contract address, MetaMask network
const USE_NETWORK: "bradbury" | "studionet" = "studionet";
```

| `USE_NETWORK` | Chain | RPC | Contract |
|---------------|-------|-----|----------|
| `"studionet"` | GenLayer Studio (61999) | studio.genlayer.com/api | `0x58c020...0D4A` |
| `"bradbury"` | Bradbury Testnet (4221) | rpc-bradbury.genlayer.com | `0x2bFd2f...1f` |

---

## 📁 Project Structure

```
MABUUK-FRONTEND/
│
├── contracts/
│   └── mabuuk.py                  # GenLayer Intelligent Contract (Python)
│
├── src/
│   ├── app/
│   │   ├── globals.css            # Retro pixel art theme styles
│   │   ├── layout.tsx             # Root layout with WalletProvider
│   │   └── page.tsx               # Main page (connect or app)
│   │
│   ├── components/
│   │   ├── connect-wallet.tsx     # MetaMask connection screen
│   │   ├── mabuuk-app.tsx         # Core app: transfer, riddle, stats, docs
│   │   └── wallet-info.tsx        # Wallet address display
│   │
│   └── lib/
│       ├── contracts.ts           # Network config & contract addresses
│       └── wallet-provider.tsx    # Wallet context: read/write/connect
│
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## 🔄 User Flow

```
Connect MetaMask
       ↓
Enter Destination + Amount
       ↓
Click "Send Transfer"
       ↓
 Amount < 500? ─── YES ──→ ✅ APPROVED (instant, no riddle)
       │
      NO
       ↓
AI Generates Riddle (on-chain via Optimistic Democracy)
Transfer stored as PENDING
       ↓
User Answers Riddle
       ↓
Click "Submit Answer"
       ↓
  AI Validators Analyze ─── PASS ──→ ✅ APPROVED (sober)
       │
     FAIL
       ↓
❌ REJECTED — Wallet locked 4 hours — Funds saved
```

---

## 🌐 Deployed Contracts

| Network | Contract Address | Chain ID | Explorer |
|---------|-----------------|----------|----------|
| **Studionet** | `0x58c02062753344baE0bb40796AB25CDeAF5c0D4A` | `61999` | [studio.genlayer.com](https://studio.genlayer.com) |
| **Bradbury** | [`0x2bFd2f9B48Ef488B8e8D0b3aCFB1af64C1868e1f`](https://explorer-bradbury.genlayer.com/address/0x2bFd2f9B48Ef488B8e8D0b3aCFB1af64C1868e1f) | `4221` | [explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com) |

| | |
|---|---|
| **GenLayer RPC (Bradbury)** | `https://rpc-bradbury.genlayer.com` |
| **MetaMask RPC (Bradbury)** | `https://zksync-os-testnet-genlayer.zksync.dev` |
| **Faucet (Bradbury)** | [testnet-faucet.genlayer.foundation](https://testnet-faucet.genlayer.foundation/) |
| **Demo Video** | [YouTube](https://www.youtube.com/watch?v=hPYbPW6uoow) |

---

## 🐛 Troubleshooting

### Transaction stuck on "Submitting..."
Bradbury consensus takes 3-7 minutes — this is normal. Check the [Explorer](https://explorer-bradbury.genlayer.com) to see if your transaction is progressing. For faster testing, switch to Studionet (~10-30 seconds).

### MetaMask shows wrong network
Go to MetaMask → Settings → Networks → remove old GenLayer networks. Then reconnect through the app — it will auto-add the correct network based on `USE_NETWORK`.

### "503 Service Unavailable" error
Bradbury testnet may occasionally experience high load. Wait a minute and try again. The app has built-in retry logic (5 attempts with 4-second intervals).

### "Read failed" after transfer
The contract state read happens immediately after consensus. If the RPC is temporarily slow, the app retries automatically. Wait for the status to update.

### Switching networks doesn't work
1. Change `USE_NETWORK` in `src/lib/contracts.ts`
2. Restart dev server (`Ctrl+C` → `npm run dev`)
3. In MetaMask, manually switch to the correct network
4. Reconnect wallet if needed

---

## 🏆 Hackathon

**Track:** Agentic Economy Infrastructure — [GenLayer Bradbury Builders Hackathon](https://dorahacks.io/hackathon/genlayer-bradbury/detail)

| Requirement | Status |
|-------------|--------|
| Optimistic Democracy consensus | ✅ `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` |
| Equivalence Principle | ✅ Partial Field Matching (PASS/FAIL binary consensus) |
| Deployed on Bradbury Testnet | ✅ [`0x2bFd...1f`](https://explorer-bradbury.genlayer.com/address/0x2bFd2f9B48Ef488B8e8D0b3aCFB1af64C1868e1f) |
| Deployed on Studionet | ✅ `0x58c0...0D4A` |
| Frontend + MetaMask integration | ✅ Next.js 14 + genlayer-js SDK |
| GitHub repository | ✅ |
| Demo video | ✅ [YouTube](https://www.youtube.com/watch?v=hPYbPW6uoow) |

---

## 💡 Why "Mabuuk"?

**Mabuuk** (مابوك / mabuk) means **"drunk"** in Indonesian. The name captures exactly what this project protects you from — yourself, when you've had a few too many.

---

## 📄 License

MIT