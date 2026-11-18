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

const ScribbleCanvas: React.FC<ScribbleCanvasProps> = ({ isActive, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotsRef = useRef<ImageData[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const { theme } = useTheme();
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [color, setColor] = useState(() => (theme.isDark ? '#FFFFFF' : '#1C1B1F'));
  const [lineWidth, setLineWidth] = useState(4);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const { playClick, playStick } = useSound();

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
    if (!canvas) return;
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
            initial={{ y: -24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed top-[70px] md:top-4 left-1/2 -translate-x-1/2 z-[110] flex flex-wrap items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-surface border border-border shadow-hard max-w-[94vw]"
          >
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'pen', icon: <Pen size={15} />, label: 'Pen' },
                  { id: 'highlighter', icon: <Highlighter size={15} />, label: 'Marker' },
                  { id: 'eraser', icon: <Eraser size={15} />, label: 'Erase' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    playClick();
                    setTool(item.id);
                  }}
                  title={item.label}
                  className={`p-2 rounded-xl transition-colors ${
                    tool === item.id
                      ? 'bg-primary text-primary-on'
                      : 'text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10'
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-border" />

            <div className="flex items-center gap-1.5">
              {INK_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  onClick={() => {
                    playClick();
                    setColor(swatch);
                    if (tool === 'eraser') setTool('pen');
                  }}
                  aria-label={`Ink color ${swatch}`}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    color === swatch && tool !== 'eraser'
                      ? 'scale-120 ring-2 ring-primary ring-offset-2 ring-offset-surface border-text-main'
                      : 'border-black/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>

            <div className="w-px h-5 bg-border" />

            <div className="flex items-center gap-1">
              {[2, 4, 8].map((sz) => (
                <button
                  key={sz}
                  onClick={() => {
                    playClick();
                    setLineWidth(sz);
                  }}
                  title={`Stroke ${sz}px`}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
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

            <div className="w-px h-5 bg-border" />

            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                title="Undo stroke"
                className="p-2 rounded-xl text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10"
              >
                <Undo2 size={15} />
              </button>
              <button
                onClick={clearCanvas}
                title="Clear desktop ink"
                className="p-2 rounded-xl text-error hover:bg-error/10"
              >
                <Trash2 size={15} />
              </button>
              {hasStrokes && (
                <button
                  onClick={exportDrawing}
                  title="Download doodle PNG"
                  className="p-2 rounded-xl text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10"
                >
                  <Download size={15} />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                playClick();
                onExit();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-on text-xs font-semibold hover:opacity-90 whitespace-nowrap shrink-0"
            >
              <Check size={14} />
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScribbleCanvas;