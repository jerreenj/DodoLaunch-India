"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProductConfig, initialDemoState, recipients } from "../lib/demo-data";
import { formatMoney, totalSettlement } from "../lib/settlement";
import type {
  DemoState,
  DodoCheckout,
  DodoPaymentEvent,
  PayoutBatch,
  ProductConfig,
  SettlementEntry,
  X402Event,
} from "../lib/types";

const storageKey = "dodolaunch-demo-state";
const productStorageKey = "dodolaunch-product-config";

const timeline = [
  "Paid product launched",
  "Dodo sale webhook received",
  "Revenue ledger updated",
  "Solana split batch prepared",
  "x402 API sale routed",
];

const pilotSteps = [
  "Keep Try without wallet selected for the first pass.",
  "Edit the founder workspace with your product name, buyer, price, and launch note.",
  "Create the paid product, replay the sale webhook, then build the revenue split.",
  "Export the split CSV and send feedback through GitHub Issues.",
];

const devnetSteps = [
  "Switch your wallet to Solana Devnet before testing.",
  "Open faucet.solana.com and request devnet SOL for your wallet address.",
  "CLI option: solana airdrop 2 <WALLET_ADDRESS> --url devnet.",
  "Devnet SOL has no real value and cannot be moved to mainnet.",
];

export default function Home() {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [selectedSettlementId, setSelectedSettlementId] = useState(initialDemoState.settlementEntries[0].id);
  const [productConfig, setProductConfig] = useState<ProductConfig>(defaultProductConfig);
  const [testMode, setTestMode] = useState<"no-wallet" | "wallet">("no-wallet");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState("Try without wallet is ready. Devnet/simulate only.");
  const [x402Preview, setX402Preview] = useState<string>("HTTP 402 preview is waiting.");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as DemoState;
      setState(parsed);
      setSelectedSettlementId(parsed.settlementEntries[0]?.id ?? initialDemoState.settlementEntries[0].id);
    }
    const savedProduct = window.localStorage.getItem(productStorageKey);
    if (savedProduct) {
      setProductConfig(JSON.parse(savedProduct) as ProductConfig);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    window.localStorage.setItem(productStorageKey, JSON.stringify(productConfig));
  }, [productConfig]);

  const selectedSettlement =
    state.settlementEntries.find((entry) => entry.id === selectedSettlementId) ?? state.settlementEntries[0];

  const latestBatch = state.payoutBatches[0];
  const totalRevenue = useMemo(() => totalSettlement(state.settlementEntries), [state.settlementEntries]);
  const latestCheckout = state.checkouts[0];
  const splitPreview = useMemo(
    () =>
      recipients.map((recipient) => ({
        ...recipient,
        amount: Number(((productConfig.amount * recipient.splitBps) / 10000).toFixed(2)),
      })),
    [productConfig.amount],
  );

  function updateProduct<K extends keyof ProductConfig>(key: K, value: ProductConfig[K]) {
    setProductConfig((current) => ({ ...current, [key]: value }));
  }

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
          productName: productConfig.productName,
          customer: productConfig.customerName,
          amount: productConfig.amount,
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
    setMessage("Demo reset. Try without wallet is ready.");
    setX402Preview("HTTP 402 preview is waiting.");
  }

  function saveLaunchKit() {
    setMessage(`${productConfig.productName} launch kit saved locally. Create a paid product when ready.`);
  }

  function exportSplitCsv() {
    const rows = [
      ["product", "recipient", "role", "region", "split_percent", "amount", "currency", "wallet"],
      ...splitPreview.map((row) => [
        productConfig.productName,
        row.name,
        row.role,
        row.region,
        String(row.splitBps / 100),
        row.amount.toFixed(2),
        productConfig.currency,
        row.wallet,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell);
            return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${productConfig.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-split-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Revenue split CSV exported from browser-local data.");
  }

  return (
    <main>
      <section className="appHero">
        <nav className="topbar">
          <strong>DodoLaunch India</strong>
          <span>AI/SaaS checkout launchpad</span>
        </nav>
        <div className="safetyBanner" role="note">
          <strong>Default tester mode: Try without wallet</strong>
          <span>Devnet/simulation only. No mainnet. No paid services. No real funds required.</span>
        </div>
        <div className="heroLayout">
          <div>
            <p className="eyebrow">Dodo checkout to revenue splits</p>
            <h1>Launch paid AI products with Dodo. Split revenue on Solana.</h1>
            <p className="lead">
              A launchpad for Indian AI and SaaS builders to sell subscriptions,
              credit packs, and paid APIs through Dodo Payments, then split revenue
              to founders, affiliates, vendors, agents, and the platform.
            </p>
            <div className="quickProof">
              <span>Product setup</span>
              <span>Dodo checkout</span>
              <span>Revenue split CSV</span>
              <span>Solana-ready batch</span>
            </div>
            <div className="commandBar">
              <button onClick={createCheckout} disabled={busyAction !== null}>
                {busyAction === "checkout" ? "Creating..." : "Create Paid Product"}
              </button>
              <button onClick={replayWebhook} disabled={busyAction !== null}>
                {busyAction === "webhook" ? "Replaying..." : "Replay Sale Webhook"}
              </button>
              <button onClick={preparePayout} disabled={busyAction !== null}>
                {busyAction === "payout" ? "Preparing..." : "Build Revenue Split"}
              </button>
              <button onClick={runX402Demo} disabled={busyAction !== null}>
                {busyAction === "x402" ? "Routing..." : "Run x402 API Sale"}
              </button>
            </div>
            <div className="modeSwitch" aria-label="Tester mode">
              <button
                className={testMode === "no-wallet" ? "activeMode" : ""}
                onClick={() => {
                  setTestMode("no-wallet");
                  setMessage("Try without wallet mode selected. Best for the first 200 users.");
                }}
                type="button"
              >
                Try without wallet
              </button>
              <button
                className={testMode === "wallet" ? "activeMode" : ""}
                onClick={() => {
                  setTestMode("wallet");
                  setMessage("Wallet tester mode selected. Use Solana devnet only.");
                }}
                type="button"
              >
                Wallet tester
              </button>
            </div>
            <p className="statusLine">{message}</p>
          </div>
          <aside className="launchCard">
            <p className="eyebrow">Revenue model</p>
            <h2>{productConfig.productName}</h2>
            <div className="launchPrice">
              <span>Demo sale</span>
              <strong>{formatMoney(productConfig.amount, productConfig.currency)}</strong>
            </div>
            <div className="modelRows">
              <div>
                <span>Founder</span>
                <strong>70%</strong>
              </div>
              <div>
                <span>Growth + vendors</span>
                <strong>20%</strong>
              </div>
              <div>
                <span>Agent/runtime</span>
                <strong>5%</strong>
              </div>
              <div>
                <span>Platform fee</span>
                <strong>5%</strong>
              </div>
            </div>
            <p className="cardNote">Dodo gets merchant checkout volume. We get a platform-fee revenue path.</p>
          </aside>
        </div>
      </section>

      <section className="metricsBand" aria-label="Business metrics">
        <div className="metric">
          <span>Demo GMV</span>
          <strong>{formatMoney(totalRevenue)}</strong>
        </div>
        <div className="metric">
          <span>Dodo sales</span>
          <strong>{state.dodoEvents.length}</strong>
        </div>
        <div className="metric">
          <span>Solana mode</span>
          <strong>{latestBatch?.mode ?? "simulate"}</strong>
        </div>
        <div className="metric">
          <span>Build cost</span>
          <strong>$0</strong>
        </div>
      </section>

      <section className="workspace">
        <div className="panel guidePanel">
          <div>
            <p className="eyebrow">First-time guide</p>
            <h2>How to test DodoLaunch</h2>
          </div>
          <div className="guideGrid">
            {pilotSteps.map((step, index) => (
              <div className="guideStep" key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel testerPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Tester mode</p>
              <h2>{testMode === "no-wallet" ? "Try without wallet first" : "Wallet tester devnet setup"}</h2>
            </div>
            <span className="pill">{testMode === "no-wallet" ? "recommended" : "devnet only"}</span>
          </div>
          <div className="modeCopy">
            <p>
              This is the default for the first 200 users. They can configure a product, generate a Dodo demo
              checkout, replay a sale, build a split report, and export CSV without connecting any wallet.
            </p>
            <strong>No wallet, no mainnet, no paid services.</strong>
          </div>
          <div className="devnetBlock">
            <p className="eyebrow">Get devnet SOL for wallet testers</p>
            <div className="devnetList">
              {devnetSteps.map((step) => (
                <div key={step}>{step}</div>
              ))}
              <a href="https://faucet.solana.com/" target="_blank" rel="noreferrer">
                Open official Solana devnet faucet
              </a>
            </div>
          </div>
        </div>

        <div className="panel feedbackPanel">
          <div>
            <p className="eyebrow">Feedback</p>
            <h2>Send bugs before we scale to 200 users</h2>
          </div>
          <p>
            Use this for broken flows, confusing copy, mobile layout issues, or Dodo/Solana integration notes.
          </p>
          <a
            href="https://github.com/jerreenj/DodoLaunch-India/issues/new"
            target="_blank"
            rel="noreferrer"
          >
            Open GitHub Issue
          </a>
        </div>

        <div className="panel setupPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Founder workspace</p>
              <h2>Configure a paid product</h2>
            </div>
            <button className="ghostButton" onClick={saveLaunchKit}>
              Save
            </button>
          </div>
          <div className="formGrid">
            <label>
              <span>Founder / company</span>
              <input value={productConfig.founderName} onChange={(event) => updateProduct("founderName", event.target.value)} />
            </label>
            <label>
              <span>Product name</span>
              <input value={productConfig.productName} onChange={(event) => updateProduct("productName", event.target.value)} />
            </label>
            <label>
              <span>Demo buyer</span>
              <input value={productConfig.customerName} onChange={(event) => updateProduct("customerName", event.target.value)} />
            </label>
            <label>
              <span>Sale amount</span>
              <input
                min="1"
                type="number"
                value={productConfig.amount}
                onChange={(event) => updateProduct("amount", Number(event.target.value) || 1)}
              />
            </label>
            <label className="wideField">
              <span>Product URL</span>
              <input value={productConfig.productUrl} onChange={(event) => updateProduct("productUrl", event.target.value)} />
            </label>
            <label className="wideField">
              <span>Launch note</span>
              <textarea value={productConfig.launchNote} onChange={(event) => updateProduct("launchNote", event.target.value)} />
            </label>
          </div>
          <div className="launchSummary">
            <div>
              <span>Launch link</span>
              <strong>{productConfig.productUrl}</strong>
            </div>
            <button onClick={exportSplitCsv}>Export Split CSV</button>
          </div>
        </div>

        <div className="panel flowPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Judge flow</p>
              <h2>Launch-to-revenue flow</h2>
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
            <p>{latestCheckout?.checkoutUrl ?? "Create a paid product to start the Dodo sale story."}</p>
          </div>
        </div>

        <div className="panel ledgerPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Revenue ledger</p>
              <h2>Product sales</h2>
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
              <p className="eyebrow">Revenue rules</p>
              <h2>Split model</h2>
            </div>
            <strong>{recipients.reduce((sum, item) => sum + item.splitBps, 0) / 100}% routed</strong>
          </div>
          <div className="recipientRows">
            {splitPreview.map((recipient) => (
              <div className="recipientRow" key={recipient.id}>
                <div>
                  <strong>{recipient.name}</strong>
                  <span>
                    {recipient.role} - {recipient.region}
                  </span>
                </div>
                <em>{formatMoney(recipient.amount, productConfig.currency)}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="panel payoutPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Solana devnet</p>
              <h2>Split proof</h2>
            </div>
            <span className="pill">{latestBatch?.network ?? "devnet"}</span>
          </div>
          {latestBatch ? (
            <>
              <div className="proofGrid">
                <div>
                  <span>Split total</span>
                  <strong>{formatMoney(latestBatch.total.amount, latestBatch.total.currency)}</strong>
                </div>
                <div>
                  <span>Estimated fee</span>
                  <strong>${latestBatch.feeEstimateUsd.toFixed(4)}</strong>
                </div>
                <div>
                  <span>Manual ops avoided</span>
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
              Build a revenue split to generate deterministic devnet-style signatures and proof links.
            </p>
          )}
        </div>

        <div className="panel x402Panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Bonus</p>
              <h2>x402 API sales</h2>
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
