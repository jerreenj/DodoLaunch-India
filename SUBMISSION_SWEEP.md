# Submission Sweep

Use this before sending the Superteam Earn and Colosseum submission.

## Product Proof

- Live app opens from the public Vercel URL.
- GitHub repo is public and up to date.
- README starts with live app, GitHub, Dodo, Solana, and stack badges.
- The app is presented as a product, not an internal checklist.
- Copy is honest about Dodo test/demo mode and Solana devnet-ready settlement.

## User Flow

- First-time user can understand what DodoLaunch does from the first screen.
- **Try without wallet** works for normal testers.
- **Create checkout** creates a Dodo checkout event.
- Sale webhook routes revenue into the ledger.
- Revenue split totals match the original sale amount.
- Settlement batch shows preview/devnet status without fake mainnet claims.
- x402 demo shows HTTP 402 first, then successful paid access after proof.
- CSV export downloads a split report.

## Technical Checks

- `npm run typecheck`
- `npm run build`
- Live Vercel smoke test
- API smoke test for checkout, webhook, Solana payout preview, and x402
- Git status clean after commits
- GitHub push complete

## Submission Package

- GitHub URL
- Vercel URL
- Two-minute walkthrough video
- Product description
- Screenshots
- Pilot feedback link
- Honest note: no mainnet, no real payment volume claim, no paid services used to build

## Last Mile

1. Send to 20 testers first.
2. Fix only blockers.
3. Send to 200 users.
4. Submit once the video, links, and feedback note are ready.
