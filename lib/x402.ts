import crypto from "node:crypto";
import type { X402Event } from "./types";

export function paymentRequiredResponse() {
  return {
    status: 402,
    title: "Payment Required",
    accepts: [
      {
        scheme: "exact",
        network: "solana-mainnet-beta",
        amount: "2.40",
        currency: "USDG",
        resource: "/api/x402/agent-data",
      },
    ],
    zeroDollar: false,
    message: "x402 payment proof required before paid agent data is released.",
  };
}

export function createX402Event(): X402Event {
  const now = new Date().toISOString();
  const proof = crypto.createHash("sha256").update(`x402:${now}`).digest("hex");

  return {
    id: `x402_${proof.slice(0, 14)}`,
    source: "x402",
    type: "x402.payment.settled",
    buyer: "Autonomous support agent",
    resource: "Paid API call: support-agent answer pack",
    amount: { amount: 2.4, currency: "USDG" },
    proof,
    receivedAt: now,
  };
}
