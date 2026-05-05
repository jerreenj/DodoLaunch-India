export type Money = {
  amount: number;
  currency: "USDG" | "USDC";
};

export type DodoMode = "demo" | "test" | "live";

export type SolanaMode = "simulate" | "devnet" | "mainnet";

export type SolanaNetwork = "devnet" | "mainnet-beta";

export type DodoCheckout = {
  mode: DodoMode;
  checkoutUrl: string;
  sessionId: string;
  productName: string;
  customer: string;
  amount: Money;
  createdAt: string;
  zeroDollar: boolean;
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
  signatureStatus: "demo-accepted" | "verified" | "missing-secret" | "invalid";
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
  network: SolanaNetwork;
  sourceSettlementId: string;
  total: Money;
  tokenMint: string;
  executionStatus: "preview" | "broadcasted";
  costStatus: "not-broadcast" | "devnet-paid" | "mainnet-requires-wallet";
  previewIds: string[];
  chainProofUrls: string[];
  lines: PayoutLine[];
  createdAt: string;
  zeroDollar: boolean;
};

export type MainnetTransactionStatus = {
  status: "idle" | "building" | "awaiting-wallet" | "broadcasted" | "failed";
  signature?: string;
  error?: string;
};

export type DemoState = {
  checkouts: DodoCheckout[];
  dodoEvents: DodoPaymentEvent[];
  x402Events: X402Event[];
  settlementEntries: SettlementEntry[];
  payoutBatches: PayoutBatch[];
};
