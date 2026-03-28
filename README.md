# Mabuuk — AI Drunk Transfer Protection

> Don't let drunk-you ruin sober-you's portfolio.

**Mabuuk** is an AI-powered sobriety verification layer for crypto transfers, built on GenLayer Bradbury Testnet. Before approving high-value transactions, the contract generates a logical riddle and uses AI validators to analyze your answer. If you sound drunk, panicked, or impaired — the transaction gets blocked and your wallet is locked for 4 hours.

No more waking up to regret.

---

## The Problem

Crypto transactions are irreversible. One drunk transfer, one panic sell at 3 AM, and your portfolio takes a hit you can't undo. Traditional wallets have zero protection against impaired decision-making — there's no "Are you sure you're sober?" button.

## The Solution

Mabuuk acts as an AI bodyguard for your wallet:

1. **You initiate a transfer** — if the amount is below the risk threshold, it goes through instantly
2. **High-value transfer?** — the contract generates a logical riddle via AI
3. **You answer the riddle** — AI validators analyze your response for signs of impairment
4. **PASS** → transfer approved, you're verified sober
5. **FAIL** → transfer blocked, wallet locked for 4 hours, funds saved

The AI doesn't just check if the answer is correct — it analyzes whether the response shows signs of drunk typing, gibberish, panic, or incoherent reasoning.

---

## How It Works

### Architecture

```
User (Frontend) → MetaMask → GenLayer RPC → Mabuuk Contract → AI Validators
                                                  ↓
                                          Riddle Generation (LLM)
                                          Sobriety Analysis (LLM)
                                          Auto-Lock Mechanism
                                          Per-Wallet Stats Tracking
```

### Core Features

- **AI Riddle Generation** — contract generates a fresh logical riddle via `gl.nondet.exec_prompt()` for each verification
- **Sobriety Verification** — AI analyzes the user's answer for signs of impairment (gibberish, panic typing, clearly wrong logic)
- **Auto-Lock Mechanism** — failed verification triggers a 4-hour wallet lock with reason tracking
- **Per-Wallet Statistics** — tracks total attempts, passes, rejections, and total funds saved per address
- **Risk Threshold** — low-value transfers (< 500 tokens) bypass AI checks entirely
- **Address Normalization** — all addresses stored in lowercase to prevent wallet mismatch bugs

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

## GenLayer Integration

### Optimistic Democracy Consensus

Mabuuk uses `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` for both riddle generation and sobriety verification:

- **Leader node** generates the result (riddle text or PASS/FAIL decision)
- **Validator nodes** independently verify the leader's output

### Equivalence Principle

**Pattern: Partial Field Matching** — for sobriety checks, validators compare only the final `PASS`/`FAIL` status (not the full LLM reasoning), ensuring consensus on the binary outcome while allowing variation in analysis.

### GenLayer Patterns Used

- `gl.nondet.exec_prompt()` for free-text LLM outputs (riddle generation)
- Binary PASS/FAIL extraction for strict consensus matching
- `TreeMap[str, ...]` for per-wallet persistent storage
- Address normalization (`.lower()`) for consistent key mapping
- Dependency header: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`

---

## Tech Stack

- **Smart Contract** — Python (GenLayer Intelligent Contract)
- **Frontend** — Next.js + TypeScript + Tailwind CSS
- **Wallet** — MetaMask
- **SDK** — `genlayer-js`

---

## Deploy & Run

```bash
# Install GenLayer CLI
npm install -g genlayer

# Setup account
genlayer account import --private-key=0xYOUR_KEY
genlayer account unlock
genlayer network testnet-bradbury

# Get testnet GEN tokens
# https://testnet-faucet.genlayer.foundation/

# Deploy the contract
cd mabuuk-frontend
npm install
genlayer deploy --contract contracts/mabuuk.py

# Set your deployed contract address in contracts.ts
MABUUK: "Your Address" as `0x${string}`

# Run the frontend
npm run dev
```

---

## Project Structure

```
MABUUK-FRONTEND/
├── contracts/
│   └── mabuuk.py                # GenLayer Intelligent Contract
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Main page
│   ├── components/
│   │   ├── connect-wallet.tsx   # MetaMask wallet connection
│   │   ├── mabuuk-app.tsx       # Core app logic & UI
│   │   └── wallet-info.tsx      # Wallet stats display
│   └── lib/
│       ├── contracts.ts         # Contract address & ABI config
│       └── wallet-provider.tsx  # Wallet context provider
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## User Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Connect     │────→│  Enter       │────→│  Amount < 500?  │
│  MetaMask    │     │  Transfer    │     │  (Risk Check)   │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                          ┌────────┴────────┐
                                          │                 │
                                        YES               NO
                                          │                 │
                                          ▼                 ▼
                                   ┌──────────┐    ┌──────────────┐
                                   │ APPROVED │    │ AI Generates │
                                   │ Instant  │    │ Riddle       │
                                   └──────────┘    └──────┬───────┘
                                                          │
                                                          ▼
                                                   ┌──────────────┐
                                                   │ User Answers │
                                                   │ the Riddle   │
                                                   └──────┬───────┘
                                                          │
                                                 ┌────────┴────────┐
                                                 │                 │
                                               PASS              FAIL
                                                 │                 │
                                                 ▼                 ▼
                                          ┌──────────┐    ┌──────────────┐
                                          │ APPROVED │    │ REJECTED     │
                                          │ Sober ✓  │    │ Wallet locked│
                                          └──────────┘    │ 4 hours      │
                                                          └──────────────┘
```

---

## Live Deployment

The contract is deployed and active on GenLayer Testnet Bradbury.

**Deployer Wallet:** [`0x8E9F8ACE98dC84159F143ba00C934fAafE3D9bA8`](https://explorer-bradbury.genlayer.com/address/0x8E9F8ACE98dC84159F143ba00C934fAafE3D9bA8)

View all deployment transactions and contract interactions on the Bradbury Explorer.

---

## Network Details

| Parameter | Value |
|-----------|-------|
| Network | GenLayer Testnet Bradbury |
| Chain ID | `4221` |
| RPC | `zksync-os-testnet-genlayer.zksync.dev` |
| Explorer | [explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com) |
| Faucet | [testnet-faucet.genlayer.foundation](https://testnet-faucet.genlayer.foundation/) |

---

## Hackathon Submission

**Track:** GenLayer Bradbury Builders Hackathon (DoraHacks)

**Requirements Met:**
- ✅ Optimistic Democracy consensus via `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`
- ✅ Equivalence Principle — Partial Field Matching pattern (compare `PASS`/`FAIL` status only)
- ✅ Deployed on GenLayer Testnet Bradbury
- ✅ Frontend with MetaMask wallet integration
- ✅ GitHub repository with source code
- ✅ Demo video

---

## Why "Mabuuk"?

"Mabuuk" (مابوك / mabuk) means "drunk" in Malay/Indonesian. The name captures exactly what this project protects you from — yourself, when you've had a few too many.

---

## License

MIT