export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20 text-white">
      <h1 className="mb-6 text-5xl font-bold">
        Security
      </h1>

      <section className="space-y-8 text-zinc-300">
        <p>
          Protecting user data is one of VouchEdge's highest priorities.
        </p>

        <ul className="ml-6 list-disc space-y-2">
          <li>Encrypted connections (HTTPS)</li>
          <li>Secure authentication</li>
          <li>Industry-standard payment processing</li>
          <li>Continuous monitoring</li>
          <li>Responsible vulnerability disclosure</li>
        </ul>

        <div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Report a Security Issue
          </h2>

          <p>
            security@vouchedge.xyz
          </p>
        </div>
      </section>
    </main>
  );
}
