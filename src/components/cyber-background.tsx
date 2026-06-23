import { useRef, useEffect, useState } from "react";

/**
 * CyberBackground — animated canvas neural mesh + laser lines.
 * Lightweight (requestAnimationFrame, cleans up on unmount).
 * Sits behind all content at -z-20.
 */
export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Floating network nodes
    const colors = [
      "rgba(0, 212, 255, ",
      "rgba(139, 92, 246, ",
      "rgba(99, 102, 241, ",
      "rgba(16, 185, 129, ",
    ];

    const nodes: { x: number; y: number; vx: number; vy: number; r: number; a: number; c: string }[] = [];
    for (let i = 0; i < 25; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 2,
        a: 0.1 + Math.random() * 0.3,
        c: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Ambient glow orbs
    const orbs = [
      { x: width * 0.2, y: height * 0.3, r: 250, vx: 0.1, vy: 0.08, c: "rgba(0, 212, 255, 0.025)" },
      { x: width * 0.8, y: height * 0.7, r: 350, vx: -0.08, vy: -0.1, c: "rgba(139, 92, 246, 0.03)" },
    ];

    let gridOffset = 0;

    const render = () => {
      if (!ctx || !canvas) return;

      // Clear with dark base
      ctx.fillStyle = "#050810";
      ctx.fillRect(0, 0, width, height);

      // Glow orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < 0 || orb.x > width) orb.vx *= -1;
        if (orb.y < 0 || orb.y > height) orb.vy *= -1;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 5, orb.x, orb.y, orb.r);
        grad.addColorStop(0, orb.c);
        grad.addColorStop(1, "rgba(5, 8, 16, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Perspective grid
      ctx.strokeStyle = "rgba(0, 212, 255, 0.03)";
      ctx.lineWidth = 1;
      gridOffset = (gridOffset + 0.12) % 50;

      const cols = Math.ceil(width / 50) + 1;
      for (let i = 0; i < cols; i++) {
        const x = i * 50;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const rows = Math.ceil(height / 50) + 1;
      for (let i = 0; i < rows; i++) {
        const y = (i * 50 + gridOffset) % height;
        ctx.strokeStyle = "rgba(0, 212, 255, 0.025)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Neural mesh nodes + connections
      nodes.forEach((node, idx) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        ctx.fillStyle = `${node.c}${node.a})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes
        for (let j = idx + 1; j < nodes.length; j++) {
          const dx = node.x - nodes[j].x;
          const dy = node.y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 170) {
            const linkAlpha = (1 - dist / 170) * 0.08;
            ctx.strokeStyle = `rgba(0, 212, 255, ${linkAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: -20 }}
      />

      {/* CSS neon light streams */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -15 }}>
        <div className="neon-stream neon-stream-cyan" style={{ top: "15%" }} />
        <div className="neon-stream neon-stream-pink" style={{ top: "38%" }} />
        <div className="neon-stream neon-stream-purple" style={{ top: "62%" }} />
        <div className="neon-stream neon-stream-emerald" style={{ top: "82%" }} />
      </div>

      {/* Vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -10,
          background: "radial-gradient(ellipse at center, rgba(5,8,16,0) 30%, rgba(5,8,16,0.6) 100%)",
        }}
      />
    </>
  );
}
