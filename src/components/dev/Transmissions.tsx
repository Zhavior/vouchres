import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { BlogPost } from '../../data/blog/posts';
import { FOCUS_RING, Reveal, ScanRule, SectionHeader } from './DevPrimitives';

/**
 * Authored transmissions as an editorial index rather than a card grid.
 * Rendered only when the operator actually has authored posts.
 */
export default function Transmissions({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="px-6 py-24 sm:py-32" aria-labelledby="transmissions">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          index="04"
          label="Transmissions"
          title={<span id="transmissions">Writing from the systems layer.</span>}
          lede="Methodology, founder record, and release notes — published under the same evidence standard as the product."
        />

        <ol className="border-t border-white/[0.08]">
          {posts.map((post, i) => (
            <li key={post.id}>
              <Reveal>
                <a
                  href={`/blog/${post.slug}`}
                  className={`group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 gap-y-2 border-b border-white/[0.08] py-7 no-underline transition-colors hover:bg-white/[0.02] sm:grid-cols-[3.5rem_1fr_auto] sm:gap-x-8 sm:py-9 ${FOCUS_RING}`}
                >
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/20 transition-colors group-hover:text-ve-cyan">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span className="min-w-0">
                    <span className="block text-lg leading-snug font-medium text-white/85 transition-colors group-hover:text-white sm:text-xl">
                      {post.title}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
                      <span className="text-ve-cyan/70">{post.tag}</span>
                      <span aria-hidden="true">/</span>
                      <span>{post.readTime}</span>
                      <span className="sm:hidden" aria-hidden="true">/</span>
                      <span className="sm:hidden">{post.date}</span>
                    </span>
                  </span>

                  <span className="col-start-2 hidden items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/25 sm:col-start-auto sm:flex">
                    <span className="whitespace-nowrap">{post.date}</span>
                    <ArrowUpRight
                      className="h-4 w-4 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ve-cyan"
                      aria-hidden="true"
                    />
                  </span>
                </a>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal className="mt-10 flex justify-end">
          <a
            href="/blog"
            className={`group inline-flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 no-underline transition-colors hover:text-ve-cyan ${FOCUS_RING}`}
          >
            View Journal
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </Reveal>

        <ScanRule className="mt-12" />
      </div>
    </section>
  );
}
