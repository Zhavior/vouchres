import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Point = { x: number; y: number };

type VouchCursorTipProps = {
  title: string;
  body: string;
  children: ReactNode;
};

function canFollowCursor() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: fine)').matches;
}

export default function VouchCursorTip({ title, body, children }: VouchCursorTipProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [follow, setFollow] = useState(false);
  const [point, setPoint] = useState<Point>({ x: 0, y: 0 });

  const move = useCallback((event: PointerEvent) => {
    setPoint({ x: event.clientX, y: event.clientY });
  }, []);

  useEffect(() => {
    if (!active || !follow) return undefined;
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [active, follow, move]);

  const openAt = (x: number, y: number, useFollow: boolean) => {
    setPoint({ x, y });
    setFollow(useFollow);
    setActive(true);
  };

  const show = (event: React.PointerEvent<HTMLDivElement>) => {
    openAt(event.clientX, event.clientY, canFollowCursor());
  };

  const hide = () => setActive(false);

  const toggleTouch = (event: React.PointerEvent<HTMLDivElement>) => {
    if (canFollowCursor()) return;
    event.preventDefault();
    if (active) {
      hide();
      return;
    }
    const rect = anchorRef.current?.getBoundingClientRect();
    openAt(rect?.left ?? event.clientX, (rect?.bottom ?? event.clientY) + 8, false);
  };

  const tipStyle = follow
    ? {
        left: Math.min(point.x + 16, window.innerWidth - 280),
        top: Math.min(point.y + 18, window.innerHeight - 120),
      }
    : {
        left: Math.max(12, Math.min(point.x, window.innerWidth - 280)),
        top: Math.min(point.y, window.innerHeight - 120),
      };

  return (
    <>
      <div
        ref={anchorRef}
        className="ve-vouch-tip-anchor"
        onPointerEnter={show}
        onPointerMove={show}
        onPointerLeave={hide}
        onPointerDown={toggleTouch}
      >
        {children}
      </div>

      {active && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="ve-vouch-cursor-tip pointer-events-none fixed z-[120] max-w-[16rem] rounded-lg border border-white/15 px-3 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
              style={tipStyle}
              role="tooltip"
            >
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/55">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/82">{body}</p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
