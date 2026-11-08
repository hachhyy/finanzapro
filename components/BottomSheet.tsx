'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-auto"
    >
      {/* Full-Screen Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer animate-[fadeIn_0.2s_ease-out]"
      />

      {/* Sheet Panel floating cleanly above everything */}
      <div
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 2rem)',
        }}
        className="relative z-10 w-full max-w-lg flex flex-col rounded-t-3xl bg-[#1C1C1E]/95 backdrop-blur-2xl border-t border-x border-[#2C2C2E] shadow-[0_-20px_50px_rgba(0,0,0,0.85)] overflow-hidden pointer-events-auto animate-[sheetSlideUp_0.28s_cubic-bezier(0.22,1,0.36,1)]"
      >
        {/* iOS Grabber Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-zinc-600/80" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-4 border-b border-[#2C2C2E] shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800/80 text-zinc-300 hover:text-white active:scale-95 transition cursor-pointer"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body with generous iOS SafeArea bottom padding */}
        <div
          style={{
            paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 3.5rem), 3.75rem)',
          }}
          className="px-5 pt-5 overflow-y-auto overscroll-contain space-y-4 pb-14"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
