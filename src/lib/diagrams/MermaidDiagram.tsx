import React, { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  /** Mermaid diagram source (flowchart, sequence, etc). */
  definition: string;
  id: string;
  className?: string;
}

let mermaidInitialized = false;

/**
 * Renders a Mermaid diagram to SVG. `mermaid` is dynamically imported so its
 * ~500KB doesn't sit in the main bundle — it only loads when a diagram is
 * actually mounted. Themed to match the Z8 Obsidian palette (emerald/cyan,
 * dark panels) rather than Mermaid's default light theme.
 */
export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ definition, id, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
              background: '#050505',
              primaryColor: 'rgba(0,240,255,0.10)',
              primaryTextColor: '#f8fafc',
              primaryBorderColor: '#00F0FF',
              lineColor: 'rgba(255,255,255,0.35)',
              secondaryColor: 'rgba(0,255,148,0.10)',
              tertiaryColor: 'rgba(255,255,255,0.04)',
              fontFamily: 'inherit',
              fontSize: '14px',
            },
            securityLevel: 'strict',
          });
          mermaidInitialized = true;
        }
        const { svg: rendered } = await mermaid.render(id, definition);
        if (alive) setSvg(rendered);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Diagram failed to render');
      }
    })();

    return () => {
      alive = false;
    };
  }, [definition, id]);

  if (error) {
    return (
      <div className={className}>
        <p className="text-xs text-rose-300">Diagram unavailable: {error}</p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={className}>
        <div className="h-40 w-full animate-pulse rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  return <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default MermaidDiagram;
