import { AlertTriangle, Heart, Phone, ExternalLink } from "lucide-react";

export function ResponsibleGamblingPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Heart className="w-7 h-7 text-danger" />
          Responsible Gambling
        </h1>
        <p className="text-sm text-slate-400 mt-2">Last updated: June 22, 2026</p>
      </div>

      <div className="glass-card p-6 border-danger/30 bg-danger/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-danger mt-0.5 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-slate-100 mb-2">If gambling is a problem, call now:</h2>
            <a
              href="tel:18004262537"
              className="text-2xl font-extrabold text-danger hover:underline"
            >
              1-800-GAMBLER
            </a>
            <p className="text-xs text-slate-400 mt-2">
              Free, confidential, 24/7 support. You are not alone.
            </p>
          </div>
        </div>
      </div>

      <Section title="Our Commitment">
        <p>
          VouchEdge MLB is a <strong>prediction and analytics platform</strong>, not a sportsbook.
          We do not accept wagers, process bets, or facilitate gambling. Our picks are for
          entertainment and informational purposes only.
        </p>
        <p className="mt-3">
          However, we recognize that sports prediction content can be associated with gambling
          behavior. We take responsible gambling seriously and have built safeguards into our
          platform.
        </p>
      </Section>

      <Section title="What We Do">
        <ul className="list-disc list-inside space-y-2 text-slate-300">
          <li>
            <strong>Age verification:</strong> Users must verify they are 21+ before saving any picks.
            We do not allow users under 21.
          </li>
          <li>
            <strong>No guaranteed-win language:</strong> We never use words like "lock," "guaranteed,"
            or "sure thing." Every pick carries probability, confidence, and risk metrics — nothing
            is presented as certain.
          </li>
          <li>
            <strong>Transparent records:</strong> All user records are server-verified from MLB box
            scores. We do not allow self-reported wins, which prevents the "winning streak" illusion
            that drives problem gambling.
          </li>
          <li>
            <strong>Loss visibility:</strong> Your full record — including losses — is visible on your
            profile and the leaderboard. We do not hide losses or inflate win rates.
          </li>
          <li>
            <strong>Region restrictions:</strong> Paid picks are not available in regions where they
            are prohibited by law.
          </li>
          <li>
            <strong>Responsible capping:</strong> Cappers must meet trust requirements (≥600 trust
            score, ≥100 verified picks) before selling picks. We review capper content for
            misleading claims.
          </li>
        </ul>
      </Section>

      <Section title="Tools for Users">
        <p>If you want to limit your use of the Service:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-300 mt-2">
          <li>
            <strong>Cool-down period:</strong> Email support@vouchedge.com to request a temporary
            account freeze (1 day to 6 months). Your picks stay locked, but you cannot save new ones.
          </li>
          <li>
            <strong>Pick limits:</strong> Free users are limited to 5 saves per day. Pro users have
            unlimited saves but can self-impose lower limits via Settings.
          </li>
          <li>
            <strong>Notification opt-out:</strong> You can disable pick_graded and win notifications
            in Settings to reduce engagement triggers.
          </li>
          <li>
            <strong>Account deletion:</strong> You can delete your account at any time in Settings.
            Personal data is removed within 30 days.
          </li>
          <li>
            <strong>Subscription cancellation:</strong> Cancel anytime in Billing. No further charges.
          </li>
        </ul>
      </Section>

      <Section title="Warning Signs">
        <p>Problem gambling can affect anyone. Warning signs include:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-300 mt-2">
          <li>Spending more money than you can afford to lose</li>
          <li>Chasing losses with bigger bets</li>
          <li>Lying about or hiding your gambling activity</li>
          <li>Gambling affecting your work, relationships, or mental health</li>
          <li>Borrowing money to gamble</li>
          <li>Feeling anxious, irritable, or depressed when not gambling</li>
        </ul>
        <p className="mt-3">
          If any of these sound familiar, please reach out for help. Gambling disorder is a
          recognized medical condition with effective treatments.
        </p>
      </Section>

      <Section title="Resources">
        <div className="space-y-3">
          <ResourceCard
            name="National Problem Gambling Helpline"
            phone="1-800-522-4700"
            url="https://www.ncpgambling.org"
            description="24/7 confidential support, text and chat available"
          />
          <ResourceCard
            name="Gamblers Anonymous"
            phone="1-855-2-CALL-GA"
            url="https://www.gamblersanonymous.org"
            description="12-step program with meetings worldwide"
          />
          <ResourceCard
            name="Gam-Anon"
            url="https://www.gam-anon.org"
            description="Support for family and friends of problem gamblers"
          />
          <ResourceCard
            name="BetBlocker"
            url="https://www.betblocker.org"
            description="Free software that blocks gambling sites on your devices"
          />
        </div>
      </Section>

      <Section title="Self-Exclusion">
        <p>
          If you want to permanently self-exclude from the Service, email
          selfexclusion@vouchedge.com with the subject "SELF-EXCLUSION." Your account will be
          permanently closed, your email added to a blocklist, and you will be unable to create
          a new account. This action is irreversible.
        </p>
        <p className="mt-3">
          For broader self-exclusion from gambling platforms, consider your state's self-exclusion
          program (e.g., New Jersey's DGE self-exclusion list).
        </p>
      </Section>

      <Section title="Our Stance on Advertising">
        <p>
          We do not accept advertising from sportsbooks, casinos, or gambling platforms. We do not
          receive affiliate commissions from gambling operators. Our revenue comes solely from
          subscription fees and the paid picks marketplace.
        </p>
      </Section>

      <div className="glass-card p-4 border-danger/20">
        <div className="flex items-start gap-2">
          <Heart className="w-4 h-4 text-danger mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            If you or someone you know has a gambling problem, call <strong>1-800-GAMBLER</strong>.
            Help is available. Recovery is possible.
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

function ResourceCard({
  name, phone, url, description,
}: {
  name: string; phone?: string; url: string; description: string;
}) {
  return (
    <div className="glass-card p-3 flex items-start gap-3">
      <div className="flex-1">
        <div className="text-sm font-bold text-slate-100">{name}</div>
        <div className="text-xs text-slate-400 mt-0.5">{description}</div>
        {phone && (
          <a href={`tel:${phone.replace(/-/g, "")}`} className="text-xs text-electric-300 hover:underline mt-1 inline-block">
            <Phone className="w-3 h-3 inline mr-1" />
            {phone}
          </a>
        )}
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-electric-300 hover:text-electric-200">
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
