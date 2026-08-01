export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20 text-white">
      <h1 className="mb-6 text-5xl font-bold">
        Contact Us
      </h1>

      <section className="space-y-8 text-zinc-300">
        <p>
          We'd love to hear from you.
        </p>

        <div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            General Support
          </h2>

          <p>support@vouchedge.xyz</p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Business
          </h2>

          <p>hello@vouchedge.xyz</p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Security
          </h2>

          <p>vouchedge@gmail.com</p>
        </div>
      </section>
    </main>
  );
}
