# Submission Sweep

Use this before sending the Superteam Earn and Colosseum submission.

## Product Proof

- Live app opens from the public Vercel URL.
- GitHub repo is public and up to date.
- README starts with live app, GitHub, Dodo, Solana, and stack badges.
- The app is presented as a product, not an internal checklist.
- Copy is honest about Dodo test/demo mode and Solana devnet-ready settlement.
- Webhook route rejects missing or invalid signatures when a Dodo webhook secret is configured.

## User Flow

- First-time user can understand what DodoLaunch does from the first screen.
- **Try without wallet** works for normal testers.
- **Connect wallet** detects Phantom/Solana wallet providers for devnet testers.
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

## Latest Local Sweep

Date: 2026-05-04

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |
| Local production home page | 200 OK |
| Dodo checkout route | Passed in demo mode |
| Dodo webhook route | Passed and returned `received: true` |
| Invalid webhook JSON | Passed with `400` |
| Missing webhook signature with secret | Passed with `401` |
| Solana payout route | Passed in `devnet` mode |
| Wallet connect UI | Added Phantom/Solana injected wallet connect path |
| Production webhook guard | Added invalid JSON and bad signature rejection |
| x402 unpaid route | Passed with `402` |
| x402 paid route | Passed and returned an event |

## Submission Package

- GitHub URL
- Vercel URL
- Two-minute walkthrough video
- Product description
- Screenshots
- Pilot feedback link: https://github.com/jerreenj/DodoLaunch-India/issues/1
- Honest note: no mainnet, no real payment volume claim, no paid services used to build

## Last Mile

1. Send to 20 testers first.
2. Fix only blockers.
3. Send to 200 users.
4. Submit once the video, links, and feedback note are ready.
