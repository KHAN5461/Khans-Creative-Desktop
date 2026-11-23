import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pen, Highlighter, Eraser, Undo2, Trash2, Download, Check } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';
import { useTheme } from '../theme/ThemeContext';

interface ScribbleCanvasProps {
  isActive: boolean;
  onExit: () => void;
}

const INK_COLORS = ['#1C1B1F', '#FFFFFF', '#D5A700', '#2563EB', '#E11D48', '#10B981'];

const STROKE_SIZES = [2, 4, 8] as const;

const ScribbleCanvas: React.FC<ScribbleCanvasProps> = ({ isActive, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotsRef = useRef<ImageData[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const { theme } = useTheme();
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [color, setColor] = useState(() => (theme.isDark ? '#FFFFFF' : '#1C1B1F'));
  const [lineWidth, setLineWidth] = useState<number>(4);
  const [inkMode, setInkMode] = useState<'pen' | 'highlighter'>('pen');
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { playClick, playStick } = useSound();

  const handleInkSwitch = () => {
    playClick();
    if (tool === 'eraser') {
      setTool(inkMode);
    } else {
      const nextMode = inkMode === 'pen' ? 'highlighter' : 'pen';
      setInkMode(nextMode);
      setTool(nextMode);
    }
  };

  const handleCycleThickness = () => {
    playClick();
    setLineWidth((prev) => {
      const idx = STROKE_SIZES.indexOf(prev as (typeof STROKE_SIZES)[number]);
      return STROKE_SIZES[(idx + 1) % STROKE_SIZES.length];
    });
  };

  useEffect(() => {
    if (!isActive) setIsPaletteOpen(false);
  }, [isActive]);

  useEffect(() => {
    setColor((prev) => {
      if (theme.isDark && prev === '#1C1B1F') return '#FFFFFF';
      if (!theme.isDark && prev === '#FFFFFF') return '#1C1B1F';
      return prev;
    });
  }, [theme.isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ctx = canvas.getContext('2d');
      let saved: ImageData | null = null;
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        try {
          saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch {
          saved = null;
        }
      }
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (ctx && saved) {
        ctx.putImageData(saved, 0, 0);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    snapshotsRef.current = [...snapshotsRef.current.slice(-19), ctx.getImageData(0, 0, canvas.width, canvas.height)];
  }, []);

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || snapshotsRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    playClick();
    const last = snapshotsRef.current[snapshotsRef.current.length - 1];
    snapshotsRef.current = snapshotsRef.current.slice(0, -1);
    ctx.putImageData(last, 0, 0);
    if (snapshotsRef.current.length === 0) {
      setHasStrokes(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    playClick();
    saveSnapshot();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const exportDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    playStick();
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'khan-desktop-doodle.png';
    a.click();
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    saveSnapshot();
    setIsPaletteOpen(false);
    setIsDrawing(true);
    setHasStrokes(true);
    lastPointRef.current = { x: e.clientX, y: e.clientY };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 5;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = lineWidth * 4;
      ctx.strokeStyle = color;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
    }
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
    ctx.lineTo(e.clientX + 0.01, e.clientY + 0.01);
    ctx.stroke();
    ctx.restore();
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive || !isDrawing || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prev = lastPointRef.current;
    const midX = (prev.x + e.clientX) / 2;
    const midY = (prev.y + e.clientY) / 2;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 5;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.14;
      ctx.lineWidth = lineWidth * 4;
      ctx.strokeStyle = color;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
    }
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = { x: e.clientX, y: e.clientY };
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
    }
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        onPointerLeave={stopDrawing}
        className={`fixed inset-0 touch-none transition-opacity ${
          isActive ? 'z-[105] pointer-events-auto cursor-crosshair' : 'z-[15] pointer-events-none'
        }`}
      />

      <AnimatePresence>
        {isActive && (
          <motion.div
            data-no-context-menu="true"
            initial={{ y: -20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed top-[8px] left-[10px] right-[10px] md:top-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[110] md:w-max md:max-w-[calc(100vw-24px)]"
          >
            {/* Primary Responsive Pill Bar (replaces mobile top bar on <md, centered floating pill on md+) */}
            <div className="flex items-center justify-between md:justify-center gap-0.5 sm:gap-1 md:gap-2 h-[48px] md:h-auto px-1.5 sm:px-2 md:px-2.5 md:py-1.5 rounded-full bg-surface/90 backdrop-blur-xl backdrop-saturate-150 border border-border shadow-hard">
              {/* Drawing Tools: Pen/Marker Switch + Eraser */}
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleInkSwitch}
                  title={
                    tool === 'eraser'
                      ? inkMode === 'pen'
                        ? 'Switch to Pen'
                        : 'Switch to Marker'
                      : inkMode === 'pen'
                        ? 'Pen — tap to switch to Marker'
                        : 'Marker — tap to switch to Pen'
                  }
                  aria-label={
                    inkMode === 'pen'
                      ? 'Pen active, switch to Marker'
                      : 'Marker active, switch to Pen'
                  }
                  className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-8 md:h-8 rounded-full transition-colors touch-manipulation ${
                    tool !== 'eraser'
                      ? 'bg-primary text-primary-on'
                      : 'text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10'
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={inkMode}
                      initial={{ scale: 0.65, rotate: -18, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0.65, rotate: 18, opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      className="flex items-center justify-center -translate-y-[1.5px]"
                    >
                      {inkMode === 'pen' ? <Pen size={14} /> : <Highlighter size={14} />}
                    </motion.span>
                  </AnimatePresence>
                  <span className="absolute bottom-[4px] flex items-center gap-[3px] pointer-events-none">
                    <span
                      className={`w-[3.5px] h-[3.5px] rounded-full transition-opacity ${
                        inkMode === 'pen' ? 'bg-current opacity-100' : 'bg-current opacity-35'
                      }`}
                    />
                    <span
                      className={`w-[3.5px] h-[3.5px] rounded-full transition-opacity ${
                        inkMode === 'highlighter' ? 'bg-current opacity-100' : 'bg-current opacity-35'
                      }`}
                    />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setTool('eraser');
                  }}
                  title="Eraser"
                  aria-label="Eraser"
                  className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-8 md:h-8 rounded-full transition-colors touch-manipulation ${
                    tool === 'eraser'
                      ? 'bg-primary text-primary-on'
                      : 'text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10'
                  }`}
                >
                  <Eraser size={15} />
                </button>
              </div>

              <div className="w-px h-5 bg-border shrink-0" />

              {/* Mobile Compact Color & Dedicated Thickness Buttons (<md) */}
              <div className="flex md:hidden items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setIsPaletteOpen((v) => !v);
                  }}
                  aria-label="Ink color"
                  title="Ink color"
                  className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-colors touch-manipulation ${
                    isPaletteOpen
                      ? 'border-primary bg-primary-container/35'
                      : 'border-border bg-bg-app'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/25 dark:border-white/30"
                    style={{ backgroundColor: color }}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleCycleThickness}
                  aria-label={`Stroke thickness ${lineWidth}px`}
                  title={`Thickness ${lineWidth}px — tap to cycle`}
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-border bg-bg-app text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10 transition-colors touch-manipulation"
                >
                  <motion.span
                    animate={{ width: lineWidth + 4, height: lineWidth + 4 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                    className="rounded-full bg-current"
                  />
                </button>
              </div>

              {/* Desktop Inline Color Swatches (md+) */}
              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                {INK_COLORS.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => {
                      playClick();
                      setColor(swatch);
                      if (tool === 'eraser') setTool(inkMode);
                    }}
                    aria-label={`Ink color ${swatch}`}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      color === swatch && tool !== 'eraser'
                        ? 'scale-120 ring-2 ring-primary ring-offset-2 ring-offset-surface border-text-main'
                        : 'border-black/20 dark:border-white/25 hover:scale-110'
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>

              <div className="hidden md:block w-px h-5 bg-border shrink-0" />

              {/* Desktop Inline Stroke Sizes (md+) */}
              <div className="hidden md:flex items-center gap-1 shrink-0">
                {STROKE_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      playClick();
                      setLineWidth(sz);
                    }}
                    title={`Thickness ${sz}px`}
                    aria-label={`Thickness ${sz}px`}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      lineWidth === sz
                        ? 'bg-neutral-90 dark:bg-neutral-10 text-text-main'
                        : 'text-text-muted hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60'
                    }`}
                  >
                    <span
                      className="rounded-full bg-current"
                      style={{ width: sz + 3, height: sz + 3 }}
                    />
                  </button>
                ))}
              </div>

              <div className="w-px h-5 bg-border shrink-0" />

              {/* History & Download Controls */}
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleUndo}
                  title="Undo stroke"
                  aria-label="Undo stroke"
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-8 md:h-8 rounded-full text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10 touch-manipulation"
                >
                  <Undo2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={clearCanvas}
                  title="Clear desktop ink"
                  aria-label="Clear desktop ink"
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-8 md:h-8 rounded-full text-error hover:bg-error/10 touch-manipulation"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={exportDrawing}
                  disabled={!hasStrokes}
                  title={hasStrokes ? 'Download doodle PNG' : 'Draw something to download'}
                  aria-label="Download doodle PNG"
                  className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-8 md:h-8 rounded-full transition-opacity touch-manipulation ${
                    hasStrokes
                      ? 'text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10'
                      : 'text-text-muted opacity-35 cursor-not-allowed'
                  }`}
                >
                  <Download size={15} />
                </button>
              </div>

              {/* Done Tick CTA (Icon-Only) */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onExit();
                }}
                title="Done drawing"
                aria-label="Done drawing"
                className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-8 md:h-8 rounded-full bg-primary text-primary-on hover:opacity-90 shrink-0 touch-manipulation"
              >
                <Check size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Mobile Attached Color Palette Tray (<md) */}
            <AnimatePresence>
              {isPaletteOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 440, damping: 28 }}
                  className="md:hidden mt-2 px-3 py-2.5 rounded-full bg-surface/95 backdrop-blur-md border border-border shadow-hard flex items-center justify-between gap-2"
                >
                  {INK_COLORS.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => {
                        playClick();
                        setColor(swatch);
                        if (tool === 'eraser') setTool(inkMode);
                        setIsPaletteOpen(false);
                      }}
                      aria-label={`Ink color ${swatch}`}
                      className={`w-7 h-7 rounded-full border transition-transform touch-manipulation ${
                        color === swatch && tool !== 'eraser'
                          ? 'scale-115 ring-2 ring-primary ring-offset-2 ring-offset-surface border-text-main'
                          : 'border-black/20 dark:border-white/25'
                      }`}
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScribbleCanvas;