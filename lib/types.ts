export type Money = {
  amount: number;
  currency: "USDG" | "USDC";
};

export type DodoMode = "demo" | "test";

export type SolanaMode = "simulate" | "devnet";

export type DodoCheckout = {
  mode: DodoMode;
  checkoutUrl: string;
  sessionId: string;
  productName: string;
  customer: string;
  amount: Money;
  createdAt: string;
  zeroDollar: true;
};

export type ProductConfig = {
  founderName: string;
  productName: string;
  customerName: string;
  amount: number;
  currency: "USDG" | "USDC";
  productUrl: string;
  launchNote: string;
};

export type DodoPaymentEvent = {
  id: string;
  source: "dodo";
  type: "payment.succeeded" | "subscription.active";
  checkoutSessionId: string;
  customer: string;
  productName: string;
  amount: Money;
  signatureStatus: "demo-accepted" | "verified" | "missing-secret";
  receivedAt: string;
};

export type X402Event = {
  id: string;
  source: "x402";
  type: "x402.payment.settled";
  buyer: string;
  resource: string;
  amount: Money;
  proof: string;
  receivedAt: string;
};

export type SettlementEntry = {
  id: string;
  sourceEventId: string;
  source: "dodo" | "x402";
  label: string;
  payer: string;
  amount: Money;
  status: "verified" | "demo";
  receivedAt: string;
};

export type RecipientRole = "founder" | "affiliate" | "vendor" | "agent" | "platform";

export type Recipient = {
  id: string;
  name: string;
  role: RecipientRole;
  region: string;
  wallet: string;
  splitBps: number;
};

export type PayoutLine = Recipient & {
  amount: Money;
  status: "ready";
};

export type PayoutBatch = {
  id: string;
  mode: SolanaMode;
  network: "devnet";
  sourceSettlementId: string;
  total: Money;
  tokenMint: string;
  feeEstimateUsd: number;
  bankWireEstimateUsd: number;
  eta: "seconds";
  signatures: string[];
  explorerUrls: string[];
  lines: PayoutLine[];
  createdAt: string;
  zeroDollar: true;
};

export type DemoState = {
  checkouts: DodoCheckout[];
  dodoEvents: DodoPaymentEvent[];
  x402Events: X402Event[];
  settlementEntries: SettlementEntry[];
  payoutBatches: PayoutBatch[];
};
