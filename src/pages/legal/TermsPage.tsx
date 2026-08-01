export default function TermsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20 text-white">
      <h1 className="text-5xl font-bold mb-6">
        Terms of Service
      </h1>

      <p className="text-zinc-400 mb-10">
        Effective Date: August 1, 2026
      </p>

      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Acceptance</h2>
          <p className="text-zinc-300">
            By using VouchEdge, you agree to these Terms of Service.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Accounts</h2>
          <p className="text-zinc-300">
            Users are responsible for maintaining the security of their account credentials.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Subscriptions</h2>
          <p className="text-zinc-300">
            Paid subscriptions automatically renew unless cancelled before renewal.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Acceptable Use</h2>
          <p className="text-zinc-300">
            Users may not abuse, scrape, reverse engineer, or misuse the platform.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Termination</h2>
          <p className="text-zinc-300">
            We reserve the right to suspend or terminate accounts violating these terms.
          </p>
        </div>
      </section>
    </main>
  );
}
