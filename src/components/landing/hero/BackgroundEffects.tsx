import { motion } from "framer-motion";

export default function BackgroundEffects() {
  return (
    <>
      {/* Base */}
      <div className="absolute inset-0 bg-[#030303]" />

      {/* Aurora */}
      <motion.div
        className="absolute inset-0 opacity-60"
        animate={{
          backgroundPosition: [
            "0% 50%",
            "100% 50%",
            "0% 50%",
          ],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(0,220,255,.16), transparent 45%),
            radial-gradient(circle at 80% 20%, rgba(0,140,255,.12), transparent 40%),
            radial-gradient(circle at 50% 80%, rgba(255,255,255,.05), transparent 55%)
          `,
          backgroundSize: "200% 200%",
        }}
      />

      {/* Spotlight */}
      <div
        className="absolute left-1/2 top-0 h-[900px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,200,255,.12), transparent 70%)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle, transparent 45%, rgba(0,0,0,.75) 100%)",
        }}
      />

      {/* Noise */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url('https://grainy-gradients.vercel.app/noise.svg')",
        }}
      />
    </>
  );
}
