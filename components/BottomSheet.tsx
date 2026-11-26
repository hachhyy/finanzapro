'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  useDragControls,
} from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: BottomSheetProps) {
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 340], [1, 0]);
  const dragControls = useDragControls();

  useEffect(() => {
    if (isOpen) {
      y.set(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, y]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{ zIndex: 100 }}
          className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-auto"
        >
          {/* Full-Screen Blurred Backdrop linked to drag y */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
          />

          {/* Interactive 1:1 Gesture Sheet Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              bounce: 0,
              duration: 0.36,
            }}
            style={{ y }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.08, bottom: 0.25 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 480) {
                onClose();
              } else {
                animate(y, 0, {
                  type: 'spring',
                  duration: 0.38,
                  bounce: 0.12,
                  velocity: info.velocity.y,
                });
              }
            }}
            className="relative z-10 w-full max-w-lg max-h-[86dvh] flex flex-col rounded-t-[28px] bg-[#141416]/95 backdrop-blur-2xl border-t border-x border-white/[0.09] shadow-[0_-24px_60px_rgba(0,0,0,0.9)] overflow-hidden pointer-events-auto"
          >
            {/* Drag Handle + Header Zone (initiates 1:1 sheet drag without fighting inner scroll) */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="touch-none select-none cursor-grab active:cursor-grabbing shrink-0"
            >
              {/* iOS Grabber Pill */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-white/20" />
              </div>

              {/* Fixed Header */}
              <div className="flex items-start justify-between px-5 pt-2 pb-4 border-b border-white/[0.07]">
                <div className="pr-3">
                  <h3 className="text-[17px] font-semibold text-white tracking-[-0.02em]">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/[0.06] text-zinc-400 hover:text-white active:scale-95 transition cursor-pointer shrink-0"
                  aria-label="Cerrar panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Native iOS Scrollable Body */}
            <div
              style={{
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3rem)',
              }}
              className="px-5 pt-4 overflow-y-auto flex-1 min-h-0 overscroll-contain touch-pan-y space-y-4 pb-10"
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
