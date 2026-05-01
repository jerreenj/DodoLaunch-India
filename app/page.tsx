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

const navItems = [
  ["Guide", "#guide"],
  ["Launch", "#launch"],
  ["Flow", "#flow"],
  ["Ledger", "#ledger"],
  ["Proof", "#proof"],
  ["Submit", "#submit"],
] as const;

const pilotSteps = [
  "Try without wallet first.",
  "Edit the founder workspace.",
  "Create checkout and replay sale webhook.",
  "Build split preview and export CSV.",
];

const devnetSteps = [
  "Switch wallet network to Solana Devnet.",
  "Request devnet SOL from faucet.solana.com.",
  "CLI option: solana airdrop 2 <WALLET_ADDRESS> --url devnet.",
  "Devnet SOL has no real value and cannot be moved to mainnet.",
];

const realityChecks = [
  "Live now: no-wallet product setup, Dodo demo/test checkout route, ledger, split CSV, and x402-style 402 flow.",
  "Real when configured: Dodo test checkout uses DODO_PAYMENTS_API_KEY and DODO_PRODUCT_ID.",
  "Preview only: Solana settlement shows a payout preview until an actual devnet transaction is broadcast.",
  "Not claimed: mainnet, real funds, real payment volume, paid infrastructure, or production custody.",
];

const flowSteps = [
  "Product configured",
  "Dodo checkout created",
  "Webhook normalized",
  "Ledger updated",
  "Split preview built",
  "x402 route tested",
];

const submitChecklist = [
  "Send Vercel link to first 20 users and collect issues.",
  "Fix only blockers: mobile layout, broken buttons, unclear copy, CSV export.",
  "Add Dodo test keys in Vercel if available, then record one real test checkout.",
  "Record a 2 minute walkthrough showing exactly what is live and what is preview.",
  "Submit GitHub repo, Vercel URL, demo video, and honest reality-check notes.",
];

export default function Home() {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [selectedSettlementId, setSelectedSettlementId] = useState(initialDemoState.settlementEntries[0].id);
  const [productConfig, setProductConfig] = useState<ProductConfig>(defaultProductConfig);
  const [testMode, setTestMode] = useState<"no-wallet" | "wallet">("no-wallet");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState("Try without wallet is ready. Devnet/preview only.");
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
  const latestCheckout = state.checkouts[0];
  const totalRevenue = useMemo(() => totalSettlement(state.settlementEntries), [state.settlementEntries]);
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
      setState((current) => ({ ...current, checkouts: [data.checkout, ...current.checkouts] }));
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
      setState((current) => ({ ...current, payoutBatches: [data.batch, ...current.payoutBatches] }));
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
    setMessage(`${productConfig.productName} launch kit saved locally.`);
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

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <main>
      <header className="siteHeader">
        <nav className="navBar" aria-label="Primary navigation">
          <a className="brandMark" href="#top" onClick={closeMobileMenu}>
            <span>D</span>
            <strong>DodoLaunch India</strong>
          </a>
          <div className="desktopNav">
            {navItems.map(([label, href]) => (
              <a href={href} key={href}>
                {label}
              </a>
            ))}
          </div>
          <div className="navActions">
            <a href="https://github.com/jerreenj/DodoLaunch-India/issues/new" target="_blank" rel="noreferrer">
              Feedback
            </a>
            <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle menu">
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </nav>
        {mobileMenuOpen ? (
          <div className="mobileNav">
            {navItems.map(([label, href]) => (
              <a href={href} key={href} onClick={closeMobileMenu}>
                {label}
              </a>
            ))}
          </div>
        ) : null}
      </header>

      <section className="heroSection sectionBand darkBand" id="top">
        <div className="heroShell">
          <div className="heroCopy">
            <div className="statusPill">Devnet/preview only - no mainnet - no paid services</div>
            <p className="eyebrow">Dodo checkout to revenue splits</p>
            <h1>Launch paid AI products with Dodo. Split revenue without payment ops chaos.</h1>
            <p className="lead">
              DodoLaunch is a founder workspace for Indian AI and SaaS teams: create a Dodo checkout,
              route sale events into a ledger, export split reports, and prepare Solana settlement previews.
            </p>
            <div className="heroActions">
              <a className="primaryLink" href="#launch">
                Start launch flow
              </a>
              <a className="secondaryLink" href="#submit">
                Check submission readiness
              </a>
            </div>
            <p className="statusLine">{message}</p>
          </div>

          <aside className="productPreview" aria-label="Live product preview">
            <div className="previewTop">
              <span>Live MVP</span>
              <strong>{testMode === "no-wallet" ? "No-wallet mode" : "Wallet tester mode"}</strong>
            </div>
            <div className="previewAmount">
              <span>Local demo ledger</span>
              <strong>{formatMoney(totalRevenue)}</strong>
            </div>
            <div className="previewGrid">
              <div>
                <span>Dodo events</span>
                <strong>{state.dodoEvents.length}</strong>
              </div>
              <div>
                <span>Split mode</span>
                <strong>{latestBatch?.executionStatus ?? "preview"}</strong>
              </div>
              <div>
                <span>x402 route</span>
                <strong>{state.x402Events.length ? "tested" : "ready"}</strong>
              </div>
              <div>
                <span>Build cost</span>
                <strong>$0</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="sectionBand" id="guide">
        <div className="sectionIntro">
          <p className="eyebrow">First run</p>
          <h2>Give users a clean path instead of one giant page</h2>
          <p>Start with no wallet, then let technical testers opt into devnet instructions.</p>
        </div>
        <div className="guideLayout">
          <article className="panel stepsPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Try without wallet</p>
                <h3>200-user pilot path</h3>
              </div>
              <span className="pill">recommended</span>
            </div>
            <div className="stepGrid">
              {pilotSteps.map((step, index) => (
                <div className="stepTile" key={step}>
                  <span>{index + 1}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
            <div className="modeSwitch" aria-label="Tester mode">
              <button
                className={testMode === "no-wallet" ? "activeMode" : ""}
                onClick={() => {
                  setTestMode("no-wallet");
                  setMessage("Try without wallet mode selected. Best for first 200 users.");
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
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Wallet testers</p>
                <h3>Get devnet SOL</h3>
              </div>
              <span className="pill">devnet only</span>
            </div>
            <div className="listStack">
              {devnetSteps.map((step) => (
                <div key={step}>{step}</div>
              ))}
            </div>
            <a className="panelLink" href="https://faucet.solana.com/" target="_blank" rel="noreferrer">
              Open official Solana devnet faucet
            </a>
          </article>
        </div>
      </section>

      <section className="sectionBand altBand" id="launch">
        <div className="sectionIntro">
          <p className="eyebrow">Founder workspace</p>
          <h2>Configure the paid product users will understand in 30 seconds</h2>
          <p>Everything saves locally in the browser so testers can explore without accounts or paid infrastructure.</p>
        </div>
        <div className="launchLayout">
          <article className="panel setupPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Product setup</p>
                <h3>Launch kit</h3>
              </div>
              <button className="ghostButton" onClick={saveLaunchKit}>
                Save locally
              </button>
            </div>
            <div className="formGrid">
              <label>
                <span>Founder / company</span>
                <input
                  value={productConfig.founderName}
                  onChange={(event) => updateProduct("founderName", event.target.value)}
                />
              </label>
              <label>
                <span>Product name</span>
                <input
                  value={productConfig.productName}
                  onChange={(event) => updateProduct("productName", event.target.value)}
                />
              </label>
              <label>
                <span>Demo buyer</span>
                <input
                  value={productConfig.customerName}
                  onChange={(event) => updateProduct("customerName", event.target.value)}
                />
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
          </article>

          <aside className="launchCard">
            <p className="eyebrow">Revenue model</p>
            <h3>{productConfig.productName}</h3>
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
            <button onClick={exportSplitCsv}>Export split CSV</button>
          </aside>
        </div>
      </section>

      <section className="sectionBand" id="flow">
        <div className="sectionIntro">
          <p className="eyebrow">User flow</p>
          <h2>One row of actions, one clear story</h2>
          <p>Use this order for demos, early users, and the submission video.</p>
        </div>
        <div className="actionRail">
          <button onClick={createCheckout} disabled={busyAction !== null}>
            {busyAction === "checkout" ? "Creating..." : "Create checkout"}
          </button>
          <button onClick={replayWebhook} disabled={busyAction !== null}>
            {busyAction === "webhook" ? "Replaying..." : "Replay webhook"}
          </button>
          <button onClick={preparePayout} disabled={busyAction !== null}>
            {busyAction === "payout" ? "Preparing..." : "Build split"}
          </button>
          <button onClick={runX402Demo} disabled={busyAction !== null}>
            {busyAction === "x402" ? "Routing..." : "Run x402"}
          </button>
          <button className="neutralAction" onClick={resetDemo}>
            Reset
          </button>
        </div>
        <div className="flowGrid">
          {flowSteps.map((step, index) => (
            <div className="flowStep" key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
        <div className="checkoutBox">
          <span>Latest checkout</span>
          <strong>{latestCheckout?.sessionId ?? "No checkout yet"}</strong>
          <p>{latestCheckout?.checkoutUrl ?? "Create a checkout to start the Dodo sale story."}</p>
        </div>
      </section>

      <section className="sectionBand altBand" id="ledger">
        <div className="sectionIntro">
          <p className="eyebrow">Ledger and rules</p>
          <h2>Show the money path without pretending there is real volume</h2>
          <p>Users see how revenue would split, while the app labels local demo ledger state clearly.</p>
        </div>
        <div className="ledgerLayout">
          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Revenue ledger</p>
                <h3>Product sales</h3>
              </div>
              <span className="pill">{state.settlementEntries.length} entries</span>
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
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Revenue rules</p>
                <h3>Split model</h3>
              </div>
              <span className="pill">{recipients.reduce((sum, item) => sum + item.splitBps, 0) / 100}% routed</span>
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
          </article>
        </div>
      </section>

      <section className="sectionBand" id="proof">
        <div className="sectionIntro">
          <p className="eyebrow">Proof and bonus</p>
          <h2>Separate real test paths from preview paths</h2>
          <p>The app no longer shows fake explorer links. Chain proof appears only after real devnet broadcast.</p>
        </div>
        <div className="proofLayout">
          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Solana devnet</p>
                <h3>Payout preview</h3>
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
                    <span>Chain status</span>
                    <strong>{latestBatch.executionStatus}</strong>
                  </div>
                  <div>
                    <span>Cost status</span>
                    <strong>{latestBatch.costStatus}</strong>
                  </div>
                </div>
                <div className="payoutRows">
                  {latestBatch.lines.map((line, index) => (
                    <div key={line.id}>
                      <span>{line.name}</span>
                      <strong>
                        {formatMoney(line.amount.amount, line.amount.currency)} | preview {latestBatch.previewIds[index]}
                      </strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="emptyState">
                Build a split to generate a payout preview. Explorer links appear only after real devnet broadcast.
              </p>
            )}
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Bonus</p>
                <h3>x402 API sale</h3>
              </div>
              <span className="pill">{state.x402Events.length ? "tested" : "ready"}</span>
            </div>
            <p className="emptyState">{x402Preview}</p>
            <div className="codeLine">
              <span>GET /api/x402/agent-data</span>
              <strong>{state.x402Events.length ? "paid" : "402"}</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="sectionBand darkBand" id="submit">
        <div className="submitLayout">
          <div>
            <p className="eyebrow">Before users and submission</p>
            <h2>Hard truth: this is ready for a pilot, not ready to claim real payment volume</h2>
            <p className="lead">
              Send it to 20 users first. For final submission, be honest: Dodo test mode can be real with keys,
              Solana settlement is preview until devnet broadcast, and the build used no paid services.
            </p>
            <div className="heroActions">
              <a className="primaryLink" href="https://github.com/jerreenj/DodoLaunch-India" target="_blank" rel="noreferrer">
                Open GitHub repo
              </a>
              <a
                className="secondaryLink"
                href="https://github.com/jerreenj/DodoLaunch-India/issues/new"
                target="_blank"
                rel="noreferrer"
              >
                File feedback issue
              </a>
            </div>
          </div>
          <div className="submitChecklist">
            {submitChecklist.map((item, index) => (
              <div key={item}>
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
