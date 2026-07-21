import React, { ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { createPortal } from 'react-dom';

interface SwipeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
}

export default function SwipeDrawer({ isOpen, onClose, children, title }: SwipeDrawerProps) {
  const controls = useAnimation();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      controls.start({ y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } });
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, controls]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If they dragged down quickly (velocity > 500) or dragged more than halfway down
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    if (offset > 150 || velocity > 500) {
      controls.start({ y: '100%', transition: { type: 'spring', damping: 30, stiffness: 300 } }).then(() => {
        onClose();
      });
    } else {
      // Snap back up
      controls.start({ y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } });
    }
  };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              controls.start({ y: '100%', transition: { type: 'spring', damping: 30, stiffness: 300 } }).then(onClose);
            }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          
          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ y: '100%' }}
            animate={controls}
            exit={{ y: '100%', transition: { type: 'spring', damping: 30, stiffness: 300 } }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-obsidian-900 border-t border-white/10 rounded-t-3xl overflow-hidden pb-safe flex flex-col max-h-[85vh] shadow-[0_-8px_32px_rgba(0,0,0,0.8)]"
            // True Apple-level glass
            style={{ 
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              backgroundColor: 'rgba(10, 10, 10, 0.7)' 
            }}
          >
            {/* Top inner highlight to simulate frosted glass reflection */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            {/* Drag Handle */}
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-6 pb-4 border-b border-white/5">
                <h3 className="text-white font-bold text-lg">{title}</h3>
              </div>
            )}

            {/* Content Area */}
            <div className="overflow-y-auto overscroll-contain flex-1 p-6 flex flex-col gap-4">
              {children}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(drawerContent, document.body);
}
