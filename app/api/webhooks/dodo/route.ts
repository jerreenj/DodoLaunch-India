import { NextResponse } from "next/server";
import { createDemoDodoEvent, verifyDodoWebhook } from "../../../../lib/dodo";
import { settlementFromDodoEvent } from "../../../../lib/settlement";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const payload = rawBody ? JSON.parse(rawBody) : {};
  const signatureStatus = await verifyDodoWebhook(rawBody, request);
  const event = {
    ...createDemoDodoEvent(payload.checkout),
    signatureStatus,
  };

  return NextResponse.json({
    received: true,
    event,
    settlementEntry: settlementFromDodoEvent(event),
    message:
      signatureStatus === "verified"
        ? "Webhook signature verified and normalized into the revenue ledger."
        : "Demo sale webhook accepted and normalized into the revenue ledger.",
  });
}
