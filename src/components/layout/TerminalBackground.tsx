type TerminalBackgroundProps = {
  /** Pin to viewport (app shell) vs fill a local overlay (boot screen). */
  fixed?: boolean;
};

/** Landing-page starfield + storm — shared site backdrop. */
export function TerminalBackground({ fixed = true }: TerminalBackgroundProps) {
  return (
    <div
      className={`ve-terminal-background ${fixed ? 've-terminal-background--fixed' : 've-terminal-background--absolute'}`}
      aria-hidden="true"
    >
      <div className="starfield" />
      <div className="storm-layer" />
    </div>
  );
}
