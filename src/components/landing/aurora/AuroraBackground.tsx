import React, { useEffect, useRef } from "react";

export default function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle system representing real-time sports telemetry data streams
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.5 - 0.2, // Rising up
      opacity: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      hue: Math.random() > 0.6 ? 188 : Math.random() > 0.3 ? 160 : 210, // Cyan, Emerald, Sky Blue
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle telemetry grid lines near bottom
      const gridYStart = height * 0.55;
      ctx.strokeStyle = "rgba(34, 211, 238, 0.04)";
      ctx.lineWidth = 1;

      // Vertical perspective lines
      const lineCount = 14;
      const centerX = width / 2;
      for (let i = -lineCount / 2; i <= lineCount / 2; i++) {
        const topX = centerX + i * (width / (lineCount * 1.8));
        const bottomX = centerX + i * (width / (lineCount * 0.8));
        ctx.beginPath();
        ctx.moveTo(topX, gridYStart);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = gridYStart; y < height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render & update floating data particles
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.01;

        // Mouse subtle magnetic push
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          p.x -= (dx / dist) * 0.4;
          p.y -= (dy / dist) * 0.4;
        }

        // Wrap around
        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${Math.max(0.1, Math.min(0.85, p.opacity))})`;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {/* Deep Space Foundation */}
      <div className="absolute inset-0 bg-[#03060a]" />

      {/* Dynamic Aurora Glow Layers */}
      <div
        className="absolute inset-[-25%] animate-[pulse_10s_ease-in-out_infinite]"
        style={{
          background: `
            radial-gradient(circle at 50% 10%, rgba(34,211,238,0.24), transparent 45%),
            radial-gradient(circle at 20% 35%, rgba(16,185,129,0.16), transparent 38%),
            radial-gradient(circle at 80% 30%, rgba(56,189,248,0.18), transparent 40%),
            radial-gradient(circle at 50% 70%, rgba(99,102,241,0.12), transparent 50%)
          `,
          filter: "blur(95px)",
        }}
      />

      {/* Interactive Telemetry Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-85"
      />

      {/* Futuristic Laser Light Beams */}
      <div className="absolute left-1/2 top-0 h-96 w-[1200px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.18),transparent_60%)] blur-2xl" />

      {/* Horizon Horizon Accent Line */}
      <div className="absolute left-1/2 bottom-[20%] h-px w-[160vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(3,6,10,0.75)_100%)]" />
    </div>
  );
}

