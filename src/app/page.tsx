import React from 'react';
import { HeaderNav } from '@/components/HeaderNav';
import { HeroCommandDeck } from '@/components/HeroCommandDeck';
import { StorySection } from '@/components/StorySection';
import { StadiumGlobe } from '@/components/StadiumGlobe';
import { SlateMatrix } from '@/components/SlateMatrix';
import { ParkFactorRadar } from '@/components/ParkFactorRadar';
import { AuditLedgerStrip } from '@/components/AuditLedgerStrip';
import { TerminalFooter } from '@/components/TerminalFooter';

export const metadata = {
  title: 'VouchEdge // Institutional MLB Home Run Intelligence',
  description: 'Deterministic Statcast analytics, aerodynamic trajectory simulation, and cryptographic pre-lock audit trails for MLB.',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#06070a] text-slate-100 selection:bg-emerald-500 selection:text-black antialiased">
      {/* 1. Terminal Navbar */}
      <HeaderNav />

      {/* 2. Hero Section with Asymmetric Command Deck Preview */}
      <HeroCommandDeck />

      {/* 3. Scrollytelling Manifesto Deck */}
      <StorySection />

      {/* 4. Interactive 3D Stadium Radar Globe */}
      <StadiumGlobe />

      {/* 5. Quantitative Slate Matrix & Evidence Drawer */}
      <SlateMatrix />

      {/* 6. Environmental Park Factors */}
      <ParkFactorRadar />

      {/* 7. Cryptographic Audit Ledger */}
      <AuditLedgerStrip />

      {/* 8. Institutional Terminal Footer */}
      <TerminalFooter />
    </main>
  );
}
