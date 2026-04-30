import { NextResponse } from "next/server";
import { initialSettlement } from "../../../../lib/demo-data";
import { createPayoutBatch } from "../../../../lib/solana";
import type { SettlementEntry, SolanaMode } from "../../../../lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const settlement = (body.settlement ?? initialSettlement) as SettlementEntry;
  const mode = (body.mode ?? "simulate") as SolanaMode;
  const batch = createPayoutBatch(settlement, mode === "devnet" ? "devnet" : "simulate");

  return NextResponse.json({
    batch,
    message:
      batch.mode === "simulate"
        ? "Zero-dollar Solana payout simulation prepared. No wallet funding required."
        : "Devnet payout batch prepared. Use only free devnet tokens.",
  });
}
