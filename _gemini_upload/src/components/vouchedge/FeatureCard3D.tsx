import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/**
 * FeatureCard3D — glass card with mouse-driven 3D tilt.
 *
 * On hover: rotates rotateX/rotateY based on mouse position.
 * On mobile: tilt is disabled (just a subtle lift).
 * Includes: glass background, glow border, icon, title, description, CTA arrow.
 */

interface Props {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  title: string;
  desc: string;
  onClick?: () => void;
  index: number;
}

export default function FeatureCard3D({ icon: Icon, iconColor, title, desc, onClick, index }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${iconColor}25`,
        boxShadow: `0 20px 40px -15px rgba(0,0,0,0.5), 0 0 30px -10px ${iconColor}15`,
      }}
      className="relative rounded-2xl p-5 cursor-pointer transition-all group overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      {/* Animated highlight line on top */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${iconColor}, transparent)` }}
      />

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border transition-transform group-hover:scale-110"
        style={{
          background: `${iconColor}12`,
          borderColor: `${iconColor}30`,
          transform: "translateZ(30px)",
        }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>

      {/* Title + arrow */}
      <div className="flex items-center gap-1.5 mb-1.5" style={{ transform: "translateZ(20px)" }}>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 leading-relaxed" style={{ transform: "translateZ(10px)" }}>
        {desc}
      </p>

      {/* Glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${iconColor}08, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}
