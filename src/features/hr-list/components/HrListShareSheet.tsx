/**
 * Share sheet for a published HR list.
 *
 * Posting model: we open X's own composer with a prefilled draft and the user
 * presses Post there. We never call the X API on their behalf — that would post
 * without a confirmation step, and X bills per post for anything containing a
 * link, which every list post does.
 *
 * The card preview is the real OG image, fetched from the same URL crawlers
 * hit, so what the user sees here is exactly what recipients see. That matters
 * because X strips the headline and description from link previews and shows
 * only this image.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Link2, Share2, X } from 'lucide-react';
import type { HrListShareBundle } from '../hrListTypes';

type ShareTarget = {
  id: string;
  label: string;
  /** Builds the destination for this network. */
  href: (bundle: HrListShareBundle) => string;
};

/**
 * Intent URLs only — every one of these lands the user in the network's own
 * composer with a draft they confirm. Each network reads our Open Graph tags
 * from the permalink to build its own preview.
 */
const TARGETS: ShareTarget[] = [
  {
    id: 'x',
    label: 'Post on X',
    href: (b) => `https://x.com/intent/post?text=${encodeURIComponent(b.text)}&url=${encodeURIComponent(b.permalink)}`,
  },
  {
    id: 'reddit',
    label: 'Reddit',
    href: (b) => `https://www.reddit.com/submit?url=${encodeURIComponent(b.permalink)}&title=${encodeURIComponent(b.text.split('\n')[0])}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: (b) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(b.permalink)}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    href: (b) => `https://wa.me/?text=${encodeURIComponent(`${b.text}\n${b.permalink}`)}`,
  },
];

interface HrListShareSheetProps {
  bundle: HrListShareBundle;
  listTitle: string;
  onClose: () => void;
}

export function HrListShareSheet({ bundle, listTitle, onClose }: HrListShareSheetProps) {
  const [copied, setCopied] = useState<'link' | 'text' | null>(null);
  const [cardFailed, setCardFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const copyResetRef = useRef<number | null>(null);

  // Focus the dismiss control on open and restore focus to the opener on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => () => {
    if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
  }, []);

  const copy = useCallback(async (kind: 'link' | 'text', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
      copyResetRef.current = window.setTimeout(() => setCopied(null), 1800);
    } catch {
      // Clipboard denied — the inputs below are selectable as a fallback.
      setCopied(null);
    }
  }, []);

  const nativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: listTitle, text: bundle.text, url: bundle.permalink });
    } catch {
      // User dismissed the OS sheet — nothing to report.
    }
  }, [bundle.permalink, bundle.text, listTitle]);

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/85 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hr-list-share-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-2xl border border-cyan-500/20 bg-slate-950 shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
              List published
            </p>
            <h2 id="hr-list-share-title" className="mt-1 truncate text-base font-bold text-white">
              {listTitle}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close share sheet"
            className="-m-2 flex h-11 w-11 items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          {/* The exact image every network will render for this link. */}
          <figure className="m-0">
            {cardFailed ? (
              <div className="flex aspect-[1200/630] items-center justify-center rounded-xl border border-white/10 bg-slate-900 px-6 text-center text-xs text-white/45">
                Preview card is still generating — the link below already works.
              </div>
            ) : (
              <img
                src={bundle.cardImageUrl}
                alt={`Share card for ${listTitle}`}
                width={1200}
                height={630}
                className="w-full rounded-xl border border-cyan-500/20"
                onError={() => setCardFailed(true)}
              />
            )}
            <figcaption className="mt-2 text-[11px] leading-relaxed text-white/40">
              This image is what X, Discord, iMessage and Slack will show. Share cards
              are still being built, so it currently renders a placeholder rather than
              your players.
            </figcaption>
          </figure>

          <section>
            <label
              htmlFor="hr-list-share-text"
              className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45"
            >
              Post text
            </label>
            <textarea
              id="hr-list-share-text"
              readOnly
              value={bundle.text}
              rows={6}
              className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 font-mono text-xs leading-relaxed text-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            />
            <button
              type="button"
              onClick={() => copy('text', bundle.text)}
              className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/70 transition-colors hover:border-cyan-400/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              {copied === 'text'
                ? <><Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> Copied</>
                : <><Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy text</>}
            </button>
          </section>

          <section>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
              Link
            </span>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5">
              <Link2 className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
              <input
                readOnly
                value={bundle.permalink}
                aria-label="Shareable link"
                className="min-w-0 flex-1 bg-transparent font-mono text-xs text-cyan-200 focus-visible:outline-none"
                onFocus={(event) => event.currentTarget.select()}
              />
              <button
                type="button"
                onClick={() => copy('link', bundle.permalink)}
                aria-label="Copy link"
                className="-m-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/55 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                {copied === 'link'
                  ? <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  : <Copy className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </section>

          <section className="space-y-2">
            {/* Primary action. rel=noopener is required on target=_blank. */}
            <a
              href={TARGETS[0].href(bundle)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Post on X
            </a>
            <p className="text-[11px] leading-relaxed text-white/40">
              Opens X with the draft ready. You review and press Post — nothing is
              posted for you.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {TARGETS.slice(1).map((target) => (
                <a
                  key={target.id}
                  href={target.href(bundle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-2 text-xs font-semibold text-white/70 transition-colors hover:border-cyan-400/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
                >
                  {target.label}
                </a>
              ))}
            </div>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={nativeShare}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-xs font-semibold text-white/70 transition-colors hover:border-cyan-400/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                More apps…
              </button>
            )}
          </section>

          <p className="border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/35">
            Anyone with this link can view the list. Player values are frozen to what
            the board showed when you added them. Research only — not betting advice. 21+.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HrListShareSheet;
