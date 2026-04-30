import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    network: process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    status: "prepared",
    message:
      "Next step: add wallet auth, USDC mint selection, simulation, and batch transfer submission.",
  });
}

