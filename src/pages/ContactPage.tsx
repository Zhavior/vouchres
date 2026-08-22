import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { FooterSection } from '../components/landing-v3';
import PublicNav from '../components/landing-v3/PublicNav';
import { AURORA_MAX_SHELL } from '../theme/auroraTokens';
import { apiClient } from '../lib/apiClient';

const SUBJECT_OPTIONS = [
  { value: '', label: 'Select Subject...' },
  { value: 'support', label: 'Technical Support' },
  { value: 'bug', label: 'Report a Bug / Issue' },
  { value: 'beta', label: 'Beta Access Inquiry' },
  { value: 'partnership', label: 'Partnership / Press' },
  { value: 'other', label: 'General Inquiry' },
];

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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
    <div className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 ${AURORA_MAX_SHELL}`} data-scroll-owner="document">
      <PublicNav />
      <div className="flex flex-col min-h-screen bg-black text-white pt-16">
        <main className="flex-grow flex flex-col items-center justify-center px-6 py-24 sm:py-32 w-full max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4 font-mono uppercase">
              Establish <span className="text-cyan-400">Connection</span>
            </h1>
            <p className="text-zinc-400 text-lg">
              Secure channels for support, bug reports, and beta inquiries.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            
            <div className="p-8 sm:p-12">
              <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <div className="font-mono text-sm tracking-wider text-zinc-300">
                  <span className="text-zinc-500">ROUTING TO: </span>
                  <span className="text-white font-bold">support@vouchedge.xyz</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
                    <h3 className="text-2xl font-bold text-white font-mono uppercase tracking-widest">Message Transmitted</h3>
                    <p className="text-zinc-400 max-w-md">
                      Your transmission has been securely logged. Our support protocol dictates a response within 24 hours.
                    </p>
                    <button
                      onClick={() => {
                        setStatus('idle');
                        setMessage('');
                      }}
                      className="mt-8 border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-2.5 font-mono text-xs tracking-widest uppercase transition-colors"
                    >
                      Send Another
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label htmlFor="email" className="block font-mono text-xs tracking-widest uppercase text-zinc-400">
                        Your Return Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="analyst@domain.com"
                        className="w-full bg-black border border-white/10 rounded-none px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono text-sm"
                        disabled={status === 'submitting'}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="block font-mono text-xs tracking-widest uppercase text-zinc-400">
                        Transmission Subject
                      </label>
                      <div className="relative">
                        <select
                          id="subject"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-none px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all appearance-none font-mono text-sm"
                          disabled={status === 'submitting'}
                        >
                          {SUBJECT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="block font-mono text-xs tracking-widest uppercase text-zinc-400">
                        Message Payload
                      </label>
                      <textarea
                        id="message"
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        placeholder="Enter your message here..."
                        className="w-full bg-black border border-white/10 rounded-none px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans resize-none"
                        disabled={status === 'submitting'}
                      />
                    </div>

                    {status === 'error' && (
                      <div className="border border-red-500/30 bg-red-950/30 p-3 text-xs font-mono text-red-400">
                        {errorMessage || 'Transmission failed. Please check your connection.'}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full flex items-center justify-center gap-3 bg-cyan-500/10 border border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-400 text-cyan-300 px-6 py-4 font-mono text-sm font-bold tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status === 'submitting' ? (
                        <>
                          <span className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          Transmitting...
                        </>
                      ) : (
                        <>
                          Transmit Message
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </main>
        <FooterSection />
      </div>
    </div>
  );
}
