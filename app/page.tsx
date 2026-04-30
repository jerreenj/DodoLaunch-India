"use client";

import { useEffect, useMemo, useState } from "react";
import { initialDemoState, merchant, recipients, zeroDollarStack } from "../lib/demo-data";
import { formatMoney, totalSettlement } from "../lib/settlement";
import type {
  DemoState,
  DodoCheckout,
  DodoPaymentEvent,
  PayoutBatch,
  SettlementEntry,
  X402Event,
} from "../lib/types";

const storageKey = "dodosettle-demo-state";

const timeline = [
  "Dodo checkout created",
  "Webhook verified or demo-accepted",
  "Settlement ledger updated",
  "Solana devnet payout batch prepared",
  "x402 agent payment routed",
];

export default function Home() {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [selectedSettlementId, setSelectedSettlementId] = useState(initialDemoState.settlementEntries[0].id);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState("Zero-dollar mode is ready. No secrets or paid services required.");
  const [x402Preview, setX402Preview] = useState<string>("HTTP 402 preview is waiting.");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as DemoState;
      setState(parsed);
      setSelectedSettlementId(parsed.settlementEntries[0]?.id ?? initialDemoState.settlementEntries[0].id);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const selectedSettlement =
    state.settlementEntries.find((entry) => entry.id === selectedSettlementId) ?? state.settlementEntries[0];

  const latestBatch = state.payoutBatches[0];
  const totalRevenue = useMemo(() => totalSettlement(state.settlementEntries), [state.settlementEntries]);
  const latestCheckout = state.checkouts[0];

  async function runAction<T>(name: string, action: () => Promise<T>) {
    setBusyAction(name);
    try {
      return await action();
    } finally {
      setBusyAction(null);
    }
  }

  async function createCheckout() {
    await runAction("checkout", async () => {
      const response = await fetch("/api/dodo/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productName: merchant.product,
          customer: merchant.customer,
          amount: merchant.amount,
        }),
      });
      const data = (await response.json()) as { checkout: DodoCheckout; message: string };
      setState((current) => ({
        ...current,
        checkouts: [data.checkout, ...current.checkouts],
      }));
      setMessage(data.message);
    });
  }

  async function replayWebhook() {
    await runAction("webhook", async () => {
      const response = await fetch("/api/webhooks/dodo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ checkout: latestCheckout }),
      });
      const data = (await response.json()) as {
        event: DodoPaymentEvent;
        settlementEntry: SettlementEntry;
        message: string;
      };
      setState((current) => ({
        ...current,
        dodoEvents: [data.event, ...current.dodoEvents],
        settlementEntries: [data.settlementEntry, ...current.settlementEntries],
      }));
      setSelectedSettlementId(data.settlementEntry.id);
      setMessage(data.message);
    });
  }

  async function preparePayout() {
    await runAction("payout", async () => {
      const response = await fetch("/api/solana/payouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settlement: selectedSettlement, mode: "simulate" }),
      });
      const data = (await response.json()) as { batch: PayoutBatch; message: string };
      setState((current) => ({
        ...current,
        payoutBatches: [data.batch, ...current.payoutBatches],
      }));
      setMessage(data.message);
    });
  }

  async function runX402Demo() {
    await runAction("x402", async () => {
      const challenge = await fetch("/api/x402/agent-data");
      const challengeBody = await challenge.json();
      setX402Preview(`${challenge.status} ${challengeBody.title}: ${challengeBody.message}`);

      const paid = await fetch("/api/x402/agent-data", {
        headers: { "x-payment": "demo-paid" },
      });
      const data = (await paid.json()) as {
        event: X402Event;
        settlementEntry: SettlementEntry;
        message: string;
      };
      setState((current) => ({
        ...current,
        x402Events: [data.event, ...current.x402Events],
        settlementEntries: [data.settlementEntry, ...current.settlementEntries],
      }));
      setSelectedSettlementId(data.settlementEntry.id);
      setMessage(data.message);
    });
  }

  function resetDemo() {
    setState(initialDemoState);
    setSelectedSettlementId(initialDemoState.settlementEntries[0].id);
    setMessage("Demo reset. Zero-dollar mode is ready.");
    setX402Preview("HTTP 402 preview is waiting.");
  }

  return (
    <main>
      <section className="appHero">
        <nav className="topbar">
          <strong>DodoSettle India</strong>
          <span>Zero-dollar Frontier build</span>
        </nav>
        <div className="heroLayout">
          <div>
            <p className="eyebrow">Dodo revenue to Solana settlement</p>
            <h1>Global SaaS revenue in. Programmable stablecoin payouts out.</h1>
            <p className="lead">
              A no-paid-services operating dashboard for Indian SaaS and AI founders:
              Dodo checkout events become settlement ledger entries, payout rules become
              Solana devnet batches, and x402 agent payments join the same flow.
            </p>
            <div className="commandBar">
              <button onClick={createCheckout} disabled={busyAction !== null}>
                {busyAction === "checkout" ? "Creating..." : "Create Dodo Checkout"}
              </button>
              <button onClick={replayWebhook} disabled={busyAction !== null}>
                {busyAction === "webhook" ? "Replaying..." : "Replay Webhook"}
              </button>
              <button onClick={preparePayout} disabled={busyAction !== null}>
                {busyAction === "payout" ? "Preparing..." : "Prepare Payout Batch"}
              </button>
              <button onClick={runX402Demo} disabled={busyAction !== null}>
                {busyAction === "x402" ? "Routing..." : "Run x402 Demo"}
              </button>
            </div>
            <p className="statusLine">{message}</p>
          </div>
          <aside className="zeroPanel">
            <p className="eyebrow">Zero-dollar architecture</p>
            {zeroDollarStack.map((item) => (
              <div className="checkRow" key={item}>
                <span>0</span>
                <strong>{item}</strong>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section className="metricsBand" aria-label="Business metrics">
        <div className="metric">
          <span>Demo revenue</span>
          <strong>{formatMoney(totalRevenue)}</strong>
        </div>
        <div className="metric">
          <span>Dodo events</span>
          <strong>{state.dodoEvents.length}</strong>
        </div>
        <div className="metric">
          <span>Solana mode</span>
          <strong>{latestBatch?.mode ?? "simulate"}</strong>
        </div>
        <div className="metric">
          <span>Spend required</span>
          <strong>$0</strong>
        </div>
      </section>

      <section className="workspace">
        <div className="panel flowPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Judge flow</p>
              <h2>Click-through demo path</h2>
            </div>
            <button className="ghostButton" onClick={resetDemo}>
              Reset
            </button>
          </div>
          <div className="timeline">
            {timeline.map((item, index) => (
              <div key={item} className="timelineItem">
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
          <div className="checkoutBox">
            <span>Latest checkout</span>
            <strong>{latestCheckout?.sessionId ?? "No checkout yet"}</strong>
            <p>{latestCheckout?.checkoutUrl ?? "Create a Dodo demo checkout to start the live story."}</p>
          </div>
        </div>

        <div className="panel ledgerPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Settlement ledger</p>
              <h2>Verified revenue</h2>
            </div>
          </div>
          <div className="ledgerList">
            {state.settlementEntries.map((entry) => (
              <button
                className={entry.id === selectedSettlement.id ? "ledgerItem active" : "ledgerItem"}
                key={entry.id}
                onClick={() => setSelectedSettlementId(entry.id)}
              >
                <span>{entry.source.toUpperCase()}</span>
                <strong>{entry.label}</strong>
                <em>{formatMoney(entry.amount.amount, entry.amount.currency)}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="panel recipientsPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Routing rules</p>
              <h2>Payout split</h2>
            </div>
            <strong>{recipients.reduce((sum, item) => sum + item.splitBps, 0) / 100}% routed</strong>
          </div>
          <div className="recipientRows">
            {recipients.map((recipient) => (
              <div className="recipientRow" key={recipient.id}>
                <div>
                  <strong>{recipient.name}</strong>
                  <span>
                    {recipient.role} - {recipient.region}
                  </span>
                </div>
                <em>{recipient.splitBps / 100}%</em>
              </div>
            ))}
          </div>
        </div>

        <div className="panel payoutPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Solana devnet</p>
              <h2>Payout proof</h2>
            </div>
            <span className="pill">{latestBatch?.network ?? "devnet"}</span>
          </div>
          {latestBatch ? (
            <>
              <div className="proofGrid">
                <div>
                  <span>Batch total</span>
                  <strong>{formatMoney(latestBatch.total.amount, latestBatch.total.currency)}</strong>
                </div>
                <div>
                  <span>Estimated fee</span>
                  <strong>${latestBatch.feeEstimateUsd.toFixed(4)}</strong>
                </div>
                <div>
                  <span>Wire estimate avoided</span>
                  <strong>${latestBatch.bankWireEstimateUsd}</strong>
                </div>
              </div>
              <div className="payoutRows">
                {latestBatch.lines.map((line, index) => (
                  <a href={latestBatch.explorerUrls[index]} target="_blank" rel="noreferrer" key={line.id}>
                    <span>{line.name}</span>
                    <strong>{formatMoney(line.amount.amount, line.amount.currency)}</strong>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <p className="emptyState">
              Prepare a payout batch to generate deterministic devnet-style signatures and proof links.
            </p>
          )}
        </div>

        <div className="panel x402Panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Bonus</p>
              <h2>x402 agent payments</h2>
            </div>
          </div>
          <p>{x402Preview}</p>
          <div className="codeLine">
            <span>GET /api/x402/agent-data</span>
            <strong>{state.x402Events.length ? "paid" : "402"}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

