# Niche Trust Platform

Parallel marketplace for prediction traders and experts — Polymarket-style categories, multi-chain wallet trust, Solana Memo attestation, verified subscriber reviews.

## Architecture (important)

| Layer | Network | Purpose |
|-------|---------|---------|
| **Trading trust** | Polygon (primary), Ethereum, Arbitrum, Base, Optimism, BNB, Solana | Sync & analyze txs **on the same chain** where activity happened |
| **Prediction proof** | Solana Memo only | Cheap/fast SHA-256 hash attestation — **not** used to score Polygon trades |

Polymarket collateral lives on **Polygon (pUSD)**. Link your Polygon wallet for trading history. Bridge deposit chains are supported for wallet linking and payments.

## Quick start

```powershell
cd "d:\New folder\New Folder\New folder\niche-trust-platform"
pnpm docker:up
copy .env.example .env
# Add ETHERSCAN_API_KEY from https://etherscan.io/apidashboard
pnpm db:push
pnpm dev
```

## Features

- **Multiple wallets** per account (`/api/wallets`, dashboard wallet manager)
- **11 market categories** like Polymarket (`/markets`)
- **1–5 star reviews** — only paying subscribers (`/api/groups/[id]/reviews`)
- **English UI** throughout
- Matrix E2EE groups (optional)

## Env

| Variable | Required for |
|----------|----------------|
| `ETHERSCAN_API_KEY` | EVM wallet sync + payment verification |
| `MEMO_SIGNER_SECRET` | Solana prediction hash writes |
| `MATRIX_ADMIN_TOKEN` | Encrypted group chat |

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server |
| `pnpm test` | Vitest |
| `pnpm worker` | Background wallet sync |
