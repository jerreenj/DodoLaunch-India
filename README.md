# Solana Dodo India

Open-source hackathon project for the **Payments Track | Superteam India x Dodo Payments** at Solana Frontier.

## Concept

Solana Dodo India is a stablecoin settlement layer for Indian SaaS, AI, and creator businesses that already sell globally through Dodo Payments. The app helps merchants collect through Dodo, track revenue events, and prepare low-cost Solana stablecoin payouts for contractors, vendors, and remote teams.

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

## Planned MVP

- Merchant dashboard for Dodo payment events
- Checkout creation flow using Dodo Payments
- Webhook endpoint for payment and subscription events
- Contractor directory with wallet addresses and payout preferences
- Solana stablecoin payout batch builder
- Demo analytics comparing wire fees/time against Solana settlement
- Vercel deployment with environment-based demo mode

## Tech Stack

- Next.js App Router
- TypeScript
- Dodo Payments API / SDK
- Solana web3 tooling
- Vercel hosting

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

## Resources

- Dodo Payments docs: https://docs.dodopayments.com/
- Dodo API reference: https://docs.dodopayments.com/api-reference/introduction
- Solana docs: https://solana.com/docs
- Frontier Hackathon: https://www.colosseum.org/

