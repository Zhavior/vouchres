export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20 text-white">
      <h1 className="mb-6 text-5xl font-bold">Cookie Policy</h1>

      <section className="space-y-8 text-zinc-300">
        <p>
          VouchEdge uses cookies and similar technologies to improve your
          experience, remember preferences, maintain secure sessions,
          and understand how our platform is used.
        </p>

        <div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Types of Cookies
          </h2>

          <ul className="ml-6 list-disc space-y-2">
            <li>Essential cookies</li>
            <li>Authentication cookies</li>
            <li>Analytics cookies</li>
            <li>Performance cookies</li>
            <li>Preference cookies</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Managing Cookies
          </h2>

          <p>
            Most browsers allow you to manage or disable cookies through
            browser settings. Some platform functionality may be affected
            if cookies are disabled.
          </p>
        </div>
      </section>
    </main>
  );
}
