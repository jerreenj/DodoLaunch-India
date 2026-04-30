import type { DemoState, Recipient, SettlementEntry } from "./types";

export const merchant = {
  name: "BharatAI Ops",
  location: "Bengaluru, India",
  product: "AI support copilot monthly plan",
  customer: "OrbitWorks Pte Ltd",
  amount: 2480,
  currency: "USDG" as const,
};

export const recipients: Recipient[] = [
  {
    id: "rec_contractor",
    name: "Frontend contractor",
    role: "contractor",
    region: "Philippines",
    wallet: "D3moConTractor111111111111111111111111111",
    splitBps: 2000,
  },
  {
    id: "rec_affiliate",
    name: "Growth affiliate",
    role: "affiliate",
    region: "UAE",
    wallet: "D3moAffiliate222222222222222222222222222",
    splitBps: 500,
  },
  {
    id: "rec_vendor",
    name: "Data labeling vendor",
    role: "vendor",
    region: "Vietnam",
    wallet: "D3moVendor3333333333333333333333333333",
    splitBps: 500,
  },
  {
    id: "rec_agent",
    name: "Agent API provider",
    role: "agent",
    region: "India",
    wallet: "D3moAgent44444444444444444444444444444",
    splitBps: 300,
  },
];

export const zeroDollarStack = [
  "GitHub public repo",
  "Vercel free tier",
  "Dodo test/demo mode",
  "Solana devnet/simulation",
  "Browser/local demo fixtures",
  "No hosted database",
];

export const initialSettlement: SettlementEntry = {
  id: "set_initial_dodo",
  sourceEventId: "evt_initial_dodo",
  source: "dodo",
  label: merchant.product,
  payer: merchant.customer,
  amount: {
    amount: merchant.amount,
    currency: merchant.currency,
  },
  status: "demo",
  receivedAt: "2026-04-30T07:30:00.000Z",
};

export const initialDemoState: DemoState = {
  checkouts: [],
  dodoEvents: [],
  x402Events: [],
  settlementEntries: [initialSettlement],
  payoutBatches: [],
};

