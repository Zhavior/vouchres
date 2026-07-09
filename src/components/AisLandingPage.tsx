import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trophy, 
  ShieldCheck, 
  Target, 
  TrendingUp, 
  UserPlus, 
  ChevronRight, 
  Search, 
  ChevronLeft, 
  Lock, 
  Star, 
  Monitor, 
  CheckCircle,
  Database,
  Sliders,
  Sparkle,
  Compass,
  ArrowRight,
  Flame,
  Gauge,
  Zap,
  Info,
  RefreshCw,
  Crown,
  Play,
  RotateCcw,
  Volume2,
  Tv,
  Check,
  MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from '../lib/motion';
import { CreatorProofProfile } from '../types';

function BaunkAnimatedTitle({ onSectionChange }: { onSectionChange: (sec: string) => void }) {
  return (
    <div 
      className="flex flex-col items-center select-none cursor-pointer group py-12 px-6 sm:px-12 my-6 relative overflow-visible w-full max-w-4xl mx-auto rounded-3xl bg-[#090d16]/80 border border-white/[0.08] backdrop-blur-xl transition-all hover:border-white/[0.08] active:scale-98 duration-300 shadow-[0_32px_90px_rgba(0,0,0,0.85)]" 
      onClick={() => onSectionChange('feed')}
    >
      {/* Premium ambient background accents (no clunky astronaut, pure luxury glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[130px] bg-gradient-to-r from-emerald-500/10 via-yellow-500/5 to-indigo-500/15 rounded-full blur-[70px] pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-1000" />
      
      {/* Decorative top badge line */}
      <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black/30 rounded-full border border-white/[0.085] mb-6 group-hover:border-emerald-500/30 transition-colors">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/45 font-extrabold font-mono font-sans">
          VOUCHEDGE PROFESSIONAL OS V1.4
        </span>
      </div>

      {/* Main Title Typography: VOUCH EDGE */}
      <div className="relative flex flex-col items-center">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-sans font-black tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 select-none text-center leading-none">
          VOUCH<span className="text-[#FFE81F] group-hover:text-emerald-400 transition-colors duration-500">EDGE</span>
        </h1>
        
        {/* Decorative architectural layout frames */}
        <div className="absolute -inset-x-6 sm:-inset-x-12 -inset-y-4 border border-emerald-500/5 rounded-2xl pointer-events-none group-hover:border-emerald-500/15 transition-colors duration-500" />
      </div>

      {/* Luxury fine subtitle with high letter spacing */}
      <p className="mt-8 text-xs sm:text-sm text-slate-405 font-mono tracking-[0.25em] uppercase text-center max-w-xl group-hover:text-white/80 transition-colors duration-300 leading-relaxed font-sans">
        THE VERIFIED STANDARD FOR AI SPORTS RESEARCH
      </p>

      {/* Interaction prompt badge */}
      <div className="mt-6 flex items-center gap-2 text-[10px] font-mono text-[#FFE81F] group-hover:text-emerald-400 transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <span>ENTER COMPILER WORKSTATION</span>
        <ArrowRight className="w-3.5 h-3.5 animate-bounce" />
      </div>
    </div>
  );
}

function BaunkAnimatedTitleUnused({ onSectionChange }: { onSectionChange: (sec: string) => void }) {
  return null;
  return (
    <div 
      className="hidden" 
      onClick={() => onSectionChange('feed')}
    >
      <svg 
        viewBox="0 0 800 380" 
        className="w-full max-w-[520px] sm:max-w-[620px] md:max-w-[700px] h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-visible"
      >
        <defs>
          {/* Intense Laser Star Wars Glowing Outline Filter */}
          <filter id="star-wars-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feColorMatrix type="matrix" values="
              0 0 0 0 1
              0 0 0 0 0.8
              0 0 0 0 0
              0 0 0 1 0" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Golden Yellow Metallic Gradient for Star Wars Font Outline */}
          <linearGradient id="starwars-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE100" />
            <stop offset="50%" stopColor="#FF9C00" />
            <stop offset="100%" stopColor="#C46200" />
          </linearGradient>

          {/* Electric Neon Cyan Glow for Astronaut Outlines */}
          <filter id="neon-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Electric Neon Red Glow for Accents */}
          <filter id="neon-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ================= BACKGROUND: RETRO PERSPECTIVE GRID (RED WIREFRAME) ================= */}
        <g id="retro-perspective-grid" className="opacity-90">
          {/* Converging radiating depth lines pointing to vanishing horizon (400, 100) */}
          <path d="M 400 110 L -100 380" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M 400 110 L 0 380" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.4" />
          <path d="M 400 110 L 100 380" stroke="#f43f5e" strokeWidth="1.2" strokeOpacity="0.5" />
          <path d="M 400 110 L 200 380" stroke="#f43f5e" strokeWidth="1.2" strokeOpacity="0.6" />
          <path d="M 400 110 L 300 380" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.75" />
          <path d="M 400 110 L 400 380" stroke="#f43f5e" strokeWidth="2" strokeOpacity="0.9" />
          <path d="M 400 110 L 500 380" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.75" />
          <path d="M 400 110 L 600 380" stroke="#f43f5e" strokeWidth="1.2" strokeOpacity="0.6" />
          <path d="M 400 110 L 700 380" stroke="#f43f5e" strokeWidth="1.2" strokeOpacity="0.5" />
          <path d="M 400 110 L 800 380" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.4" />
          <path d="M 400 110 L 900 380" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.3" />

          {/* Horizontally compressing perspective lines (closer as they go up) */}
          <line x1="-100" y1="120" x2="900" y2="120" stroke="#f43f5e" strokeWidth="0.8" strokeOpacity="0.2" />
          <line x1="-100" y1="132" x2="900" y2="132" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.3" />
          <line x1="-100" y1="148" x2="900" y2="148" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.45" />
          <line x1="-100" y1="170" x2="900" y2="170" stroke="#f43f5e" strokeWidth="1.2" strokeOpacity="0.6" />
          <line x1="-100" y1="202" x2="900" y2="202" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.8" />
          <line x1="-100" y1="250" x2="900" y2="250" stroke="#f43f5e" strokeWidth="2.2" strokeOpacity="0.9" />
          <line x1="-100" y1="318" x2="900" y2="318" stroke="#f43f5e" strokeWidth="2.8" strokeOpacity="1.0" />
        </g>

        {/* ================= MIDDLEGROUND: THE SPACE GUY (ASTRONAUT) ================= */}
        {/* Re-drawn as an ultra-high-fidelity vector engraving that perfectly copies the user's hand-drawn sketch:
            - Horizontal floating position facing slightly right.
            - Highly detailed, sharp black and glowing silver line engraving without any white paper backing (seethrough).
            - Custom wire antennule pointing upward and right from the helmet.
            - Custom NASA logo circular patch on his right arm, and US Flag rectangular badge on his left arm.
            - Tech chest control module detailed with a "SMITH" text nameplate label.
            - Hand splaying/reaching forward with five highly detailed fingers with joint-cross-hatching.
            - Visor reflecting a baseball with detailed curved stitches. */}
        <g id="space-guy-explorer" className="transition-transform duration-700 group-hover:scale-[1.04] origin-center">
          
          {/* Subtle cosmic silhouette shadow path - protects legibility over background elements without a clumsy solid block */}
          <path 
            d="M 370 120 
               C 360 80, 460 75, 460 120 
               C 460 140, 440 180, 445 195 
               L 480 205 L 540 210 L 620 210 L 685 190 L 695 242 L 635 255 L 530 238 L 430 242 L 350 248 
               L 230 338 L 175 348 L 140 312 L 235 275 L 285 175 Z" 
            fill="none" 
            stroke="#030712" 
            strokeWidth="24" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.8"
          />

          {/* --- LIFE SUPPORT SYSTEM (CORRUGATED BACKPACK) --- */}
          <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Main backpack contours */}
            <path d="M 342 142 L 322 146 L 312 224 L 332 220 Z" stroke="#38bdf8" strokeWidth="2" />
            
            {/* Structural vertical bands */}
            <line x1="334" y1="144" x2="324" y2="222" stroke="#e2e8f0" strokeWidth="1" />
            <line x1="328" y1="145" x2="318" y2="223" stroke="#e2e8f0" strokeWidth="1" />

            {/* Support cabling loop to suit chest base */}
            <path d="M 318 205 Q 295 220, 290 240 T 320 262 Q 345 264 345 235" stroke="#38bdf8" strokeWidth="2.4" />
            <path d="M 318 205 Q 295 220, 290 240 T 320 262 Q 345 264 345 235" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
          </g>

          {/* --- HIS RIGHT ARM (LEFT SIDE OF DRAWING): WITH CIRCULAR MISSION LOGO --- */}
          <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round">
            {/* Arm extension backward */}
            <path d="M 358 180 C 330 168, 295 182, 276 198 L 250 214 C 238 218, 226 210, 232 198 L 246 186" />
            
            {/* Fine sleeve fold hatching (Replicating vintage ink pen style) */}
            <path d="M 350 176 C 338 174, 332 180, 332 184" strokeWidth="0.8" />
            <path d="M 342 180 C 328 178, 322 184, 322 188" strokeWidth="0.8" />
            <path d="M 326 182 C 314 180, 310 186, 310 190" strokeWidth="0.8" />
            <path d="M 314 186 C 304 184, 300 190, 300 194" strokeWidth="0.8" />
            <path d="M 298 190 C 288 188, 284 194, 284 198" strokeWidth="0.8" />
            
            {/* Ribbed Wrist cuff boundary */}
            <path d="M 264 196 L 258 208" stroke="#38bdf8" strokeWidth="1.8" />

            {/* Circular Mission Shield Patch ("NASA Style") */}
            <circle cx="316" cy="186" r="10.5" stroke="#38bdf8" strokeWidth="1.6" />
            {/* Micro details inside shield: Vector star-cross symbol and planet orbit arc */}
            <circle cx="316" cy="186" r="6" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="2 2" />
            <path d="M 310 190 Q 316 182 322 188" stroke="#f43f5e" strokeWidth="1" />
            <line x1="316" y1="181" x2="316" y2="191" stroke="#38bdf8" strokeWidth="0.8" />
            <line x1="311" y1="186" x2="321" y2="186" stroke="#38bdf8" strokeWidth="0.8" />
          </g>

          {/* --- HIS LEFT ARM (RIGHT SIDE OF DRAWING): WITH AMERICAN FLAG --- */}
          <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round">
            {/* Connection segment from shoulder leading to the forward glove */}
            <path d="M 438 198 C 472 204, 510 208, 544 214" strokeWidth="1.8" />
            <path d="M 432 214 C 466 218, 502 222, 534 230" strokeWidth="1.8" />

            {/* Dense arm bellows folds (creases matching sketch) */}
            <path d="M 454 200 C 452 208, 456 214, 458 214" strokeWidth="0.8" />
            <path d="M 474 202 C 472 210, 476 216, 478 216" strokeWidth="0.8" />
            <path d="M 494 204 C 492 212, 496 218, 498 218" strokeWidth="0.8" />
            <path d="M 514 206 C 512 215, 516 220, 518 220" strokeWidth="0.8" />

            {/* US Flag Rectangular Patch on upper sleeve */}
            <rect x="478" y="184" width="18" height="11" rx="0.5" transform="rotate(6 478 184)" stroke="#38bdf8" strokeWidth="1.4" />
            {/* flag canton canton square */}
            <rect x="480" y="186" width="7" height="5.5" fill="#38bdf8" />
            {/* flag stripes */}
            <line x1="487" y1="187" x2="495" y2="188" stroke="#ffffff" strokeWidth="0.6" />
            <line x1="487" y1="189" x2="495" y2="190" stroke="#f43f5e" strokeWidth="0.6" />
            <line x1="487" y1="191" x2="495" y2="192" stroke="#ffffff" strokeWidth="0.6" />
            <line x1="480" y1="193" x2="495" y2="194.5" stroke="#f43f5e" strokeWidth="0.6" />
            <line x1="480" y1="194.5" x2="495" y2="196" stroke="#ffffff" strokeWidth="0.6" />
          </g>

          {/* --- TORSO SUIT SECTION (ENGRAVED DETAILS & CHEST PANEL) --- */}
          <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Main torso bounding lines */}
            <path d="M 368 175 L 442 181 L 434 202 L 418 244" strokeWidth="1.8" />
            <path d="M 350 184 L 358 238 L 418 244" strokeWidth="1.8" />

            {/* Concentric girdle suit rings around waist (as in sketch) */}
            <path d="M 362 192 C 388 196, 412 198, 428 200" strokeWidth="1" />
            <path d="M 360 204 C 386 208, 410 210, 426 211" strokeWidth="1" />
            <path d="M 358 216 C 384 220, 408 221, 423 222" strokeWidth="1" />
            <path d="M 356 228 C 382 232, 404 232, 418 232" strokeWidth="1" />

            {/* Fine texture ink hatching shading details */}
            <line x1="364" y1="181" x2="368" y2="190" stroke="#888888" strokeWidth="0.5" />
            <line x1="370" y1="182" x2="374" y2="191" stroke="#888888" strokeWidth="0.5" />
            <line x1="376" y1="183" x2="380" y2="192" stroke="#888888" strokeWidth="0.5" />
            <line x1="428" y1="187" x2="424" y2="198" stroke="#888888" strokeWidth="0.5" />
            <line x1="434" y1="188" x2="430" y2="199" stroke="#888888" strokeWidth="0.5" />

            {/* CHEST CONTROL CONSOLE BLOCK (SMITH box assembly) */}
            {/* Outlying metal box container */}
            <rect x="368" y="196" width="46" height="28" rx="2" fill="#05070f" stroke="#38bdf8" strokeWidth="1.8" />
            
            {/* Left side circular dial knob and indicator lights */}
            <circle cx="377" cy="204" r="3" stroke="#e2e8f0" strokeWidth="1" />
            <line x1="377" y1="201" x2="377" y2="204" stroke="#f43f5e" strokeWidth="0.8" />
            
            <circle cx="386" cy="202" r="1.5" fill="#f43f5e" filter="url(#neon-red)" />
            <circle cx="386" cy="206" r="1.5" fill="#10b981" />

            {/* --- NAMEPLATE "SMITH" TAPE (As explicitly visible in the sketch!) --- */}
            {/* The white background tape box on the right side of the chest panel */}
            <rect x="393" y="200" width="18" height="8" rx="1" fill="#ffffff" stroke="none" />
            <text 
              x="402" 
              y="206.5" 
              fontFamily="'JetBrains Mono', 'Fira Code', monospace" 
              fontSize="6" 
              fontWeight="900" 
              letterSpacing="-0.02em" 
              textAnchor="middle" 
              fill="#030712"
              stroke="none"
            >
              SMITH
            </text>

            {/* Corrugated wire lines beneath chest panel */}
            <rect x="374" y="212" width="28" height="6" fill="#111827" stroke="#64748b" strokeWidth="0.8" />
            <line x1="378" y1="215" x2="398" y2="215" stroke="#f43f5e" strokeWidth="1.1" />
            <circle cx="406" cy="215" r="1" fill="#38bdf8" />
          </g>

          {/* --- RETRO HELMET ASSEMBLY WITH SIGNATURE ANTENNA --- */}
          <g id="helmet-and-collar" className="origin-center">
            
            {/* Curved collar ridge bracket */}
            <ellipse cx="408" cy="173" rx="22" ry="5.5" fill="#05070f" stroke="#38bdf8" strokeWidth="1.8" />
            <line x1="386" y1="172" x2="386" y2="175" stroke="#ffffff" strokeWidth="2.2" />
            <line x1="430" y1="172" x2="430" y2="175" stroke="#ffffff" strokeWidth="2.2" />

            {/* Inner neck collar fabric lines */}
            <path d="M 390 171 Q 408 174 426 171" stroke="#e2e8f0" strokeWidth="0.8" />

            {/* Outer Helmet spherical dome line */}
            <circle cx="408" cy="142" r="32" fill="none" stroke="#ffffff" strokeWidth="2.2" filter="url(#neon-cyan)" />

            {/* --- SIGNATURE WIRE ANTENNA (Sticks up to the right, exactly as in drawing) --- */}
            {/* Base block on upper right template of helmet */}
            <rect x="428" y="117" width="5" height="4" rx="1" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" transform="rotate(35 428 117)" />
            {/* Long delicate steel wire pointing diagonally up-right */}
            <line x1="431" y1="115" x2="445" y2="72" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            {/* Tiny circular glowing red indicator bead on top of the wire */}
            <circle cx="445" cy="72" r="2.5" fill="#f43f5e" filter="url(#neon-red)" />

            {/* Outer bubble visor metal framework */}
            <path 
              d="M 380 142 
                 C 380 122, 436 122, 436 142 
                 C 436 162, 380 162, 380 142 Z" 
              fill="#030712" 
              stroke="#38bdf8" 
              strokeWidth="2.2" 
            />

            {/* Deep-space visor backdrop (Seethrough tint) */}
            <path 
              d="M 382 142 
                 C 382 124, 434 124, 434 142 
                 C 434 160, 382 160, 382 142 Z" 
              fill="rgba(10, 15, 30, 0.95)" 
            />

            {/* Star sparkles inside visor background */}
            <circle cx="394" cy="132" r="0.8" fill="#ffffff" />
            <circle cx="423" cy="133" r="0.6" fill="#38bdf8" />
            <circle cx="388" cy="148" r="0.7" fill="#f43f5e" />
            <circle cx="425" cy="151" r="0.8" fill="#ffffff" />

            {/* ================= VISOR REFLECTION: EXQUISITE DETAILED BASEBALL ================= */}
            {/* This is the heart of the user request. A highly-glowing, razor sharp, seethrough baseball center reflection! */}
            <g id="baseball-reflection-visor" className="animate-pulse" style={{ animationDuration: '4s' }}>
              
              {/* Outer white sphere edge */}
              <circle cx="408" cy="142" r="11.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />
              
              {/* Overlay shadow to map its spherical coordinate depth */}
              <circle cx="408" cy="142" r="11.5" fill="url(#starwars-gold-grad)" opacity="0.12" />

              {/* Left Curvature seam stitches (Double curving lines with little cross stitching ticks) */}
              <path d="M 401.5 133.5 A 9 9 0 0 0 401.5 150.5" fill="none" stroke="#f43f5e" strokeWidth="0.9" />
              {/* Classic red cross threads on left seam */}
              <line x1="400" y1="135" x2="401.5" y2="136.5" stroke="#f43f5e" strokeWidth="0.6" />
              <line x1="399" y1="139" x2="400.5" y2="140.5" stroke="#f43f5e" strokeWidth="0.6" />
              <line x1="398.5" y1="143" x2="400" y2="144.5" stroke="#f43f5e" strokeWidth="0.6" />
              <line x1="399" y1="147" x2="400.5" y2="148.5" stroke="#f43f5e" strokeWidth="0.6" />

              {/* Right Curvature seam stitches */}
              <path d="M 414.5 133.5 A 9 9 0 0 1 414.5 150.5" fill="none" stroke="#f43f5e" strokeWidth="0.9" />
              {/* Classic red cross threads on right seam */}
              <line x1="416" y1="135" x2="414.5" y2="136.5" stroke="#f43f5e" strokeWidth="0.6" />
              <line x1="417" y1="139" x2="415.5" y2="140.5" stroke="#f43f5e" strokeWidth="0.6" />
              <line x1="417.5" y1="143" x2="416" y2="144.5" stroke="#f43f5e" strokeWidth="0.6" />
              <line x1="417" y1="147" x2="415.5" y2="148.5" stroke="#f43f5e" strokeWidth="0.6" />
            </g>

            {/* Top-left visor curved high-glare slick reflection */}
            <path d="M 386 134 A 20 20 0 0 1 405 125" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            
            {/* Helmet communications node dials on temples */}
            <circle cx="376" cy="142" r="2.5" fill="#38bdf8" />
            <circle cx="440" cy="142" r="2.5" fill="#38bdf8" />
          </g>

          {/* --- TRAILING SPLAYED LEGS (TRAILING BACK TO THE LEFT IN HORIZONTAL ZERO-G) --- */}
          <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* RIGHT thigh and knee bellows structure (drawn as in pen sketch) */}
            <path d="M 350 238 C 314 260, 275 284, 252 302" strokeWidth="1.8" />
            {/* Creased knee bellows rings */}
            <path d="M 276 270 Q 268 280, 278 288" strokeWidth="0.8" />
            <path d="M 266 278 Q 258 288, 268 296" strokeWidth="0.8" />
            <path d="M 256 286 Q 248 296, 258 304" strokeWidth="0.8" />
            
            {/* Calf leading to the right boot angled away */}
            <path d="M 252 302 L 210 310 C 196 314, 186 310, 188 298" strokeWidth="1.8" />
            {/* Soft joint folds */}
            <path d="M 234 298 Q 224 304, 234 308" strokeWidth="0.8" />
            {/* Foot boot showing flat contoured sole and ankle collar */}
            <path d="M 188 298 L 180 286 L 160 289" stroke="#38bdf8" strokeWidth="1.8" />
            <path d="M 188 298 L 168 304 L 160 289 Z" stroke="#38bdf8" strokeWidth="1.8" />
            {/* Sole tread lines */}
            <line x1="162" y1="301" x2="168" y2="288" stroke="#38bdf8" strokeWidth="0.8" />
            <line x1="166" y1="303" x2="172" y2="290" stroke="#38bdf8" strokeWidth="0.8" />

            {/* LEFT leg trailing and bent slightly below right leg (great three-dimensional splay) */}
            <path d="M 364 244 C 322 284, 280 314, 240 334" strokeWidth="1.8" />
            {/* Knee bellows rings */}
            <path d="M 292 290 Q 284 300, 294 308" strokeWidth="0.8" />
            <path d="M 280 298 Q 272 308, 282 316" strokeWidth="0.8" />
            <path d="M 268 306 Q 260 316, 270 324" strokeWidth="0.8" />

            {/* Lower leg segment and Left Boot */}
            <path d="M 240 334 L 198 346 C 184 350, 174 344, 177 332" strokeWidth="1.8" />
            <path d="M 177 332 L 168 318 L 148 321" stroke="#38bdf8" strokeWidth="1.8" />
            <path d="M 177 332 L 157 338 L 148 321 Z" stroke="#38bdf8" strokeWidth="1.8" />
            {/* Sole tread lines */}
            <line x1="150" y1="334" x2="156" y2="321" stroke="#38bdf8" strokeWidth="0.8" />
            <line x1="154" y1="336" x2="160" y2="323" stroke="#38bdf8" strokeWidth="0.8" />
          </g>

          {/* ================= FOREGROUND REACHING space-Glove (LEFT HAND) ================= */}
          {/* Reaches directly towards the viewer on the right side of the canvas. 
              Extremely dramatic foreshortened palm with long splayed fingers, exact copy of sketch layout. */}
          <g id="forehand-reaching-glove">
            
            {/* Ring cuff linking glove to sleeve */}
            <ellipse cx="572" cy="236" rx="5" ry="12" fill="#05070f" stroke="#f43f5e" strokeWidth="1.8" filter="url(#neon-red)" />

            {/* Splayed fingers reaching aggressively forward */}
            <g stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#neon-cyan)">
              {/* Base cuff connecting ring folds */}
              <path d="M 572 224 C 586 210, 608 214, 616 226 C 620 236, 614 246, 602 250" strokeWidth="2.5" />

              {/* 1. FORESHORTENED RECHING THUMB */}
              <path d="M 574 222 Q 596 204, 603 206 C 608 208, 604 216, 588 225" />
              <line x1="586" y1="214" x2="594" y2="216.5" stroke="#38bdf8" strokeWidth="1.2" />

              {/* 2. RECHING INDEX FINGER (Pointed upwards-right) */}
              <path d="M 598 220 Q 642 190, 652 194 C 658 197, 648 207, 614 225" />
              <line x1="616" y1="208" x2="624" y2="212" stroke="#38bdf8" strokeWidth="1.2" />
              <line x1="631" y1="200" x2="639" y2="204" stroke="#38bdf8" strokeWidth="1.2" />

              {/* 3. RECHING MIDDLE FINGER (Longest, pointing right-upward) */}
              <path d="M 606 225 Q 662 195, 672 201 C 678 205, 666 215, 617 232" strokeWidth="2.4" />
              <line x1="624" y1="212" x2="634" y2="216" stroke="#38bdf8" strokeWidth="1.2" />
              <line x1="644" y1="204" x2="654" y2="208" stroke="#38bdf8" strokeWidth="1.2" />

              {/* 4. RECHING RING FINGER (Pointing right) */}
              <path d="M 610 232 Q 656 212, 666 219 C 672 223, 658 232, 612 240" strokeWidth="2.2" />
              <line x1="628" y1="223" x2="637" y2="227" stroke="#38bdf8" strokeWidth="1.2" />
              <line x1="642" y1="217" x2="651" y2="221" stroke="#38bdf8" strokeWidth="1.2" />

              {/* 5. RECHING PINKY FINGER (Angled downward-right) */}
              <path d="M 606 240 Q 644 233, 651 239 C 656 243, 644 250, 607 249" />
              <line x1="618" y1="238" x2="627" y2="240" stroke="#38bdf8" strokeWidth="1.2" />
              <line x1="630" y1="236" x2="639" y2="238" stroke="#38bdf8" strokeWidth="1.2" />

              {/* Intrricate protective backplate pad shield on glove */}
              <path d="M 584 231 L 592 229 L 598 236 L 590 238 Z" fill="#05070f" stroke="#38bdf8" strokeWidth="1.2" />
              {/* Gripper ridge line fold hashes inside palm */}
              <line x1="592" y1="243" x2="600" y2="246" stroke="#3s8bdf8" strokeWidth="1" />
            </g>
          </g>
        </g>

        {/* ================= FOREGROUND: CUSTOM SCALED STAR WARS OUTLINE FONT ================= */}
        {/* Layered on top ("the astronaut behind the text"). Skewed with retro connection framing bars. */}
        <g id="starwars-typography-title" transform="skewX(-10)" className="pointer-events-none select-none">
          
          {/* STAR WARS style top-connecting frame bar extending from 'V' */}
          <path d="M 130 55 L 685 55 L 685 75 L 665 75 L 665 65 L 150 65 L 150 75 L 130 75 Z" fill="url(#starwars-gold-grad)" filter="url(#star-wars-glow)" />

          {/* Word row 1: VOUCH */}
          <text 
            x="400" 
            y="130" 
            fontFamily="'Space Grotesk', 'Impact', 'Arial Black', sans-serif" 
            fontSize="92" 
            fontWeight="950" 
            letterSpacing="0.14em" 
            textAnchor="middle"
            fill="#05070c"
            stroke="url(#starwars-gold-grad)"
            strokeWidth="5.5"
            paintOrder="stroke fill"
            className="tracking-[0.14em]"
          >
            VOUCH
          </text>
          
          {/* Inner gold highlight thin stroke to make it razor-sharp */}
          <text 
            x="400" 
            y="130" 
            fontFamily="'Space Grotesk', 'Impact', 'Arial Black', sans-serif" 
            fontSize="92" 
            fontWeight="950" 
            letterSpacing="0.14em" 
            textAnchor="middle"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.3"
            opacity="0.95"
            className="tracking-[0.14em]"
          >
            VOUCH
          </text>

          {/* STAR WARS style bottom-connecting frame bar extending from 'E' */}
          <path d="M 115 174 L 115 194 L 135 194 L 135 184 L 650 184 L 650 194 L 670 194 L 670 174 Z" fill="url(#starwars-gold-grad)" filter="url(#star-wars-glow)" />

          {/* Word row 2: EDGE */}
          <text 
            x="400" 
            y="245" 
            fontFamily="'Space Grotesk', 'Impact', 'Arial Black', sans-serif" 
            fontSize="104" 
            fontWeight="950" 
            letterSpacing="0.18em" 
            textAnchor="middle"
            fill="#05070c"
            stroke="url(#starwars-gold-grad)"
            strokeWidth="7"
            paintOrder="stroke fill"
            className="tracking-[0.18em]"
          >
            EDGE
          </text>

          {/* Inner gold highlight thin stroke */}
          <text 
            x="400" 
            y="245" 
            fontFamily="'Space Grotesk', 'Impact', 'Arial Black', sans-serif" 
            fontSize="104" 
            fontWeight="950" 
            letterSpacing="0.18em" 
            textAnchor="middle"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.3"
            opacity="0.95"
            className="tracking-[0.18em]"
          >
            EDGE
          </text>
        </g>
      </svg>

      {/* Elegant minimalist luxurious subtitle statement */}
      <div className="mt-4 flex items-center gap-3">
        <span className="h-[1px] w-8 sm:w-12 bg-red-800" />
        <span className="goku-serif-italic text-sm sm:text-base text-red-400 tracking-widest font-semibold uppercase font-sans">
          The Cinematic Standard of Sovereign Sporting Projections
        </span>
        <span className="h-[1px] w-8 sm:w-12 bg-red-800" />
      </div>
    </div>
  );
}

interface AisLandingPageProps {
  profile: CreatorProofProfile;
  onUpdateProfile: (updated: Partial<CreatorProofProfile>) => void;
  onSectionChange: (section: string) => void;
}

/* =========================================================================
   CINEMATIC FEATURES VIDEO & SCREENCAST SIMULATOR Component
   Renders a simulated active screen capture with live interactive timelines,
   mouse tracking actions, and state cycles representing platform usage.
========================================================================= */
function FeaturePreviewVideo({ featureId, accentColor }: { featureId: string; accentColor: string }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [simulationStep, setSimulationStep] = useState(0);
  const [timelineSecs, setTimelineSecs] = useState(1.4);

  // Auto-advance simulated video step to represent user interacting with the app
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSimulationStep((prev) => (prev + 1) % 4);
    }, 3200);

    const secondsInterval = setInterval(() => {
      setTimelineSecs((prev) => {
        if (prev >= 12) return 0.0;
        return parseFloat((prev + 0.1).toFixed(1));
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(secondsInterval);
    };
  }, [isPlaying]);

  const handleRestart = () => {
    setSimulationStep(0);
    setTimelineSecs(0.0);
    setIsPlaying(true);
  };

  // Render screencast based on feature
  const renderScreencastSimulation = () => {
    switch (featureId) {
      case 'feed':
        return (
          <div className="w-full h-full flex flex-col justify-between bg-[#080d17] p-3 text-[10px] font-mono leading-tight">
            {/* Simulation Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-white/40 text-[8px]">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LEDGER_REC_ACTIVE</span>
              <span>UTC ID: 8F2B1</span>
            </div>

            {/* Simulated Action Canvas */}
            <div className="flex-1 my-2 flex flex-col justify-center space-y-1.5 min-h-[90px] relative">
              
              {/* Fake Interactive Cursor */}
              {simulationStep === 0 && (
                <div className="absolute right-12 top-6 flex items-center gap-1 text-yellow-400 z-20 pointer-events-none transition-all duration-1000 animate-bounce">
                  <MousePointer2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                  <span className="bg-black/25/95 border border-sky-400/30 text-[7px] px-1.5 py-0.5 rounded text-sky-300 font-bold uppercase">Click "Publish Slip"</span>
                </div>
              )}

              {/* Step representations */}
              {simulationStep === 0 ? (
                <div className="space-y-1 bg-[#121824] p-2 rounded-lg border border-white/10">
                  <div className="text-white/45 text-[8px] flex justify-between">
                    <span>CAPPER HANDLE: @vouch_skywalker</span>
                    <span className="text-vouch-cyan">DRAFT</span>
                  </div>
                  <div className="text-white/65 font-sans font-bold">New Parlay Selection: LAD ML + NYY -1.5</div>
                  <div className="text-[8px] text-white/40 mt-1 block">Tapping verification cryptography...</div>
                </div>
              ) : simulationStep === 1 ? (
                <div className="space-y-1 bg-yellow-950/20 p-2 rounded-lg border border-yellow-500/20 animate-pulse">
                  <div className="text-yellow-400 text-[8px]">⚡ CRITICAL PROTOCOL ACTION IN PROGRESS</div>
                  <div className="text-white/80 text-[9px] font-bold">PROVING PROBABILITY COEFFICIENTS...</div>
                  <div className="w-full bg-black/25 h-1 rounded overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full w-2/3" />
                  </div>
                </div>
              ) : simulationStep === 2 ? (
                <div className="space-y-1 bg-obsidian-900 p-2 rounded-lg border border-teal-500/30">
                  <div className="text-emerald-400 text-[8px] font-bold flex items-center gap-1">
                    <span>✓ LEDGER SECURED</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <div className="text-white text-[11px] font-black">SLIP SEALED UNDER BLOCK #72109</div>
                  <p className="text-[7px] text-white/40">Un-deletable ROI & win-rate variables calculated instantly.</p>
                </div>
              ) : (
                <div className="space-y-1 bg-[#0f172a] p-2 rounded-lg border border-white/10">
                  <div className="flex justify-between text-white/45 text-[8px]">
                    <span className="text-emerald-400 uppercase font-black bg-emerald-950/80 px-1 rounded">VERIFIED WON</span>
                    <span>1 min ago</span>
                  </div>
                  <div className="text-white font-bold font-sans">LAD vs NYY Multi-Slip Ledger Entry</div>
                  <div className="flex justify-between text-[8px] text-white/40 font-mono">
                    <span>Expected Return: +310%</span>
                    <span className="text-emerald-400 font-bold">+15.2 U</span>
                  </div>
                </div>
              )}
            </div>

            {/* Video footer stat display */}
            <div className="flex items-center justify-between text-white/35 text-[7px] pt-1 border-t border-white/10 font-sans">
              <span>ACTION STAGED: USER PUBLISHING SLIP LOOP</span>
              <span className="text-yellow-450 uppercase font-bold">STATUS: RESEARCH PREVIEW</span>
            </div>
          </div>
        );

      case 'ai_engine':
        return (
          <div className="w-full h-full flex flex-col justify-between bg-[#070b13] p-3 text-[10px] font-mono leading-tight">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-white/40 text-[8px]">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" /> V.A.I PREDICTION MATRIX v3.0</span>
              <span className="text-cyan-400">LOCAL_GPU: LOADED</span>
            </div>

            <div className="flex-1 my-2 flex flex-col justify-center space-y-1.5 relative min-h-[90px]">
              {simulationStep === 0 ? (
                <div className="space-y-1 bg-obsidian-900 p-2 rounded-lg border border-white/10">
                  <div className="text-[8px] text-white/45 font-bold uppercase tracking-wider">Step 1: Selecting Research Matchups</div>
                  <div className="grid grid-cols-2 gap-1 text-[8px]">
                    <div className="bg-cyan-950/30 border border-cyan-800/40 p-1 rounded font-bold text-cyan-300">✓ OHTANI (TOTAL BASES)</div>
                    <div className="bg-black/25 text-white/40 p-1 rounded">PENDING SELECTION</div>
                  </div>
                </div>
              ) : simulationStep === 1 ? (
                <div className="space-y-1">
                  <div className="text-[8px] text-cyan-300">Step 2: Processing 10,000 Sabermetric Simulations</div>
                  <div className="text-[10px] text-white/65 animate-pulse flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                    <span>COMPUTING SABERMETRIC VECTORS...</span>
                  </div>
                  <div className="bg-[#121824] p-1.5 rounded text-[8px] text-white/40">
                    Confidence threshold set at: 85% Variance limit
                  </div>
                </div>
              ) : simulationStep === 2 ? (
                <div className="space-y-1 bg-black/30 p-2 rounded-lg border border-cyan-500/30">
                  <div className="text-cyan-400 text-[8px] font-bold">Step 3: Calculating Edge Index Potential</div>
                  <div className="flex justify-between items-center bg-obsidian-900 p-1.5 rounded">
                    <span className="text-white/90 font-bold">BETTOR EDGE FOUND</span>
                    <span className="text-[#FFE81F] font-black text-xs">+14.86% EDGE</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/40">
                  <div className="text-[8px] text-[#FFE81F] font-black uppercase">V.A.I CERTIFIED SMART SLIP RECOMMENDED</div>
                  <div className="text-white/80 text-[9px] leading-tight font-sans">
                    Weigh confidence score: <span className="text-cyan-400 font-bold">94.2%</span> based on historical ballpark altitude adjustments.
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-white/35 text-[7px] pt-1 border-t border-white/10 font-sans">
              <span>ACTIVE MODEL PROCESSOR LOOP</span>
              <span className="text-cyan-400 font-bold">RUNNING MATRIX</span>
            </div>
          </div>
        );

      case 'build':
        return (
          <div className="w-full h-full flex flex-col justify-between bg-[#090712] p-3 text-[10px] font-mono leading-tight">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-white/40 text-[8px]">
              <span className="flex items-center gap-1">🎛️ MULTI-LEG ODDS COUNTER</span>
              <span>SLIP BUILDER CODES</span>
            </div>

            <div className="flex-1 my-2 flex flex-col justify-center space-y-1.5 relative min-h-[90px]">
              
              {/* Virtual calculator widget */}
              <div className="bg-obsidian-900 p-2 rounded-lg border border-purple-900/20 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-white/40 uppercase">Interactive Stake</span>
                  {simulationStep === 0 ? (
                    <span className="text-[#FFE81F] font-bold font-mono">$50.00</span>
                  ) : simulationStep === 1 ? (
                    <span className="text-[#FFE81F] font-bold font-mono">$100.00</span>
                  ) : simulationStep === 2 ? (
                    <span className="text-[#FFE81F] font-bold font-mono">$250.00</span>
                  ) : (
                    <span className="text-[#FFE81F] font-bold font-mono">$500.00</span>
                  )}
                </div>

                <div className="w-full bg-black/25 h-1.5 rounded-full overflow-hidden relative">
                  <div 
                    className="bg-purple-650 h-full transition-all duration-700" 
                    style={{ 
                      width: simulationStep === 0 ? '20%' : simulationStep === 1 ? '40%' : simulationStep === 2 ? '70%' : '100%' 
                    }} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[8px] text-white/45">
                  <div className="bg-black/25 p-1 rounded">
                    <div>MULTIPLIER</div>
                    <div className="text-white font-bold font-mono">
                      {simulationStep === 0 ? 'x1.90' : simulationStep === 1 ? 'x3.40' : simulationStep === 2 ? 'x7.80' : 'x17.40'}
                    </div>
                  </div>
                  <div className="bg-black/25 p-1 rounded">
                    <div>EST. PAYOUT</div>
                    <div className="text-emerald-400 font-bold font-mono">
                      {simulationStep === 0 ? '$95.00' : simulationStep === 1 ? '$340.00' : simulationStep === 2 ? '$1,950.00' : '$8,700.00'}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between text-white/35 text-[7px] pt-1 border-t border-white/10 font-sans">
              <span>REALTIME COMPOUND CALCULATIONS</span>
              <span className="text-purple-400 font-bold">COMPOUND OK</span>
            </div>
          </div>
        );

      case 'live_games':
        return (
          <div className="w-full h-full flex flex-col justify-between bg-[#050e0f] p-3 text-[10px] font-mono leading-tight">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-white/40 text-[8px]">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" /> LIVE STREAMING STAGE</span>
              <span className="text-red-400">FPS: 60.0_DIRECT</span>
            </div>

            <div className="flex-1 my-2 grid grid-cols-12 gap-2 min-h-[90px]">
              {/* Virtual Webcam Viewer box (Grid Left) */}
              <div className="col-span-7 bg-[#111625] border border-white/10 rounded-lg p-1.5 relative flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient from-slate-900/10 via-black/80 to-black pointer-events-none" />
                
                {/* Simulated Floating Fire emoji cards */}
                <div className="absolute top-1 right-1 bg-yellow-950/80 border border-yellow-500/40 text-[#FFE81F] text-[6px] font-black px-1 rounded flex items-center gap-0.5 animate-pulse">
                  <Flame className="w-2 h-2 text-yellow-405 fill-yellow-405" />
                  <span>TAILING OUT_NOW</span>
                </div>

                <div className="my-auto text-center space-y-1">
                  <Tv className="w-5 h-5 mx-auto text-white/35 animate-bounce" />
                  <span className="text-[7px] text-white/45 block font-sans">Capper Streaming Live...</span>
                </div>

                <div className="flex justify-between items-center text-[6px] text-white/40 font-sans">
                  <span>🔴 OVERLAY_ON</span>
                  <span className="text-emerald-400 font-bold">148 TAILING SLIP</span>
                </div>
              </div>

              {/* Chat Viewport (Grid Right) */}
              <div className="col-span-5 bg-[#0a0f18] p-1 rounded-lg border border-white/10 flex flex-col justify-between space-y-1 overflow-hidden">
                <span className="text-white/35 text-[6px] font-bold tracking-wider uppercase border-b border-white/10 pb-0.5 text-center">LOBBY_CHAT</span>
                
                <div className="flex-1 flex flex-col justify-end space-y-1 select-none">
                  <div className="text-[6px] text-white/45 scale-[0.95] origin-bottom-left leading-tight">
                    <span className="text-sky-400 font-bold">@v_capper:</span> Let's go MLB !
                  </div>
                  <div className="text-[6px] text-white/45 scale-[0.95] origin-bottom-left leading-tight">
                    <span className="text-pink-400 font-bold">@bet_babe:</span> Tailed +10U
                  </div>
                  <div className="text-[6px] text-yellow-400 scale-[0.95] origin-bottom-left leading-tight animate-pulse font-bold bg-yellow-950/30 rounded px-0.5">
                    🚀 VOUCH APPROVED
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-white/35 text-[7px] pt-1 border-t border-white/10 font-sans">
              <span>COMMUNITY LIVECHAT MODERATOR STREAM</span>
              <span className="text-emerald-400 font-bold text-[6px] bg-emerald-950 px-1 rounded uppercase">PRO_STREAM</span>
            </div>
          </div>
        );

      case 'board':
        return (
          <div className="w-full h-full flex flex-col justify-between bg-[#0e0710] p-3 text-[10px] font-mono leading-tight">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-white/40 text-[8px]">
              <span className="flex items-center gap-1">🎨 CUSTOM NEON CARD LAB</span>
              <span>RENDER ENGINE v2</span>
            </div>

            <div className="flex-1 my-2 flex flex-col justify-center items-center space-y-1 bg-obsidian-900 p-2 rounded-lg border border-white/10 min-h-[90px] relative">
              
              {/* Star Wars card deck editor simulation */}
              <div className="w-3/4 bg-[#111827] rounded-lg border border-pink-500/50 p-1.5 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all duration-700 select-none text-center transform rotate-1">
                <span className="text-[6px] uppercase font-black text-rose-455 tracking-widest block font-sans">VERIFIED PUBLIC CONTRACT</span>
                <span className="text-[10px] text-white/90 font-black block leading-none uppercase my-1 font-mono tracking-widest text-[#FFE81F]">VOUCHEDGE HERO DECK</span>
                
                <div className="w-full bg-[#1e293b] p-1 rounded text-[5px] text-white/45 flex justify-between uppercase">
                  <span>GLOW: 45PX</span>
                  <span className="text-pink-400 font-bold">SATURATION: MAX</span>
                </div>
              </div>

              {/* Cursor moving automatically */}
              {simulationStep === 2 && (
                <div className="absolute bottom-1 right-8 flex items-center gap-1 text-pink-400 z-10 pointer-events-none transition-all duration-700 animate-pulse">
                  <MousePointer2 className="w-3 h-3 text-pink-500 fill-pink-500" />
                  <span className="bg-black/25 text-[5px] px-1 rounded border border-pink-500/20 uppercase font-sans">Adjust Neon</span>
                </div>
              )}

            </div>

            <div className="flex items-center justify-between text-white/35 text-[7px] pt-1 border-t border-white/10 font-sans">
              <span>COLOR SECTOR COLOR SCHEME PREVIEW</span>
              <span className="text-pink-404 font-bold text-[6px]">DECK COMPILER READY</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-4 border border-slate-850 bg-obsidian-900 rounded-2xl overflow-hidden shadow-2xl relative select-none group/player">
      
      {/* Video Player Header Chrome */}
      <div className="bg-[#0e1220] border-b border-white/10 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-white/45">
        
        {/* Left Side: Video source badge */}
        <div className="flex items-center gap-2">
          {/* Fake camera red record light */}
          {isPlaying ? (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse block" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-600 block" />
          )}
          <span className="text-[9px] uppercase font-extrabold tracking-wider text-white/65">
             VOUCHEDGE_WALKTHROUGH_LOOP.MP4
          </span>
        </div>

        {/* Right Side: Quality tag */}
        <div className="flex items-center gap-1.5 text-[8px] text-white/40">
          <span className="text-yellow-450 font-bold bg-yellow-950/40 px-1 py-0.2 rounded border border-yellow-800/30">720P FPS:60</span>
          <span>MUTED</span>
          <Volume2 className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Screen Canvas Render Viewport */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {renderScreencastSimulation()}

        {/* Big play pause layout indicators */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-2 z-10"
            >
              <button 
                onClick={() => setIsPlaying(true)}
                className="w-12 h-12 rounded-full bg-[#FFE81F] text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,232,31,0.5)] outline-none"
              >
                <Play className="w-6 h-6 fill-slate-950 ml-1" />
              </button>
              <span className="text-[9px] font-bold font-mono text-white/65 uppercase tracking-widest bg-black/25 px-2 py-0.5 rounded">
                SIMULATION PAUSED
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Player Bottom Timeline Scrubbed Console */}
      <div className="bg-[#0b0f19] px-3.5 py-2.5 flex items-center gap-3 border-t border-white/10 text-white/45 text-[10px] font-mono">
        
        {/* Play/Pause Button */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-xs font-black uppercase text-white/65 hover:text-white transition-colors flex-shrink-0 cursor-pointer outline-none"
        >
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>

        {/* Progress Timeline bar */}
        <div className="flex-1 bg-black/25 h-1.5 rounded-full overflow-hidden relative cursor-pointer" onClick={handleRestart}>
          <div 
            className="bg-yellow-405 h-full relative" 
            style={{ width: `${(timelineSecs / 12) * 100}%` }}
          />
        </div>

        {/* Timeline timer indicator */}
        <div className="text-[9px] text-white/40 font-mono flex-shrink-0">
          <span>00:{timelineSecs < 10 ? `0${timelineSecs.toFixed(0)}` : timelineSecs.toFixed(0)}</span>
          <span className="mx-1">/</span>
          <span>00:12</span>
        </div>

        {/* Refresh loop trigger */}
        <button 
          onClick={handleRestart}
          className="text-white/40 hover:text-yellow-400 hover:scale-105 transition-all duration-200 outline-none flex-shrink-0"
          title="Restart screencast clip"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}

export default function AisLandingPage({ profile, onUpdateProfile, onSectionChange }: AisLandingPageProps) {
  // Animated signup form state
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    tierPreference: 'GOLD',
    agreedToTerms: true,
  });

  const [signupStep, setSignupStep] = useState<number>(1); // 1 = Registration Form; 2 = Done
  const [isActivating, setIsActivating] = useState(false);

  // Cinematic Trust Crawl Theater state variables
  const [theaterPaused, setTheaterPaused] = useState(false);
  const [isSpaceCruise, setIsSpaceCruise] = useState(true);

  // Detect if verified account is already established
  const isRegistered = profile.username && profile.username !== 'anonymous_capper' && profile.username !== '';

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim() || !formData.username.trim()) {
      alert('Please initialize display traits correctly.');
      return;
    }

    setIsActivating(true);
    setTimeout(() => {
      setIsActivating(false);
      setSignupStep(2);
      
      onUpdateProfile({
        displayName: formData.displayName,
        username: formData.username.replace(/\s+/g, '_').toLowerCase(),
        subscriptionTier: formData.tierPreference as 'GOLD' | 'SELLER_PRO' | 'BASIC',
        verified: true,
      });
    }, 1800);
  };

  const handleResetForNewAccount = () => {
    // Allows user to sign up a new account/overwrite cache
    onUpdateProfile({
      displayName: 'Anonymous Capper',
      username: 'anonymous_capper',
      subscriptionTier: 'BASIC',
      verified: false,
    });
    setSignupStep(1);
    setFormData({
      username: '',
      displayName: '',
      tierPreference: 'GOLD',
      agreedToTerms: true,
    });
  };

  // Middle timeline dataset
  const FEATURES = [
    {
      id: 'feed',
      title: 'Immutable Trust Ledger Feed',
      description: 'The definitive standard of transparent sports record-keeping. Post parlay slips with un-deletable histories, calculated win-rates, public ROI statistics, and verified green seals.',
      tag: 'IMMUTABLE SOURCE',
      icon: ShieldCheck,
      color: 'from-amber-400 to-yellow-500',
      accentHexColor: '#FFE81F',
      actionText: 'Explore Ledger Feed',
    },
    {
      id: 'ai_engine',
      title: 'V.A.I Smart Simulation Models',
      description: 'Consult physical predictive estimations based on premium Sabermetric variables. Bypass human biases by running thousands of simulated game vectors to determine actual edge indexes.',
      tag: 'QUANT RESEARCH',
      icon: Sparkles,
      color: 'from-cyan-400 to-sky-500',
      accentHexColor: '#38bdf8',
      actionText: 'Consult AI Models',
    },
    {
      id: 'build',
      title: 'The Multi-Leg Parlay Laboratory',
      description: 'An offline-safe stake builder. Calculate comprehensive compound odds, toggle customizable decimal-to-american odds, and adjust fractional weights before saving slips.',
      tag: 'RESEARCH BENCH',
      icon: Sliders,
      color: 'from-indigo-400 to-purple-500',
      accentHexColor: '#818cf8',
      actionText: 'Open Parlay Lab',
    },
    {
      id: 'live_games',
      title: 'Active Playrooms & Broadcasters',
      description: 'Exchange insights with community advisors inside active streamer channels. Tail and vouch for active slips directly inside streaming frames with live moderated feed chats.',
      tag: 'COMMUNITY NETWORK',
      icon: Monitor,
      color: 'from-emerald-400 to-teal-500',
      accentHexColor: '#34d399',
      actionText: 'Enter Streams Lobby',
    },
    {
      id: 'board',
      title: 'Vouch Customizer & Board',
      description: 'The designer workbench. Tailor elegant proof-slips with high-fidelity custom neon shadows, custom glow margins, and templates under strict design guidelines.',
      tag: 'DESIGN WORKSPACE',
      icon: Sparkle,
      color: 'from-rose-400 to-pink-500',
      accentHexColor: '#f43f5e',
      actionText: 'Launch Vouch Board',
    },
  ];

  return (
    <div id="landing-page-elite-root" className="bg-transparent text-white/90 min-h-screen relative overflow-y-auto overflow-x-hidden font-sans pb-24">
      
      {/* Landing Navigation Header Header */}
      <header className="sticky top-0 w-full z-50 bg-[#0b0f19]/85 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 py-4 flex items-center justify-between select-none max-w-7xl mx-auto rounded-b-2xl" id="vouchedge-main-nav-header">
        <div 
          onClick={() => onSectionChange('welcome')} 
          className="flex items-center gap-3 cursor-pointer group transition-all"
          id="vouchedge-nav-brand-logo-trigger"
        >
          <div className="w-9 h-9 rounded-xl bg-obsidian-900 border border-[#FFE81F]/70 flex items-center justify-center text-[#FFE81F] font-bold text-sm shadow-[0_0_15px_rgba(255,232,31,0.25)] group-hover:scale-110 transition-transform">
            ★
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-widest text-white uppercase group-hover:text-yellow-400 transition-colors">
              VOUCH<span className="text-[#FFE81F]">EDGE</span>
            </span>
            <span className="text-[8px] font-mono tracking-widest text-[#FFE81F] uppercase mt-px scale-[0.85] origin-left">
              Trust Network
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[11px] font-mono tracking-wider text-white/45" id="vouchedge-navbar-navlinks">
          <button 
            type="button"
            onClick={() => {
              const el = document.getElementById('features-chronicle-timeline-tree');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="hover:text-[#FFE81F] transition-colors uppercase font-bold relative group cursor-pointer bg-transparent border-none outline-none"
            id="navlink-features-scroller"
          >
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#FFE81F] transition-all group-hover:w-full" />
          </button>
          <button 
            type="button"
            onClick={() => onSectionChange('ai_engine')} 
            className="hover:text-[#38bdf8] transition-colors uppercase font-bold relative group cursor-pointer bg-transparent border-none outline-none"
            id="navlink-smart-models"
          >
            Smart Models
            <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#38bdf8] transition-all group-hover:w-full" />
          </button>
          <button 
            type="button"
            onClick={() => onSectionChange('board')} 
            className="hover:text-rose-450 transition-colors uppercase font-bold relative group cursor-pointer bg-transparent border-none outline-none"
            id="navlink-vouch-studio"
          >
            Vouch Studio
            <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-rose-400 transition-all group-hover:w-full" />
          </button>
          <button 
            type="button"
            onClick={() => onSectionChange('leaderboard')} 
            className="hover:text-emerald-400 transition-colors uppercase font-bold relative group cursor-pointer bg-transparent border-none outline-none"
            id="navlink-leaderboard"
          >
            Leaderboard
            <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-emerald-400 transition-all group-hover:w-full" />
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSectionChange('feed')}
            className="hidden sm:inline-block px-4 py-2 bg-black/30 hover:bg-slate-850 hover:text-white text-white/45 border border-white/10 hover:border-white/10 font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer outline-none"
            id="nav-guest-entrance-btn"
          >
            Guest Entrance
          </button>
          <button
            type="button"
            onClick={() => {
              if (isRegistered) {
                onSectionChange('feed');
              } else {
                const el = document.getElementById('security-identity-gateway-root');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-4 py-2 bg-[#FFE81F] hover:bg-yellow-405 text-slate-950 font-black font-mono text-[10px] uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,232,31,0.25)] transition-all active:scale-95 cursor-pointer outline-none"
            id="nav-establish-proof-btn"
          >
            {isRegistered ? 'Enter Portal' : 'Establish Proof'}
          </button>
        </div>
      </header>

      {/* Background Matrix & Celestial Nebulas */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c152e_1px,transparent_1px),linear-gradient(to_bottom,#0c152e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none z-0" />
      
      {/* Soft Glow Nebulas */}
      <div className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-yellow-300/[0.04] via-amber-500/[0.02] to-transparent rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-400/[0.04] via-purple-600/[0.02] to-transparent rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Cinematic Star Wars Header Container */}
      <section className="relative pt-16 pb-12 px-4 max-w-5xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Trust Shield Badge - Luxurious Platinum Silver & Gold style */}
          <span className="inline-flex items-center gap-1.5 bg-obsidian-900/60 border border-white/10 rounded-full px-4 py-1 text-[10px] text-indigo-350 font-mono font-black uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(99,102,241,0.12)]">
            <ShieldCheck className="w-3.5 h-3.5 text-vouch-cyan" />
            IMMUTABLE TRUST & TRANSPARENCY STANDARD
          </span>

          {/* Spaced Cinematic Editorial Title with Baunk styled experimental stencil typography */}
          <BaunkAnimatedTitle onSectionChange={onSectionChange} />

          <p className="text-white/45 text-[10px] sm:text-xs font-mono tracking-[0.16em] uppercase text-center max-w-2xl mx-auto mt-4 leading-relaxed">
            THE GALACTIC PROTOCOL OF IMMUTABLE SPORTING EDGES <span className="text-vouch-cyan">•</span> ZERO REPACTED LOGS <span className="text-vouch-cyan">•</span> TOTAL AUDIT TRANSPARENCY
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent my-6" />
        </motion.div>
      </section>

      {/* SECURE IDENTITY GATEWAY: CONTINUE / SIGN IN / SIGN UP (TRUST PORTAL WITH CONTINUOUS BYPASS OPTION) */}
      <section id="security-identity-gateway-root" className="max-w-4xl mx-auto px-4 pb-16 relative z-10">
        <div className="bg-gradient-to-b from-[#111625] to-[#0a0c14] border border-white/10 rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Glowing accent border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-yellow-500/20 via-yellow-400/80 to-yellow-500/20" />
          
          <AnimatePresence mode="wait">
            {isRegistered ? (
              /* Already Signed In: Quick Commander clearance launch option */
              <motion.div
                key="cleared_user"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4 font-mono"
              >
                <div className="w-16 h-16 bg-yellow-950/40 border border-[#FFE81F]/40 rounded-full flex items-center justify-center mx-auto mb-4 text-[#FFE81F] shadow-[0_0_15px_rgba(255,232,31,0.2)]">
                  <Crown className="w-8 h-8 animate-pulse" />
                </div>

                <span className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-widest bg-yellow-950/60 px-3 py-1 rounded border border-[#FFE81F]/30">
                  COMMAND CLEARANCE STATUS: GRANTED
                </span>

                <h3 className="text-xl sm:text-2xl font-black text-white mt-4 uppercase">
                  WELCOME BACK, COMMANDER <span className="text-[#FFE81F]">@{profile.username}</span>
                </h3>

                <p className="text-white/45 text-xs mt-2 max-w-md mx-auto leading-relaxed font-sans">
                  Your customized profile is synchronized. Your active theme is <span className="text-sky-400 font-bold uppercase">{profile.activeTheme || 'Default Space'}</span> and currently auditing trust score parameters.
                </p>

                <div className="my-8 max-w-md mx-auto grid grid-cols-2 gap-3.5 text-left text-xs bg-black/30 p-4 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-white/40 block uppercase text-[10px]">Display Alias:</span>
                    <span className="text-white/80 font-bold block mt-0.5">{profile.displayName}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block uppercase text-[10px]">Verification Tier:</span>
                    <span className="text-yellow-404 font-bold block mt-0.5 uppercase">✨ {profile.subscriptionTier} LEVEL</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 mt-2">
                  <button
                    onClick={() => onSectionChange('feed')}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-550 to-amber-500 hover:from-yellow-400 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,232,31,0.25)]"
                  >
                    <span>LAUNCH COMMAND INTERFACE</span>
                    <ChevronRight className="w-4 h-4 text-slate-950" />
                  </button>

                  <button
                    onClick={handleResetForNewAccount}
                    className="text-[10px] text-white/40 hover:text-yellow-400 font-bold uppercase tracking-wider underline mt-3 sm:mt-0 cursor-pointer"
                  >
                    Register as Another User Handle
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Not Signed In: Show 2-Column Gateway Option: Continue without account VS Create account */
              <motion.div
                key="authentication_gateways"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
              >
                {/* Column Left: Continue without account (Bypass) */}
                <div className="lg:col-span-5 flex flex-col justify-between p-5 bg-black/25 rounded-2xl border border-white/10 text-left">
                  <div className="space-y-3 font-mono">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest bg-black/25 px-2.5 py-0.5 rounded border border-slate-850">
                      SECURE BYPASS
                    </span>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">
                      RAPID ENTRY GUEST
                    </h3>
                    <p className="text-white/45 text-xs leading-relaxed font-sans mt-2">
                      Bypass account establishment. Instantly transition directly to the central, active community social forum. You will use a default temporary anonymous owner handle to tail or vouch slips.
                    </p>
                  </div>

                  <button
                    onClick={() => onSectionChange('feed')}
                    className="mt-6 w-full py-4 bg-black/25 hover:bg-slate-850 text-white/80 hover:text-white border border-white/10 hover:border-white/10 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>BYPASS SECURITY GATE</span>
                    <ArrowRight className="w-3.5 h-3.5 text-yellow-400" />
                  </button>
                </div>

                {/* Splitting divider */}
                <div className="hidden lg:flex lg:col-span-1 justify-center items-center">
                  <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-slate-800 to-transparent" />
                </div>

                {/* Column Right: Sign Up/Sign In (Active user creation) */}
                <div className="lg:col-span-6 text-left">
                  {signupStep === 1 ? (
                    <div className="space-y-4">
                      <div className="font-mono">
                        <span className="text-[9px] font-bold text-[#FFE81F] uppercase tracking-widest bg-yellow-950/30 px-2.5 py-0.5 rounded border border-yellow-900/30">
                          INITIALIZE COGNITIVE PROFILE
                        </span>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider mt-2.5">
                          CREATE PROTOCOL CREDENTIALS
                        </h3>
                        <p className="text-white/45 text-xs font-sans mt-1">
                          Establish continuous trust logs. Save your custom sports slip history, earn verified status badges, and equip premium platform styles.
                        </p>
                      </div>

                      <form onSubmit={handleSignUp} className="space-y-4 font-mono text-xs">
                        <div>
                          <label className="block text-slate-450 font-bold mb-1.5 uppercase text-[10px] tracking-wider">Public Display Name</label>
                          <input
                            required
                            type="text"
                            value={formData.displayName}
                            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="e.g. Captain Vouch Walker"
                            className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-yellow-400/50"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-450 font-bold mb-1.5 uppercase text-[10px] tracking-wider">Unique Handle Username</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35">@</span>
                            <input
                              required
                              type="text"
                              value={formData.username}
                              onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                              placeholder="vouch_skywalker"
                              className="w-full bg-obsidian-900 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-yellow-400/50"
                            />
                          </div>
                        </div>

                        {/* Subscription Tier Choice */}
                        <div className="space-y-1.5">
                          <label className="block text-slate-450 font-bold uppercase text-[10px] tracking-wider">verification badge preference</label>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div 
                              onClick={() => setFormData({ ...formData, tierPreference: 'GOLD' })}
                              className={`p-2.5 rounded-xl border text-[11px] cursor-pointer transition-all ${
                                formData.tierPreference === 'GOLD' 
                                  ? 'bg-yellow-950/30 border-[#FFE81F] text-yellow-350' 
                                  : 'bg-obsidian-900 border-white/10 text-white/40'
                              }`}
                            >
                              <div className="flex justify-between items-center font-bold">
                                <span>✨ GOLD VERIFIED</span>
                              </div>
                              <p className="text-[9px] text-white/45 mt-1 font-sans">Receive permanent gold check badge.</p>
                            </div>

                            <div 
                              onClick={() => setFormData({ ...formData, tierPreference: 'SELLER_PRO' })}
                              className={`p-2.5 rounded-xl border text-[11px] cursor-pointer transition-all ${
                                formData.tierPreference === 'SELLER_PRO' 
                                  ? 'bg-indigo-950/35 border-indigo-505 text-vouch-cyan/80' 
                                  : 'bg-obsidian-900 border-white/10 text-white/40'
                              }`}
                            >
                              <div className="flex justify-between items-center font-bold">
                                <span>💎 SELLER PRO</span>
                              </div>
                              <p className="text-[9px] text-white/45 mt-1 font-sans">Unlock storefront indicators.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                          <input
                            required
                            type="checkbox"
                            id="agreed_check"
                            checked={formData.agreedToTerms}
                            onChange={e => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                            className="mt-0.5 rounded border-white/10 bg-obsidian-900 text-yellow-405 focus:ring-transparent"
                          />
                          <label htmlFor="agreed_check" className="text-white/40 text-[10px] leading-tight font-sans">
                            I verify that my logged sport outcomes are generated with transparent trust parameters.
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={isActivating}
                          className="w-full py-3.5 bg-[#FFE81F] hover:bg-yellow-405 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          {isActivating ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                              <span>ENCRYPTING SECURE PUBLIC KEY...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                              <span>ESTABLISH TRUST ACCOUNT</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* Account generated animation frame */
                    <div className="text-center py-6 font-mono">
                      <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <CheckCircle className="w-6 h-6 animate-pulse" />
                      </div>
                      
                      <h4 className="text-emerald-400 font-extrabold uppercase text-sm">LEDGER GENERATED SUCCESSFUL CHECK!</h4>
                      <p className="text-white/45 text-xs mt-2 leading-relaxed font-sans">
                        Identity keys loaded. Handle <span className="text-yellow-400 font-bold">@{formData.username}</span> is equipped with <span className="text-sky-400 font-bold">{formData.tierPreference} AUTHORIZATION</span> level credentials.
                      </p>

                      <button
                        onClick={() => onSectionChange('feed')}
                        className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 mx-auto active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer"
                      >
                        <span>ENTER PROTOCOL SYSTEM</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* EPIC MIDDLE TIMELINE FEATURES TREE */}
      <section className="max-w-5xl mx-auto px-4 py-8 relative z-10 text-center">
        <div className="max-w-2xl mx-auto mb-16">
          <span className="text-[#FFE81F] font-mono text-[10px] font-bold tracking-widest uppercase">THE CHRONICLE OF TRUST</span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase tracking-wider mt-1">
            EXPLORE THE CORE INTEL CHANNELS
          </h2>
          <p className="text-white/45 text-xs sm:text-sm mt-3 leading-relaxed font-sans">
            Every analytical workbench and live forum is linked seamlessly underneath the un-deletable VouchEdge ledger. Travel along the neural index, watch the live interactive workflows, and engage any module instantly.
          </p>
        </div>

        {/* Tree Container */}
        <div className="relative before:absolute before:left-[26px] md:before:left-1/2 before:top-0 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-yellow-400 before:via-[#FFE81F] before:to-purple-500 before:shadow-[0_0_15px_rgba(255,232,31,0.5)] space-y-24 py-6" id="features-chronicle-timeline-tree">
          {FEATURES.map((feat, idx) => {
            const IconComponent = feat.icon;
            const isLeft = idx % 2 === 0;

            return (
              <div key={feat.id} className="relative grid grid-cols-1 md:grid-cols-9 items-start gap-0" id={`feature-timeline-segment-${feat.id}`}>
                
                {/* Left Card - Desktop only, on Left index */}
                <div className={`hidden md:block md:col-span-4 text-right pr-10 ${isLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  {isLeft && (
                    <motion.div 
                      whileHover={{ y: -4, scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 350, damping: 22 }}
                      className="bg-[#121824]/90 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl hover:border-yellow-400/50 hover:shadow-[0_0_20px_rgba(255,232,31,0.15)] transition-all flex flex-col justify-between group text-left"
                    >
                      <div className={`absolute top-0 right-0 w-2 h-full bg-gradient-to-b ${feat.color}`} />
                      <div>
                        {/* Video Screencast Label badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[9px] font-mono tracking-widest text-[#FFE81F] bg-yellow-950/40 border border-yellow-850/40 px-2 py-0.5 rounded font-black">
                            {feat.tag}
                          </span>
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.2 rounded font-bold animate-pulse">
                            ⏯️ INTERACTIVE WALKTHROUGH VIDEO
                          </span>
                        </div>

                        <h3 className="text-base font-black text-white group-hover:text-[#FFE81F] transition-colors uppercase tracking-wider">
                          {feat.title}
                        </h3>
                        
                        <p className="text-white/45 text-xs mt-2.5 leading-relaxed font-sans">
                          {feat.description}
                        </p>

                        {/* Interactive Simulated Video Component embedded inside card */}
                        <FeaturePreviewVideo featureId={feat.id} accentColor={feat.accentHexColor} />
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-between items-center text-[9px] font-mono">
                         <span className="text-white/40 font-bold uppercase tracking-wider">HASH VERIFIED ✓</span>
                         <button
                           onClick={() => onSectionChange(feat.id)}
                           className="text-[#FFE81F] font-black uppercase tracking-wider flex items-center gap-1 hover:underline active:scale-95 transition-all outline-none cursor-pointer"
                         >
                           <span>{feat.actionText}</span>
                           <ChevronRight className="w-3.5 h-3.5 text-[#FFE81F]" />
                         </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Center Pin Column */}
                <div className="absolute left-[12px] md:relative md:left-0 md:col-span-1 flex md:justify-center items-start pt-8 h-full z-20">
                  <div className="w-8 h-8 rounded-full bg-obsidian-900 border-2 border-[#FFE81F] flex items-center justify-center text-[#FFE81F] timeline-dot-pulse shadow-[0_0_12px_rgba(255,232,31,0.8)]">
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                {/* Right Card - On mobile, always show here. On Desktop, show here if idx is odd (!isLeft) */}
                <div className="col-span-1 md:col-span-4 pl-12 md:pl-10">
                  {/* Render on right if mobile, or if desktop and idx is odd */}
                  <div className={`${isLeft ? 'md:hidden' : 'block'}`}>
                    <motion.div 
                      whileHover={{ y: -4, scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 350, damping: 22 }}
                      className="bg-[#121824]/90 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl hover:border-yellow-400/50 hover:shadow-[0_0_20px_rgba(255,232,31,0.15)] transition-all flex flex-col justify-between group text-left"
                    >
                      <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${feat.color}`} />
                      <div>
                        {/* Video Screencast Label badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[9px] font-mono tracking-widest text-[#FFE81F] bg-yellow-950/40 border border-yellow-850/40 px-2 py-0.5 rounded font-black">
                            {feat.tag}
                          </span>
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.2 rounded font-bold animate-pulse">
                            ⏯️ INTERACTIVE WALKTHROUGH VIDEO
                          </span>
                        </div>

                        <h3 className="text-base font-black text-white group-hover:text-[#FFE81F] transition-colors uppercase tracking-wider">
                          {feat.title}
                        </h3>
                        
                        <p className="text-white/45 text-xs mt-2.5 leading-relaxed font-sans">
                          {feat.description}
                        </p>

                        {/* Interactive Simulated Video Component embedded inside card */}
                        <FeaturePreviewVideo featureId={feat.id} accentColor={feat.accentHexColor} />
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-between items-center text-[9px] font-mono">
                         <span className="text-white/40 font-bold uppercase tracking-wider">HASH VERIFIED ✓</span>
                         <button
                           onClick={() => onSectionChange(feat.id)}
                           className="text-[#FFE81F] font-black uppercase tracking-wider flex items-center gap-1 hover:underline active:scale-95 transition-all outline-none cursor-pointer"
                         >
                           <span>{feat.actionText}</span>
                           <ChevronRight className="w-3.5 h-3.5 text-[#FFE81F]" />
                         </button>
                      </div>
                    </motion.div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 mt-24 py-12 px-4 bg-obsidian-900 relative z-10 text-center font-mono text-[10px] text-white/40">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="tracking-widest uppercase text-yellow-450">
            VOUCHEDGE INTEGRITY CONTRACT CODES © ALL RIGHTS VERIFIED 2026.
          </p>
          <p className="max-w-lg mx-auto leading-relaxed text-slate-650 font-sans">
            Transparent Ledger System. Safe simulated testing coefficients carry no real cash stakes. Auditable mathematical trust matrices logged publicly.
          </p>
        </div>
      </footer>

    </div>
  );
}
