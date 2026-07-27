interface HeroActionsProps {
  onPrimary?: () => void;
  onSecondary?: () => void;
}

export function HeroActions({
  onPrimary,
  onSecondary,
}: HeroActionsProps) {
  return (
    <div className="aurora-hero-actions">
      <button
        className="aurora-button aurora-button-primary aurora-button-large"
        type="button"
        onClick={onPrimary}
      >
        View today’s board
      </button>

      <button
        className="aurora-button aurora-button-secondary aurora-button-large"
        type="button"
        onClick={onSecondary}
      >
        See verified results
      </button>
    </div>
  );
}
