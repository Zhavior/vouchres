import type { ButtonHTMLAttributes, ReactNode } from "react";

type CyberButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost";
};

export function CyberButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: CyberButtonProps) {
  const base = variant === "primary" ? "ve-button-primary" : "ve-button-ghost";

  return (
    <button className={`${base} px-4 py-2.5 ${className}`} {...props}>
      {children}
    </button>
  );
}
