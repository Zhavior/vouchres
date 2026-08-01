export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20 text-white">
      <h1 className="text-5xl font-bold mb-6">Privacy Policy</h1>

      <p className="text-zinc-400 mb-10">
        Effective Date: August 1, 2026
      </p>

      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Overview</h2>
          <p className="text-zinc-300">
            VouchEdge is committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, disclose, and protect your information while you use our
            platform.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Information We Collect</h2>
          <ul className="list-disc ml-6 space-y-2 text-zinc-300">
            <li>Account information</li>
            <li>Email address</li>
            <li>Subscription information</li>
            <li>Usage analytics</li>
            <li>Device information</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">How We Use Your Data</h2>
          <ul className="list-disc ml-6 space-y-2 text-zinc-300">
            <li>Provide VouchEdge services</li>
            <li>Improve recommendations</li>
            <li>Customer support</li>
            <li>Security and fraud prevention</li>
            <li>Legal compliance</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Your Rights</h2>
          <p className="text-zinc-300">
            You may request access, correction, or deletion of your personal information at
            any time by contacting us.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Contact</h2>
          <p className="text-zinc-300">
            support@vouchedge.xyz
          </p>
        </div>
      </section>
    </main>
  );
}
