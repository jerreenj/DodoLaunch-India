# Mainnet Operator Checklist

Use this checklist before approving any real settlement from DodoLaunch India.

## Wallet

- Use Phantom or another Solana wallet that supports transaction signing in the browser.
- Connect only the wallet that owns the source USDC token account.
- Keep enough SOL in the wallet for transaction fees.
- Keep enough mainnet USDC in the source token account for the full payout batch.

## Dodo

- Add `DODO_PAYMENTS_API_KEY` only in Vercel environment variables.
- Set `DODO_PAYMENTS_ENVIRONMENT=live_mode` only when the product is ready for live payments.
- Add `DODO_PRODUCT_ID` for the live product that buyers should purchase.
- Add `DODO_PAYMENTS_WEBHOOK_SECRET` before accepting production webhooks.

## Settlement

- Create or select the revenue ledger entry first.
- Prepare the mainnet payout batch from the selected ledger entry.
- Review every recipient wallet before approving the transaction.
- Approve only if the total amount, token mint, and recipients are correct.
- Treat Solscan proof as real only after a wallet-approved transaction signature exists.

## Reality Boundary

- The app never stores private keys.
- The app never broadcasts without wallet approval.
- The app never shows fake Solscan links.
- The app should not claim real payment volume unless a real Dodo payment and transaction proof exist.
