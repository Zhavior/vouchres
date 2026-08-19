import { useState } from 'react';
import { Activity, ArrowRight, Radar, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { useResearchPreview, type EvidenceItem } from '../landing-v3/researchPreviewData';

type Props = { onJoinBeta: () => void; onExploreBoard: () => void };

const theme = {
  available: { label: 'VERIFIED', cls: 'rt2-good', Icon: ShieldCheck },
  partial: { label: 'PARTIAL', cls: 'rt2-partial', Icon: ShieldAlert },
  unavailable: { label: 'MISSING', cls: 'rt2-missing', Icon: ShieldX },
} as const;

function Signal({ item }: { item: EvidenceItem }) {
  const state = theme[item.state];
  const { Icon } = state;
  return (
    <article className="rt2-signal">
      <header>
        <span>
          <Activity aria-hidden="true" />
          {item.label}
        </span>
        <b className={state.cls}>
          <Icon aria-hidden="true" />
          {state.label}
        </b>
      </header>
      <p>{item.explanation}</p>
      <small>{item.detail}</small>
      <footer>
        <span>SRC / {item.source}</span>
        <span>{item.freshness}</span>
      </footer>
    </article>
  );
}

const faqs = [
  ['What is VouchEdge?', 'A research and decision-tracking environment for sports analysis.'],
  [
    'Does confidence guarantee an outcome?',
    'No. It describes evidence coverage and alignment, not certainty.',
  ],
  [
    'What happens after the game?',
    'Saved research can be compared with the official final result.',
  ],
] as const;

export default function ResearchTelemetryStory({ onJoinBeta, onExploreBoard }: Props) {
  const [faq, setFaq] = useState<number | null>(null);
  const { evidenceItems, primaryPlayer, isLoading, statusLabel, featuredGame } = useResearchPreview();
  const count = (state: EvidenceItem['state']) =>
    evidenceItems.filter((item) => item.state === state).length;

  return (
    <section className="rt2-story rt2-storyFlat">
      <div className="rt2-pin rt2-pinFlat">
        <div className="rt2-layout">
          <aside>
            <span className="rt2-kicker">
              <Radar aria-hidden="true" /> LIVE RESEARCH RECORD
            </span>
            <p className="rt2-tag">{statusLabel}</p>
            <h2>Transparency over hype.</h2>
            <p className="rt2-copy">
              Every input on this row is visible — and every absent input stays absent. This is
              today’s slate, not a fabricated demo.
            </p>
          </aside>
          <div>
            <div className="rt2-canvas">
              <div className="rt2-bar">
                <span>
                  <i />
                  <i />
                  <i />
                </span>
                <b>VouchEdge · research record</b>
                <em>LIVE RESEARCH CONTEXT</em>
              </div>
              <div className="rt2-matrix">
                <div className="rt2-canvasHeading">
                  <div>
                    <span>
                      {featuredGame
                        ? `${featuredGame.awayAbbr ?? featuredGame.awayTeam} @ ${featuredGame.homeAbbr ?? featuredGame.homeTeam}`
                        : 'NO MATCHUP ON FEED'}
                    </span>
                    <strong>{primaryPlayer?.playerName ?? 'Linked research row unavailable'}</strong>
                  </div>
                  <b>LIVE PAYLOAD</b>
                </div>
                <div className="rt2-grid">
                  {evidenceItems.map((item) => (
                    <Signal key={`${item.label}-${item.source}`} item={item} />
                  ))}
                </div>
              </div>
            </div>
            <div className="rt2-accessPanel">
              <button type="button" onClick={onJoinBeta}>
                GET ACCESS <ArrowRight aria-hidden="true" />
              </button>
              <button type="button" className="rt2-outline" onClick={onExploreBoard}>
                OPEN TODAY&apos;S BOARD
              </button>
              <small>No credit card required. Research tools, not betting advice.</small>
              <div className="rt2-faq">
                {faqs.map(([question, answer], index) => (
                  <div key={question}>
                    <button type="button" onClick={() => setFaq(faq === index ? null : index)}>
                      <span>{question}</span>
                      <b>{faq === index ? '−' : '+'}</b>
                    </button>
                    {faq === index && <p>{answer}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="rt2-status">
          <span>
            {isLoading
              ? 'SYNCING LIVE PAYLOAD'
              : `${count('available')} VERIFIED · ${count('partial')} PARTIAL · ${count('unavailable')} MISSING`}
          </span>
          <b>{primaryPlayer?.playerName ?? 'NO ROW'}</b>
        </div>
      </div>
    </section>
  );
}
