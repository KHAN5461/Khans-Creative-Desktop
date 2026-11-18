import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { SnapSide } from '../types';
import { useSound } from '../contexts/SoundContext';

interface DraggableWindowProps {
  isOpen: boolean;
  isMinimized?: boolean;
  isMaximized?: boolean;
  isFocused?: boolean;
  snapSide?: SnapSide;
  onClose: () => void;
  onMinimize?: () => void;
  onToggleMaximize?: () => void;
  onFocus?: () => void;
  onDragEnd?: (pos: { x: number; y: number }, snap: SnapSide) => void;
  onSnapPreview?: (snap: SnapSide) => void;
  onResize?: (size: { width: number; height: number }) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  title: string;
  children: React.ReactNode;
  contentClassName?: string;
  zIndex?: number;
  defaultPosition?: { x: number; y: number };
  size?: { width: number; height: number };
  constraintsRef?: React.RefObject<Element | null>;
}

const SAFE_TOP = 64;
const SAFE_BOTTOM = 88;
const MAX_WORKSTATION_WIDTH = 1120;
const MIN_WIN_WIDTH = 380;
const MIN_WIN_HEIGHT = 320;

const DraggableWindow: React.FC<DraggableWindowProps> = ({
  isOpen,
  isMinimized = false,
  isMaximized = false,
  isFocused = true,
  snapSide = null,
  onClose,
  onMinimize,
  onToggleMaximize,
  onFocus,
  onDragEnd,
  onSnapPreview,
  onResize,
  onSwipeLeft,
  onSwipeRight,
  title,
  children,
  contentClassName,
  zIndex = 30,
  defaultPosition = { x: 0, y: 0 },
  size = { width: 640, height: 500 },
  constraintsRef,
}) => {
  const { playClose, playMinimize, playClick, playSnap } = useSound();
  const windowRef = useRef<HTMLDivElement>(null);
  const snapOriginRectRef = useRef<DOMRect | null>(null);
  const swipeTouchRef = useRef<{
    startX: number;
    startY: number;
    locked: 'none' | 'horizontal' | 'vertical' | 'blocked';
  } | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [viewport, setViewport] = useState(() =>
    typeof window !== 'undefined'
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: 1280, h: 800 }
  );
  const isMobile = viewport.w < 768;

  useEffect(() => {
    const onWinResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onWinResize);
    return () => window.removeEventListener('resize', onWinResize);
  }, []);

  const maxAllowedW = Math.max(MIN_WIN_WIDTH, Math.min(MAX_WORKSTATION_WIDTH, viewport.w - 48));
  const maxAllowedH = Math.max(MIN_WIN_HEIGHT, viewport.h - SAFE_TOP - SAFE_BOTTOM);
  const clampedW = Math.max(MIN_WIN_WIDTH, Math.min(maxAllowedW, size.width));
  const clampedH = Math.max(MIN_WIN_HEIGHT, Math.min(maxAllowedH, size.height));
  const floatTop = Math.max(SAFE_TOP, Math.round((viewport.h - SAFE_BOTTOM - clampedH) * 0.44));

  const detectSnap = (pointerX: number): SnapSide => {
    if (isMobile) return null;
    if (pointerX <= 32) return 'left';
    if (pointerX >= viewport.w - 32) return 'right';
    return null;
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    if (isMobile || isMaximized || snapSide) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = clampedW;
    const startH = clampedH;

    const onMove = (moveEvent: PointerEvent) => {
      const capW = Math.max(MIN_WIN_WIDTH, Math.min(MAX_WORKSTATION_WIDTH, window.innerWidth - 48));
      const capH = Math.max(MIN_WIN_HEIGHT, window.innerHeight - SAFE_TOP - SAFE_BOTTOM);
      const nextW = Math.max(MIN_WIN_WIDTH, Math.min(capW, startW + (moveEvent.clientX - startX)));
      const nextH = Math.max(MIN_WIN_HEIGHT, Math.min(capH, startH + (moveEvent.clientY - startY)));
      onResize?.({ width: nextW, height: nextH });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const visible = isOpen && !isMinimized;

  // Compute responsive positioning & safe-area frame geometry
  const desktopStyle: React.CSSProperties = isMobile
    ? {
        zIndex,
        top: 64,
        left: 10,
        right: 10,
        bottom: 78,
        width: 'auto',
        height: 'auto',
      }
    : isMaximized
      ? {
          zIndex,
          top: SAFE_TOP,
          left: 24,
          right: 24,
          bottom: SAFE_BOTTOM,
          maxWidth: MAX_WORKSTATION_WIDTH,
          marginLeft: 'auto',
          marginRight: 'auto',
          width: 'auto',
          height: 'auto',
        }
      : snapSide === 'left'
        ? {
            zIndex,
            top: SAFE_TOP,
            left: 20,
            width: 'calc(50vw - 28px)',
            maxWidth: 720,
            height: `calc(100vh - ${SAFE_TOP + SAFE_BOTTOM}px)`,
          }
        : snapSide === 'right'
          ? {
              zIndex,
              top: SAFE_TOP,
              right: 20,
              width: 'calc(50vw - 28px)',
              maxWidth: 720,
              height: `calc(100vh - ${SAFE_TOP + SAFE_BOTTOM}px)`,
            }
          : {
              zIndex,
              top: floatTop,
              left: '50%',
              marginLeft: -(clampedW / 2),
              width: clampedW,
              height: clampedH,
            };

  const targetX = isMobile ? swipeX : isMaximized || snapSide ? 0 : defaultPosition.x;
  const targetY = isMobile || isMaximized || snapSide ? 0 : defaultPosition.y;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || (!onSwipeLeft && !onSwipeRight) || e.touches.length !== 1) return;
    const target = e.target as HTMLElement | null;
    const isBlockedTarget = Boolean(
      target?.closest('input, textarea, select, canvas, .touch-none, .overflow-x-auto, [data-no-swipe="true"]')
    );
    swipeTouchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      locked: isBlockedTarget ? 'blocked' : 'none',
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const state = swipeTouchRef.current;
    if (!isMobile || !state || state.locked === 'blocked' || state.locked === 'vertical') return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;

    if (state.locked === 'none') {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      if (Math.abs(dy) >= Math.abs(dx) * 0.9) {
        state.locked = 'vertical';
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        state.locked = 'horizontal';
      }
    }

    if (state.locked === 'horizontal') {
      setSwipeX(Math.max(-36, Math.min(36, dx * 0.28)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const state = swipeTouchRef.current;
    swipeTouchRef.current = null;
    setSwipeX(0);
    if (!isMobile || !state || state.locked === 'blocked' || state.locked === 'vertical') return;

    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;

    if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0 && onSwipeLeft) {
        playClick();
        onSwipeLeft();
      } else if (dx > 0 && onSwipeRight) {
        playClick();
        onSwipeRight();
      }
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={windowRef}
          initial={{ scale: 0.9, opacity: 0, x: targetX, y: targetY + 24 }}
          animate={{ scale: 1, opacity: 1, x: targetX, y: targetY }}
          exit={{
            scale: isMinimized ? 0.45 : 0.94,
            y: isMinimized ? 260 : targetY + 10,
            opacity: 0,
            transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            swipeTouchRef.current = null;
            setSwipeX(0);
          }}
          className={`fixed flex flex-col rounded-2xl overflow-hidden border shadow-hard bg-surface ${
            isMobile ? 'touch-pan-y' : ''
          } ${
            isFocused ? 'border-primary/45 ring-1 ring-primary/20' : 'border-border opacity-[0.98]'
          }`}
          style={desktopStyle}
          drag={!isMobile && !isMaximized}
          dragConstraints={constraintsRef}
          dragMomentum={false}
          dragElastic={0}
          whileDrag={{ cursor: 'grabbing' }}
          onDragStart={() => {
            if (snapSide && windowRef.current) {
              snapOriginRectRef.current = windowRef.current.getBoundingClientRect();
            } else {
              snapOriginRectRef.current = null;
            }
          }}
          onDrag={(event) => {
            if ('clientX' in event) {
              onSnapPreview?.(detectSnap((event as PointerEvent).clientX));
            }
          }}
          onDragEnd={(event, info) => {
            const pointerX = 'clientX' in event ? (event as PointerEvent).clientX : -1;
            const snap = pointerX >= 0 ? detectSnap(pointerX) : null;
            onSnapPreview?.(null);
            if (snap) {
              snapOriginRectRef.current = null;
              playSnap();
              onDragEnd?.({ x: 0, y: 0 }, snap);
            } else if (snapOriginRectRef.current) {
              const originRect = snapOriginRectRef.current;
              snapOriginRectRef.current = null;
              const centerLeft = (window.innerWidth - clampedW) / 2;
              onDragEnd?.(
                {
                  x: originRect.left + info.offset.x - centerLeft,
                  y: originRect.top + info.offset.y - floatTop,
                },
                null
              );
            } else {
              onDragEnd?.(
                {
                  x: defaultPosition.x + info.offset.x,
                  y: defaultPosition.y + info.offset.y,
                },
                null
              );
            }
          }}
          onPointerDown={onFocus}
          transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        >
          {/* Window Header */}
          <div
            onDoubleClick={() => {
              if (!isMobile && onToggleMaximize) {
                playClick();
                onToggleMaximize();
              }
            }}
            className="flex items-center justify-between px-3.5 py-2 md:px-4 md:py-3 border-b border-border bg-neutral-90/80 dark:bg-neutral-10/80 cursor-grab active:cursor-grabbing select-none shrink-0"
            onPointerDown={() => onFocus?.()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-sans font-semibold text-text-main text-sm tracking-tight truncate">
                {title}
              </span>
              {snapSide && !isMaximized && (
                <span className="text-[11px] font-mono text-text-muted">· {snapSide}</span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
              {onMinimize && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playMinimize();
                    onMinimize();
                  }}
                  aria-label={`Minimize ${title}`}
                  title="Minimize to Dock"
                  className="flex items-center justify-center w-11 h-11 md:w-7 md:h-7 rounded-full hover:bg-black/8 dark:hover:bg-white/10 transition-colors text-text-muted hover:text-text-main touch-manipulation"
                >
                  <Minus size={15} strokeWidth={2.2} />
                </button>
              )}
              {!isMobile && onToggleMaximize && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playClick();
                    onToggleMaximize();
                  }}
                  aria-label={isMaximized ? `Restore ${title}` : `Maximize ${title}`}
                  title={isMaximized ? 'Restore' : 'Maximize'}
                  className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-black/8 dark:hover:bg-white/10 transition-colors text-text-muted hover:text-text-main"
                >
                  {isMaximized ? <Minimize2 size={14} strokeWidth={2.2} /> : <Maximize2 size={14} strokeWidth={2.2} />}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playClose();
                  onClose();
                }}
                aria-label={`Close ${title}`}
                title="Close"
                className="flex items-center justify-center w-11 h-11 md:w-7 md:h-7 rounded-full hover:bg-error/15 hover:text-error transition-colors text-text-main touch-manipulation"
              >
                <X size={16} strokeWidth={2.3} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className={`flex-1 overflow-y-auto overscroll-y-contain cursor-auto ${contentClassName ?? 'p-6 bg-surface'}`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {children}
          </div>

          {/* Corner Resize Handle */}
          {!isMobile && !isMaximized && !snapSide && onResize && (
            <div
              onPointerDown={handleResizeStart}
              title="Drag to resize"
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-1 opacity-40 hover:opacity-100 transition-opacity"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M7 1L1 7M7 4L4 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DraggableWindow;