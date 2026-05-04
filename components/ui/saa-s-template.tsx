"use client";

import React from "react";
import {
  ArrowRight,
  Bot,
  Check,
  CreditCard,
  ExternalLink,
  FileDown,
  Globe2,
  Menu,
  Network,
  RefreshCw,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";
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

type WorkspaceView = "launch" | "checkout" | "ledger" | "settlement" | "agent";

type SolanaProvider = {
  isPhantom?: boolean;
  publicKey?: { toString: () => string };
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect?: () => Promise<void>;
};

declare global {
  interface Window {
    phantom?: { solana?: SolanaProvider };
    solana?: SolanaProvider;
  }
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "gradient";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-semibold tracking-normal transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/70 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "border-lime bg-lime text-ink hover:bg-lime/90",
      secondary: "border-white/10 bg-white/10 text-white hover:border-white/20 hover:bg-white/15",
      ghost: "border-transparent bg-transparent text-white/68 hover:bg-white/10 hover:text-white",
      gradient:
        "border-white/20 bg-gradient-to-b from-white via-white/95 to-white/70 text-ink shadow-glow hover:translate-y-[-1px] active:translate-y-0",
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

const workspaceViews: Array<{
  id: WorkspaceView;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "launch",
    label: "Launch",
    description: "Product, buyer, and pricing",
    icon: Sparkles,
  },
  {
    id: "checkout",
    label: "Checkout",
    description: "Dodo payment session",
    icon: CreditCard,
  },
  {
    id: "ledger",
    label: "Ledger",
    description: "Revenue and split rules",
    icon: Network,
  },
  {
    id: "settlement",
    label: "Settlement",
    description: "Solana devnet readiness",
    icon: Wallet,
  },
  {
    id: "agent",
    label: "Agent Pay",
    description: "x402 paid API flow",
    icon: Bot,
  },
];

const devnetSteps = [
  "Switch your wallet network to Solana Devnet.",
  "Request test SOL from the official Solana faucet.",
  "Use devnet only for transaction testing; never mainnet for this build.",
  "Explorer proof appears only after an actual devnet broadcast exists.",
];

function ShellCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] ${className}`}>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-bold uppercase tracking-normal text-white/42">{children}</span>;
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-white/58 ${className}`}>
      {label}
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 rounded-lg border border-white/10 bg-black/24 px-3 text-white outline-none transition focus:border-lime/60 ${
        props.className ?? ""
      }`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-white outline-none transition focus:border-lime/60 ${
        props.className ?? ""
      }`}
    />
  );
}

function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "lime" | "blue";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border-white/10 bg-white/8 text-white/68",
    lime: "border-lime/30 bg-lime/12 text-lime",
    blue: "border-frontier/35 bg-frontier/12 text-blue-200",
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${tones[tone]}`}>{children}</span>;
}

function getSolanaProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  const phantomProvider = window.phantom?.solana;
  if (phantomProvider?.isPhantom) {
    return phantomProvider;
  }

  if (window.solana?.isPhantom) {
    return window.solana;
  }

  return null;
}

function shortWallet(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Component() {
  const [state, setState] = React.useState<DemoState>(initialDemoState);
  const [selectedSettlementId, setSelectedSettlementId] = React.useState(initialDemoState.settlementEntries[0].id);
  const [productConfig, setProductConfig] = React.useState<ProductConfig>(defaultProductConfig);
  const [mode, setMode] = React.useState<"trial" | "wallet">("trial");
  const [activeView, setActiveView] = React.useState<WorkspaceView>("launch");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("No wallet trial is ready. Use Dodo test credentials later when available.");
  const [x402Preview, setX402Preview] = React.useState("Agent data is protected until a payment proof is attached.");
  const [walletAddress, setWalletAddress] = React.useState("");
  const [walletError, setWalletError] = React.useState("");
  const [walletConnecting, setWalletConnecting] = React.useState(false);

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
      setMessage("Workspace reset after invalid saved browser state.");
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  React.useEffect(() => {
    window.localStorage.setItem(productStorageKey, JSON.stringify(productConfig));
  }, [productConfig]);

  React.useEffect(() => {
    const provider = getSolanaProvider();
    if (!provider) {
      return;
    }

    provider
      .connect({ onlyIfTrusted: true })
      .then((response) => {
        setWalletAddress(response.publicKey.toString());
        setMode("wallet");
      })
      .catch(() => {
        setWalletAddress("");
      });
  }, []);

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
      setMessage(data.message.replaceAll("Demo", "Sandbox"));
      setActiveView("checkout");
    });
  }

  async function replayWebhook() {
    if (!latestCheckout) {
      setMessage("Create a checkout session first.");
      setActiveView("checkout");
      return;
    }

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
      setMessage(data.message.replaceAll("demo", "sandbox"));
      setActiveView("ledger");
    });
  }

  async function preparePayout() {
    await runAction("payout", async () => {
      const response = await fetch("/api/solana/payouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settlement: selectedSettlement, mode: walletAddress ? "devnet" : "simulate" }),
      });
      const data = (await response.json()) as { batch: PayoutBatch; message: string };
      setState((current) => ({ ...current, payoutBatches: [data.batch, ...current.payoutBatches] }));
      setMessage(data.message);
      setActiveView("settlement");
    });
  }

  async function runX402Demo() {
    await runAction("x402", async () => {
      const challenge = await fetch("/api/x402/agent-data");
      const challengeBody = await challenge.json();
      setX402Preview(`${challenge.status}: ${challengeBody.message}`);

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
      setMessage(data.message.replaceAll("demo", "sandbox"));
      setActiveView("agent");
    });
  }

  async function connectWallet() {
    setMode("wallet");
    setActiveView("settlement");
    setWalletError("");

    const provider = getSolanaProvider();
    if (!provider) {
      const error = "No Solana wallet detected. Install Phantom, then switch it to devnet for testing.";
      setWalletError(error);
      setMessage(error);
      return;
    }

    setWalletConnecting(true);
    try {
      const response = await provider.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);
      setMessage(`Wallet connected: ${shortWallet(address)}. Use devnet only for settlement testing.`);
    } catch {
      const error = "Wallet connection was cancelled or blocked by the browser.";
      setWalletError(error);
      setMessage(error);
    } finally {
      setWalletConnecting(false);
    }
  }

  async function disconnectWallet() {
    const provider = getSolanaProvider();
    await provider?.disconnect?.();
    setWalletAddress("");
    setWalletError("");
    setMessage("Wallet disconnected. No wallet trial is still available.");
  }

  function resetWorkspace() {
    setState(initialDemoState);
    setSelectedSettlementId(initialDemoState.settlementEntries[0].id);
    setMessage("Workspace reset. No wallet trial is ready.");
    setX402Preview("Agent data is protected until a payment proof is attached.");
    setActiveView("launch");
  }

  function saveLaunchKit() {
    setMessage(`${productConfig.productName} launch kit saved in this browser.`);
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
    setMessage("Split CSV exported from the current workspace.");
  }

  function selectView(view: WorkspaceView) {
    setActiveView(view);
    setMobileMenuOpen(false);
  }

  function goToWorkspace(view: WorkspaceView) {
    selectView(view);
    window.requestAnimationFrame(() => {
      document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const activeViewMeta = workspaceViews.find((view) => view.id === activeView) ?? workspaceViews[0];
  const heroProductName = productConfig.productName.replace("SupportAgent", "Support Agent");

  return (
    <main className="min-h-screen bg-[#050705] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(216,241,106,0.13),transparent_28%),radial-gradient(circle_at_88%_0%,rgba(40,87,232,0.16),transparent_24%),linear-gradient(145deg,#050705_0%,#0c130f_48%,#040604_100%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050705]/88 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button className="flex items-center gap-3 text-left" type="button" onClick={() => selectView("launch")}>
            <span className="grid size-9 place-items-center rounded-lg bg-lime font-black text-ink">D</span>
            <span>
              <strong className="block text-sm leading-tight">DodoLaunch India</strong>
              <span className="hidden text-xs text-white/45 sm:block">Revenue OS for AI and SaaS founders</span>
            </span>
          </button>

          <div className="hidden items-center rounded-lg border border-white/10 bg-white/[0.045] p-1 md:flex">
            {workspaceViews.map((view) => (
              <button
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  activeView === view.id ? "bg-lime text-ink" : "text-white/58 hover:bg-white/8 hover:text-white"
                }`}
                key={view.id}
                type="button"
                onClick={() => selectView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <StatusPill tone={walletAddress || mode === "wallet" ? "blue" : "lime"}>
              {walletAddress ? shortWallet(walletAddress) : mode === "trial" ? "No wallet trial" : "Connect wallet"}
            </StatusPill>
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
          <div className="border-t border-white/10 bg-[#050705] px-4 py-3 md:hidden">
            <div className="grid gap-2">
              {workspaceViews.map((view) => (
                <button
                  className={`rounded-lg px-3 py-3 text-left text-sm font-semibold ${
                    activeView === view.id ? "bg-lime text-ink" : "bg-white/[0.055] text-white/70"
                  }`}
                  key={view.id}
                  type="button"
                  onClick={() => selectView(view.id)}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <section className="mx-auto grid min-h-[720px] max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            <StatusPill tone="lime">Dodo Payments</StatusPill>
            <StatusPill tone="blue">Solana devnet</StatusPill>
            <StatusPill>No mainnet funds</StatusPill>
          </div>
          <h1 className="max-w-3xl text-6xl font-semibold leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">
            DodoLaunch India
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
            A sleek revenue workspace for Indian AI and SaaS founders: sell with Dodo, route every paid event,
            split revenue with partners, and prepare Solana settlement when the team is ready.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="gradient" size="lg" onClick={() => goToWorkspace("launch")}>
              Go to app <ArrowRight className="size-4" />
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={createCheckout} disabled={busyAction !== null}>
              {busyAction === "checkout" ? "Creating..." : "Create checkout"}
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={connectWallet} disabled={walletConnecting}>
              <Wallet className="size-4" />
              {walletConnecting ? "Connecting..." : walletAddress ? shortWallet(walletAddress) : "Connect wallet"}
            </Button>
          </div>
          <p className="mt-5 max-w-xl text-sm font-medium text-white/48">{message}</p>
        </div>

        <ShellCard className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Label>Workspace health</Label>
              <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-4xl">Payments In, Splits Out</h2>
            </div>
            <span className="grid size-11 place-items-center rounded-lg bg-lime text-ink">
              <Zap className="size-5" />
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Revenue tracked", formatMoney(totalRevenue)],
              ["Dodo events", String(state.dodoEvents.length)],
              ["Split rules", `${recipients.reduce((sum, item) => sum + item.splitBps, 0) / 100}% Routed`],
              ["Settlement", latestBatch?.executionStatus === "broadcasted" ? "Broadcasted" : "Ready"],
            ].map(([label, value]) => (
              <div className="rounded-lg border border-white/10 bg-black/24 p-4" key={label}>
                <Label>{label}</Label>
                <strong className="mt-2 block text-2xl text-white">{value}</strong>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-lime/[0.08] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Label>Active product</Label>
              <StatusPill tone={walletAddress ? "blue" : "lime"}>
                {walletAddress ? "Wallet connected" : mode === "trial" ? "No wallet" : "Wallet tester"}
              </StatusPill>
            </div>
            <strong className="block text-xl">{heroProductName}</strong>
            <p className="mt-2 text-sm leading-6 text-white/55">{productConfig.launchNote}</p>
          </div>
        </ShellCard>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6" id="workspace">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-3 lg:sticky lg:top-20 lg:self-start">
            <div className="mb-3 px-2">
              <Label>Product console</Label>
              <h2 className="mt-2 text-xl font-semibold">{activeViewMeta.label}</h2>
              <p className="mt-1 text-sm leading-6 text-white/48">{activeViewMeta.description}</p>
            </div>
            <div className="grid gap-2">
              {workspaceViews.map((view) => {
                const Icon = view.icon;
                return (
                  <button
                    className={`grid grid-cols-[36px_1fr] items-center gap-3 rounded-lg p-3 text-left transition ${
                      activeView === view.id
                        ? "bg-lime text-ink"
                        : "border border-white/8 bg-black/18 text-white/70 hover:bg-white/8 hover:text-white"
                    }`}
                    key={view.id}
                    type="button"
                    onClick={() => selectView(view.id)}
                  >
                    <span className="grid size-9 place-items-center rounded-md bg-current/10">
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <strong className="block text-sm">{view.label}</strong>
                      <span className={`text-xs ${activeView === view.id ? "text-ink/62" : "text-white/38"}`}>
                        {view.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-h-[680px] rounded-lg border border-white/10 bg-[#080b08]/88 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.36)] sm:p-5">
            {activeView === "launch" ? (
              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <ShellCard>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <Label>Launch setup</Label>
                      <h3 className="mt-2 text-3xl font-semibold">Set the product and buyer</h3>
                    </div>
                    <Button type="button" variant="secondary" onClick={saveLaunchKit}>
                      Save
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Founder / company">
                      <TextInput value={productConfig.founderName} onChange={(event) => updateProduct("founderName", event.target.value)} />
                    </Field>
                    <Field label="Product name">
                      <TextInput value={productConfig.productName} onChange={(event) => updateProduct("productName", event.target.value)} />
                    </Field>
                    <Field label="Buyer">
                      <TextInput value={productConfig.customerName} onChange={(event) => updateProduct("customerName", event.target.value)} />
                    </Field>
                    <Field label="Amount">
                      <TextInput
                        min="1"
                        type="number"
                        value={productConfig.amount}
                        onChange={(event) => updateProduct("amount", Number(event.target.value) || 1)}
                      />
                    </Field>
                    <Field label="Product URL" className="sm:col-span-2">
                      <TextInput value={productConfig.productUrl} onChange={(event) => updateProduct("productUrl", event.target.value)} />
                    </Field>
                    <Field label="Buyer-facing offer" className="sm:col-span-2">
                      <TextArea value={productConfig.launchNote} onChange={(event) => updateProduct("launchNote", event.target.value)} />
                    </Field>
                  </div>
                </ShellCard>

                <ShellCard>
                  <Label>Commercial model</Label>
                  <h3 className="mt-2 text-3xl font-semibold">{formatMoney(productConfig.amount, productConfig.currency)}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/52">The current sale routes to founder, growth, vendor, agent runtime, and platform revenue.</p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      ["Founder", "70%"],
                      ["Growth", "10%"],
                      ["Vendor", "10%"],
                      ["Agent + platform", "10%"],
                    ].map(([label, value]) => (
                      <div className="rounded-lg border border-white/10 bg-black/24 p-4" key={label}>
                        <Label>{label}</Label>
                        <strong className="mt-2 block text-2xl">{value}</strong>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="gradient" className="mt-5 w-full" onClick={() => selectView("checkout")}>
                    Continue to checkout <ArrowRight className="size-4" />
                  </Button>
                </ShellCard>
              </div>
            ) : null}

            {activeView === "checkout" ? (
              <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <ShellCard>
                  <Label>Dodo payment rail</Label>
                  <h3 className="mt-2 text-3xl font-semibold">Create a checkout, then record the sale</h3>
                  <p className="mt-3 text-sm leading-6 text-white/54">
                    This path uses Dodo test credentials when configured. Without keys, the app uses a sandbox adapter so users can still experience the product.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <Button type="button" variant="gradient" disabled={busyAction !== null} onClick={createCheckout}>
                      {busyAction === "checkout" ? "Creating checkout..." : "Create Dodo checkout"}
                    </Button>
                    <Button type="button" variant="secondary" disabled={busyAction !== null} onClick={replayWebhook}>
                      {busyAction === "webhook" ? "Recording sale..." : "Record successful sale"}
                    </Button>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <StatusPill tone={latestCheckout?.mode === "test" ? "lime" : "neutral"}>
                      {latestCheckout?.mode === "test" ? "Dodo test API" : "Sandbox adapter"}
                    </StatusPill>
                    <StatusPill>No paid database</StatusPill>
                  </div>
                </ShellCard>

                <ShellCard>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <Label>Checkout session</Label>
                      <h3 className="mt-2 text-2xl font-semibold">{latestCheckout?.sessionId ?? "No session yet"}</h3>
                    </div>
                    <CreditCard className="size-6 text-lime" />
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/24 p-4">
                    <Label>Payment link</Label>
                    <p className="mt-2 break-words text-sm leading-6 text-white/64">
                      {latestCheckout?.checkoutUrl ?? "Create a checkout session to generate a buyer-facing payment link."}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-black/24 p-4">
                      <Label>Buyer</Label>
                      <strong className="mt-2 block">{latestCheckout?.customer ?? productConfig.customerName}</strong>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/24 p-4">
                      <Label>Product</Label>
                      <strong className="mt-2 block">{latestCheckout?.productName ?? productConfig.productName}</strong>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/24 p-4">
                      <Label>Amount</Label>
                      <strong className="mt-2 block">
                        {latestCheckout ? formatMoney(latestCheckout.amount.amount, latestCheckout.amount.currency) : formatMoney(productConfig.amount, productConfig.currency)}
                      </strong>
                    </div>
                  </div>
                </ShellCard>
              </div>
            ) : null}

            {activeView === "ledger" ? (
              <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <ShellCard>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <Label>Revenue ledger</Label>
                      <h3 className="mt-2 text-3xl font-semibold">Paid events</h3>
                    </div>
                    <StatusPill tone="lime">{state.settlementEntries.length} entries</StatusPill>
                  </div>
                  <div className="grid gap-3">
                    {state.settlementEntries.map((entry) => (
                      <button
                        className={`grid gap-2 rounded-lg border p-4 text-left transition sm:grid-cols-[72px_1fr_auto] ${
                          entry.id === selectedSettlement.id
                            ? "border-lime/50 bg-lime/[0.1]"
                            : "border-white/10 bg-black/24 hover:bg-white/8"
                        }`}
                        key={entry.id}
                        type="button"
                        onClick={() => setSelectedSettlementId(entry.id)}
                      >
                        <span className="text-xs font-black uppercase text-lime">{entry.source}</span>
                        <span>
                          <strong className="block">{entry.label}</strong>
                          <span className="text-sm text-white/42">{entry.payer}</span>
                        </span>
                        <em className="not-italic font-black">{formatMoney(entry.amount.amount, entry.amount.currency)}</em>
                      </button>
                    ))}
                  </div>
                </ShellCard>

                <ShellCard>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <Label>Split rules</Label>
                      <h3 className="mt-2 text-3xl font-semibold">Revenue routing</h3>
                    </div>
                    <Button type="button" variant="secondary" onClick={exportSplitCsv}>
                      <FileDown className="size-4" /> CSV
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    {splitPreview.map((recipient) => (
                      <div className="grid gap-3 rounded-lg border border-white/10 bg-black/24 p-4 sm:grid-cols-[1fr_auto]" key={recipient.id}>
                        <span>
                          <strong className="block">{recipient.name}</strong>
                          <span className="text-sm text-white/42">
                            {recipient.role} / {recipient.region} / {recipient.splitBps / 100}%
                          </span>
                        </span>
                        <strong className="sm:text-right">{formatMoney(recipient.amount, productConfig.currency)}</strong>
                      </div>
                    ))}
                  </div>
                </ShellCard>
              </div>
            ) : null}

            {activeView === "settlement" ? (
              <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <ShellCard>
                  <Label>Solana settlement</Label>
                  <h3 className="mt-2 text-3xl font-semibold">Prepare a devnet batch</h3>
                  <p className="mt-3 text-sm leading-6 text-white/54">
                    The product prepares payout lines from verified ledger entries. It does not show chain proof until a real devnet transaction is broadcast.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <Button type="button" variant="gradient" disabled={busyAction !== null} onClick={preparePayout}>
                      {busyAction === "payout" ? "Preparing..." : "Prepare payout batch"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setMode(mode === "trial" ? "wallet" : "trial")}>
                      {mode === "trial" ? "Show wallet tester path" : "Use no wallet trial"}
                    </Button>
                    <Button type="button" variant={walletAddress ? "secondary" : "default"} onClick={connectWallet} disabled={walletConnecting}>
                      <Wallet className="size-4" />
                      {walletConnecting ? "Connecting wallet..." : walletAddress ? `Connected ${shortWallet(walletAddress)}` : "Connect Phantom wallet"}
                    </Button>
                  </div>
                  {mode === "wallet" ? (
                    <div className="mt-5 grid gap-3">
                      <div className="rounded-lg border border-white/10 bg-black/24 p-4">
                        <Label>Wallet status</Label>
                        <strong className="mt-2 block break-all text-white">
                          {walletAddress || "No wallet connected yet"}
                        </strong>
                        {walletError ? <p className="mt-2 text-sm leading-6 text-red-200">{walletError}</p> : null}
                        {walletAddress ? (
                          <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={disconnectWallet}>
                            Disconnect wallet
                          </Button>
                        ) : null}
                      </div>
                      {devnetSteps.map((step) => (
                        <div className="flex gap-3 rounded-lg border border-white/10 bg-black/24 p-3" key={step}>
                          <Check className="mt-0.5 size-4 shrink-0 text-lime" />
                          <span className="text-sm leading-6 text-white/58">{step}</span>
                        </div>
                      ))}
                      <a
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-frontier px-4 text-sm font-semibold text-white"
                        href="https://faucet.solana.com/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Solana faucet <ExternalLink className="size-4" />
                      </a>
                    </div>
                  ) : null}
                </ShellCard>

                <ShellCard>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <Label>Batch status</Label>
                      <h3 className="mt-2 text-3xl font-semibold">
                        {latestBatch?.executionStatus === "broadcasted" ? "Broadcasted" : "Ready"}
                      </h3>
                    </div>
                    <StatusPill tone="blue">{latestBatch?.network ?? "devnet"}</StatusPill>
                  </div>
                  {latestBatch ? (
                    <div className="grid gap-3">
                      {latestBatch.lines.map((line, index) => (
                        <div className="grid gap-2 rounded-lg border border-white/10 bg-black/24 p-4 sm:grid-cols-[1fr_auto]" key={line.id}>
                          <span>
                            <strong className="block">{line.name}</strong>
                            <span className="text-sm text-white/42">{latestBatch.previewIds[index]}</span>
                          </span>
                          <strong>{formatMoney(line.amount.amount, line.amount.currency)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-black/24 p-5 text-sm leading-6 text-white/56">
                      Select a ledger entry and prepare a batch. The output remains clearly labeled until a devnet broadcast is available.
                    </div>
                  )}
                </ShellCard>
              </div>
            ) : null}

            {activeView === "agent" ? (
              <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <ShellCard>
                  <Label>Agentic payments</Label>
                  <h3 className="mt-2 text-3xl font-semibold">Protect API revenue with x402</h3>
                  <p className="mt-3 text-sm leading-6 text-white/54">
                    AI agents can hit a paid endpoint, receive a 402 challenge, attach payment proof, and route the resulting revenue into the same ledger.
                  </p>
                  <Button type="button" variant="gradient" className="mt-5" disabled={busyAction !== null} onClick={runX402Demo}>
                    {busyAction === "x402" ? "Routing..." : "Run paid API flow"}
                  </Button>
                </ShellCard>

                <ShellCard>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <Label>Protected route</Label>
                      <h3 className="mt-2 text-3xl font-semibold">/api/x402/agent-data</h3>
                    </div>
                    <StatusPill tone={state.x402Events.length ? "lime" : "neutral"}>
                      {state.x402Events.length ? "Paid" : "402"}
                    </StatusPill>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-sm text-white/70">
                    GET /api/x402/agent-data
                    <br />
                    x-payment: {state.x402Events.length ? "demo-paid" : "required"}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/56">{x402Preview}</p>
                </ShellCard>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center">
              <p className="text-sm leading-6 text-white/52">
                Product status: Dodo test credentials are optional, Solana is devnet-only, and no paid services are required to use the trial workspace.
              </p>
              <Button type="button" variant="ghost" onClick={resetWorkspace}>
                <RefreshCw className="size-4" /> Reset workspace
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-white/40 sm:px-6">
        <Globe2 className="mx-auto mb-3 size-5 text-lime" />
        DodoLaunch India runs as a public product workspace for test-mode checkout, revenue routing, and devnet settlement preparation.
      </footer>
    </main>
  );
}
