import React, { useState, useRef, useCallback } from 'react';
import {
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  Undo2,
  Redo2,
  Trash2,
  Download,
  FlipHorizontal2,
  Grid3X3,
  Pin,
} from 'lucide-react';
import { useSound } from '../contexts/SoundContext';

interface PixelArtCanvasProps {
  onPinToDesktop?: (imageDataUrl: string, label: string) => void;
}

type Tool = 'pencil' | 'eraser' | 'bucket' | 'eyedropper';

interface HistorySnapshot {
  gridSize: 16 | 32;
  pixels: (string | null)[];
}

const PALETTE = [
  '#1C1B1F',
  '#FFFFFF',
  '#D5A700',
  '#E11D48',
  '#2563EB',
  '#10B981',
  '#8B5CF6',
  '#F97316',
  '#38BDF8',
  '#F472B6',
];

const createStarterGrid16 = (): (string | null)[] => {
  const g: (string | null)[] = Array(16 * 16).fill(null);
  const put = (x: number, y: number, c: string) => {
    g[y * 16 + x] = c;
  };
  // Charming pixel buddy motif
  const outline = '#1C1B1F';
  const body = '#D5A700';
  const cheek = '#F472B6';
  const shine = '#FFF0C9';

  for (let x = 5; x <= 10; x++) {
    put(x, 3, outline);
    put(x, 12, outline);
  }
  for (let y = 5; y <= 10; y++) {
    put(3, y, outline);
    put(12, y, outline);
  }
  put(4, 4, outline);
  put(11, 4, outline);
  put(4, 11, outline);
  put(11, 11, outline);

  for (let y = 4; y <= 11; y++) {
    for (let x = 4; x <= 11; x++) {
      if (g[y * 16 + x] === null) put(x, y, body);
    }
  }
  // Highlights
  put(5, 5, shine);
  put(6, 5, shine);
  // Eyes
  put(6, 7, outline);
  put(9, 7, outline);
  // Cheeks
  put(5, 8, cheek);
  put(10, 8, cheek);
  // Smile
  put(7, 9, outline);
  put(8, 9, outline);
  return g;
};

const PixelArtCanvas: React.FC<PixelArtCanvasProps> = ({ onPinToDesktop }) => {
  const [gridSize, setGridSize] = useState<16 | 32>(16);
  const [pixels, setPixels] = useState<(string | null)[]>(() => createStarterGrid16());
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);
  const [activeColor, setActiveColor] = useState<string>('#1C1B1F');
  const [tool, setTool] = useState<Tool>('pencil');
  const [mirrorX, setMirrorX] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [pinnedFeedback, setPinnedFeedback] = useState<boolean>(false);

  const isPaintingRef = useRef(false);
  const strokeSavedRef = useRef(false);
  const paintStepRef = useRef(0);
  const { playPaint, playClick, playStick } = useSound();

  const pushHistory = useCallback((size: 16 | 32, snapshot: (string | null)[]) => {
    setHistory((prev) => [...prev.slice(-29), { gridSize: size, pixels: snapshot }]);
    setRedoStack([]);
  }, []);

  const handleGridSizeChange = (nextSize: 16 | 32) => {
    if (nextSize === gridSize) return;
    playClick();
    pushHistory(gridSize, pixels);
    setGridSize(nextSize);
    setPixels(nextSize === 16 ? createStarterGrid16() : Array(32 * 32).fill(null));
  };

  const floodFill = (startIdx: number, targetColor: string | null, replacement: string | null) => {
    if (targetColor === replacement) return;
    pushHistory(gridSize, pixels);
    const next = [...pixels];
    const queue = [startIdx];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const idx = queue.shift()!;
      if (visited.has(idx)) continue;
      visited.add(idx);
      if (next[idx] !== targetColor) continue;
      next[idx] = replacement;
      const x = idx % gridSize;
      const y = Math.floor(idx / gridSize);
      if (x > 0) queue.push(idx - 1);
      if (x < gridSize - 1) queue.push(idx + 1);
      if (y > 0) queue.push(idx - gridSize);
      if (y < gridSize - 1) queue.push(idx + gridSize);
    }
    setPixels(next);
    playPaint(2);
  };

  const paintAt = (idx: number, isInitialClick: boolean) => {
    if (tool === 'eyedropper') {
      const picked = pixels[idx];
      if (picked) {
        setActiveColor(picked);
        setTool('pencil');
        playClick();
      }
      return;
    }

    if (tool === 'bucket') {
      if (isInitialClick) {
        floodFill(idx, pixels[idx], activeColor);
      }
      return;
    }

    const colorToApply = tool === 'eraser' ? null : activeColor;
    const x = idx % gridSize;
    const y = Math.floor(idx / gridSize);
    const mirrorIdx = y * gridSize + (gridSize - 1 - x);

    const willChange =
      pixels[idx] !== colorToApply || (mirrorX && pixels[mirrorIdx] !== colorToApply);
    if (!willChange) return;

    if (!strokeSavedRef.current) {
      pushHistory(gridSize, pixels);
      strokeSavedRef.current = true;
    }

    setPixels((prev) => {
      const next = [...prev];
      next[idx] = colorToApply;
      if (mirrorX) {
        next[mirrorIdx] = colorToApply;
      }
      return next;
    });

    paintStepRef.current += 1;
    playPaint(paintStepRef.current);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    playClick();
    const prev = history[history.length - 1];
    setRedoStack((r) => [...r, { gridSize, pixels }]);
    setGridSize(prev.gridSize);
    setPixels(prev.pixels);
    setHistory((h) => h.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    playClick();
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [...h, { gridSize, pixels }]);
    setGridSize(next.gridSize);
    setPixels(next.pixels);
    setRedoStack((r) => r.slice(0, -1));
  };

  const handleClear = () => {
    playClick();
    pushHistory(gridSize, pixels);
    setPixels(Array(gridSize * gridSize).fill(null));
  };

  const renderToDataUrl = (scale = 12): string => {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize * scale;
    canvas.height = gridSize * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    pixels.forEach((col, i) => {
      if (!col) return;
      const x = (i % gridSize) * scale;
      const y = Math.floor(i / gridSize) * scale;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, scale, scale);
    });
    return canvas.toDataURL('image/png');
  };

  const handleDownload = () => {
    playClick();
    const url = renderToDataUrl(16);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `khan-pixel-${gridSize}x${gridSize}.png`;
    a.click();
  };

  const handlePin = () => {
    const url = renderToDataUrl(12);
    if (!url || !onPinToDesktop) return;
    playStick();
    onPinToDesktop(url, `pixel-${gridSize}x${gridSize}`);
    setPinnedFeedback(true);
    setTimeout(() => setPinnedFeedback(false), 1800);
  };

  return (
    <div
      className="flex flex-col h-full bg-surface text-text-main select-none"
      onPointerUp={() => {
        isPaintingRef.current = false;
        strokeSavedRef.current = false;
      }}
      onPointerLeave={() => {
        isPaintingRef.current = false;
        strokeSavedRef.current = false;
      }}
    >
      {/* Top Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-border bg-bg-app/70">
        <div className="flex items-center gap-1">
          {(
            [
              { id: 'pencil', icon: <Pencil size={15} />, label: 'Pencil' },
              { id: 'bucket', icon: <PaintBucket size={15} />, label: 'Fill' },
              { id: 'eyedropper', icon: <Pipette size={15} />, label: 'Pick' },
              { id: 'eraser', icon: <Eraser size={15} />, label: 'Erase' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                playClick();
                setTool(t.id);
              }}
              title={t.label}
              className={`flex items-center justify-center gap-1.5 min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 touch-manipulation ${
                tool === t.id
                  ? 'bg-primary text-primary-on shadow-sm'
                  : 'hover:bg-neutral-90 dark:hover:bg-neutral-10 text-text-main'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              playClick();
              setMirrorX((m) => !m);
            }}
            title="Mirror Symmetry X"
            className={`min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1.5 rounded-lg border transition-colors touch-manipulation ${
              mirrorX
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-transparent hover:bg-neutral-90 dark:hover:bg-neutral-10 text-text-muted'
            }`}
          >
            <FlipHorizontal2 size={15} />
          </button>
          <button
            onClick={() => {
              playClick();
              setShowGrid((g) => !g);
            }}
            title="Toggle Grid Lines"
            className={`min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1.5 rounded-lg border transition-colors touch-manipulation ${
              showGrid
                ? 'border-border bg-surface text-text-main'
                : 'border-transparent text-text-muted hover:bg-neutral-90 dark:hover:bg-neutral-10'
            }`}
          >
            <Grid3X3 size={15} />
          </button>
          <div className="w-px h-4 bg-border mx-0.5 sm:mx-1" />
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo"
            className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1.5 rounded-lg hover:bg-neutral-90 dark:hover:bg-neutral-10 disabled:opacity-30 touch-manipulation"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo"
            className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1.5 rounded-lg hover:bg-neutral-90 dark:hover:bg-neutral-10 disabled:opacity-30 touch-manipulation"
          >
            <Redo2 size={15} />
          </button>
          <button
            onClick={handleClear}
            title="Clear Canvas"
            className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1.5 rounded-lg hover:bg-error/15 text-error transition-colors touch-manipulation"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Canvas Grid Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-3 sm:p-4 bg-bg-app/40 min-h-0">
        <div
          data-no-swipe="true"
          onPointerMove={(e) => {
            if (!isPaintingRef.current) return;
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const idxAttr = el?.getAttribute('data-pixel-index');
            if (idxAttr !== null && idxAttr !== undefined) {
              const idx = Number(idxAttr);
              if (!Number.isNaN(idx)) paintAt(idx, false);
            }
          }}
          className="grid w-full max-w-[310px] sm:max-w-[384px] aspect-square touch-none bg-white dark:bg-[#19191c] border border-border shadow-medium rounded-lg overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            backgroundImage:
              'linear-gradient(45deg, rgba(0,0,0,0.03) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.03) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.03) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.03) 75%)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
          }}
        >
          {pixels.map((color, i) => (
            <div
              key={i}
              data-pixel-index={i}
              onPointerDown={(e) => {
                e.preventDefault();
                isPaintingRef.current = true;
                strokeSavedRef.current = false;
                paintAt(i, true);
              }}
              className={`w-full h-full cursor-crosshair transition-transform duration-75 hover:scale-[1.08] ${
                showGrid ? 'border-[0.5px] border-black/8 dark:border-white/10' : ''
              }`}
              style={{ backgroundColor: color ?? 'transparent' }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Palette & Export Bar */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-1.5 flex-wrap">
          {PALETTE.map((swatch) => (
            <button
              key={swatch}
              onClick={() => {
                playClick();
                setActiveColor(swatch);
                if (tool === 'eraser' || tool === 'eyedropper') setTool('pencil');
              }}
              aria-label={`Select color ${swatch}`}
              className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full border transition-transform touch-manipulation ${
                activeColor === swatch && tool !== 'eraser'
                  ? 'scale-115 ring-2 ring-primary ring-offset-2 ring-offset-surface border-text-main'
                  : 'border-black/20 hover:scale-105'
              }`}
              style={{ backgroundColor: swatch }}
            />
          ))}
          <label
            title="Custom color"
            className="w-7 h-7 sm:w-6 sm:h-6 rounded-full border border-border overflow-hidden cursor-pointer flex items-center justify-center bg-bg-app text-[11px] font-mono touch-manipulation"
          >
            <input
              type="color"
              value={activeColor}
              onChange={(e) => {
                setActiveColor(e.target.value);
                if (tool === 'eraser') setTool('pencil');
              }}
              className="opacity-0 w-0 h-0 absolute"
            />
            +
          </label>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center p-0.5 rounded-lg bg-bg-app border border-border text-[11px] font-mono tabular-nums">
            <button
              onClick={() => handleGridSizeChange(16)}
              className={`px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-md transition-colors touch-manipulation ${
                gridSize === 16 ? 'bg-surface text-text-main shadow-sm' : 'text-text-muted'
              }`}
            >
              16×16
            </button>
            <button
              onClick={() => handleGridSizeChange(32)}
              className={`px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-md transition-colors touch-manipulation ${
                gridSize === 32 ? 'bg-surface text-text-main shadow-sm' : 'text-text-muted'
              }`}
            >
              32×32
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              title="Download PNG"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-2.5 sm:py-1.5 min-h-[38px] sm:min-h-0 rounded-lg border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium whitespace-nowrap shrink-0 touch-manipulation"
            >
              <Download size={13} />
              <span>PNG</span>
            </button>

            {onPinToDesktop && (
              <button
                onClick={handlePin}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-3 sm:py-1.5 min-h-[38px] sm:min-h-0 rounded-lg bg-primary text-primary-on text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 touch-manipulation"
              >
                <Pin size={13} />
                <span>{pinnedFeedback ? 'Pinned!' : 'Pin Sticker'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixelArtCanvas;
