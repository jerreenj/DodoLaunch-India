<div align="center">

# DodoLaunch India

### Launch paid AI products with Dodo. Route revenue splits with Solana-ready settlement.

<p>
  <a href="https://dodolaunch-india.vercel.app"><img alt="Live app" src="https://img.shields.io/badge/LIVE_APP-DODOLAUNCH-111111?style=for-the-badge&logo=vercel&logoColor=white"></a>
  <a href="https://github.com/jerreenj/DodoLaunch-India"><img alt="GitHub" src="https://img.shields.io/badge/GITHUB-DodoLaunch--India-24292f?style=for-the-badge&logo=github&logoColor=white"></a>
  <a href="https://docs.dodopayments.com/"><img alt="Dodo Payments" src="https://img.shields.io/badge/DODO-PAYMENTS-7c3aed?style=for-the-badge"></a>
</p>

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App_Router-black?style=flat-square&logo=nextdotjs">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-v3-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="Dodo Payments" src="https://img.shields.io/badge/Dodo-test%2Fdemo-f97316?style=flat-square">
  <img alt="Solana" src="https://img.shields.io/badge/Solana-devnet-14f195?style=flat-square&logo=solana&logoColor=111111">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-white?style=flat-square">
</p>

</div>

---

**DodoLaunch India** is an open-source hackathon product for the **Payments Track | Superteam India x Dodo Payments** at Solana Frontier.

It helps Indian AI and SaaS builders package a paid product, launch checkout with Dodo Payments, track every sale, calculate revenue splits, and prepare Solana-ready settlement batches for founders, affiliates, vendors, agents, and platform fees.

The hackathon build path costs **$0** by using Dodo test/demo mode, Solana devnet or payout preview mode, browser state, GitHub, and Vercel free tier. The product itself is designed to create real revenue after launch.

## Live Links

- **Live app:** https://dodolaunch-india.vercel.app
- **GitHub repo:** https://github.com/jerreenj/DodoLaunch-India
- **Pilot feedback:** https://github.com/jerreenj/DodoLaunch-India/issues/1
- **Hackathon track:** Payments Track | Superteam India x Dodo Payments

## Submission Status

| Area | Status |
| --- | --- |
| App | Live on Vercel |
| Checkout | Dodo test mode when keys exist, built-in demo mode when keys are blank |
| Webhooks | Demo mode accepts local test events; production secret mode rejects missing or invalid signatures |
| Ledger | Working browser-local revenue ledger |
| Splits | Founder, affiliate, vendor, agent/runtime, and platform fee split model |
| Settlement | Solana simulate mode by default; connected-wallet path prepares devnet batches |
| x402 | Working HTTP 402 demo route for paid agent/API access |
| Cost to build | No paid hosting, no paid database, no paid RPC, no paid AI API |

## Product

DodoLaunch is a paid-product launchpad for Indian micro-SaaS and AI builders.

Builders can package an AI tool, API, credit pack, template, or SaaS subscription, create a Dodo-powered checkout, track sales, and automatically calculate revenue splits for everyone involved in the sale.

The first prototype focuses on this workflow:

1. A founder launches a paid AI/SaaS product using a Dodo checkout.
2. Dodo sale webhooks update the revenue ledger.
3. Split rules calculate founder revenue, affiliate commissions, vendor/API costs, agent/runtime fees, and the DodoLaunch platform fee.
4. The app prepares Solana stablecoin settlement previews for those splits; explorer links should only be shown after real devnet broadcast.
5. x402 demonstrates paid API access for agentic buyers.

## Why This Is Useful

- **For founders:** ship paid products faster without building billing, affiliate splits, or revenue operations from scratch.
- **For Dodo Payments:** brings new SaaS/AI merchants, checkout sessions, subscriptions, credit packs, and payment volume into Dodo.
- **For us:** DodoLaunch can earn a platform fee on successful product revenue, shown in the demo split model.
- **For Solana:** stablecoins become the programmable settlement layer for affiliates, vendors, API providers, and global collaborators.

## Implemented Demo

- Interactive launch dashboard for a paid AI product.
- Founder workspace to configure product, buyer, launch note, and amount.
- Dodo checkout route with free test mode or built-in demo mode.
- Dodo sale webhook route that normalizes events into a revenue ledger.
- Revenue split model for founder, affiliate, vendor, agent/runtime, and platform fee.
- Browser-generated CSV export for revenue split reports.
- Solana simulate/devnet settlement batch preview with no fake explorer links.
- x402-style HTTP 402 demo for paid agent/API access.
- First-time user guide inside the app.
- Default **Try without wallet** mode for early users.
- Real Phantom/Solana browser wallet connect for devnet testers.
- Wallet tester instructions for getting devnet SOL from the official faucet.
- GitHub Issues feedback CTA before scaling from 20 to 200 users.
- Clear devnet-only/no-mainnet/no-paid-services labels.
- Browser-local demo state with no hosted database.
- Vercel free-tier deployment path with no required secrets.

See the full hackathon plan: [HACKATHON_WIN_PLAN.md](./HACKATHON_WIN_PLAN.md).
Use the final checklist before submission: [SUBMISSION_SWEEP.md](./SUBMISSION_SWEEP.md).

## Judge Demo Script

1. Open the live app.
2. Keep **Try without wallet** selected.
3. Click **Create checkout** to generate a Dodo checkout event.
4. Replay the sale webhook to route the paid event into the ledger.
5. Build the revenue split to see the settlement batch and platform fee.
6. Run the x402 agent/API sale to show autonomous paid access.
7. Export the CSV split report.

The product does not claim real mainnet volume during judging. It shows a real working product flow with honest Dodo test/demo and Solana devnet-ready settlement boundaries.

## Tech Stack

- Next.js App Router
- TypeScript
- Dodo Payments TypeScript SDK
- Solana devnet / payout preview mode / browser wallet connect
- x402-style HTTP 402 demo route
- Vercel free-tier hosting

## Free Build Path

The hackathon version runs without spending any money:

- No Dodo credentials are required for demo mode.
- No mainnet SOL, USDC, or paid RPC is used.
- No hosted database is required; demo state is stored in the browser.
- Optional real test credentials live only in `.env.local`.
- The default settlement path is Solana payout preview mode; connected wallets can prepare devnet batches, and no chain proof is claimed until a real devnet transaction is broadcast.

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

1. Click **Create Paid Product**.
2. Click **Replay Sale Webhook** to create a Dodo revenue event.
3. Click **Build Revenue Split** to generate the Solana settlement batch.
4. Click **Run x402 API Sale** to show paid API access for agentic buyers.
5. Edit the product details in **Founder workspace** and export the split report CSV.
6. Keep **Try without wallet** selected for normal testers, or use **Wallet tester** for devnet setup instructions.

## Reality Check

- Live today: product setup, Dodo demo/test checkout route, ledger, split CSV, and x402-style HTTP 402 flow.
- Real when configured: Dodo test checkout uses `DODO_PAYMENTS_API_KEY` and `DODO_PRODUCT_ID`.
- Preview/devnet-ready: Solana settlement does not claim a broadcast transaction until a real devnet signature exists.
- Not claimed: mainnet, real funds, real payment volume, paid infrastructure, or production custody.

## Pilot Rollout

1. Send the Vercel link to the first 20 users.
2. Ask them to use **Try without wallet** first.
3. Collect feedback through [GitHub issue #1](https://github.com/jerreenj/DodoLaunch-India/issues/1).
4. Fix confusing copy, broken flows, and mobile layout issues.
5. Send to the next 200 users after the first feedback pass.

## Submission Checklist

- GitHub repo is public.
- Vercel deployment uses the free tier.
- Demo runs with empty `.env.local`.
- Build passes with `npm run build`.
- No secrets, tokens, private keys, or paid API keys are committed.
- Demo video shows Dodo checkout, sale webhook, revenue ledger, split batch, platform fee, and x402 API sale.

## Resources

- Dodo Payments docs: https://docs.dodopayments.com/
- Dodo API reference: https://docs.dodopayments.com/api-reference/introduction
- Solana docs: https://solana.com/docs
- x402 docs: https://docs.x402.org/
- Frontier Hackathon: https://www.colosseum.org/
