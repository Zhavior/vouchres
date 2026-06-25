/**
 * HrCard — the universal card component for displaying HR predictions.
 *
 * Every page that shows an HR prediction uses this card:
 *   - HR Board
 *   - AI Picks
 *   - Parlay Scanner (each leg)
 *   - Player Research (today's matchup)
 *   - Game Research (top HR fits)
 *   - Notifications (linked target)
 *   - Results (graded pick)
 *   - Profile (recent picks)
 *   - Dashboard (today's best)
 *   - Vouch Cards (social share)
 *
 * Layered design (Section 28):
 *   Top:      Player, team, matchup, HR score
 *   Middle:   Probability, confidence, tier
 *   Breakdown: Power / Pitcher / Pitch Mix / Weather / Lineup
 *   Bottom:   Reasons, risks, save/share buttons
 *
 * Props control which layers are shown — compact for lists, full for detail.
 */

import { HrPrediction } from "./types";
import { generateVouchCard } from "./vouchCardGenerator";

interface HrCardProps {
  prediction: HrPrediction;
  variant?: "compact" | "full" | "minimal";
  showBreakdown?: boolean;
  showReasons?: boolean;
  showActions?: boolean;
  onSave?: (prediction: HrPrediction) => void;
  onShare?: (prediction: HrPrediction) => void;
  saved?: boolean;
}

export function HrCard({
  prediction,
  variant = "full",
  showBreakdown = true,
  showReasons = true,
  showActions = true,
  onSave,
  onShare,
  saved = false,
}: HrCardProps) {
  const probPct = (prediction.hrProbability * 100).toFixed(1);
  const score = prediction.hrScore.toFixed(0);
  const tierColor = getTierColor(prediction.tier.tier);

  if (variant === "minimal") {
    return (
      <div className="hr-card hr-card--minimal">
        <div className="hr-card__header">
          <span className="hr-card__name">{prediction.playerName}</span>
          <span className="hr-card__team">{prediction.team} vs {prediction.opponent}</span>
        </div>
        <div className="hr-card__score" style={{ color: tierColor }}>
          {score}
          <span className="hr-card__score-suffix">/100</span>
        </div>
        <div className="hr-card__tier">{prediction.tier.label}</div>
      </div>
    );
  }

  return (
    <div className="hr-card" style={{ borderColor: tierColor }}>
      {/* === TOP LAYER === */}
      <div className="hr-card__top">
        <div className="hr-card__identity">
          <h3 className="hr-card__name">{prediction.playerName}</h3>
          <p className="hr-card__matchup">
            {prediction.team} vs {prediction.opponent}
          </p>
          <p className="hr-card__pitcher">vs {prediction.pitcherName}</p>
        </div>
        <div className="hr-card__score-block">
          <div className="hr-card__score" style={{ color: tierColor }}>
            {score}<span className="hr-card__score-suffix">/100</span>
          </div>
          <div className="hr-card__tier" style={{ background: tierColor }}>
            {prediction.tier.label}
          </div>
        </div>
      </div>

      {/* === MIDDLE LAYER === */}
      <div className="hr-card__middle">
        <div className="hr-card__stat">
          <span className="hr-card__stat-label">Probability</span>
          <span className="hr-card__stat-value">{probPct}%</span>
        </div>
        <div className="hr-card__stat">
          <span className="hr-card__stat-label">Confidence</span>
          <span className="hr-card__stat-value">{prediction.confidence.level}</span>
        </div>
        <div className="hr-card__stat">
          <span className="hr-card__stat-label">λ (expected HR)</span>
          <span className="hr-card__stat-value">{prediction.lambda.toFixed(3)}</span>
        </div>
      </div>

      {/* === BREAKDOWN LAYER === */}
      {showBreakdown && variant === "full" && (
        <div className="hr-card__breakdown">
          <h4 className="hr-card__breakdown-title">Model Breakdown</h4>
          <div className="hr-card__breakdown-grid">
            <BreakdownItem label="Hitter Power" value={prediction.hitterPowerScore.score} />
            <BreakdownItem label="Pitcher Risk" value={prediction.pitcherVulnerabilityScore.score} />
            <BreakdownItem label="Pitch Mix" value={prediction.pitchMixScore.score} />
            <BreakdownItem label="Park/Weather" value={Math.round(50 + prediction.parkWeatherScore.boost * 100)} />
            <BreakdownItem label="Lineup" value={Math.round((prediction.lineupScore.multiplier - 0.88) / 0.20 * 100)} />
            <BreakdownItem
              label="K Penalty"
              value={-Math.round(prediction.strikeoutPenalty.penalty * 100)}
              negative
            />
          </div>
        </div>
      )}

      {/* === REASONS + RISKS === */}
      {showReasons && variant === "full" && (
        <div className="hr-card__reasons">
          <div className="hr-card__why">
            <h4>Why:</h4>
            <ul>
              {prediction.topReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
          <div className="hr-card__risks">
            <h4>Risks:</h4>
            <ul>
              {prediction.risks.map((risk, i) => (
                <li key={i}>{risk}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* === ACTIONS === */}
      {showActions && (
        <div className="hr-card__actions">
          <button
            onClick={() => onSave?.(prediction)}
            className={`hr-card__btn ${saved ? "hr-card__btn--saved" : ""}`}
          >
            {saved ? "✓ Saved" : "Save"}
          </button>
          <button
            onClick={() => onShare?.(prediction)}
            className="hr-card__btn hr-card__btn--share"
          >
            Share
          </button>
        </div>
      )}

      {/* === DISCLAIMER === */}
      <p className="hr-card__disclaimer">
        Probability-based research for entertainment only. Not betting advice.
      </p>
    </div>
  );
}

function BreakdownItem({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  const color = negative
    ? value < -5 ? "#ef4444" : "#a3a3a3"
    : value >= 75 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="hr-card__breakdown-item">
      <span className="hr-card__breakdown-label">{label}</span>
      <span className="hr-card__breakdown-value" style={{ color }}>
        {negative ? "" : ""}{value}
      </span>
    </div>
  );
}

function getTierColor(tier: string): string {
  switch (tier) {
    case "Elite":  return "#10b981"; // emerald
    case "Strong": return "#22c55e"; // green
    case "Good":   return "#eab308"; // yellow
    case "Sneaky": return "#f97316"; // orange
    case "Avoid":  return "#ef4444"; // red
    default:       return "#a3a3a3";
  }
}

// === CSS (include in src/index.css or a separate hr-card.css) ===
export const HR_CARD_CSS = `
.hr-card {
  background: #141414;
  border: 1px solid #262626;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: border-color 0.15s ease;
}
.hr-card:hover { border-color: #404040; }
.hr-card--minimal { padding: 12px 16px; gap: 4px; }

.hr-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.hr-card__identity h3 { margin: 0; font-size: 18px; }
.hr-card__matchup { margin: 4px 0 0; font-size: 14px; color: #a3a3a3; }
.hr-card__pitcher { margin: 2px 0 0; font-size: 12px; color: #737373; }

.hr-card__score {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}
.hr-card__score-suffix {
  font-size: 14px;
  color: #737373;
  font-weight: 400;
}
.hr-card__tier {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #0a0a0a;
  margin-top: 4px;
}

.hr-card__middle {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-top: 1px solid #262626;
  border-bottom: 1px solid #262626;
}
.hr-card__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hr-card__stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #737373;
}
.hr-card__stat-value {
  font-size: 16px;
  font-weight: 600;
}

.hr-card__breakdown-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.hr-card__breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hr-card__breakdown-label {
  font-size: 11px;
  color: #737373;
}
.hr-card__breakdown-value {
  font-size: 16px;
  font-weight: 600;
}

.hr-card__reasons h4 {
  margin: 0 0 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #737373;
}
.hr-card__reasons ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.hr-card__reasons li {
  font-size: 13px;
  padding: 2px 0;
}

.hr-card__actions {
  display: flex;
  gap: 8px;
}
.hr-card__btn {
  flex: 1;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #404040;
  background: transparent;
  color: #fafafa;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s ease;
}
.hr-card__btn:hover { background: #1f1f1f; }
.hr-card__btn--saved { background: #10b981; color: #0a0a0a; border-color: #10b981; }
.hr-card__btn--share { background: #262626; }

.hr-card__disclaimer {
  font-size: 11px;
  color: #525252;
  text-align: center;
  margin: 0;
}
`;
