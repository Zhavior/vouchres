export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20 text-white">
      <h1 className="mb-6 text-5xl font-bold">
        About VouchEdge
      </h1>

      <section className="space-y-8 text-zinc-300">
        <p>
          VouchEdge is a next-generation sports intelligence platform designed
          to help fans make smarter, more informed decisions through data,
          research, and transparent analytics.
        </p>

        <p>
          Rather than relying on hype or black-box predictions, VouchEdge
          combines statistics, matchup analysis, AI-powered insights, and
          evidence-driven research into one premium experience.
        </p>

        <div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Our Mission
          </h2>

          <p>
            Build the world's most trusted sports intelligence platform by
            making advanced analytics understandable, transparent, and useful
            for every sports fan.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            What Makes Us Different
          </h2>

          <ul className="ml-6 list-disc space-y-2">
            <li>Evidence-first research</li>
            <li>Transparent confidence scoring</li>
            <li>AI-powered insights</li>
            <li>Premium user experience</li>
            <li>Built for serious sports fans</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Contact
          </h2>

          <p>hello@vouchedge.xyz</p>
        </div>
      </section>
    </main>
  );
}
