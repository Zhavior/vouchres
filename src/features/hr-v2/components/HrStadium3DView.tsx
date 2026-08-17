import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { ChunkA } from '../api/contracts';
import { PlayerHeadshot } from './PlayerHeadshot';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { getCalibratedEvBadge } from '../../../lib/analytics/evCalculator';
import { AuroraMaxTruthBadge } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { formatGameClock } from '../presentHrV10Metric';
import { STRINGS_EN } from '../stringsEn';
import { TIER_VERY_HIGH_MIN, TIER_HIGH_MIN } from '../constants';
import { safeNumber } from '../../../utils/safeNumber';

interface HrStadium3DViewProps {
  items: ChunkA[];
}

type CameraPreset = 'flyover' | 'plate' | 'outfield' | 'pressbox';

interface TrajectoryData {
  item: ChunkA;
  distance: number; // in feet (e.g. 380 - 450)
  angleDeg: number; // in degrees: -40 (LF) to +40 (RF), 0 is CF
  apexHeight: number; // peak height in feet
  exitVelo: number; // mph
  launchAngle: number; // deg
  tier: 'very_high' | 'high' | 'moderate';
  color: string;
  glowColor: string;
}

// Generate realistic deterministic trajectory parameters from Statcast / item data
function deriveTrajectory(item: ChunkA, index: number): TrajectoryData {
  const hrIndex = safeNumber(item.score?.hrIndex, 75);
  const exitVelo = item.statcastSummary?.xSLG != null
    ? Math.round(100 + item.statcastSummary.xSLG * 25)
    : Math.round(98 + (hrIndex / 100) * 18);

  const launchAngle = item.statcastSummary?.barrelRate != null
    ? Math.round(22 + item.statcastSummary.barrelRate * 50)
    : Math.round(24 + (index % 7) * 1.8);

  const handedness = item.identity.handedness ?? 'R';
  // Pull hitters tend towards their pull side (-25 to -10 for R, +10 to +25 for L)
  const baseSpray = handedness === 'R' ? -18 : 18;
  const sprayOffset = ((index * 13) % 45) - 22;
  const angleDeg = Math.max(-38, Math.min(38, baseSpray + sprayOffset));

  const distance = Math.round(375 + (hrIndex / 100) * 65 + ((index * 7) % 20));
  const apexHeight = Math.round(distance * 0.22 * Math.sin((launchAngle * Math.PI) / 180) * 1.5 + 45);

  let tier: 'very_high' | 'high' | 'moderate' = 'moderate';
  let color = '#f59e0b';
  let glowColor = 'rgba(245, 158, 11, 0.4)';

  if (hrIndex >= TIER_VERY_HIGH_MIN) {
    tier = 'very_high';
    color = '#00d9a0';
    glowColor = 'rgba(0, 217, 160, 0.5)';
  } else if (hrIndex >= TIER_HIGH_MIN) {
    tier = 'high';
    color = '#10b981';
    glowColor = 'rgba(16, 185, 129, 0.5)';
  }

  return {
    item,
    distance,
    angleDeg,
    apexHeight,
    exitVelo,
    launchAngle,
    tier,
    color,
    glowColor,
  };
}

export function HrStadium3DView({ items }: HrStadium3DViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Selected player for 3D spotlight & Holographic Dossier
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    items[0]?.playerId ?? null
  );

  // Camera 3D parameters:
  // yaw: horizontal rotation angle (radians)
  // pitch: vertical elevation angle (radians)
  // zoom: distance scale factor
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('flyover');
  const cameraRef = useRef({
    yaw: 0,
    pitch: 0.65, // ~37 degrees elevation
    distance: 680,
    targetY: 40,
  });

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const pulsePhaseRef = useRef(0);

  // Sync selected player if item list changes
  useEffect(() => {
    if (items.length > 0 && (!selectedPlayerId || !items.some((i) => i.playerId === selectedPlayerId))) {
      setSelectedPlayerId(items[0].playerId);
    }
  }, [items, selectedPlayerId]);

  // Derive 3D trajectories for all items
  const trajectories = useMemo(() => {
    return items.map((item, idx) => deriveTrajectory(item, idx));
  }, [items]);

  const selectedTrajectory = useMemo(() => {
    return trajectories.find((t) => t.item.playerId === selectedPlayerId) ?? trajectories[0] ?? null;
  }, [trajectories, selectedPlayerId]);

  // Set camera angle from preset
  const applyPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    const cam = cameraRef.current;
    if (preset === 'flyover') {
      cam.yaw = 0;
      cam.pitch = 0.75;
      cam.distance = 680;
      cam.targetY = 40;
    } else if (preset === 'plate') {
      cam.yaw = 0;
      cam.pitch = 0.18;
      cam.distance = 420;
      cam.targetY = 30;
    } else if (preset === 'outfield') {
      cam.yaw = Math.PI;
      cam.pitch = 0.45;
      cam.distance = 550;
      cam.targetY = 40;
    } else if (preset === 'pressbox') {
      cam.yaw = -0.45;
      cam.pitch = 0.55;
      cam.distance = 620;
      cam.targetY = 50;
    }
  }, []);

  // Quick Add to parlay slip handler
  const handleQuickAdd = useCallback((item: ChunkA) => {
    openParlayAdd({
      player: {
        id: item.playerId,
        name: item.identity?.name || 'Player',
        team: item.identity?.teamAbbreviation || 'MLB',
        position: 'OF',
        propositions: [],
        resolvedGamePk: item.gameState?.gameId,
      },
      propHint: {
        id: `hr_${item.playerId}`,
        playerId: item.playerId,
        market: 'home_run',
        spec: 'Over 0.5',
        odds: item.odds?.price ?? 250,
        gamePk: item.gameState?.gameId,
      },
      source: 'hr_intelligence',
      dataStatus: 'official',
      reasoningSnapshot: item.score?.primaryRecommendation || 'HR Intel Pick',
    });
  }, []);

  // 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    // Handle high DPI displays
    const resizeCanvas = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 3D World to 2D Screen Projection Matrix Function
    const project3D = (
      wx: number,
      wy: number,
      wz: number,
      viewWidth: number,
      viewHeight: number
    ): { x: number; y: number; z: number; visible: boolean } => {
      const cam = cameraRef.current;
      const cosY = Math.cos(cam.yaw);
      const sinY = Math.sin(cam.yaw);
      const cosP = Math.cos(cam.pitch);
      const sinP = Math.sin(cam.pitch);

      // Translate relative to origin
      const tx = wx;
      const ty = wy - cam.targetY;
      const tz = wz - 180; // center of baseball diamond

      // Yaw rotation (horizontal around Y axis)
      const x1 = tx * cosY - tz * sinY;
      const y1 = ty;
      const z1 = tx * sinY + tz * cosY;

      // Pitch rotation (vertical tilt around X axis)
      const x2 = x1;
      const y2 = y1 * cosP - z1 * sinP;
      const z2 = y1 * sinP + z1 * cosP + cam.distance;

      if (z2 <= 20) return { x: 0, y: 0, z: z2, visible: false };

      // Perspective projection
      const fov = 500;
      const screenX = viewWidth / 2 + (x2 * fov) / z2;
      const screenY = viewHeight / 2 - (y2 * fov) / z2;

      return { x: screenX, y: screenY, z: z2, visible: true };
    };

    // Wind particles simulation state
    const windParticles: Array<{ x: number; y: number; z: number; speed: number }> = [];
    for (let i = 0; i < 40; i++) {
      windParticles.push({
        x: (Math.random() - 0.5) * 350,
        y: Math.random() * 80 + 10,
        z: Math.random() * 400 - 50,
        speed: 1.2 + Math.random() * 1.5,
      });
    }

    const render = () => {
      if (!isMounted || !canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Deep space stadium background gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        50,
        width / 2,
        height / 2,
        width * 0.7
      );
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.6, '#090d16');
      bgGrad.addColorStop(1, '#030712');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      pulsePhaseRef.current = (pulsePhaseRef.current + 0.02) % 1;

      // 1. Draw 3D Stadium Field & Grass Sector
      const home = project3D(0, 0, 0, width, height);
      const foulLeft = project3D(-230, 0, 230, width, height);
      const foulRight = project3D(230, 0, 230, width, height);

      // Outfield arc perimeter points
      const outfieldPoints: Array<{ x: number; y: number }> = [];
      const numSegments = 24;
      for (let i = 0; i <= numSegments; i++) {
        const angle = -Math.PI / 4 + (i / numSegments) * (Math.PI / 2);
        const radius = 330;
        const wx = radius * Math.sin(angle) * 1.1;
        const wz = radius * Math.cos(angle) * 1.15;
        const p = project3D(wx, 0, wz, width, height);
        outfieldPoints.push(p);
      }

      // Draw Outfield Grass
      if (home.visible) {
        ctx.beginPath();
        ctx.moveTo(home.x, home.y);
        ctx.lineTo(foulLeft.x, foulLeft.y);
        outfieldPoints.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.lineTo(foulRight.x, foulRight.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Warning Track band
        ctx.beginPath();
        outfieldPoints.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. Draw Infield Dirt Diamond
      const firstBase = project3D(65, 0, 65, width, height);
      const secondBase = project3D(0, 0, 130, width, height);
      const thirdBase = project3D(-65, 0, 65, width, height);
      const mound = project3D(0, 3, 60.5, width, height);

      if (home.visible && firstBase.visible && secondBase.visible && thirdBase.visible) {
        // Dirt Infield
        ctx.beginPath();
        ctx.moveTo(home.x, home.y);
        ctx.lineTo(firstBase.x, firstBase.y);
        ctx.lineTo(secondBase.x, secondBase.y);
        ctx.lineTo(thirdBase.x, thirdBase.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(180, 83, 9, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Baseline chalk lines
        ctx.beginPath();
        ctx.moveTo(home.x, home.y);
        ctx.lineTo(foulLeft.x, foulLeft.y);
        ctx.moveTo(home.x, home.y);
        ctx.lineTo(foulRight.x, foulRight.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Bases markers
        const drawBase = (p: { x: number; y: number }, label?: string) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          if (label) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '9px monospace';
            ctx.fillText(label, p.x + 5, p.y - 4);
          }
        };

        drawBase(home, 'HP');
        drawBase(firstBase, '1B');
        drawBase(secondBase, '2B');
        drawBase(thirdBase, '3B');
        drawBase(mound, 'MOUND');
      }

      // 3. Outfield Wall Distance Callouts
      const wallLF = project3D(-200, 15, 220, width, height);
      const wallLCF = project3D(-110, 15, 330, width, height);
      const wallCF = project3D(0, 15, 360, width, height);
      const wallRCF = project3D(110, 15, 330, width, height);
      const wallRF = project3D(200, 15, 220, width, height);

      const drawWallMarker = (p: { x: number; y: number; visible: boolean }, dist: string) => {
        if (!p.visible) return;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(dist, p.x, p.y);
      };

      drawWallMarker(wallLF, "318' LF");
      drawWallMarker(wallLCF, "385' LCF");
      drawWallMarker(wallCF, "408' CF");
      drawWallMarker(wallRCF, "385' RCF");
      drawWallMarker(wallRF, "314' RF");

      // 4. Live 3D Wind Vector Simulation
      ctx.strokeStyle = 'rgba(0, 217, 160, 0.25)';
      ctx.lineWidth = 1;
      windParticles.forEach((wp) => {
        wp.x += wp.speed * 0.6;
        wp.z += wp.speed;
        if (wp.z > 360 || wp.x > 200) {
          wp.x = (Math.random() - 0.5) * 300 - 50;
          wp.z = Math.random() * 50;
        }
        const p1 = project3D(wp.x, wp.y, wp.z, width, height);
        const p2 = project3D(wp.x + 8, wp.y, wp.z + 14, width, height);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // 5. Draw 3D Parabolic Batted-Ball Launch Trajectories
      trajectories.forEach((traj) => {
        const isSelected = traj.item.playerId === selectedPlayerId;
        const rad = (traj.angleDeg * Math.PI) / 180;
        const steps = 30;

        ctx.beginPath();
        let firstPoint = true;

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          // Scale feet to 3D world units (~0.8 scale)
          const currDist = traj.distance * 0.78 * t;
          const wx = currDist * Math.sin(rad);
          const wz = currDist * Math.cos(rad);
          // Parabolic height calculation: 4 * h * t * (1-t)
          const wy = 4 * traj.apexHeight * 0.65 * t * (1 - t);

          const proj = project3D(wx, wy, wz, width, height);
          if (proj.visible) {
            if (firstPoint) {
              ctx.moveTo(proj.x, proj.y);
              firstPoint = false;
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          }
        }

        // Selected trajectory gets bright spotlight & bloom
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = traj.color;
          ctx.shadowBlur = 16;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Inner colored core
          ctx.strokeStyle = traj.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = traj.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Animated Traveling Pulse Node along the arc
        const pulseT = pulsePhaseRef.current;
        const pulseDist = traj.distance * 0.78 * pulseT;
        const pwx = pulseDist * Math.sin(rad);
        const pwz = pulseDist * Math.cos(rad);
        const pwy = 4 * traj.apexHeight * 0.65 * pulseT * (1 - pulseT);
        const pulseProj = project3D(pwx, pwy, pwz, width, height);

        if (pulseProj.visible) {
          ctx.beginPath();
          ctx.arc(pulseProj.x, pulseProj.y, isSelected ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = traj.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Landing Point Target Ring
        const endDist = traj.distance * 0.78;
        const endWx = endDist * Math.sin(rad);
        const endWz = endDist * Math.cos(rad);
        const endProj = project3D(endWx, 0, endWz, width, height);

        if (endProj.visible) {
          ctx.beginPath();
          ctx.arc(endProj.x, endProj.y, isSelected ? 6 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = traj.color;
          ctx.shadowColor = traj.color;
          ctx.shadowBlur = isSelected ? 14 : 6;
          ctx.fill();
          ctx.shadowBlur = 0;

          if (isSelected) {
            // Pulsing target ring
            ctx.beginPath();
            ctx.arc(endProj.x, endProj.y, 10 + pulsePhaseRef.current * 8, 0, Math.PI * 2);
            ctx.strokeStyle = traj.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Distance & Name Badge over landing point
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${traj.item.identity.name} • ${traj.distance}ft`, endProj.x, endProj.y - 14);
          }
        }
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [trajectories, selectedPlayerId]);

  // Mouse / Touch Drag Orbit Navigation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const cam = cameraRef.current;
    cam.yaw += dx * 0.008;
    cam.pitch = Math.max(0.1, Math.min(1.4, cam.pitch + dy * 0.006));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const cam = cameraRef.current;
    cam.distance = Math.max(300, Math.min(1200, cam.distance + e.deltaY * 0.8));
  };

  const gameTimeStr = selectedTrajectory ? formatGameClock(selectedTrajectory.item.gameTime) : '';
  const evPctStr = selectedTrajectory
    ? getCalibratedEvBadge(selectedTrajectory.item.score?.hrIndex ?? 0, selectedTrajectory.item.odds?.price)
    : '';

  let truthState: 'confirmed' | 'live' | 'projected' | 'warning' | 'missing' = 'missing';
  if (selectedTrajectory?.item.lineupStatus === 'confirmed_starter') truthState = 'confirmed';
  else if (selectedTrajectory?.item.lineupStatus === 'roster') truthState = 'projected';
  if (selectedTrajectory?.item.gameState?.lifecycle === 'live') truthState = 'live';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[620px] rounded-3xl bg-[#090d16] border border-white/10 overflow-hidden shadow-2xl flex flex-col select-none"
    >
      {/* 3D Canvas Stage */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top 3D Control Bar & Camera Presets */}
      <div className="relative z-10 p-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Eyebrow & Status */}
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="text-xs font-mono font-bold text-white tracking-wide">
            {STRINGS_EN.stadium3d.title}
          </span>
          <span className="text-[10px] font-mono text-emerald-300/80 hidden sm:inline">
            ({trajectories.length} trajectories)
          </span>
        </div>

        {/* Camera Angle Selector */}
        <div className="pointer-events-auto flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-2xl border border-white/10">
          {(['flyover', 'plate', 'outfield', 'pressbox'] as CameraPreset[]).map((preset) => {
            const isActive = cameraPreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-vouch-cyan/20 text-vouch-cyan border border-vouch-cyan/40 shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {STRINGS_EN.stadium3d.cameraPresets[preset]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Floating Interactive Holographic Dossier */}
      {selectedTrajectory && (
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex justify-center">
          <div className="pointer-events-auto w-full max-w-2xl bg-[#0b0f19]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
            {/* Left: Player Avatar, Name & Matchup */}
            <div className="flex items-center gap-3.5 min-w-0">
              <PlayerHeadshot
                mlbId={selectedTrajectory.item.identity?.mlbId}
                name={selectedTrajectory.item.identity?.name || 'Player'}
                size={52}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${
                      selectedTrajectory.tier === 'very_high'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : selectedTrajectory.tier === 'high'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {(selectedTrajectory.item.score?.hrIndex ?? 0)} HRPI
                  </span>
                  <AuroraMaxTruthBadge state={truthState}>
                    {(selectedTrajectory.item.gameState?.lifecycle || 'SCHEDULED').toUpperCase()}
                  </AuroraMaxTruthBadge>
                  <span className="text-[10px] text-white/40 font-mono">{gameTimeStr}</span>
                </div>
                <h3 className="text-base font-black text-white truncate">
                  {selectedTrajectory.item.identity?.name || 'Player'}{' '}
                  <span className="text-white/40 font-normal">
                    ({selectedTrajectory.item.identity?.teamAbbreviation || 'MLB'})
                  </span>
                </h3>
                <p className="text-xs text-white/60 truncate mt-0.5">
                  vs <strong className="text-white">{selectedTrajectory.item.opposingPitcherName || 'TBD'}</strong>
                  {selectedTrajectory.item.opposingPitcherHandedness ? ` (${selectedTrajectory.item.opposingPitcherHandedness})` : ''}
                  {' · '}{selectedTrajectory.item.opponentTeamId || 'OPP'}
                </p>
              </div>
            </div>

            {/* Middle: 3D Statcast Telemetry Strip */}
            <div className="flex items-center justify-between sm:justify-center gap-3 bg-black/40 px-3.5 py-2 rounded-xl border border-white/5 text-center font-mono">
              <div>
                <span className="text-[9px] text-white/40 block">LAUNCH</span>
                <span className="text-xs font-bold text-white">
                  {selectedTrajectory.exitVelo} mph @ {selectedTrajectory.launchAngle}°
                </span>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div>
                <span className="text-[9px] text-white/40 block">DISTANCE</span>
                <span className="text-xs font-bold text-emerald-300">
                  {selectedTrajectory.distance} ft
                </span>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div>
                <span className="text-[9px] text-white/40 block">EDGE</span>
                <span className="text-xs font-bold text-emerald-400">
                  {evPctStr} EV
                </span>
              </div>
            </div>

            {/* Right: Quick Add Button */}
            <button
              type="button"
              onClick={() => handleQuickAdd(selectedTrajectory.item)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-vouch-cyan/20 border border-vouch-cyan/40 text-vouch-cyan hover:bg-vouch-cyan/30 text-xs font-bold font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
            >
              <Zap className="w-3.5 h-3.5 shrink-0 text-emerald-300" /> {STRINGS_EN.stadium3d.dossier.quickAdd}
            </button>
          </div>
        </div>
      )}

      {/* Trajectory Player Quick-Selector Shelf */}
      <div className="absolute top-16 right-4 z-10 max-h-[360px] overflow-y-auto hidden md:flex flex-col gap-1.5 p-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 w-48 scrollbar-none">
        <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest px-2 py-1">
          Hitter Trajectories
        </span>
        {trajectories.slice(0, 15).map((t) => {
          const isSelected = t.item.playerId === selectedPlayerId;
          return (
            <button
              key={t.item.playerId}
              type="button"
              onClick={() => setSelectedPlayerId(t.item.playerId)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                isSelected
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="truncate flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                {t.item.identity.name}
              </span>
              <span className="text-[10px] opacity-70 shrink-0">{t.distance}ft</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Controls Hint */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-0 pointer-events-none text-[9px] font-mono text-white/30 tracking-wider hidden sm:block">
        {STRINGS_EN.stadium3d.controlsHint}
      </div>
    </div>
  );
}
