import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Rocket,
  Sparkles,
  Coffee,
  Zap,
  Terminal,
  Heart,
  StickyNote,
  Stamp,
} from 'lucide-react';
import { StampIconId, StickerTone, StickerVariant } from '../types';
import { useSound } from '../contexts/SoundContext';

interface StickerCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: {
    text: string;
    tone: StickerTone;
    variant: StickerVariant;
    rotation: number;
    stampIcon?: StampIconId;
  }) => void;
}

const TONES: { id: StickerTone; label: string; swatch: string }[] = [
  { id: 'surface', label: 'Paper', swatch: '#FFFFFF' },
  { id: 'amber', label: 'Butter', swatch: '#FFE484' },
  { id: 'mint', label: 'Sage', swatch: '#BFEFCC' },
  { id: 'lavender', label: 'Iris', swatch: '#D6CCFF' },
  { id: 'rose', label: 'Blush', swatch: '#FFC7D4' },
];

const QUICK_PROMPTS = [
  'ship-it-today',
  'craft > noise',
  'micro-magic',
  'coffee + canvas',
  'design systems',
];

const STAMPS: {
  id: StampIconId;
  label: string;
  caption: string;
  tone: StickerTone;
  icon: React.ReactNode;
}[] = [
  { id: 'rocket', label: 'Ship It', caption: 'SHIP IT · 2026', tone: 'amber', icon: <Rocket size={18} /> },
  { id: 'sparkles', label: 'Crafted', caption: 'HIGH CRAFT', tone: 'lavender', icon: <Sparkles size={18} /> },
  { id: 'zap', label: '60fps Lock', caption: '60FPS LOCK', tone: 'mint', icon: <Zap size={18} /> },
  { id: 'coffee', label: 'Fueled', caption: 'ESPRESSO OPS', tone: 'surface', icon: <Coffee size={18} /> },
  { id: 'terminal', label: 'Zero Bugs', caption: 'CLEAN BUILD', tone: 'mint', icon: <Terminal size={18} /> },
  { id: 'heart', label: 'Loved Desk', caption: 'LOVED IT', tone: 'rose', icon: <Heart size={18} /> },
];

const StickerCreatorModal: React.FC<StickerCreatorModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [mode, setMode] = useState<'note' | 'stamp'>('note');
  const [text, setText] = useState('');
  const [tone, setTone] = useState<StickerTone>('amber');
  const [variant, setVariant] = useState<StickerVariant>('default');
  const [rotation, setRotation] = useState<number>(-2);
  const [selectedStamp, setSelectedStamp] = useState<StampIconId>('rocket');
  const [stampCaption, setStampCaption] = useState('SHIP IT · 2026');
  const { playClick, playStick } = useSound();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'stamp') {
      const preset = STAMPS.find((s) => s.id === selectedStamp) || STAMPS[0];
      onCreate({
        text: stampCaption.trim() || preset.caption,
        tone,
        variant: 'stamp',
        rotation,
        stampIcon: selectedStamp,
      });
      playStick();
      onClose();
      return;
    }

    const finalText = text.trim() || 'new-idea';
    onCreate({ text: finalText, tone, variant, rotation });
    playStick();
    setText('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] bg-black/25 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-2.5 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[88dvh] flex flex-col rounded-2xl bg-surface border border-border shadow-hard overflow-hidden text-text-main"
          >
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-neutral-90/60 dark:bg-neutral-10/60 shrink-0">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-bg-app border border-border">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setMode('note');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium transition-colors touch-manipulation ${
                    mode === 'note'
                      ? 'bg-surface text-text-main shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <StickyNote size={12} />
                  Write Note
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setMode('stamp');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium transition-colors touch-manipulation ${
                    mode === 'stamp'
                      ? 'bg-surface text-text-main shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Stamp size={12} />
                  Drop a Stamp
                </button>
              </div>
              <button
                onClick={onClose}
                aria-label="Close note creator"
                className="w-9 h-9 sm:w-7 sm:h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 touch-manipulation"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto overscroll-contain">
              {mode === 'note' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      Note Label
                    </label>
                    <input
                      autoFocus={typeof window !== 'undefined' && window.innerWidth >= 768}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={42}
                      placeholder="Write a phrase, reminder, or tag..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bg-app border border-border text-base sm:text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {QUICK_PROMPTS.map((chip) => (
                        <button
                          type="button"
                          key={chip}
                          onClick={() => {
                            playClick();
                            setText(chip);
                          }}
                          className="text-[11px] font-mono px-2 py-1 rounded-md border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <span className="block text-xs font-medium text-text-muted mb-2">
                      Choose Visitor Stamp
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {STAMPS.map((st) => (
                        <button
                          type="button"
                          key={st.id}
                          onClick={() => {
                            playClick();
                            setSelectedStamp(st.id);
                            setStampCaption(st.caption);
                            setTone(st.tone);
                          }}
                          className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs transition-all ${
                            selectedStamp === st.id
                              ? 'border-primary bg-primary-container/25 text-text-main shadow-sm'
                              : 'border-border bg-bg-app text-text-muted hover:text-text-main'
                          }`}
                        >
                          <div className="text-primary">{st.icon}</div>
                          <span className="font-medium text-[11px]">{st.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      Stamp Caption
                    </label>
                    <input
                      value={stampCaption}
                      onChange={(e) => setStampCaption(e.target.value)}
                      maxLength={24}
                      placeholder="SHIP IT · 2026"
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-app border border-border text-base sm:text-xs font-mono uppercase tracking-wider text-text-main outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              <div className={`grid ${mode === 'note' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div>
                  <span className="block text-xs font-medium text-text-muted mb-2">Paper Tone</span>
                  <div className="flex items-center gap-2">
                    {TONES.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => {
                          playClick();
                          setTone(t.id);
                        }}
                        title={t.label}
                        className={`w-7 h-7 rounded-full border transition-transform ${
                          tone === t.id
                            ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface border-text-main'
                            : 'border-black/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: t.swatch }}
                      />
                    ))}
                  </div>
                </div>

                {mode === 'note' && (
                  <div>
                    <span className="block text-xs font-medium text-text-muted mb-2">Style</span>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-app border border-border">
                      {(
                        [
                          { id: 'default', label: 'Sans' },
                          { id: 'highlight', label: 'Serif' },
                          { id: 'error', label: 'Alert' },
                        ] as const
                      ).map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => {
                            playClick();
                            setVariant(opt.id);
                          }}
                          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                            variant === opt.id
                              ? 'bg-surface text-text-main shadow-sm'
                              : 'text-text-muted hover:text-text-main'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {(mode === 'stamp' || variant !== 'error') && (
                <div>
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Tilt Angle</span>
                    <span className="font-mono tabular-nums">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={-8}
                    max={8}
                    step={0.5}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-medium text-text-muted hover:text-text-main touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-semibold bg-primary text-primary-on hover:opacity-90 transition-opacity touch-manipulation"
                >
                  <Plus size={14} />
                  {mode === 'stamp' ? 'Stamp Desktop' : 'Pin to Desktop'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickerCreatorModal;
