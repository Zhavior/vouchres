interface HeroBackgroundProps {
  imageUrl?: string;
}

export function HeroBackground({ imageUrl }: HeroBackgroundProps) {
  return (
    <div className="aurora-hero-background" aria-hidden="true">
      {imageUrl ? (
        <div
          className="aurora-hero-photograph"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />
      ) : (
        <div className="aurora-hero-photograph aurora-hero-placeholder" />
      )}

      <div className="aurora-hero-vignette" />
      <div className="aurora-hero-haze" />
      <div className="aurora-hero-grain" />
    </div>
  );
}
