# DodoLaunch India

Open-source hackathon project for the **Payments Track | Superteam India x Dodo Payments** at Solana Frontier.

**DodoLaunch India helps Indian AI and SaaS builders launch paid products with Dodo Payments, then split revenue to founders, affiliates, vendors, agents, and the platform through Solana-ready settlement batches.**

The build path costs **$0** by using free test/demo tooling, devnet/simulation, browser state, GitHub, and Vercel free tier. The product itself is designed to create real revenue after launch.

## Product

DodoLaunch is a paid-product launchpad for Indian micro-SaaS and AI builders.

Builders can package an AI tool, API, credit pack, template, or SaaS subscription, create a Dodo-powered checkout, track sales, and automatically calculate revenue splits for everyone involved in the sale.

The first prototype focuses on this workflow:

1. A founder launches a paid AI/SaaS product using a Dodo checkout.
2. Dodo sale webhooks update the revenue ledger.
3. Split rules calculate founder revenue, affiliate commissions, vendor/API costs, agent/runtime fees, and the DodoLaunch platform fee.
4. The app prepares Solana stablecoin settlement batches and proof links for those splits.
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
- Solana devnet/simulate settlement batch builder with proof links.
- x402-style HTTP 402 demo for paid agent/API access.
- First-time user guide inside the app.
- Default **Try without wallet** mode for early users.
- Wallet tester instructions for getting devnet SOL from the official faucet.
- GitHub Issues feedback CTA before scaling from 20 to 200 users.
- Clear devnet-only/no-mainnet/no-paid-services labels.
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
- The default settlement path is Solana simulation/devnet proof links.

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

## Pilot Rollout

1. Send the Vercel link to the first 20 users.
2. Ask them to use **Try without wallet** first.
3. Collect feedback through GitHub Issues.
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
