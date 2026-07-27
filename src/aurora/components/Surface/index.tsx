import type { HTMLAttributes } from "react";
import clsx from "clsx";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: "flat" | "raised" | "floating";
}

export function Surface({
  elevation = "flat",
  className,
  ...props
}: SurfaceProps) {
  const elevationClass = {
    flat: "",
    raised: "shadow-md",
    floating: "shadow-xl",
  }[elevation];

  return (
    <div
      className={clsx(
        "rounded-3xl border border-white/10 bg-neutral-950/70 backdrop-blur-xl",
        elevationClass,
        className
      )}
      {...props}
    />
  );
}

export default Surface;
