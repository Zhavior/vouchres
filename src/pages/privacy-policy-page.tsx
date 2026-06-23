import { Lock, Shield, FileText, Eye } from "lucide-react";

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Lock className="w-7 h-7 text-electric-400" />
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-400 mt-2">Last updated: June 22, 2026</p>
      </div>

      <div className="glass-card p-4 border-electric-500/20">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-electric-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-300 leading-relaxed">
            We take your privacy seriously. This policy explains what data we collect, why we collect
            it, and how you can control it. We comply with GDPR (EU) and CCPA (California).
          </p>
        </div>
      </div>

      <Section title="1. Data We Collect">
        <p><strong>Account data:</strong> email, username, hashed password, region, age verification status.</p>
        <p><strong>Profile data:</strong> bio, avatar, favorite teams, preferred markets (all optional).</p>
        <p><strong>Activity data:</strong> picks you save, parlays you create, posts and comments you publish, vouches you give.</p>
        <p><strong>Payment data:</strong> subscription status and payment history. Credit card numbers are processed by Stripe and never stored on our servers.</p>
        <p><strong>Usage data:</strong> IP address, browser type, access times (for security and analytics).</p>
        <p><strong>MLB data:</strong> game schedules, player stats, box scores (fetched from MLB Stats API, cached temporarily).</p>
      </Section>

      <Section title="2. How We Use Your Data">
        <ul className="list-disc list-inside space-y-1 text-slate-300">
          <li>To provide the Service (account, picks, grading, trust scores, feed)</li>
          <li>To send transactional emails (pick graded, trust increased, subscriber joined)</li>
          <li>To process payments via Stripe</li>
          <li>To prevent fraud and maintain trust system integrity</li>
          <li>To comply with legal obligations</li>
          <li>To improve the Service (aggregated, anonymized analytics)</li>
        </ul>
        <p className="mt-3">
          We do <strong>not</strong> sell your personal data to third parties. We do not use your
          data to train external AI models.
        </p>
      </Section>

      <Section title="3. Data Sharing">
        <p>We share data only in these circumstances:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-300">
          <li><strong>Stripe:</strong> payment processing (email, subscription status)</li>
          <li><strong>MLB Stats API:</strong> we fetch data from them; we do not send your data to them</li>
          <li><strong>Service providers:</strong> hosting (database, CDN), email delivery — all under strict data agreements</li>
          <li><strong>Legal compliance:</strong> if required by law, court order, or to protect rights/safety</li>
          <li><strong>Business transfer:</strong> in the event of merger/acquisition (with notice to you)</li>
        </ul>
      </Section>

      <Section title="4. Data Retention">
        <p>
          We retain your data for as long as your account is active. If you delete your account:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-300">
          <li>Personal data (email, username, password) is deleted within 30 days</li>
          <li>Pick records are retained anonymously for leaderboard integrity</li>
          <li>Audit logs are retained for 2 years for security and compliance</li>
          <li>Payment records are retained for 7 years per tax law requirements</li>
        </ul>
      </Section>

      <Section title="5. Your Rights (GDPR / CCPA)">
        <p>You have the right to:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-300">
          <li><strong>Access:</strong> request a copy of your personal data</li>
          <li><strong>Rectification:</strong> correct inaccurate data</li>
          <li><strong>Erasure:</strong> request deletion of your data ("right to be forgotten")</li>
          <li><strong>Portability:</strong> receive your data in a machine-readable format (JSON)</li>
          <li><strong>Objection:</strong> opt out of certain data processing</li>
          <li><strong>Withdraw consent:</strong> for any consent-based processing</li>
        </ul>
        <p className="mt-3">
          To exercise these rights, email privacy@vouchedge.com. We respond within 30 days.
          California residents may also submit requests via our CCPA portal.
        </p>
      </Section>

      <Section title="6. Data Security">
        <p>We implement industry-standard security measures:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-300">
          <li>Passwords hashed with bcrypt (never stored in plaintext)</li>
          <li>JWT tokens with 15-minute expiry + 30-day refresh tokens</li>
          <li>TLS encryption for all API communication</li>
          <li>Database access restricted to authenticated API servers only</li>
          <li>Stripe handles all payment card data (we never see or store it)</li>
          <li>Audit logs track every privileged action</li>
          <li>Rate limiting prevents brute-force attacks</li>
        </ul>
        <p className="mt-3">
          Despite these measures, no system is 100% secure. In the event of a data breach, we will
          notify affected users within 72 hours per GDPR requirements.
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          We use essential cookies for authentication (JWT tokens in localStorage) and session
          management. We do not use third-party tracking cookies, advertising cookies, or
          analytics cookies that collect personal data.
        </p>
        <p className="mt-3">
          If we add analytics in the future, we will use privacy-focused tools (e.g., Plausible)
          that do not collect personal data or require cookie consent.
        </p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>
          The Service is not directed at children under 21. We do not knowingly collect data from
          anyone under 21. Age verification is required before saving picks. If we learn we have
          collected data from someone under 21, we will delete it immediately.
        </p>
      </Section>

      <Section title="9. International Users">
        <p>
          The Service is hosted in the United States. If you access it from outside the US, your
          data is transferred to the US. By using the Service, you consent to this transfer.
          We comply with GDPR for EU users and provide adequate safeguards (SCCs) for data transfers.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy periodically. Material changes will be notified via
          email. The "Last updated" date at the top reflects the most recent revision.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Privacy questions? Email privacy@vouchedge.com. For data deletion requests, use the
          in-app Settings → Delete Account, or email us directly.
        </p>
      </Section>

      <div className="glass-card p-4 border-electric-500/20">
        <div className="flex items-start gap-2">
          <Eye className="w-4 h-4 text-electric-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            This Privacy Policy is designed to be readable and transparent. If anything is unclear,
            ask us — we'd rather over-explain than leave you guessing about your data.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-slate-100">{title}</h2>
      <div className="text-sm text-slate-300 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
