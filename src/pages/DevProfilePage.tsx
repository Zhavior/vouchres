import React, { useMemo } from 'react';
import Navbar from '../components/landing-v4/Navbar';
import PublicFooter from '../components/landing-v4/PublicFooter';
import { BLOG_POSTS } from '../data/blog/posts';
import ArchitectureRegistry from '../components/dev/ArchitectureRegistry';
import DevBackdrop from '../components/dev/DevBackdrop';
import EngineeringPhilosophy from '../components/dev/EngineeringPhilosophy';
import OperatorHero from '../components/dev/OperatorHero';
import ShippedSystems from '../components/dev/ShippedSystems';
import Transmissions from '../components/dev/Transmissions';

/**
 * /dev — the engineering wing of VouchEdge.
 *
 * Same shell as the V4 landing (Navbar + PublicFooter), same typographic
 * philosophy, but a cyan engineering personality and a document rhythm:
 *
 *   HERO           cinematic, asymmetric
 *   01 SYSTEMS     structured, medium density
 *   02 PHILOSOPHY  sparse, editorial
 *   03 REGISTRY    dense, technical
 *   04 JOURNAL     sparse, editorial
 *   FOOTER         quiet
 */
export default function DevProfilePage() {
  const authoredPosts = useMemo(
    () => BLOG_POSTS.filter((post) => post.author.toLowerCase().includes('boyd')),
    [],
  );

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-ve-cyan/25 selection:text-white">
      <Navbar />

      <DevBackdrop />

      <div className="relative z-10">
        <main id="main">
          <OperatorHero />
          <ShippedSystems />
          <EngineeringPhilosophy />
          <ArchitectureRegistry />
          <Transmissions posts={authoredPosts} />
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
