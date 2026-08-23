import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { AURORA_MAX_SHELL } from '../theme/auroraTokens';
import { apiClient } from '../lib/apiClient';
import Navbar from '../components/landing-v4/Navbar';
import PublicFooter from '../components/landing-v4/PublicFooter';

const SUBJECT_OPTIONS = [
  { value: '', label: 'Select Subject...' },
  { value: 'support', label: 'Technical Support' },
  { value: 'bug', label: 'Report a Bug / Issue' },
  { value: 'beta', label: 'Beta Access Inquiry' },
  { value: 'partnership', label: 'Partnership / Press' },
  { value: 'other', label: 'General Inquiry' },
];

const ROUTING_ADDRESS = 'support@vouchedge.xyz';

/**
 * Only facts the page can actually stand behind: the address it posts to, the
 * fact that the subject field drives routing, and that the channel is open.
 * Deliberately no response time, no hours, no location, no security claim.
 */
const CHANNEL_META = [
  { label: 'Channel', value: 'External Communications' },
  { label: 'Routing', value: ROUTING_ADDRESS },
  { label: 'Dispatch', value: 'Selected by transmission subject' },
  { label: 'Status', value: 'Available', live: true },
];

type Status = 'idle' | 'submitting' | 'success' | 'error';

const FIELD_CLASS =
  'w-full rounded-none border border-white/10 bg-obsidian-950 px-4 py-3 font-sans text-sm text-white ' +
  'placeholder-white/25 transition-colors focus:border-ve-cyan focus:outline-none focus:ring-1 focus:ring-ve-cyan ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const LABEL_CLASS =
  'block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40';

function ChannelMeta() {
  return (
    <div className="mt-12 lg:mt-auto lg:pt-12">
      <dl className="border-t border-white/[0.08]">
      {CHANNEL_META.map((item) => (
        <div key={item.label} className="flex items-baseline gap-4 border-b border-white/[0.08] py-3.5">
          <dt className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            {item.label}
          </dt>
          <dd className="min-w-0 font-mono text-xs text-white/70">
            {item.live ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ve-emerald" aria-hidden="true" />
                {item.value}
              </span>
            ) : (
              <span className="break-all">{item.value}</span>
            )}
          </dd>
        </div>
      ))}
      </dl>
    </div>
  );
}

function ContactHero() {
  return (
    // No opacity gate: the statement is the page's meaning and must survive
    // frame one. Only the offset animates, which reduced motion neutralises.
    <motion.div
      initial={{ x: -12 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex min-w-0 flex-col lg:h-full"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-white/[0.08] pb-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ve-cyan">
          05 / External Communications
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/30">
          Channel // Available
        </span>
      </div>

      <h1 className="mt-10 text-5xl font-bold italic leading-[0.9] tracking-tighter text-white sm:text-6xl lg:text-7xl">
        Secure
        <br />
        <span className="text-white/25">Transmission</span>
      </h1>

      <p className="mt-8 max-w-md font-sans text-lg font-light leading-relaxed text-white/55">
        Support, bug reports, beta access, partnerships, and press. Pick a subject and it
        routes to the right place.
      </p>

      <ChannelMeta />
    </motion.div>
  );
}

function TransmissionReceipt({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-6 sm:p-10"
    >
      <div className="flex items-center gap-3 border-b border-ve-emerald/20 pb-5">
        <span className="flex h-6 w-6 items-center justify-center border border-ve-emerald/40 bg-ve-emerald/10">
          <Check className="h-3.5 w-3.5 text-ve-emerald" aria-hidden="true" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ve-emerald">
          Transmission Accepted
        </span>
      </div>

      <h2 className="mt-8 text-3xl font-bold italic tracking-tighter text-white sm:text-4xl">
        Message received.
      </h2>

      <p className="mt-4 max-w-sm font-sans text-base font-light leading-relaxed text-white/55">
        Your message has been logged and routed to {ROUTING_ADDRESS}.
      </p>

      <dl className="mt-10 grid gap-px border-t border-white/[0.08]">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] py-3">
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Status</dt>
          <dd className="font-mono text-xs text-ve-emerald">Received</dd>
        </div>
        <div className="flex items-baseline justify-between border-b border-white/[0.08] py-3">
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Channel</dt>
          <dd className="font-mono text-xs text-white/70">External Comms</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onReset}
        className="mt-10 inline-flex min-h-11 items-center gap-2 border border-white/15 px-6 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-cyan"
      >
        Send another message
      </button>
    </motion.div>
  );
}

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const submitting = status === 'submitting';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      await apiClient.post('/api/contact', {
        email,
        subject: subject || 'General Inquiry',
        message,
      });

      setStatus('success');
    } catch (err: any) {
      console.error('[contact] transmission failed:', err);
      setErrorMessage(err?.message || 'Transmission failed. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div
      className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 selection:bg-ve-cyan/30 ${AURORA_MAX_SHELL}`}
      data-scroll-owner="document"
    >
      <Navbar />

      <div className="flex min-h-screen flex-col bg-black pt-16 text-white">
        <main id="main" className="flex-grow px-6 py-24 sm:py-28 lg:py-32">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-16 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-5 lg:self-stretch">
              <ContactHero />
            </div>

            <motion.section
              aria-labelledby="transmission-heading"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.45, delay: 0.06, ease: 'easeOut' }}
              className="min-w-0 border border-white/10 bg-obsidian-900 lg:col-span-7"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 sm:px-10">
                <h2 id="transmission-heading" className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/70 whitespace-nowrap">
                  Transmission // {status === 'success' ? 'Complete' : 'New'}
                </h2>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-white/40 sm:inline">
                  {ROUTING_ADDRESS}
                </span>
              </div>

              {/* Async status is announced for assistive tech; the visible
                  receipt and error block are the same information rendered. */}
              <p aria-live="polite" className="sr-only">
                {status === 'submitting' && 'Transmitting message.'}
                {status === 'success' && 'Message received and routed.'}
                {status === 'error' && `Transmission failed. ${errorMessage}`}
              </p>

              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <TransmissionReceipt
                    key="success"
                    onReset={() => {
                      setStatus('idle');
                      setMessage('');
                    }}
                  />
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    aria-busy={submitting}
                    className="space-y-7 p-6 sm:p-10"
                  >
                    <div className="space-y-2">
                      <label htmlFor="email" className={LABEL_CLASS}>
                        Return address
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="analyst@domain.com"
                        className={FIELD_CLASS}
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className={LABEL_CLASS}>
                        Routing subject
                      </label>
                      <div className="relative">
                        <select
                          id="subject"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className={`${FIELD_CLASS} appearance-none pr-10`}
                          disabled={submitting}
                        >
                          {SUBJECT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-mono text-[10px] text-white/40"
                        >
                          ▼
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className={LABEL_CLASS}>
                        Message payload
                      </label>
                      <textarea
                        id="message"
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        placeholder="Enter your message here..."
                        className={`${FIELD_CLASS} resize-none leading-relaxed`}
                        disabled={submitting}
                        aria-describedby={status === 'error' ? 'transmission-error' : undefined}
                      />
                    </div>

                    {status === 'error' && (
                      <div id="transmission-error" className="border border-ve-red/40 bg-ve-red/[0.07] px-4 py-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ve-red">
                          Transmission failed
                        </p>
                        <p className="mt-1.5 font-sans text-sm text-white/70">
                          {errorMessage || 'Transmission failed. Please check your connection.'}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-white/[0.08] pt-7">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="group inline-flex min-h-12 w-full items-center justify-center gap-3 bg-ve-cyan px-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ve-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
                      >
                        {submitting ? (
                          <>
                            <span
                              aria-hidden="true"
                              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black"
                            />
                            Transmitting
                          </>
                        ) : (
                          <>
                            Transmit message
                            <ArrowRight
                              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.section>
          </div>
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
