import type { DodoPaymentEvent, SettlementEntry, X402Event } from "./types";

export function settlementFromDodoEvent(event: DodoPaymentEvent): SettlementEntry {
  return {
    id: `set_${event.id}`,
    sourceEventId: event.id,
    productId: event.productId,
    source: "dodo",
    label: event.productName,
    payer: event.customer,
    amount: event.amount,
    status: event.signatureStatus === "verified" ? "verified" : "demo",
    receivedAt: event.receivedAt,
  };
}

export function settlementFromX402Event(event: X402Event): SettlementEntry {
  return {
    id: `set_${event.id}`,
    sourceEventId: event.id,
    productId: event.productId,
    source: "x402",
    label: event.resource,
    payer: event.buyer,
    amount: event.amount,
    status: "demo",
    receivedAt: event.receivedAt,
  };
}

export function formatMoney(amount: number, currency = "USDC") {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)} ${currency}`;
}

export function totalSettlement(entries: SettlementEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.amount.amount, 0);
}

export function totalSettlementByProduct(entries: SettlementEntry[], productId: string) {
  return entries
    .filter((entry) => entry.productId === productId)
    .reduce((sum, entry) => sum + entry.amount.amount, 0);
}
