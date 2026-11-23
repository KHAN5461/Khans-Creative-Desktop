import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, Plus, Minus } from 'lucide-react';
import { WindowId, WindowState } from '../types';
import { useSound } from '../contexts/SoundContext';

export interface ExposeWindowMeta {
  id: WindowId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

interface WindowExposeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  windows: Record<WindowId, WindowState>;
  focusedWindowId: WindowId | null;
  windowMeta: ExposeWindowMeta[];
  onFocusWindow: (id: WindowId) => void;
  onCloseWindow: (id: WindowId) => void;
  onMinimizeAll: () => void;
}

const WindowExposeOverlay: React.FC<WindowExposeOverlayProps> = ({
  isOpen,
  onClose,
  windows,
  focusedWindowId,
  windowMeta,
  onFocusWindow,
  onCloseWindow,
  onMinimizeAll,
}) => {
  const { playClick, playClose, playMinimize } = useSound();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const openMetas = windowMeta
    .filter((m) => windows[m.id]?.isOpen)
    .sort((a, b) => (windows[b.id]?.zIndex ?? 0) - (windows[a.id]?.zIndex ?? 0));

  const closedMetas = windowMeta.filter((m) => !windows[m.id]?.isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-no-context-menu="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[125] bg-black/40 backdrop-blur-md backdrop-saturate-150 flex flex-col justify-between p-4 sm:p-8 overflow-y-auto overscroll-contain"
        >
          {/* Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full mx-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-surface/90 backdrop-blur-xl backdrop-saturate-150 border border-border shadow-hard"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LayoutGrid size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-text-main truncate">Window Overview</h2>
                <p className="text-[11px] font-mono text-text-muted tabular-nums">
                  {openMetas.length} open {openMetas.length === 1 ? 'window' : 'windows'} · Press ⌘/ or Esc
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {openMetas.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    playMinimize();
                    onMinimizeAll();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium text-text-main transition-colors whitespace-nowrap touch-manipulation"
                >
                  <Minus size={13} />
                  <span>Show Desktop</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onClose();
                }}
                aria-label="Close overview"
                className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10 transition-colors touch-manipulation"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Open Windows Grid */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full mx-auto my-auto py-6"
          >
            {openMetas.length === 0 ? (
              <div className="max-w-sm mx-auto p-6 rounded-2xl bg-surface/92 backdrop-blur-xl border border-border shadow-hard text-center space-y-2">
                <div className="text-sm font-semibold text-text-main">Clean Desktop</div>
                <p className="text-xs text-text-muted">
                  No windows are open right now. Pick an app below to launch it.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {openMetas.map((meta, idx) => {
                  const win = windows[meta.id];
                  const isFocused = focusedWindowId === meta.id && !win.isMinimized;
                  const statusText = win.isMinimized
                    ? 'Minimized'
                    : win.isMaximized
                      ? 'Maximized'
                      : win.snapSide
                        ? `Snapped ${win.snapSide}`
                        : isFocused
                          ? 'Focused'
                          : 'Open';

                  return (
                    <motion.div
                      key={meta.id}
                      initial={{ opacity: 0, scale: 0.94, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 28,
                        delay: idx * 0.03,
                      }}
                      className={`group relative rounded-2xl bg-surface/95 backdrop-blur-xl border shadow-hard overflow-hidden transition-colors ${
                        isFocused
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border hover:border-text-muted'
                      }`}
                    >
                      {/* Mini Titlebar */}
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-border bg-bg-app/80">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-primary shrink-0">{meta.icon}</span>
                          <span className="text-xs font-semibold text-text-main truncate">
                            {meta.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playClose();
                            onCloseWindow(meta.id);
                          }}
                          aria-label={`Close ${meta.title}`}
                          title="Close window"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-colors shrink-0 touch-manipulation"
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {/* Clickable Window Preview Body */}
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          onFocusWindow(meta.id);
                          onClose();
                        }}
                        className="w-full p-4 text-left space-y-3 hover:bg-neutral-90/40 dark:hover:bg-neutral-10/40 transition-colors touch-manipulation"
                      >
                        <div className="space-y-1">
                          <div className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                            {meta.subtitle}
                          </div>
                        </div>

                        {/* Minimal Wireframe Preview Lines */}
                        <div className="p-3 rounded-xl border border-border/70 bg-bg-app/70 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-primary/50" />
                            <div className="h-2 flex-1 rounded-full bg-border/80" />
                          </div>
                          <div className="h-2 w-4/5 rounded-full bg-border/60" />
                          <div className="h-2 w-3/5 rounded-full bg-border/40" />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                          <span>{statusText}</span>
                          <span className="text-primary font-medium group-hover:underline">
                            {win.isMinimized ? 'Restore →' : 'Focus →'}
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Launch Strip for Closed Apps */}
          {closedMetas.length > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-surface/90 backdrop-blur-xl backdrop-saturate-150 border border-border shadow-medium"
            >
              <span className="text-[11px] font-mono text-text-muted px-2">Launch</span>
              {closedMetas.map((meta) => (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    onFocusWindow(meta.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium text-text-main transition-colors whitespace-nowrap touch-manipulation"
                >
                  <Plus size={12} className="text-primary" />
                  <span>{meta.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-2" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WindowExposeOverlay;
