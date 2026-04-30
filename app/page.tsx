const payoutRows = [
  { name: "Design contractor", region: "Philippines", amount: "$840", status: "Ready" },
  { name: "AI data vendor", region: "Vietnam", amount: "$1,250", status: "Review" },
  { name: "Growth partner", region: "UAE", amount: "$610", status: "Ready" },
];

const events = [
  "Dodo checkout created for Pro AI SaaS plan",
  "Payment succeeded webhook mapped to receivables",
  "Payout batch prepared on Solana devnet",
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <strong>Solana Dodo India</strong>
          <span>Frontier Hackathon</span>
        </nav>
        <div className="heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">Dodo checkout to Solana settlement</p>
            <h1>Global SaaS revenue in. Stablecoin payouts out.</h1>
            <p>
              A dashboard for Indian SaaS and AI founders who sell worldwide with
              Dodo Payments and need fast, programmable contractor payouts using
              Solana stablecoins.
            </p>
            <div className="actions">
              <a href="#demo">View Demo Flow</a>
              <a href="#plan" className="secondary">
                MVP Plan
              </a>
            </div>
          </div>
          <div className="terminal" aria-label="Settlement workflow preview">
            <div className="terminalTop">
              <span />
              <span />
              <span />
            </div>
            {events.map((event) => (
              <p key={event}>
                <span>$</span> {event}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="band">
        <div className="panel">
          <div>
            <p className="eyebrow">Operator view</p>
            <h2>Receivables and payouts in one place</h2>
          </div>
          <div className="metrics">
            <div>
              <span>Dodo GMV</span>
              <strong>$12,480</strong>
            </div>
            <div>
              <span>Batch cost</span>
              <strong>&lt; $0.01</strong>
            </div>
            <div>
              <span>ETA</span>
              <strong>Seconds</strong>
            </div>
          </div>
          <div className="table">
            {payoutRows.map((row) => (
              <div className="row" key={row.name}>
                <div>
                  <strong>{row.name}</strong>
                  <span>{row.region}</span>
                </div>
                <span>{row.amount}</span>
                <em>{row.status}</em>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plan" className="plan">
        <h2>Build plan</h2>
        <div className="steps">
          <article>
            <span>01</span>
            <h3>Dodo integration</h3>
            <p>Create checkout sessions and consume payment/subscription webhooks.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Settlement ledger</h3>
            <p>Map Dodo events to receivables, payout obligations, and merchant balances.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Solana payouts</h3>
            <p>Build, simulate, and submit stablecoin transfer batches from the dashboard.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

