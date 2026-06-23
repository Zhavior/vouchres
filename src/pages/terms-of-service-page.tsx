import { Shield, AlertTriangle, FileText, Lock } from "lucide-react";

export function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <FileText className="w-7 h-7 text-electric-400" />
          Terms of Service
        </h1>
        <p className="text-sm text-slate-400 mt-2">Last updated: June 22, 2026</p>
      </div>

      <div className="glass-card p-4 border-warning/30 bg-warning/5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Important:</strong> VouchEdge MLB is a prediction and analytics platform.
            We do not accept wagers. Picks are for entertainment and informational purposes only.
            No guarantee of outcome is expressed or implied.
          </p>
        </div>
      </div>

      <Section title="1. Acceptance of Terms">
        <p>
          By creating an account or using VouchEdge MLB ("the Service"), you agree to be bound by
          these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
          You must be at least 21 years old to use the Service. By registering, you confirm that you
          are 21 or older and legally permitted to access the Service in your jurisdiction.
        </p>
      </Section>

      <Section title="2. Description of Service">
        <p>
          VouchEdge MLB provides MLB (Major League Baseball) analytics, AI-powered pick predictions,
          a social trust platform with verified pick grading, and optional paid subscriptions for
          enhanced features. The Service includes:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
          <li>AI-generated probability scores for player performance markets (HR, Hit, RBI, Run, Total Bases)</li>
          <li>A pick ledger that locks picks at game start and auto-grades results from official MLB box scores</li>
          <li>A trust score system that verifies user records and prevents self-reported wins</li>
          <li>A social feed with community vouching and capper marketplace</li>
          <li>Optional paid subscriptions (Pro, Capper) and paid picks marketplace</li>
        </ul>
        <p className="mt-3">
          The Service does <strong>not</strong> accept wagers, facilitate betting, or process
          gambling transactions. Any references to "picks" or "odds" are informational and
          analytical, not wagering offers.
        </p>
      </Section>

      <Section title="3. No Guarantee of Results">
        <p>
          <strong>All picks and predictions are for entertainment purposes only.</strong> The Service
          uses statistical models and historical data to generate probabilities, but no prediction
          can guarantee a specific outcome. Past performance does not indicate future results. You
          acknowledge that:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
          <li>Model probabilities are estimates, not certainties</li>
          <li>MLB data may be delayed, incomplete, or contain errors</li>
          <li>You are solely responsible for any decisions you make based on Service content</li>
          <li>The Service is not financial, legal, or gambling advice</li>
        </ul>
      </Section>

      <Section title="4. User Accounts">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activities under your account. You agree to:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
          <li>Provide accurate and complete registration information</li>
          <li>Verify your age (21+) before saving any picks</li>
          <li>Not create multiple accounts to manipulate trust scores or leaderboards</li>
          <li>Not share, sell, or transfer your account</li>
          <li>Notify us immediately of any unauthorized account access</li>
        </ul>
        <p className="mt-3">
          We reserve the right to suspend or terminate accounts that violate these Terms, attempt to
          manipulate the trust system, or engage in fraudulent activity.
        </p>
      </Section>

      <Section title="5. Pick Integrity & Trust System">
        <p>
          The integrity of our trust system is the core of the Service. You acknowledge that:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
          <li>Picks lock automatically at scheduled game start time — you cannot edit or delete locked picks</li>
          <li>Results are computed server-side from official MLB box scores — you cannot self-report results</li>
          <li>Trust scores are computed from verified pick records using a transparent formula</li>
          <li>Vouches are weighted by the voucher's trust score and recency</li>
          <li>Attempts to manipulate trust scores (vouch farming, duplicate accounts, etc.) will result in permanent ban</li>
          <li>Demo data is kept separate from real data and never affects real leaderboards</li>
        </ul>
      </Section>

      <Section title="6. Paid Subscriptions">
        <p>
          The Service offers paid subscription tiers (Pro at $19/month, Capper at $49/month).
          Subscriptions are billed monthly through Stripe until canceled. You can cancel at any time;
          cancellation takes effect at the end of the current billing period. No partial refunds are
          issued for unused time within a billing period.
        </p>
        <p className="mt-3">
          We reserve the right to change pricing with 30 days' notice. Existing subscribers will be
          charged the new rate at their next billing cycle after the change.
        </p>
      </Section>

      <Section title="7. Paid Picks Marketplace">
        <p>
          Verified cappers (trust score ≥ 600 and ≥ 100 verified picks) may sell individual picks
          through the marketplace. The platform deducts a 20% fee from each paid pick sale; the
          capper receives 80% of the sale price. Payouts are processed via Stripe Connect.
        </p>
        <p className="mt-3">
          <strong>Refund policy:</strong> If a paid pick is voided (due to game postponement, broken
          data, or admin discretion), buyers receive a full refund automatically. Refund requests
          for other reasons are evaluated case-by-case within 24 hours of purchase, provided the
          pick's game has not yet started.
        </p>
        <p className="mt-3">
          <strong>Capper disclaimer:</strong> Paid picks are the opinion of the capper, not the
          platform. The platform does not guarantee the accuracy of any paid pick. Cappers are
          responsible for their own tax obligations (1099-K forms are issued by Stripe).
        </p>
      </Section>

      <Section title="8. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
          <li>Use the Service for any illegal purpose</li>
          <li>Attempt to reverse-engineer, scrape, or overload the Service</li>
          <li>Post abusive, hateful, or misleading content</li>
          <li>Impersonate another person or entity</li>
          <li>Use bots or automation to interact with the Service without authorization</li>
          <li>Share model outputs or paid picks with non-subscribers</li>
          <li>Use the Service if located in a jurisdiction where it is prohibited</li>
        </ul>
      </Section>

      <Section title="9. Intellectual Property">
        <p>
          The Service, including its design, code, model outputs, and content, is owned by VouchEdge
          MLB and protected by intellectual property laws. You retain ownership of your posts,
          comments, and reasoning content, but grant us a license to display them within the Service.
        </p>
        <p className="mt-3">
          MLB team names, player names, and statistics are property of Major League Baseball and are
          used under fair use for informational and analytical purposes. VouchEdge MLB is not
          affiliated with or endorsed by Major League Baseball.
        </p>
      </Section>

      <Section title="10. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
          INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR
          THAT MODEL PREDICTIONS WILL BE ACCURATE.
        </p>
      </Section>

      <Section title="11. Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, VOUCHEDGE MLB SHALL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS,
          DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY
          CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PREVIOUS 12 MONTHS.
        </p>
      </Section>

      <Section title="12. Termination">
        <p>
          You may delete your account at any time. We may suspend or terminate your account for
          violations of these Terms. Upon termination, your picks remain in the ledger for record
          integrity, but your personal data is deleted per our Privacy Policy.
        </p>
      </Section>

      <Section title="13. Changes to Terms">
        <p>
          We may update these Terms periodically. Material changes will be notified via email or
          in-app notification. Continued use after changes take effect constitutes acceptance.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          Questions about these Terms? Contact us at legal@vouchedge.com. For responsible gambling
          concerns, see our <a href="/responsible-gambling" className="text-electric-300 hover:underline">Responsible Gambling page</a>.
        </p>
      </Section>

      <div className="glass-card p-4 border-electric-500/20">
        <div className="flex items-start gap-2">
          <Lock className="w-4 h-4 text-electric-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            These Terms constitute the entire agreement between you and VouchEdge MLB regarding the
            Service. If any provision is found unenforceable, the remaining provisions remain in
            full effect.
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
