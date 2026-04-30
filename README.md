# DodoSettle India

Open-source hackathon project for the **Payments Track | Superteam India x Dodo Payments** at Solana Frontier.

**DodoSettle India turns Dodo Payments revenue into programmable Solana stablecoin payout batches for Indian SaaS and AI founders. The hackathon build path costs $0 by using free test/demo tooling, devnet/simulation, browser state, GitHub, and Vercel free tier.**

## Concept

DodoSettle India is a stablecoin settlement layer for Indian SaaS, AI, and creator businesses that already sell globally through Dodo Payments. The app helps merchants collect through Dodo, track revenue events, and prepare low-cost Solana stablecoin payouts for contractors, vendors, affiliates, and AI agents.

The first prototype focuses on a simple workflow:

1. A merchant creates a Dodo-powered checkout or payment link for a customer.
2. Dodo webhooks update the merchant's receivables dashboard.
3. The merchant builds a payout batch for global contractors.
4. The app prepares Solana stablecoin transfers and shows speed/cost savings against bank wires.

## Why This Fits The Track

- **Dodo Payments:** checkout, payment links, subscriptions, and webhook events are the merchant-facing payment layer.
- **Solana stablecoins:** fast settlement and programmable payout batches for cross-border business payments.
- **India focus:** built for Indian SaaS and AI founders who sell globally but still face slow, expensive, manual payout operations.
- **Defined user:** founders and finance operators managing invoices, contractor payments, and treasury movement.

## Implemented Demo

- Interactive operator dashboard for Dodo payment events.
- Dodo checkout route with free test mode or built-in demo mode.
- Webhook endpoint that normalizes payment events into a settlement ledger.
- Contractor/vendor/affiliate/agent directory with split rules.
- Solana devnet/simulate payout batch builder with proof links.
- Demo analytics comparing bank wire fees/time against Solana settlement.
- x402-style HTTP 402 demo for agent/API payments.
- Browser-local demo state with no hosted database.
- Vercel free-tier deployment path with no required secrets.

See the full hackathon plan: [HACKATHON_WIN_PLAN.md](./HACKATHON_WIN_PLAN.md).

## Tech Stack

- Next.js App Router
- TypeScript
- Dodo Payments TypeScript SDK
- Solana devnet / simulation
- x402-style HTTP 402 demo route
- Vercel free-tier hosting

## Free Build Path

The hackathon version runs without spending any money:

- No Dodo credentials are required for demo mode.
- No mainnet SOL, USDC, or paid RPC is used.
- No hosted database is required; demo state is stored in the browser.
- Optional real test credentials live only in `.env.local`.
- The default payout path is Solana simulation/devnet proof links.

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` when wiring real integrations.

```bash
cp .env.example .env.local
```

Leaving the values blank is valid and keeps the app in free demo mode.

## Demo Flow

1. Click **Create Dodo Checkout**.
2. Click **Replay Webhook** to create a settlement ledger entry.
3. Click **Prepare Payout Batch** to generate Solana devnet-style payout proof.
4. Click **Run x402 Demo** to show the HTTP 402 agent payment path.

## Submission Checklist

- GitHub repo is public.
- Vercel deployment uses the free tier.
- Demo runs with empty `.env.local`.
- Build passes with `npm run build`.
- No secrets, tokens, private keys, or paid API keys are committed.
- Demo video shows Dodo checkout, webhook, ledger, payout batch, and x402 bonus.

## Resources

- Dodo Payments docs: https://docs.dodopayments.com/
- Dodo API reference: https://docs.dodopayments.com/api-reference/introduction
- Solana docs: https://solana.com/docs
- x402 docs: https://docs.x402.org/
- Frontier Hackathon: https://www.colosseum.org/
