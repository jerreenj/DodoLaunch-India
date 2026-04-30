import crypto from "node:crypto";
import { merchant } from "./demo-data";
import type { DodoCheckout, DodoMode, DodoPaymentEvent } from "./types";

type CheckoutInput = {
  productName?: string;
  customer?: string;
  amount?: number;
};

function id(prefix: string, seed: string) {
  return `${prefix}_${crypto.createHash("sha256").update(seed).digest("hex").slice(0, 14)}`;
}

function dodoMode(): DodoMode {
  return process.env.DODO_PAYMENTS_API_KEY && process.env.DODO_PRODUCT_ID ? "test" : "demo";
}

export async function createDodoCheckout(input: CheckoutInput = {}): Promise<DodoCheckout> {
  const now = new Date().toISOString();
  const mode = dodoMode();
  const productName = input.productName ?? merchant.product;
  const customer = input.customer ?? merchant.customer;
  const amount = input.amount ?? merchant.amount;
  const sessionId = id("cks", `${productName}:${customer}:${amount}`);

  if (mode === "test") {
    const DodoPayments = (await import("dodopayments")).default;
    const client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment: "test_mode",
    });
    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: process.env.DODO_PRODUCT_ID as string, quantity: 1 }],
      return_url: process.env.DODO_RETURN_URL ?? "http://localhost:3000",
    });

    return {
      mode,
      checkoutUrl: session.checkout_url ?? `https://test.checkout.dodopayments.com/session/${sessionId}`,
      sessionId: session.session_id,
      productName,
      customer,
      amount: { amount, currency: merchant.currency },
      createdAt: now,
      zeroDollar: true,
    };
  }

  return {
    mode,
    checkoutUrl: `https://test.checkout.dodopayments.com/session/${sessionId}?demo=true`,
    sessionId,
    productName,
    customer,
    amount: { amount, currency: merchant.currency },
    createdAt: now,
    zeroDollar: true,
  };
}

export function createDemoDodoEvent(checkout?: DodoCheckout): DodoPaymentEvent {
  const base = checkout ?? {
    sessionId: "cks_demo_seeded",
    productName: merchant.product,
    customer: merchant.customer,
    amount: { amount: merchant.amount, currency: merchant.currency },
  };
  const now = new Date().toISOString();

  return {
    id: id("evt", `${base.sessionId}:${now}`),
    source: "dodo",
    type: "payment.succeeded",
    checkoutSessionId: base.sessionId,
    customer: base.customer,
    productName: base.productName,
    amount: base.amount,
    signatureStatus: process.env.DODO_PAYMENTS_WEBHOOK_SECRET ? "missing-secret" : "demo-accepted",
    receivedAt: now,
  };
}

export async function verifyDodoWebhook(rawBody: string, request: Request) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
  if (!secret) {
    return "demo-accepted" as const;
  }

  const signature = request.headers.get("webhook-signature");
  const timestamp = request.headers.get("webhook-timestamp");
  const webhookId = request.headers.get("webhook-id");
  if (!signature || !timestamp || !webhookId) {
    return "missing-secret" as const;
  }

  const signedMessage = `${webhookId}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedMessage).digest("hex");
  return signature.includes(expected) ? ("verified" as const) : ("missing-secret" as const);
}
