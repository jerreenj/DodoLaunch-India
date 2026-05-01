"use client";

import React from "react";
import { ArrowRight, ExternalLink, Menu, X } from "lucide-react";
import { defaultProductConfig, initialDemoState, recipients } from "@/lib/demo-data";
import { formatMoney, totalSettlement } from "@/lib/settlement";
import type {
  DemoState,
  DodoCheckout,
  DodoPaymentEvent,
  PayoutBatch,
  ProductConfig,
  SettlementEntry,
  X402Event,
} from "@/lib/types";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "gradient";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/70 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "border-lime bg-lime text-ink hover:bg-lime/90",
      secondary: "border-white/10 bg-white/10 text-white hover:bg-white/15",
      ghost: "border-transparent bg-transparent text-white/70 hover:bg-white/10 hover:text-white",
      gradient:
        "border-white/20 bg-gradient-to-b from-white via-white/95 to-white/65 text-ink shadow-glow hover:scale-[1.02] active:scale-[0.98]",
    };

    const sizes = {
      default: "h-10 px-4 text-sm",
      sm: "h-9 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button ref={ref} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

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
  "Try without wallet first",
  "Edit the founder workspace",
  "Create checkout and replay sale",
  "Build split preview and export CSV",
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

const submitChecklist = [
  "Send Vercel link to first 20 users and collect issues.",
  "Fix only blockers: mobile layout, broken buttons, unclear copy, CSV export.",
  "Add Dodo test keys in Vercel if available, then record one real test checkout.",
  "Record a 2 minute walkthrough showing exactly what is live and what is preview.",
  "Submit GitHub repo, Vercel URL, demo video, and honest reality-check notes.",
];

function SectionIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto mb-8 max-w-7xl px-6">
      <p className="mb-3 text-xs font-bold uppercase text-dodo">{eyebrow}</p>
      <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-ink md:text-5xl">{title}</h2>
      <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">{children}</p>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <article className={`rounded-lg border border-neutral-200 bg-white p-5 shadow-sm ${className}`}>{children}</article>;
}

export default function Component() {
  const [state, setState] = React.useState<DemoState>(initialDemoState);
  const [selectedSettlementId, setSelectedSettlementId] = React.useState(initialDemoState.settlementEntries[0].id);
  const [productConfig, setProductConfig] = React.useState<ProductConfig>(defaultProductConfig);
  const [testMode, setTestMode] = React.useState<"no-wallet" | "wallet">("no-wallet");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("Try without wallet is ready. Devnet/preview only.");
  const [x402Preview, setX402Preview] = React.useState("HTTP 402 preview is waiting.");

  React.useEffect(() => {
    try {
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
    } catch {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(productStorageKey);
      setMessage("Local demo state was reset because saved browser data was invalid.");
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  React.useEffect(() => {
    window.localStorage.setItem(productStorageKey, JSON.stringify(productConfig));
  }, [productConfig]);

  const selectedSettlement =
    state.settlementEntries.find((entry) => entry.id === selectedSettlementId) ?? state.settlementEntries[0];
  const latestBatch = state.payoutBatches[0];
  const latestCheckout = state.checkouts[0];
  const totalRevenue = React.useMemo(() => totalSettlement(state.settlementEntries), [state.settlementEntries]);
  const splitPreview = React.useMemo(
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
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-neutral-950/85 backdrop-blur-md">
        <nav className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a className="flex items-center gap-3 text-white no-underline" href="#top" onClick={closeMobileMenu}>
            <span className="grid size-9 place-items-center rounded-lg bg-lime font-black text-ink">D</span>
            <strong>DodoLaunch India</strong>
          </a>
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex">
            {navItems.map(([label, href]) => (
              <a className="text-sm font-semibold text-white/60 transition-colors hover:text-white" href={href} key={href}>
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <a
              className="hidden text-sm font-semibold text-white/60 transition-colors hover:text-white sm:inline"
              href="https://github.com/jerreenj/DodoLaunch-India/issues/new"
              target="_blank"
              rel="noreferrer"
            >
              Feedback
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </nav>
        {mobileMenuOpen ? (
          <div className="border-t border-white/10 bg-neutral-950 px-6 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map(([label, href]) => (
                <a className="py-2 text-sm font-semibold text-white/70" href={href} key={href} onClick={closeMobileMenu}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <section className="relative flex min-h-screen items-center overflow-hidden px-6 pb-20 pt-28" id="top">
        <div className="absolute inset-0 bg-[linear-gradient(140deg,#080b08_0%,#101713_42%,#020403_100%)]" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="py-10">
            <aside className="mb-8 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/70 backdrop-blur-sm">
              <span>Devnet/preview only</span>
              <span className="text-white/30">/</span>
              <span>No mainnet</span>
              <span className="text-white/30">/</span>
              <span>No paid services</span>
            </aside>
            <h1 className="max-w-4xl text-6xl font-semibold leading-none tracking-normal text-white md:text-8xl">
              DodoLaunch India
            </h1>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-white via-white/95 to-white/70 px-6 font-semibold text-ink shadow-glow transition-transform hover:scale-[1.02]"
                href="#launch"
              >
                Go to app <ArrowRight className="size-4" />
              </a>
              <a
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-6 font-semibold text-white hover:bg-white/15"
                href="#submit"
              >
                Check submission readiness
              </a>
            </div>
            <p className="mt-5 text-sm font-semibold text-white/60">{message}</p>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur">
            <p className="mb-3 text-xs font-bold uppercase text-lime">Dodo checkout to revenue splits</p>
            <h2 className="text-3xl font-semibold leading-tight text-white md:text-5xl">
              Sell globally, route revenue, and prepare Solana settlement from one founder workspace.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/65">
              Built for Indian AI and SaaS teams: create a Dodo checkout, route sale events into a ledger,
              export split reports, and test x402-style paid API revenue without needing a wallet.
            </p>
            <div className="mt-6 flex items-center justify-between gap-4 text-sm text-white/70">
              <span>Live MVP</span>
              <strong className="text-white">{testMode === "no-wallet" ? "No-wallet mode" : "Wallet tester mode"}</strong>
            </div>
            <div className="my-4 rounded-lg bg-white p-5 text-ink">
              <span className="text-sm font-bold text-neutral-500">Local demo ledger</span>
              <strong className="mt-2 block text-4xl">{formatMoney(totalRevenue)}</strong>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Dodo events", state.dodoEvents.length],
                ["Split mode", latestBatch?.executionStatus ?? "preview"],
                ["x402 route", state.x402Events.length ? "tested" : "ready"],
                ["Build cost", "$0"],
              ].map(([label, value]) => (
                <div className="rounded-lg border border-white/10 bg-white/10 p-4" key={label}>
                  <span className="text-xs font-bold text-white/50">{label}</span>
                  <strong className="mt-2 block text-xl text-white">{value}</strong>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-neutral-50 py-20 text-ink" id="guide">
        <SectionIntro eyebrow="First run" title="Give users a clean path instead of one giant page">
          Start with no wallet, then let technical testers opt into devnet instructions.
        </SectionIntro>
        <div className="mx-auto grid max-w-7xl gap-5 px-6 md:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-dodo">Try without wallet</p>
                <h3 className="text-2xl font-semibold">200-user pilot path</h3>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-dodo">
                recommended
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pilotSteps.map((step, index) => (
                <div className="min-h-28 rounded-lg border border-neutral-200 bg-neutral-50 p-4" key={step}>
                  <span className="grid size-8 place-items-center rounded-full bg-lime text-sm font-black">{index + 1}</span>
                  <strong className="mt-4 block">{step}</strong>
                </div>
              ))}
            </div>
            <div className="mt-5 inline-grid grid-cols-2 rounded-lg border border-neutral-200 bg-white p-1">
              <button
                className={`rounded-md px-4 py-2 text-sm font-bold ${testMode === "no-wallet" ? "bg-ink text-white" : "text-neutral-500"}`}
                type="button"
                onClick={() => {
                  setTestMode("no-wallet");
                  setMessage("Try without wallet mode selected. Best for first 200 users.");
                }}
              >
                Try without wallet
              </button>
              <button
                className={`rounded-md px-4 py-2 text-sm font-bold ${testMode === "wallet" ? "bg-ink text-white" : "text-neutral-500"}`}
                type="button"
                onClick={() => {
                  setTestMode("wallet");
                  setMessage("Wallet tester mode selected. Use Solana devnet only.");
                }}
              >
                Wallet tester
              </button>
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-dodo">Wallet testers</p>
                <h3 className="text-2xl font-semibold">Get devnet SOL</h3>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-frontier">
                devnet only
              </span>
            </div>
            <div className="grid gap-3">
              {devnetSteps.map((step) => (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4" key={step}>
                  {step}
                </div>
              ))}
            </div>
            <a
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-frontier px-4 font-semibold text-white"
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noreferrer"
            >
              Open official Solana devnet faucet <ExternalLink className="size-4" />
            </a>
          </Card>
        </div>
      </section>

      <section className="bg-[#ecf1eb] py-20 text-ink" id="launch">
        <SectionIntro eyebrow="Founder workspace" title="Configure the paid product users understand in 30 seconds">
          Everything saves locally in the browser so testers can explore without accounts or paid infrastructure.
        </SectionIntro>
        <div className="mx-auto grid max-w-7xl gap-5 px-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-dodo">Product setup</p>
                <h3 className="text-2xl font-semibold">Launch kit</h3>
              </div>
              <Button type="button" variant="secondary" onClick={saveLaunchKit}>
                Save locally
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2 text-sm font-bold text-neutral-500">
                Founder / company
                <input
                  className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-ink"
                  value={productConfig.founderName}
                  onChange={(event) => updateProduct("founderName", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-500">
                Product name
                <input
                  className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-ink"
                  value={productConfig.productName}
                  onChange={(event) => updateProduct("productName", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-500">
                Demo buyer
                <input
                  className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-ink"
                  value={productConfig.customerName}
                  onChange={(event) => updateProduct("customerName", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-500">
                Sale amount
                <input
                  className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-ink"
                  min="1"
                  type="number"
                  value={productConfig.amount}
                  onChange={(event) => updateProduct("amount", Number(event.target.value) || 1)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-500 sm:col-span-2">
                Product URL
                <input
                  className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-ink"
                  value={productConfig.productUrl}
                  onChange={(event) => updateProduct("productUrl", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-500 sm:col-span-2">
                Launch note
                <textarea
                  className="min-h-24 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-ink"
                  value={productConfig.launchNote}
                  onChange={(event) => updateProduct("launchNote", event.target.value)}
                />
              </label>
            </div>
          </Card>

          <Card className="bg-ink text-white">
            <p className="mb-3 text-xs font-bold uppercase text-lime">Revenue model</p>
            <h3 className="text-2xl font-semibold">{productConfig.productName}</h3>
            <div className="my-5 flex items-end justify-between gap-4 border-y border-white/10 py-5">
              <span className="text-white/50">Demo sale</span>
              <strong className="text-2xl">{formatMoney(productConfig.amount, productConfig.currency)}</strong>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Founder", "70%"],
                ["Growth + vendors", "20%"],
                ["Agent/runtime", "5%"],
                ["Platform fee", "5%"],
              ].map(([label, value]) => (
                <div className="rounded-lg border border-white/10 bg-white/10 p-4" key={label}>
                  <span className="text-sm text-white/55">{label}</span>
                  <strong className="mt-2 block text-2xl">{value}</strong>
                </div>
              ))}
            </div>
            <Button type="button" variant="gradient" className="mt-5 w-full" onClick={exportSplitCsv}>
              Export split CSV
            </Button>
          </Card>
        </div>
      </section>

      <section className="bg-neutral-50 py-20 text-ink" id="flow">
        <SectionIntro eyebrow="User flow" title="One row of actions, one clear story">
          Use this order for demos, early users, and the submission video.
        </SectionIntro>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Button type="button" disabled={busyAction !== null} onClick={createCheckout}>
              {busyAction === "checkout" ? "Creating..." : "Create checkout"}
            </Button>
            <Button type="button" variant="secondary" disabled={busyAction !== null} onClick={replayWebhook}>
              {busyAction === "webhook" ? "Replaying..." : "Replay webhook"}
            </Button>
            <Button type="button" variant="default" disabled={busyAction !== null} onClick={preparePayout}>
              {busyAction === "payout" ? "Preparing..." : "Build split"}
            </Button>
            <Button type="button" variant="secondary" disabled={busyAction !== null} onClick={runX402Demo}>
              {busyAction === "x402" ? "Routing..." : "Run x402"}
            </Button>
            <Button type="button" variant="ghost" className="border-neutral-200 bg-white text-ink hover:bg-neutral-100" onClick={resetDemo}>
              Reset
            </Button>
          </div>
          <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-5">
            <span className="text-sm font-bold text-neutral-500">Latest checkout</span>
            <strong className="mt-2 block break-words">{latestCheckout?.sessionId ?? "No checkout yet"}</strong>
            <p className="mt-2 break-words text-neutral-600">
              {latestCheckout?.checkoutUrl ?? "Create a checkout to start the Dodo sale story."}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#ecf1eb] py-20 text-ink" id="ledger">
        <SectionIntro eyebrow="Ledger and rules" title="Show the money path without pretending there is real volume">
          Users see how revenue would split while the app labels local demo ledger state clearly.
        </SectionIntro>
        <div className="mx-auto grid max-w-7xl gap-5 px-6 lg:grid-cols-2">
          <Card>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-dodo">Revenue ledger</p>
                <h3 className="text-2xl font-semibold">Product sales</h3>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase text-neutral-500">
                {state.settlementEntries.length} entries
              </span>
            </div>
            <div className="grid gap-3">
              {state.settlementEntries.map((entry) => (
                <button
                  className={`grid gap-2 rounded-lg border p-4 text-left sm:grid-cols-[80px_1fr_auto] ${
                    entry.id === selectedSettlement.id ? "border-frontier bg-blue-50" : "border-neutral-200 bg-neutral-50"
                  }`}
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedSettlementId(entry.id)}
                >
                  <span className="text-xs font-black text-frontier">{entry.source.toUpperCase()}</span>
                  <strong>{entry.label}</strong>
                  <em className="not-italic font-black">{formatMoney(entry.amount.amount, entry.amount.currency)}</em>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-dodo">Revenue rules</p>
                <h3 className="text-2xl font-semibold">Split model</h3>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase text-neutral-500">
                {recipients.reduce((sum, item) => sum + item.splitBps, 0) / 100}% routed
              </span>
            </div>
            <div className="grid gap-3">
              {splitPreview.map((recipient) => (
                <div className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4" key={recipient.id}>
                  <div>
                    <strong>{recipient.name}</strong>
                    <span className="mt-1 block text-sm text-neutral-500">
                      {recipient.role} - {recipient.region}
                    </span>
                  </div>
                  <em className="text-right not-italic font-black">{formatMoney(recipient.amount, productConfig.currency)}</em>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-neutral-50 py-20 text-ink" id="proof">
        <SectionIntro eyebrow="Proof and bonus" title="Separate real test paths from preview paths">
          The app does not show fake explorer links. Chain proof appears only after real devnet broadcast.
        </SectionIntro>
        <div className="mx-auto grid max-w-7xl gap-5 px-6 lg:grid-cols-2">
          <Card>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-dodo">Solana devnet</p>
                <h3 className="text-2xl font-semibold">Payout preview</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-frontier">
                {latestBatch?.network ?? "devnet"}
              </span>
            </div>
            {latestBatch ? (
              <>
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <span className="text-sm font-bold text-neutral-500">Split total</span>
                    <strong className="mt-2 block">{formatMoney(latestBatch.total.amount, latestBatch.total.currency)}</strong>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <span className="text-sm font-bold text-neutral-500">Chain status</span>
                    <strong className="mt-2 block">{latestBatch.executionStatus}</strong>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <span className="text-sm font-bold text-neutral-500">Cost status</span>
                    <strong className="mt-2 block">{latestBatch.costStatus}</strong>
                  </div>
                </div>
                <div className="grid gap-3">
                  {latestBatch.lines.map((line, index) => (
                    <div className="grid gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-[1fr_auto]" key={line.id}>
                      <span>{line.name}</span>
                      <strong className="break-all sm:text-right">
                        {formatMoney(line.amount.amount, line.amount.currency)} | preview {latestBatch.previewIds[index]}
                      </strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="leading-7 text-neutral-600">
                Build a split to generate a payout preview. Explorer links appear only after real devnet broadcast.
              </p>
            )}
          </Card>

          <Card>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-dodo">Bonus</p>
                <h3 className="text-2xl font-semibold">x402 API sale</h3>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase text-neutral-500">
                {state.x402Events.length ? "tested" : "ready"}
              </span>
            </div>
            <p className="leading-7 text-neutral-600">{x402Preview}</p>
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-4 rounded-lg bg-ink p-4 font-mono text-sm text-white">
              <span>GET /api/x402/agent-data</span>
              <strong className="text-lime">{state.x402Events.length ? "paid" : "402"}</strong>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-ink py-20 text-white" id="submit">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase text-lime">Before users and submission</p>
            <h2 className="max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">
              Hard truth: ready for a pilot, not ready to claim real payment volume.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">
              Send it to 20 users first. For final submission, be honest: Dodo test mode can be real with
              keys, Solana settlement is preview until devnet broadcast, and the build used no paid services.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-lime px-6 font-semibold text-ink"
                href="https://github.com/jerreenj/DodoLaunch-India"
                target="_blank"
                rel="noreferrer"
              >
                Open GitHub repo <ExternalLink className="size-4" />
              </a>
              <a
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-6 font-semibold text-white"
                href="https://github.com/jerreenj/DodoLaunch-India/issues/new"
                target="_blank"
                rel="noreferrer"
              >
                File feedback issue
              </a>
            </div>
          </div>
          <div className="grid gap-3">
            {submitChecklist.map((item, index) => (
              <div className="grid grid-cols-[38px_1fr] gap-3 rounded-lg border border-white/10 bg-white/10 p-4" key={item}>
                <span className="grid size-8 place-items-center rounded-full bg-lime text-sm font-black text-ink">{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
