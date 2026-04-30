import { NextResponse } from "next/server";
import { createDodoCheckout } from "../../../../lib/dodo";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const checkout = await createDodoCheckout(body);

  return NextResponse.json({
    checkout,
    message:
      checkout.mode === "test"
        ? "Dodo test checkout created with free test credentials."
        : "Zero-dollar demo checkout created without requiring Dodo credentials.",
  });
}
