import { NextResponse } from "next/server";
import { createDemoDodoEvent, verifyDodoWebhook } from "../../../../lib/dodo";
import { settlementFromDodoEvent } from "../../../../lib/settlement";

export async function POST(request: Request) {
  const rawBody = await request.text();
  let payload: { checkout?: Parameters<typeof createDemoDodoEvent>[0] } = {};

  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json(
      {
        received: false,
        message: "Invalid JSON webhook payload.",
      },
      { status: 400 },
    );
  }

  const signatureStatus = await verifyDodoWebhook(rawBody, request);

  if (signatureStatus === "missing-secret" || signatureStatus === "invalid") {
    return NextResponse.json(
      {
        received: false,
        signatureStatus,
        message: "Dodo webhook signature is missing or invalid.",
      },
      { status: 401 },
    );
  }

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
