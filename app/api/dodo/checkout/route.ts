import { NextResponse } from "next/server";

export async function POST() {
  const hasApiKey = Boolean(process.env.DODO_PAYMENTS_API_KEY);

  if (!hasApiKey) {
    return NextResponse.json({
      mode: "demo",
      checkoutUrl: "https://test.checkout.dodopayments.com/session/demo",
      message: "Set DODO_PAYMENTS_API_KEY to create real Dodo checkouts.",
    });
  }

  return NextResponse.json(
    {
      message:
        "Dodo checkout integration placeholder. Wire this route to the official Dodo Payments TypeScript SDK/API.",
    },
    { status: 501 },
  );
}

