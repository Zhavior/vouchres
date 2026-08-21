import React from 'react';
import { motion } from 'framer-motion';
import { FooterSection } from '../components/landing-v3';
import PublicNav from '../components/landing-v3/PublicNav';
import { AURORA_MAX_SHELL } from '../theme/auroraTokens';

export default function PolicyPage() {
  const isTerms = typeof window !== 'undefined' && window.location.pathname.toLowerCase() === '/terms';

  return (
    <div className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 ${AURORA_MAX_SHELL}`} data-scroll-owner="document">
      <PublicNav />
      <div className="flex flex-col min-h-screen bg-black text-white pt-16">
        <main className="flex-grow flex flex-col px-6 py-24 sm:py-32 w-full max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-4xl font-bold mb-12 font-mono uppercase tracking-widest text-white border-b border-white/10 pb-6">
              {isTerms ? 'Terms of Service' : 'Privacy Policy'}
            </h1>
            <div className="prose prose-invert max-w-none text-zinc-300 font-sans">
              <p className="mb-6 text-sm text-zinc-400 font-mono tracking-wider">
                LAST UPDATED: AUGUST 20, 2026
              </p>
              <p className="mb-4">
                This is the {isTerms ? 'terms of service' : 'privacy policy'} for VouchEdge. By using our application, you agree to these terms.
              </p>
              <h2 className="text-xl font-bold mt-10 mb-4 text-white">1. Introduction</h2>
              <p className="mb-4 text-zinc-400">
                (Replace this placeholder text with your actual, legally-reviewed policy content. Use standard markdown/HTML elements like headers and lists to format your sections.)
              </p>
              <h2 className="text-xl font-bold mt-10 mb-4 text-white">2. Data Processing</h2>
              <p className="mb-4 text-zinc-400">
                VouchEdge operates as a non-custodial research environment where applicable...
              </p>
            </div>
          </motion.div>
        </main>
        <FooterSection />
      </div>
    </div>
  );
}
