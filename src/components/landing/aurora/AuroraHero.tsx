import React from 'react';
import AuroraBackground from './AuroraBackground';

export default function AuroraHero() {
  return (
    <section className="relative overflow-hidden rounded-[32px]">
      <AuroraBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <h1 className="text-6xl font-black text-white">
          Aurora Hero
        </h1>

        <p className="mt-6 max-w-xl text-white/70">
          Temporary hero placeholder. We'll build the full premium version next.
        </p>
      </div>
    </section>
  );
}
