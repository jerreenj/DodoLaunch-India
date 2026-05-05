<div align="center">

# DodoLaunch India

### Launch paid AI products with Dodo. Route revenue splits with mainnet-ready Solana settlement.

<p>
  <a href="https://dodolaunch-india.vercel.app"><img alt="Live app" src="https://img.shields.io/badge/LIVE_APP-DODOLAUNCH-111111?style=for-the-badge&logo=vercel&logoColor=white"></a>
  <a href="https://github.com/jerreenj/DodoLaunch-India"><img alt="GitHub" src="https://img.shields.io/badge/GITHUB-DodoLaunch--India-24292f?style=for-the-badge&logo=github&logoColor=white"></a>
  <a href="https://docs.dodopayments.com/"><img alt="Dodo Payments" src="https://img.shields.io/badge/DODO-PAYMENTS-7c3aed?style=for-the-badge"></a>
</p>

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App_Router-black?style=flat-square&logo=nextdotjs">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-v3-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="Dodo Payments" src="https://img.shields.io/badge/Dodo-live%2Ftest-f97316?style=flat-square">
  <img alt="Solana" src="https://img.shields.io/badge/Solana-mainnet--ready-14f195?style=flat-square&logo=solana&logoColor=111111">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-white?style=flat-square">
</p>

</div>

---

**DodoLaunch India** is an open-source hackathon product for the **Payments Track | Superteam India x Dodo Payments** at Solana Frontier.

It helps Indian AI and SaaS builders package a paid product, launch checkout with Dodo Payments, track every sale, calculate revenue splits, and prepare mainnet-ready Solana settlement batches for founders, affiliates, vendors, agents, and platform fees.

The product runs without secrets in sandbox mode, and becomes production-ready when Dodo live credentials and a wallet-approved mainnet settlement path are configured.

## Live Links

- **Live app:** https://dodolaunch-india.vercel.app
- **GitHub repo:** https://github.com/jerreenj/DodoLaunch-India
- **Pilot feedback:** https://github.com/jerreenj/DodoLaunch-India/issues/1
- **Hackathon track:** Payments Track | Superteam India x Dodo Payments

## Submission Status

| Area | Status |
| --- | --- |
| App | Live on Vercel |
| Checkout | Dodo live mode when live keys exist, test mode for staging, sandbox mode when keys are blank |
| Webhooks | Sandbox mode accepts local test events; production secret mode rejects missing or invalid signatures |
| Ledger | Working browser-local revenue ledger |
| Splits | Founder, affiliate, vendor, agent/runtime, and platform fee split model |
| Settlement | Connected-wallet path prepares, signs, and broadcasts mainnet USDC batches |
| x402 | Working HTTP 402 demo route for paid agent/API access |
| Cost to build | No paid hosting, no paid database, no paid RPC, no paid AI API |

## Product

DodoLaunch is a paid-product launchpad for Indian micro-SaaS and AI builders.

Builders can package an AI tool, API, credit pack, template, or SaaS subscription, create a Dodo-powered checkout, track sales, and automatically calculate revenue splits for everyone involved in the sale.

The first prototype focuses on this workflow:

1. A founder launches a paid AI/SaaS product using a Dodo checkout.
2. Dodo sale webhooks update the revenue ledger.
3. Split rules calculate founder revenue, affiliate commissions, vendor/API costs, agent/runtime fees, and the DodoLaunch platform fee.
4. The app prepares Solana stablecoin settlement previews for those splits; explorer links should only be shown after real mainnet broadcast.
5. x402 demonstrates paid API access for agentic buyers.

## Why This Is Useful

- **For founders:** ship paid products faster without building billing, affiliate splits, or revenue operations from scratch.
- **For Dodo Payments:** brings new SaaS/AI merchants, checkout sessions, subscriptions, credit packs, and payment volume into Dodo.
- **For us:** DodoLaunch can earn a platform fee on successful product revenue, shown in the demo split model.
- **For Solana:** stablecoins become the programmable settlement layer for affiliates, vendors, API providers, and global collaborators.

## Implemented Demo

- Interactive launch dashboard for a paid AI product.
- Founder workspace to configure product, buyer, launch note, and amount.
- Dodo checkout route with live, test, and sandbox modes.
- Dodo sale webhook route that normalizes events into a revenue ledger.
- Revenue split model for founder, affiliate, vendor, agent/runtime, and platform fee.
- Browser-generated CSV export for revenue split reports.
- Solana mainnet USDC settlement batch preview with wallet approval and no fake explorer links.
- x402-style HTTP 402 demo for paid agent/API access.
- First-time user guide inside the app.
- Real Phantom/Solana browser wallet connect for mainnet settlement operators.
- Real wallet-signed mainnet USDC transaction builder and broadcaster.
- Section-by-section product console for launch, checkout, ledger, settlement, and agent payments.
- Mainnet wallet readiness instructions for SOL fees and USDC payouts.
- GitHub Issues feedback CTA before scaling from 20 to 200 users.
- Clear mainnet-ready labels with no fake broadcast claims.
- Browser-local demo state with no hosted database.
- Vercel free-tier deployment path with no required secrets.

See the full hackathon plan: [HACKATHON_WIN_PLAN.md](./HACKATHON_WIN_PLAN.md).
Use the final checklist before submission: [SUBMISSION_SWEEP.md](./SUBMISSION_SWEEP.md).

## Judge Demo Script

1. Open the live app.
2. Connect a Phantom/Solana wallet from the top-right action.
3. Click **Create checkout** to generate a Dodo checkout event.
4. Replay the sale webhook to route the paid event into the ledger.
5. Build the revenue split to see the settlement batch and platform fee.
6. Approve the mainnet transfer flow from the settlement section when the wallet is funded.
7. Run the x402 agent/API sale to show autonomous paid access.
8. Export the CSV split report.

The product does not fake mainnet volume during judging. It shows a working product flow with honest Dodo live/test/sandbox modes and mainnet-ready Solana settlement boundaries.

## Tech Stack

- Next.js App Router
- TypeScript
- Dodo Payments TypeScript SDK
- Solana mainnet-ready payout preview / browser wallet connect
- x402-style HTTP 402 demo route
- Vercel free-tier hosting

## Production Configuration

The app can be opened without secrets in sandbox mode, then moved to production by configuring live credentials:

- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_ENVIRONMENT=live_mode`
- `DODO_PAYMENTS_WEBHOOK_SECRET`
- `DODO_PRODUCT_ID`
- `DODO_RETURN_URL=https://dodolaunch-india.vercel.app`
- `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
- `NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`

No private keys are committed. Mainnet settlement still requires a connected wallet to approve any real transfer.

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

Leaving Dodo values blank is valid and keeps the app in sandbox mode.

## Demo Flow

1. Click **Create Paid Product**.
2. Click **Replay Sale Webhook** to create a Dodo revenue event.
3. Click **Build Revenue Split** to generate the Solana settlement batch.
4. Click **Run x402 API Sale** to show paid API access for agentic buyers.
5. Edit the product details in **Founder workspace** and export the split report CSV.
6. Connect Phantom for mainnet settlement readiness and approval.

## Reality Check

- Live today: product setup, Dodo sandbox/test/live checkout route, ledger, split CSV, wallet connect, and x402-style HTTP 402 flow.
- Real when configured: Dodo live checkout uses `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_ENVIRONMENT=live_mode`, and `DODO_PRODUCT_ID`.
- Mainnet-ready: Solana settlement prepares mainnet batches and can request wallet approval for a real USDC transfer.
- Not claimed: completed mainnet broadcast, real payment volume, or production custody unless a real signature/payment is shown.

## Pilot Rollout

1. Send the Vercel link to the first 20 users.
2. Ask wallet testers to use Phantom in a wallet-enabled browser.
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
