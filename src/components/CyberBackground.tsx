import React, { useRef, useEffect, useState } from 'react';
import { Settings, Play, Pause, Zap, Grid, EyeOff, Sparkles } from 'lucide-react';
import { getFounderPointsLabel } from "../lib/founderAccess";

interface LaserLine {
  coord: number; // static position
  pos: number;   // active traveling variable
  speed: number;
  length: number;
  color: string;
  horizontal: boolean;
  width: number;
}

interface NodePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export default function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Custom interactive settings
  const [bgStyle, setBgStyle] = useState<'matrix' | 'lasers' | 'minimal' | 'aurora'>('matrix');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [intensity, setIntensity] = useState<number>(1.2); // 0.8 to 2.0
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize laser lines
    const lasers: LaserLine[] = [];
    const colors = [
      'rgba(56, 189, 248, ',  // cyan
      'rgba(139, 92, 246, ',  // purple
      'rgba(99, 102, 241, ',  // royal indigo
      'rgba(16, 185, 129, ',  // neon emerald
    ];

    const createLaser = (isHorizontal: boolean): LaserLine => {
      const colorBase = colors[Math.floor(Math.random() * colors.length)];
      return {
        coord: Math.random() * (isHorizontal ? height : width),
        pos: Math.random() * (isHorizontal ? width : height),
        speed: (2 + Math.random() * 4) * intensity,
        length: 80 + Math.random() * 190,
        color: colorBase,
        horizontal: isHorizontal,
        width: 1 + Math.random() * 1.5,
      };
    };

    // Spawn 14 lasers
    for (let i = 0; i < 14; i++) {
      lasers.push(createLaser(Math.random() > 0.5));
    }

    // Initialize floating network node points
    const nodes: NodePoint[] = [];
    const nodeCount = 35;
    for (let i = 0; i < nodeCount; i++) {
      const colorBase = colors[Math.floor(Math.random() * colors.length)];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45 * intensity,
        vy: (Math.random() - 0.5) * 0.45 * intensity,
        radius: 1 + Math.random() * 2,
        alpha: 0.15 + Math.random() * 0.4,
        color: colorBase,
      });
    }

    // Slow ambient glow light orbs
    const orbs = [
      { x: width * 0.2, y: height * 0.3, r: 250, targetR: 280, vx: 0.15, vy: 0.1, color: 'rgba(56, 189, 248, 0.03)' },
      { x: width * 0.8, y: height * 0.7, r: 350, targetR: 380, vx: -0.1, vy: -0.15, color: 'rgba(139, 92, 246, 0.035)' },
      { x: width * 0.5, y: height * 0.5, r: 200, targetR: 220, vx: 0.08, vy: -0.08, color: 'rgba(99, 102, 241, 0.025)' },
    ];

    // Grid scroll offset
    let gridOffset = 0;

    const render = () => {
      if (!ctx || !canvas) return;

      // Clear with elegant translucent fade to leave short cyber trails
      ctx.fillStyle = 'rgba(11, 15, 25, 1)';
      ctx.fillRect(0, 0, width, height);

      // --- 1. RENDER SOFT CHROMOSPHERE GLOW ORBS ---
      orbs.forEach((orb) => {
        if (isPlaying) {
          orb.x += orb.vx;
          orb.y += orb.vy;
          // Boundary bounce
          if (orb.x < 0 || orb.x > width) orb.vx *= -1;
          if (orb.y < 0 || orb.y > height) orb.vy *= -1;
          
          // Subtle beat swell effect
          orb.r += (orb.targetR - orb.r) * 0.005;
          if (Math.abs(orb.r - orb.targetR) < 1) {
            orb.targetR = (orb.targetR > 250 ? 180 + Math.random() * 100 : 280 + Math.random() * 120);
          }
        }

        const orbGrad = ctx.createRadialGradient(orb.x, orb.y, 5, orb.x, orb.y, orb.r);
        orbGrad.addColorStop(0, orb.color);
        orbGrad.addColorStop(1, 'rgba(11, 15, 25, 0)');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- 2. DRAW PERSPECTIVE TECH GRID ---
      if (showWireframe && bgStyle !== 'aurora') {
        ctx.strokeStyle = bgStyle === 'minimal' ? 'rgba(30, 41, 59, 0.15)' : 'rgba(56, 189, 248, 0.04)';
        ctx.lineWidth = 1;

        if (isPlaying) {
          gridOffset = (gridOffset + 0.18 * intensity) % 50;
        }

        // Draw vertical lines with dynamic opacity
        const cols = Math.ceil(width / 50) + 1;
        for (let i = 0; i < cols; i++) {
          const x = i * 50;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Draw horizontal scanning lines
        const rows = Math.ceil(height / 50) + 1;
        for (let i = 0; i < rows; i++) {
          const y = (i * 50 + gridOffset) % height;
          ctx.strokeStyle = bgStyle === 'lasers' ? 'rgba(139, 92, 246, 0.03)' : 'rgba(56, 189, 248, 0.035)';
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw tactical radar ticks or corner decoration points
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        const dotsRow = Math.ceil(height / 150);
        const dotsCol = Math.ceil(width / 150);
        for (let r = 0; r < dotsRow; r++) {
          for (let c = 0; c < dotsCol; c++) {
            ctx.beginPath();
            ctx.arc(c * 150, r * 150 + (gridOffset % 150), 0.75, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // --- 3. ANIMATE AND DRAW CYBER MESH MESHWORK NODES ---
      if (bgStyle === 'matrix' || bgStyle === 'lasers') {
        nodes.forEach((node, idx) => {
          if (isPlaying) {
            node.x += node.vx;
            node.y += node.vy;

            // Bounce wrap
            if (node.x < 0) node.x = width;
            if (node.x > width) node.x = 0;
            if (node.y < 0) node.y = height;
            if (node.y > height) node.y = 0;
          }

          // Draw the singular node
          ctx.fillStyle = `${node.color}${node.alpha})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fill();

          // Connect nodes to neighboring nodes within limit
          for (let j = idx + 1; j < nodes.length; j++) {
            const nextNode = nodes[j];
            const dx = node.x - nextNode.x;
            const dy = node.y - nextNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 185) {
              const linkAlpha = (1 - dist / 185) * 0.11 * intensity;
              ctx.strokeStyle = `rgba(56, 189, 248, ${linkAlpha})`;
              ctx.lineWidth = 0.6;
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(nextNode.x, nextNode.y);
              ctx.stroke();
            }
          }
        });
      }

      // --- 4. ANIMATE AND DRAW ELECTRIC NEON LASERS ---
      if (bgStyle !== 'minimal' && bgStyle !== 'aurora') {
        lasers.forEach((laser, index) => {
          if (isPlaying) {
            laser.pos += laser.speed;

            // Recycle lasers once out of bounds
            const limit = laser.horizontal ? width : height;
            if (laser.pos - laser.length > limit) {
              Object.assign(laser, createLaser(laser.horizontal));
              laser.pos = -laser.length;
            }
          }

          ctx.lineWidth = laser.width;
          const laserGrad = laser.horizontal
            ? ctx.createLinearGradient(laser.pos, laser.coord, laser.pos + laser.length, laser.coord)
            : ctx.createLinearGradient(laser.coord, laser.pos, laser.coord, laser.pos + laser.length);

          laserGrad.addColorStop(0, `${laser.color}0)`);
          laserGrad.addColorStop(0.5, `${laser.color}0.38)`);
          laserGrad.addColorStop(0.9, `${laser.color}0.85)`);
          laserGrad.addColorStop(1, '#ffffff'); // bright sparks head

          ctx.strokeStyle = laserGrad;
          ctx.beginPath();
          if (laser.horizontal) {
            ctx.moveTo(laser.pos, laser.coord);
            ctx.lineTo(laser.pos + laser.length, laser.coord);
          } else {
            ctx.moveTo(laser.coord, laser.pos);
            ctx.lineTo(laser.coord, laser.pos + laser.length);
          }
          ctx.stroke();

          // Add subtle bright flare sparks at the very tip of faster laser flows
          if (laser.speed > 4.5 && Math.random() > 0.4) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = laser.color.substring(0, laser.color.length - 2) + '1)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            const tx = laser.horizontal ? laser.pos + laser.length : laser.coord;
            const ty = laser.horizontal ? laser.coord : laser.pos + laser.length;
            ctx.arc(tx, ty, 1.25, 0, Math.PI * 2);
            ctx.fill();
            // Reset shadows instantly for canvas drawing pipeline optimization
            ctx.shadowBlur = 0;
          }
        });
      }

      if (isPlaying) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [bgStyle, isPlaying, intensity, showWireframe]);

  return (
    <>
      {/* Absolute canvas wrapper underneath everything */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full -z-20 block pointer-events-none"
        id="cyber-matrix-background-canvas"
      />

      {/* Global CSS moving neon light lines layout */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-15" id="global-css-neon-lines-container">
        <div className="css-neon-stream stream-cyan" style={{ top: '15%' }} />
        <div className="css-neon-stream stream-pink" style={{ top: '38%' }} />
        <div className="css-neon-stream stream-purple" style={{ top: '65%' }} />
        <div className="css-neon-stream stream-emerald" style={{ top: '85%' }} />
        <div className="css-neon-stream stream-diagonal-gold" style={{ top: '10%', left: '15%' }} />
        <div className="css-neon-stream stream-diagonal-violet" style={{ top: '30%', left: '55%' }} />
      </div>

      {/* Cyber tactical scanning filter lines */}
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-linear-to-b from-transparent via-[#0b0f19]/35 to-[#0b0f19]/50 block"
        style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(11, 15, 25, 0) 30%, rgba(11, 15, 25, 0.75) 100%)',
        }}
      />

      {/* Elegant HUD Controller Switcher for user customization */}
      <div 
        className="fixed top-4 right-16 z-40 select-none" 
        id="bg-neural-matrix-controller"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-900 hover:border-sky-500/40 text-slate-400 hover:text-sky-400 transition-all text-[11px] font-bold font-mono tracking-wider shadow-lg"
          >
            <Settings className={`w-3.5 h-3.5 ${showConfig ? 'animate-spin' : ''}`} />
            <span>MATRIX CORE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {showConfig && (
            <div 
              className="absolute right-0 top-10 w-64 bg-slate-950/95 backdrop-blur-md border border-slate-900 p-3 rounded-xl shadow-2xl space-y-3 font-mono text-[10.5px] text-slate-300 animate-slide-up"
              id="bg-config-dropdown"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <span className="font-extrabold uppercase text-sky-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Background Engine
                </span>
                <span className="text-[8px] text-slate-550">PREMIUM HUD v1.2</span>
              </div>

              {/* Intensity Sliders */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9.5px]">
                  <span>ANIMATION SPEED</span>
                  <span className="text-emerald-400">{Math.round(intensity * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={intensity}
                  onChange={(e) => setIntensity(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                />
              </div>

              {/* Mode Selection Grid */}
              <div className="space-y-1.5">
                <span className="text-[8.5px] uppercase text-slate-500">DYNAMIC EFFECT STYLE</span>
                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold text-center">
                  <button
                    onClick={() => setBgStyle('matrix')}
                    className={`py-1.5 px-1 rounded-lg border ${
                      bgStyle === 'matrix' 
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-sm' 
                        : 'bg-slate-900 border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Neural Mesh
                  </button>
                  <button
                    onClick={() => setBgStyle('lasers')}
                    className={`py-1.5 px-1 rounded-lg border ${
                      bgStyle === 'lasers' 
                        ? 'bg-violet-500/10 border-violet-500/40 text-violet-400 shadow-sm' 
                        : 'bg-slate-900 border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Light Lanes
                  </button>
                  <button
                    onClick={() => setBgStyle('aurora')}
                    className={`py-1.5 px-1 rounded-lg border ${
                      bgStyle === 'aurora' 
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-sm' 
                        : 'bg-slate-900 border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Subtle Aurora
                  </button>
                  <button
                    onClick={() => setBgStyle('minimal')}
                    className={`py-1.5 px-1 rounded-lg border ${
                      bgStyle === 'minimal' 
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-sm' 
                        : 'bg-slate-900 border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Clean Light
                  </button>
                </div>
              </div>

              {/* Play/Pause & Grid controls */}
              <div className="flex gap-1.5 pt-1 border-t border-slate-900/40">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                    isPlaying 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>PAUSED</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>RESUME</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowWireframe(!showWireframe)}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                    showWireframe 
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' 
                      : 'bg-slate-900 border-transparent text-slate-500'
                  }`}
                >
                  {showWireframe ? <Grid className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>GRID {showWireframe ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
