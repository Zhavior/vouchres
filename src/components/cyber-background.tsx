/**
 * CyberBackground — live sports data network canvas.
 * Zig-zag neon lines, floating glowing nodes, subtle grid.
 */
import { useRef, useEffect } from "react";

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    // Read CSS variables for colors
    const styles = getComputedStyle(document.documentElement);
    const nodeColor = styles.getPropertyValue("--ve-node-color").trim() || "rgba(34, 211, 238, 0.4)";
    const zigzagColor = styles.getPropertyValue("--ve-zigzag-color").trim() || "rgba(0, 183, 255, 0.15)";
    const accent = styles.getPropertyValue("--ve-accent").trim() || "#00B7FF";

    // Extract rgba base from nodeColor for alpha manipulation
    const nodeBase = nodeColor.replace(/rgba?\(([^)]+)\)/, "$1").split(",").map(s => s.trim());

    // Nodes
    const nodes: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    for (let i = 0; i < 20; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: 1.5 + Math.random() * 2.5, a: 0.2 + Math.random() * 0.3,
      });
    }

    // Orbs
    const orbs = [
      { x: w * 0.2, y: h * 0.3, r: 220, vx: 0.08, vy: 0.06 },
      { x: w * 0.8, y: h * 0.7, r: 300, vx: -0.06, vy: -0.08 },
    ];

    let gridOffset = 0;

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      // Orbs
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < 0 || o.x > w) o.vx *= -1;
        if (o.y < 0 || o.y > h) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x, o.y, 5, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${nodeBase[0]}, ${nodeBase[1]}, ${nodeBase[2]}, 0.02)`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      });

      // Grid
      ctx.strokeStyle = zigzagColor;
      ctx.lineWidth = 1;
      gridOffset = (gridOffset + 0.1) % 50;
      for (let i = 0; i <= w / 50; i++) { ctx.beginPath(); ctx.moveTo(i * 50, 0); ctx.lineTo(i * 50, h); ctx.stroke(); }
      for (let i = 0; i <= h / 50; i++) { const y = (i * 50 + gridOffset) % h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Nodes + connections
      nodes.forEach((n, idx) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0) n.x = w; if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h; if (n.y > h) n.y = 0;
        ctx.fillStyle = `rgba(${nodeBase[0]}, ${nodeBase[1]}, ${nodeBase[2]}, ${n.a})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();

        for (let j = idx + 1; j < nodes.length; j++) {
          const dx = n.x - nodes[j].x, dy = n.y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) {
            ctx.strokeStyle = `rgba(${nodeBase[0]}, ${nodeBase[1]}, ${nodeBase[2]}, ${(1 - d / 160) * 0.06})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
      });

      raf = requestAnimationFrame(render);
    };

    render();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: -20 }} />
      {/* Neon streams */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -15 }}>
        <div className="neon-stream" style={{ top: "20%", height: "1.5px", width: "300px", background: `linear-gradient(90deg, transparent, var(--ve-accent), transparent)` }} />
        <div className="neon-stream" style={{ top: "55%", height: "1.5px", width: "400px", animationDuration: "20s", animationDirection: "reverse", background: `linear-gradient(90deg, transparent, var(--ve-purple), transparent)` }} />
        <div className="neon-stream" style={{ top: "80%", height: "1.5px", width: "250px", animationDuration: "12s", background: `linear-gradient(90deg, transparent, var(--ve-neon), transparent)` }} />
      </div>
    </>
  );
}
