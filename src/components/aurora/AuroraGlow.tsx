import { motion } from "framer-motion";
import clsx from "clsx";

type AuroraGlowProps = {
  intensity?: "low" | "medium" | "high";
};

const intensityMap = {
  low: "opacity-20",
  medium: "opacity-35",
  high: "opacity-50",
} as const;

export function AuroraGlow({
  intensity = "medium",
}: AuroraGlowProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        className={clsx(
          "absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full",
          "bg-ve-ion blur-3xl",
          intensityMap[intensity],
        )}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, 25, -10, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className={clsx(
          "absolute -right-48 bottom-[-10rem] h-[36rem] w-[36rem] rounded-full",
          "bg-ve-voltage blur-3xl",
          "opacity-25",
        )}
        animate={{
          x: [0, -35, 10, 0],
          y: [0, -20, 15, 0],
          scale: [1.05, 1, 1.05],
        }}
        transition={{
          duration: 36,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
