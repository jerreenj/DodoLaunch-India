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
  Network,
  RefreshCw,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { defaultProductConfig, initialDemoState, recipients } from "@/lib/demo-data";
import { formatMoney, totalSettlement } from "@/lib/settlement";
import type {
  DemoState,
  DodoCheckout,
  DodoPaymentEvent,
  MainnetTransactionStatus,
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
  signTransaction?: <T>(transaction: T) => Promise<T>;
  signAndSendTransaction?: <T>(transaction: T) => Promise<{ signature: string }>;
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
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-semibold tracking-normal transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dodo/70 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "border-dodo bg-dodo text-white hover:bg-dodo/90",
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
    description: "Solana mainnet readiness",
    icon: Wallet,
  },
  {
    id: "agent",
    label: "Agent Pay",
    description: "x402 paid API flow",
    icon: Bot,
  },
];

const productionWalletSteps = [
  "Open this app in a wallet-enabled browser with Phantom or another Solana wallet.",
  "Switch your wallet to Solana Mainnet Beta before production settlement.",
  "Keep enough SOL for network fees and enough USDC for payouts.",
  "Explorer proof appears only after a real wallet-approved mainnet broadcast exists.",
];

const MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

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
      className={`h-11 rounded-lg border border-white/10 bg-black/25 px-3 text-white outline-none transition focus:border-dodo/70 ${
        props.className ?? ""
      }`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-24 rounded-lg border border-white/10 bg-black/25 p-3 text-white outline-none transition focus:border-dodo/70 ${
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
    neutral: "border-white/10 bg-white/[0.08] text-white/68",
    lime: "border-dodo/35 bg-dodo/[0.16] text-emerald-100",
    blue: "border-frontier/35 bg-frontier/[0.14] text-blue-200",
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

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

export default function Component() {
  const [state, setState] = React.useState<DemoState>(initialDemoState);
  const [selectedSettlementId, setSelectedSettlementId] = React.useState(initialDemoState.settlementEntries[0].id);
  const [productConfig, setProductConfig] = React.useState<ProductConfig>(defaultProductConfig);
  const [walletPanelOpen, setWalletPanelOpen] = React.useState(false);
  const [activeView, setActiveView] = React.useState<WorkspaceView>("launch");
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("Ready: create a Dodo checkout, record the sale, then approve USDC payout from a wallet.");
  const [x402Preview, setX402Preview] = React.useState("Agent data is protected until a payment proof is attached.");
  const [walletAddress, setWalletAddress] = React.useState("");
  const [walletError, setWalletError] = React.useState("");
  const [walletConnecting, setWalletConnecting] = React.useState(false);
  const [mainnetTx, setMainnetTx] = React.useState<MainnetTransactionStatus>({ status: "idle" });

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as DemoState;
        const migrated: DemoState = {
          ...parsed,
          checkouts: parsed.checkouts.map((checkout) => ({
            ...checkout,
            amount: { ...checkout.amount, currency: "USDC" },
          })),
          dodoEvents: parsed.dodoEvents.map((event) => ({
            ...event,
            amount: { ...event.amount, currency: "USDC" },
          })),
          x402Events: parsed.x402Events.map((event) => ({
            ...event,
            amount: { ...event.amount, currency: "USDC" },
          })),
          settlementEntries: parsed.settlementEntries.map((entry) => ({
            ...entry,
            amount: { ...entry.amount, currency: "USDC" },
          })),
          payoutBatches: parsed.payoutBatches.map((batch) => ({
            ...batch,
            total: { ...batch.total, currency: "USDC" },
            lines: batch.lines.map((line) => ({
              ...line,
              amount: { ...line.amount, currency: "USDC" },
            })),
          })),
        };
        setState(migrated);
        setSelectedSettlementId(parsed.settlementEntries[0]?.id ?? initialDemoState.settlementEntries[0].id);
      }

      const savedProduct = window.localStorage.getItem(productStorageKey);
      if (savedProduct) {
        const parsedProduct = JSON.parse(savedProduct) as ProductConfig;
        setProductConfig({ ...parsedProduct, currency: "USDC" });
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
        setWalletPanelOpen(true);
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
    if (!walletAddress) {
      await connectWallet();
      setMessage("Connect a wallet before preparing the mainnet settlement batch.");
      return;
    }

    await runAction("payout", async () => {
      const response = await fetch("/api/solana/payouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settlement: selectedSettlement, mode: "mainnet" }),
      });
      const data = (await response.json()) as { batch: PayoutBatch; message: string };
      setState((current) => ({ ...current, payoutBatches: [data.batch, ...current.payoutBatches] }));
      setMainnetTx({ status: "idle" });
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
    setWalletPanelOpen(true);
    setActiveView("settlement");
    setWalletError("");

    const provider = getSolanaProvider();
    if (!provider) {
      const error = "No Solana wallet detected. Install Phantom or open this app in a wallet-enabled browser.";
      setWalletError(error);
      setMessage(error);
      return;
    }

    setWalletConnecting(true);
    try {
      const response = await provider.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);
      setMessage(`Wallet connected: ${shortWallet(address)}. Mainnet settlement batches can now be prepared for wallet approval.`);
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
    setMainnetTx({ status: "idle" });
    setMessage("Wallet disconnected. Connect a wallet before mainnet settlement.");
  }

  async function broadcastMainnetBatch() {
    const batch = latestBatch;
    if (!batch) {
      setMessage("Prepare a mainnet settlement batch before wallet approval.");
      setActiveView("settlement");
      return;
    }

    const provider = getSolanaProvider();
    if (!provider || !walletAddress) {
      await connectWallet();
      return;
    }

    setMainnetTx({ status: "building" });
    try {
      const [{ Connection, PublicKey, Transaction }, splToken] = await Promise.all([
        import("@solana/web3.js"),
        import("@solana/spl-token"),
      ]);
      const {
        createAssociatedTokenAccountIdempotentInstruction,
        createTransferCheckedInstruction,
        getAssociatedTokenAddressSync,
      } = splToken;

      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
      const connection = new Connection(rpcUrl, "confirmed");
      const payer = new PublicKey(walletAddress);
      const mint = new PublicKey(MAINNET_USDC_MINT);
      const sourceTokenAccount = getAssociatedTokenAddressSync(mint, payer);
      const transaction = new Transaction();

      for (const line of batch.lines) {
        const recipient = new PublicKey(line.wallet);
        const destinationTokenAccount = getAssociatedTokenAddressSync(mint, recipient);
        const tokenAmount = BigInt(Math.round(line.amount.amount * 1_000_000));

        transaction.add(
          createAssociatedTokenAccountIdempotentInstruction(payer, destinationTokenAccount, recipient, mint),
          createTransferCheckedInstruction(sourceTokenAccount, mint, destinationTokenAccount, payer, tokenAmount, 6),
        );
      }

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      transaction.feePayer = payer;
      transaction.recentBlockhash = latestBlockhash.blockhash;
      setMainnetTx({ status: "awaiting-wallet" });

      let signature = "";
      if (provider.signAndSendTransaction) {
        const result = await provider.signAndSendTransaction(transaction);
        signature = result.signature;
      } else if (provider.signTransaction) {
        const signed = await provider.signTransaction(transaction);
        const rawTransaction = signed.serialize();
        signature = await connection.sendRawTransaction(rawTransaction, { skipPreflight: false });
      } else {
        throw new Error("Connected wallet does not support transaction signing.");
      }

      setMainnetTx({ status: "broadcasted", signature });
      setState((current) => ({
        ...current,
        payoutBatches: current.payoutBatches.map((item) =>
          item.id === batch.id
            ? {
                ...item,
                executionStatus: "broadcasted",
                chainProofUrls: [`https://solscan.io/tx/${signature}`],
              }
            : item,
        ),
      }));
      setMessage(`Mainnet transaction broadcast: ${signature.slice(0, 8)}...${signature.slice(-8)}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Wallet rejected or RPC could not broadcast the transaction.";
      setMainnetTx({ status: "failed", error: detail });
      setMessage(`Mainnet transaction not broadcast: ${detail}`);
    }
  }

  function resetWorkspace() {
    setState(initialDemoState);
    setSelectedSettlementId(initialDemoState.settlementEntries[0].id);
    setMessage("Ready: create a Dodo checkout, record the sale, then approve USDC payout from a wallet.");
    setX402Preview("Agent data is protected until a payment proof is attached.");
    setMainnetTx({ status: "idle" });
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
        titleCase(row.role),
        titleCase(row.region),
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
  }

  function goToWorkspace(view: WorkspaceView) {
    selectView(view);
    window.requestAnimationFrame(() => {
      document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const activeViewMeta = workspaceViews.find((view) => view.id === activeView) ?? workspaceViews[0];
  const heroProductName = productConfig.productName.replace("SupportAgent", "Support Agent");
  const transactionSteps = [
    ["1", "Ledger", selectedSettlement ? "Revenue selected" : "Select revenue"],
    ["2", "Batch", latestBatch ? `${latestBatch.lines.length} payout lines` : "Prepare mainnet batch"],
    ["3", "Wallet", walletAddress ? shortWallet(walletAddress) : "Connect wallet"],
    ["4", "Broadcast", mainnetTx.status === "broadcasted" ? "Signature live" : "Awaiting approval"],
  ];

  return (
    <main className="min-h-screen bg-[#050705] bg-[linear-gradient(180deg,#050705_0%,#09100c_48%,#050705_100%)] text-white">

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050705]/88 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button className="flex items-center gap-3 text-left" type="button" onClick={() => selectView("launch")}>
            <span className="grid size-9 place-items-center rounded-lg bg-dodo font-black text-white">D</span>
            <span>
              <strong className="block text-sm leading-tight">DodoLaunch India</strong>
              <span className="hidden text-xs text-white/45 sm:block">Revenue OS for AI and SaaS founders</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <Button type="button" variant={walletAddress ? "secondary" : "default"} size="sm" onClick={connectWallet} disabled={walletConnecting}>
              <Wallet className="size-4" />
              {walletConnecting ? "Connecting..." : walletAddress ? shortWallet(walletAddress) : "Connect wallet"}
            </Button>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase text-emerald-200/80">Dodo checkout to Solana USDC payouts</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl">
            Sell globally. Split revenue instantly.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/64 sm:text-lg">
            A mainnet-ready workspace for AI and SaaS founders: create a Dodo checkout, record paid sales,
            calculate partner splits, export reports, and approve USDC payouts from your wallet.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="gradient" size="lg" onClick={() => goToWorkspace("launch")}>
              Open console <ArrowRight className="size-4" />
            </Button>
            <Button type="button" variant="default" size="lg" onClick={createCheckout} disabled={busyAction !== null}>
              {busyAction === "checkout" ? "Creating..." : "Create checkout"}
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={connectWallet} disabled={walletConnecting}>
              <Wallet className="size-4" />
              {walletConnecting ? "Connecting..." : walletAddress ? shortWallet(walletAddress) : "Connect wallet"}
            </Button>
          </div>
          <p className="mt-5 max-w-xl text-sm font-medium text-white/48">{message}</p>
        </div>

        <section className="rounded-lg border border-white/10 bg-[#09110d]/92 p-4 shadow-[0_32px_110px_rgba(0,0,0,0.34)] sm:p-5">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <Label>Live operating board</Label>
              <h2 className="mt-2 text-3xl font-semibold leading-tight">From checkout to payout</h2>
            </div>
            <span className="grid size-11 place-items-center rounded-lg bg-white/10 text-emerald-200">
              <Zap className="size-5" />
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Tracked revenue", formatMoney(totalRevenue, productConfig.currency)],
              ["Dodo events", String(state.dodoEvents.length)],
              ["Split coverage", `${recipients.reduce((sum, item) => sum + item.splitBps, 0) / 100}%`],
              ["Settlement", latestBatch?.executionStatus === "broadcasted" ? "Broadcasted" : "Ready"],
            ].map(([label, value]) => (
              <div className="rounded-lg border border-white/10 bg-black/25 p-4" key={label}>
                <Label>{label}</Label>
                <strong className="mt-2 block text-2xl text-white">{value}</strong>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-black/25 p-4">
            <div className="flex items-center justify-between gap-3">
              <Label>Active launch</Label>
              <StatusPill tone={walletAddress ? "blue" : "neutral"}>{walletAddress ? "Wallet connected" : "Wallet needed"}</StatusPill>
            </div>
            <strong className="block text-xl">{heroProductName}</strong>
            <p className="text-sm leading-6 text-white/58">{productConfig.launchNote}</p>
          </div>

          <div className="mt-4 grid gap-3">
            {[
              ["1", "Create Dodo checkout", latestCheckout ? "Done" : "Pending"],
              ["2", "Record successful sale", state.settlementEntries.length ? "Ledger active" : "Awaiting sale"],
              ["3", "Approve USDC payout", mainnetTx.status === "broadcasted" ? "Proof live" : "Wallet approval"],
            ].map(([index, title, detail]) => (
              <div className="grid grid-cols-[34px_1fr] items-center gap-3 rounded-lg border border-white/10 bg-black/25 p-3" key={title}>
                <span className="grid size-8 place-items-center rounded-md bg-white/10 text-xs font-black text-emerald-200">{index}</span>
                <span>
                  <strong className="block text-sm">{title}</strong>
                  <span className="text-xs text-white/45">{detail}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6" id="workspace">
        <div className="rounded-lg border border-white/10 bg-[#070b08]/92 p-3 shadow-[0_30px_120px_rgba(0,0,0,0.34)] sm:p-4">
          <div className="grid gap-4 border-b border-white/10 pb-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Label>Product console</Label>
              <h2 className="mt-2 text-3xl font-semibold">{activeViewMeta.label}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">{activeViewMeta.description}</p>
            </div>
            <div className="flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-black/20 p-1">
              {workspaceViews.map((view) => {
                const Icon = view.icon;
                return (
                  <button
                    className={`inline-flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                      activeView === view.id ? "bg-white text-ink" : "text-white/58 hover:bg-white/[0.08] hover:text-white"
                    }`}
                    key={view.id}
                    type="button"
                    onClick={() => selectView(view.id)}
                  >
                    <Icon className="size-4" />
                    {view.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-[620px] pt-4">
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
                    <Field label="Founder / Company">
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
                  <p className="mt-2 text-sm leading-6 text-white/52">The current sale routes to Founder, Growth, Vendor, Agent Runtime, and Platform revenue.</p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      ["Founder", "70%"],
                      ["Growth", "10%"],
                      ["Vendor", "10%"],
                      ["Agent + Platform", "10%"],
                    ].map(([label, value]) => (
                      <div className="rounded-lg border border-white/10 bg-black/25 p-4" key={label}>
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
                    This path uses Dodo live credentials when configured. Without keys, the app uses a sandbox adapter so users can still experience the product.
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
                    <StatusPill tone={latestCheckout?.mode === "live" ? "lime" : "neutral"}>
                      {latestCheckout?.mode === "live" ? "Dodo live API" : latestCheckout?.mode === "test" ? "Dodo test API" : "Sandbox adapter"}
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
                    <CreditCard className="size-6 text-emerald-200" />
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                    <Label>Payment link</Label>
                    <p className="mt-2 break-words text-sm leading-6 text-white/64">
                      {latestCheckout?.checkoutUrl ?? "Create a checkout session to generate a buyer-facing payment link."}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <Label>Buyer</Label>
                      <strong className="mt-2 block">{latestCheckout?.customer ?? productConfig.customerName}</strong>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <Label>Product</Label>
                      <strong className="mt-2 block">{latestCheckout?.productName ?? productConfig.productName}</strong>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
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
                            ? "border-dodo/55 bg-dodo/[0.14]"
                            : "border-white/10 bg-black/25 hover:bg-white/[0.08]"
                        }`}
                        key={entry.id}
                        type="button"
                        onClick={() => setSelectedSettlementId(entry.id)}
                      >
                        <span className="text-xs font-black uppercase text-emerald-200">{entry.source}</span>
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
                      <div className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-4 sm:grid-cols-[1fr_auto]" key={recipient.id}>
                        <span>
                          <strong className="block">{recipient.name}</strong>
                          <span className="text-sm text-white/42">
                            {titleCase(recipient.role)} / {titleCase(recipient.region)} / {recipient.splitBps / 100}%
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
                  <h3 className="mt-2 text-3xl font-semibold">Prepare a mainnet batch</h3>
                  <p className="mt-3 text-sm leading-6 text-white/54">
                    The product prepares payout lines from verified ledger entries. It does not show chain proof until a real mainnet transaction is wallet-approved and broadcast.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <Button type="button" variant="gradient" disabled={busyAction !== null} onClick={preparePayout}>
                      {busyAction === "payout" ? "Preparing..." : "Prepare payout batch"}
                    </Button>
                    <Button type="button" variant={walletAddress ? "secondary" : "default"} onClick={connectWallet} disabled={walletConnecting}>
                      <Wallet className="size-4" />
                      {walletConnecting ? "Connecting wallet..." : walletAddress ? `Connected ${shortWallet(walletAddress)}` : "Connect Phantom wallet"}
                    </Button>
                    <Button type="button" variant="secondary" disabled={!latestBatch || mainnetTx.status === "building" || mainnetTx.status === "awaiting-wallet"} onClick={broadcastMainnetBatch}>
                      {mainnetTx.status === "building"
                        ? "Building transaction..."
                        : mainnetTx.status === "awaiting-wallet"
                          ? "Awaiting wallet..."
                          : "Approve mainnet transfer"}
                    </Button>
                  </div>
                  <div className="mt-5 grid gap-2">
                    {transactionSteps.map(([index, title, detail]) => (
                      <div className="grid grid-cols-[34px_1fr] items-center gap-3 rounded-lg border border-white/10 bg-black/25 p-3" key={title}>
                        <span className="grid size-8 place-items-center rounded-md bg-white/10 text-xs font-black text-emerald-200">{index}</span>
                        <span>
                          <strong className="block text-sm">{title}</strong>
                          <span className="text-xs text-white/45">{detail}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {walletPanelOpen || walletAddress || walletError ? (
                    <div className="mt-5 grid gap-3">
                      <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                        <Label>Wallet status</Label>
                        <strong className="mt-2 block break-all text-white">
                          {walletAddress || "Wallet connection pending"}
                        </strong>
                        {walletError ? <p className="mt-2 text-sm leading-6 text-red-200">{walletError}</p> : null}
                        {mainnetTx.status !== "idle" ? (
                          <p className={`mt-2 text-sm leading-6 ${mainnetTx.status === "failed" ? "text-red-200" : "text-emerald-200"}`}>
                            {mainnetTx.status === "broadcasted" && mainnetTx.signature
                              ? `Broadcasted: ${shortWallet(mainnetTx.signature)}`
                              : mainnetTx.status === "failed"
                                ? mainnetTx.error
                                : mainnetTx.status === "awaiting-wallet"
                                  ? "Approve the transaction in your wallet."
                                  : "Building the mainnet USDC transfer transaction."}
                          </p>
                        ) : null}
                        {walletAddress ? (
                          <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={disconnectWallet}>
                            Disconnect wallet
                          </Button>
                        ) : null}
                      </div>
                      {productionWalletSteps.map((step) => (
                        <div className="flex gap-3 rounded-lg border border-white/10 bg-black/25 p-3" key={step}>
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-200" />
                          <span className="text-sm leading-6 text-white/58">{step}</span>
                        </div>
                      ))}
                      <a
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-frontier px-4 text-sm font-semibold text-white"
                        href="https://phantom.com/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Install Phantom <ExternalLink className="size-4" />
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
                    <StatusPill tone="blue">{latestBatch?.network ?? "mainnet-beta"}</StatusPill>
                  </div>
                  {latestBatch ? (
                    <div className="grid gap-3">
                      <div className="rounded-lg border border-dodo/30 bg-dodo/[0.12] p-4">
                        <Label>Mainnet transfer</Label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                          <strong className="text-lg">{formatMoney(latestBatch.total.amount, latestBatch.total.currency)}</strong>
                          <span className="text-sm text-white/55">{latestBatch.network}</span>
                          <span className="break-all text-xs text-white/45">{latestBatch.tokenMint}</span>
                        </div>
                        {latestBatch.chainProofUrls[0] ? (
                          <a className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200" href={latestBatch.chainProofUrls[0]} target="_blank" rel="noreferrer">
                            View Solscan proof <ExternalLink className="size-4" />
                          </a>
                        ) : null}
                      </div>
                      {latestBatch.lines.map((line, index) => (
                        <div className="grid gap-2 rounded-lg border border-white/10 bg-black/25 p-4 sm:grid-cols-[1fr_auto]" key={line.id}>
                          <span>
                            <strong className="block">{line.name}</strong>
                            <span className="text-sm text-white/42">{latestBatch.previewIds[index]}</span>
                          </span>
                          <strong>{formatMoney(line.amount.amount, line.amount.currency)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/56">
                      Select a ledger entry and prepare a batch. The output remains clearly labeled until a wallet-approved mainnet broadcast is available.
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
                Product status: Dodo live credentials are supported, Solana settlement is mainnet-ready, and real funds require wallet approval.
              </p>
              <Button type="button" variant="ghost" onClick={resetWorkspace}>
                <RefreshCw className="size-4" /> Reset workspace
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-white/40 sm:px-6">
        <Globe2 className="mx-auto mb-3 size-5 text-emerald-200" />
        DodoLaunch India runs as a public product workspace for live checkout configuration, revenue routing, and mainnet settlement preparation.
      </footer>
    </main>
  );
}
