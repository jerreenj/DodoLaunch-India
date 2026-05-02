import type { DemoState, ProductConfig, Recipient, SettlementEntry } from "./types";

export const merchant = {
  name: "Madras MicroApps",
  location: "Chennai, India",
  product: "SupportAgent Pro credit pack",
  customer: "OrbitWorks Pte Ltd",
  amount: 1280,
  currency: "USDG" as const,
};

export const defaultProductConfig: ProductConfig = {
  founderName: merchant.name,
  productName: merchant.product,
  customerName: merchant.customer,
  amount: merchant.amount,
  currency: merchant.currency,
  productUrl: "https://madrasmicroapps.example/supportagent-pro",
  launchNote: "AI support credit pack for global SaaS teams that need instant customer replies.",
};

export const recipients: Recipient[] = [
  {
    id: "rec_founder",
    name: "Founder treasury",
    role: "founder",
    region: "India",
    wallet: "D3moFounder1111111111111111111111111111",
    splitBps: 7000,
  },
  {
    id: "rec_affiliate",
    name: "Launch affiliate",
    role: "affiliate",
    region: "UAE",
    wallet: "D3moAffiliate222222222222222222222222222",
    splitBps: 1000,
  },
  {
    id: "rec_vendor",
    name: "Data/API vendor",
    role: "vendor",
    region: "Vietnam",
    wallet: "D3moVendor3333333333333333333333333333",
    splitBps: 1000,
  },
  {
    id: "rec_agent",
    name: "Agent runtime provider",
    role: "agent",
    region: "India",
    wallet: "D3moAgent44444444444444444444444444444",
    splitBps: 500,
  },
  {
    id: "rec_platform",
    name: "DodoLaunch platform fee",
    role: "platform",
    region: "India",
    wallet: "D3moPlatform55555555555555555555555555",
    splitBps: 500,
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
