import type { DemoState, ProductConfig, Recipient, SettlementEntry } from "./types";

export const merchant = {
  name: "Madras MicroApps",
  location: "Chennai, India",
  product: "SupportAgent Pro credit pack",
  customer: "OrbitWorks Pte Ltd",
  amount: 1280,
  currency: "USDC" as const,
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
    wallet: "Bhgt1XQxJHgb1Z4TygenJt7gpsUSodDBPhy5XnShxjsZ",
    splitBps: 7000,
  },
  {
    id: "rec_affiliate",
    name: "Launch affiliate",
    role: "affiliate",
    region: "UAE",
    wallet: "3C3SkYEPBongTXtra9RhdEr8NfQ4BngCPJnuaM18goCh",
    splitBps: 1000,
  },
  {
    id: "rec_vendor",
    name: "Data/API vendor",
    role: "vendor",
    region: "Vietnam",
    wallet: "GCCaVxDpT7KcKcgnXEpvVmkWLi5SmnJ1WU6C47KY3PfQ",
    splitBps: 1000,
  },
  {
    id: "rec_agent",
    name: "Agent runtime provider",
    role: "agent",
    region: "India",
    wallet: "8yyzZyQowDPRQHQewcwMio5wwf9ik9ZptKTtY3nvGdjZ",
    splitBps: 500,
  },
  {
    id: "rec_platform",
    name: "DodoLaunch platform fee",
    role: "platform",
    region: "India",
    wallet: "CmkjWLDtnjUGUz5EnzNwT5nSGc9PSfUU1xGKS8s5EARX",
    splitBps: 500,
  },
];

export const zeroDollarStack = [
  "GitHub public repo",
  "Vercel free tier",
  "Dodo live/test/sandbox mode",
  "Solana mainnet-ready settlement",
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
