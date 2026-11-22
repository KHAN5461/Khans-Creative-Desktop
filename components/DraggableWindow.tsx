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
  const pinchTouchRef = useRef<{
    initialDistance: number;
    lastScale: number;
  } | null>(null);
  const suppressGesturesRef = useRef(false);
  const [swipeX, setSwipeX] = useState(0);
  const [pinchScale, setPinchScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
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

  // Prevent native browser pinch-zoom when two fingers pinch on the window
  useEffect(() => {
    const el = windowRef.current;
    if (!visible || !el) return;
    const preventPinchZoom = (e: TouchEvent) => {
      if (e.touches.length === 2 && !suppressGesturesRef.current) {
        e.preventDefault();
      }
    };
    el.addEventListener('touchmove', preventPinchZoom, { passive: false });
    return () => el.removeEventListener('touchmove', preventPinchZoom);
  }, [visible]);

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
          top: 10,
          left: 10,
          right: 10,
          bottom: 84,
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

  const getTouchDistance = (touches: React.TouchList) => {
    const t1 = touches[0];
    const t2 = touches[1];
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const PINCH_CLOSE_THRESHOLD = 0.78;
  const isPinching = pinchScale < 0.985;
  const isPinchReadyToClose = pinchScale <= PINCH_CLOSE_THRESHOLD;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // 3+ fingers belong to the global desktop visibility swipe gesture
    if (e.touches.length >= 3) {
      suppressGesturesRef.current = true;
      swipeTouchRef.current = null;
      pinchTouchRef.current = null;
      setSwipeX(0);
      setPinchScale(1);
      return;
    }

    if (suppressGesturesRef.current) return;

    // Two-finger pinch-to-close (works on phones, tablets, and touch laptops)
    if (e.touches.length === 2) {
      swipeTouchRef.current = null;
      setSwipeX(0);
      const dist = getTouchDistance(e.touches);
      if (dist >= 36) {
        pinchTouchRef.current = { initialDistance: dist, lastScale: 1 };
      }
      return;
    }

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
    if (e.touches.length >= 3) {
      suppressGesturesRef.current = true;
      swipeTouchRef.current = null;
      pinchTouchRef.current = null;
      setSwipeX(0);
      setPinchScale(1);
      return;
    }

    if (suppressGesturesRef.current) return;

    // Active two-finger pinch-to-close tracking
    if (e.touches.length === 2) {
      swipeTouchRef.current = null;
      setSwipeX(0);
      const dist = getTouchDistance(e.touches);
      if (!pinchTouchRef.current) {
        if (dist >= 36) {
          pinchTouchRef.current = { initialDistance: dist, lastScale: 1 };
        }
        return;
      }
      const ratio = dist / pinchTouchRef.current.initialDistance;
      const nextScale = ratio < 1 ? Math.max(0.6, Math.min(1, ratio)) : 1;
      pinchTouchRef.current.lastScale = nextScale;
      setPinchScale(nextScale);
      return;
    }

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
    if (suppressGesturesRef.current) {
      if (e.touches.length === 0) {
        suppressGesturesRef.current = false;
      }
      return;
    }

    // Complete pinch-to-close once fewer than 2 fingers remain
    if (pinchTouchRef.current && e.touches.length < 2) {
      const finalScale = pinchTouchRef.current.lastScale;
      pinchTouchRef.current = null;
      setPinchScale(1);
      if (e.touches.length > 0) {
        // Prevent remaining single finger from firing a stray swipe
        suppressGesturesRef.current = true;
      }
      if (finalScale <= PINCH_CLOSE_THRESHOLD) {
        playClose();
        onClose();
      }
      return;
    }

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
          data-pong-window={!isMobile && !isMaximized ? title : undefined}
          initial={{ scale: 0.9, opacity: 0, x: targetX, y: targetY + 24 }}
          animate={{
            scale: pinchScale,
            opacity: isPinching ? Math.max(0.55, pinchScale) : 1,
            x: targetX,
            y: targetY,
          }}
          exit={{
            scale: isMinimized ? 0.45 : 0.72,
            y: isMinimized ? 260 : targetY + 10,
            opacity: 0,
            transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            swipeTouchRef.current = null;
            pinchTouchRef.current = null;
            suppressGesturesRef.current = false;
            setSwipeX(0);
            setPinchScale(1);
          }}
          className={`fixed flex flex-col overflow-hidden border shadow-hard bg-surface ${
            isMaximized ? 'rounded-[20px]' : 'rounded-2xl'
          } ${
            !isDragging && !isMobile
              ? 'transition-[top,left,right,bottom,border-radius] duration-200 ease-out'
              : ''
          } ${
            isMobile ? 'touch-pan-y' : ''
          } ${
            isMaximized
              ? 'border-border/90'
              : isFocused
                ? 'border-primary/45 ring-1 ring-primary/20'
                : 'border-border opacity-[0.98]'
          }`}
          style={desktopStyle}
          drag={!isMobile && !isMaximized}
          dragConstraints={constraintsRef}
          dragMomentum={false}
          dragElastic={0}
          whileDrag={{ cursor: 'grabbing' }}
          onDragStart={() => {
            setIsDragging(true);
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
            setIsDragging(false);
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
          transition={
            isPinching
              ? { duration: 0.04, ease: 'linear' }
              : { type: 'spring', damping: 28, stiffness: 380 }
          }
        >
          {/* Live Pinch-to-Close Gesture HUD */}
          <AnimatePresence>
            {isPinching && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.12 }}
                className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/10 dark:bg-black/25 backdrop-blur-[1px]"
              >
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-hard text-xs font-semibold transition-colors ${
                    isPinchReadyToClose
                      ? 'bg-error text-white border-error'
                      : 'bg-surface/95 text-text-main border-border'
                  }`}
                >
                  <X size={14} strokeWidth={2.5} />
                  <span>{isPinchReadyToClose ? 'Release to close' : 'Pinch inward to close'}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Window Header */}
          <div
            onDoubleClick={() => {
              if (!isMobile && onToggleMaximize) {
                playClick();
                onToggleMaximize();
              }
            }}
            className={`flex items-center justify-between px-3.5 py-2 md:px-4 md:py-2.5 border-b border-border bg-neutral-90/80 dark:bg-neutral-10/80 select-none shrink-0 ${
              isMobile || isMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
            }`}
            onPointerDown={() => onFocus?.()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-sans font-semibold text-text-main text-sm tracking-tight truncate">
                {title}
              </span>
              {snapSide && !isMaximized && (
                <span className="text-[11px] font-mono text-text-muted">· {snapSide}</span>
              )}
              {isMaximized && !isMobile && (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-surface/80 border border-border text-[10px] font-mono text-text-muted">
                  Full View
                </span>
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
                  className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                    isMaximized
                      ? 'bg-primary/15 text-primary hover:bg-primary/25'
                      : 'hover:bg-black/8 dark:hover:bg-white/10 text-text-muted hover:text-text-main'
                  }`}
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

          {/* Content (Container Query Host) */}
          <div
            className={`@container flex-1 overflow-y-auto overscroll-y-contain cursor-auto ${contentClassName ?? 'p-6 bg-surface'}`}
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