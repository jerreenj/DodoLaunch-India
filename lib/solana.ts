import crypto from "node:crypto";
import { recipients } from "./demo-data";
import type { PayoutBatch, SettlementEntry, SolanaMode } from "./types";

const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

function signature(seed: string) {
  const chars = crypto.createHash("sha256").update(seed).digest("base64url").replace(/_/g, "x");
  return `${chars}${chars}`.slice(0, 88);
}

export function createPayoutBatch(
  settlement: SettlementEntry,
  mode: SolanaMode = "simulate",
): PayoutBatch {
  const lines = recipients.map((recipient) => ({
    ...recipient,
    amount: {
      amount: Number(((settlement.amount.amount * recipient.splitBps) / 10000).toFixed(2)),
      currency: settlement.amount.currency,
    },
    status: "ready" as const,
  }));
  const signatures = lines.map((line) => signature(`${settlement.id}:${line.id}:${mode}`));

  return {
    id: `batch_${signature(settlement.id).slice(0, 12)}`,
    mode,
    network: "devnet",
    sourceSettlementId: settlement.id,
    total: {
      amount: Number(lines.reduce((sum, line) => sum + line.amount.amount, 0).toFixed(2)),
      currency: settlement.amount.currency,
    },
    tokenMint: DEVNET_USDC_MINT,
    feeEstimateUsd: mode === "devnet" ? 0.0005 : 0,
    bankWireEstimateUsd: lines.length * 25,
    eta: "seconds",
    signatures,
    explorerUrls: signatures.map((sig) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`),
    lines,
    createdAt: new Date().toISOString(),
    zeroDollar: true,
  };
}

