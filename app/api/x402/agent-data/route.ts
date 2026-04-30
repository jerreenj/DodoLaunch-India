import { NextResponse } from "next/server";
import { createX402Event, paymentRequiredResponse } from "../../../../lib/x402";
import { settlementFromX402Event } from "../../../../lib/settlement";

export async function GET(request: Request) {
  const paid = request.headers.get("x-payment") === "demo-paid";

  if (!paid) {
    return NextResponse.json(paymentRequiredResponse(), {
      status: 402,
      headers: {
        "x-payment-required": "demo",
      },
    });
  }

  const event = createX402Event();

  return NextResponse.json({
    event,
    settlementEntry: settlementFromX402Event(event),
    data: {
      signal: "South-east Asia support vendors are cheapest for night-shift coverage.",
      confidence: "demo",
    },
    message: "Demo x402 API sale accepted and routed into the revenue ledger.",
  });
}
