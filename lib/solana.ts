import crypto from "node:crypto";
import { recipients } from "./demo-data";
import type { PayoutBatch, SettlementEntry, SolanaMode } from "./types";

const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

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
  const previewIds = lines.map((line) => signature(`${settlement.id}:${line.id}:${mode}`).slice(0, 24));
  const isMainnet = mode === "mainnet";

  return {
    id: `batch_${signature(settlement.id).slice(0, 12)}`,
    mode,
    network: isMainnet ? "mainnet-beta" : "devnet",
    sourceSettlementId: settlement.id,
    total: {
      amount: Number(lines.reduce((sum, line) => sum + line.amount.amount, 0).toFixed(2)),
      currency: settlement.amount.currency,
    },
    tokenMint: isMainnet ? MAINNET_USDC_MINT : DEVNET_USDC_MINT,
    executionStatus: "preview",
    costStatus: isMainnet ? "mainnet-requires-wallet" : "not-broadcast",
    previewIds,
    chainProofUrls: [],
    lines,
    createdAt: new Date().toISOString(),
    zeroDollar: !isMainnet,
  };
}
