import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Mail, Copy, Check, ExternalLink, Settings, Sun, Moon, ChevronRight } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';
import { useTheme } from '../theme/ThemeContext';
import { ToyMode } from '../types';

interface ClockProps {
  isInkMode: boolean;
  onToggleInkMode: () => void;
  toyMode: ToyMode;
  onCycleToyMode: () => void;
  onOpenResume: () => void;
  onOpenSettings: () => void;
}

const Clock: React.FC<ClockProps> = ({
  isInkMode,
  onToggleInkMode,
  toyMode,
  onCycleToyMode,
  onOpenResume,
  onOpenSettings,
}) => {
  const [time, setTime] = useState(new Date());
  const [activePopover, setActivePopover] = useState<'none' | 'tray' | 'hire'>('none');
  const [copied, setCopied] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);
  const { soundEnabled, toggleSound, playClick, playSnap } = useSound();
  const { theme, toggleDarkMode } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onOutsideClick = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setActivePopover('none');
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePopover('none');
    };
    if (activePopover !== 'none') {
      window.addEventListener('mousedown', onOutsideClick);
      window.addEventListener('keydown', onKeyDown);
    }
    return () => {
      window.removeEventListener('mousedown', onOutsideClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activePopover]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const formatDate = (date: Date) =>
    date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const handleCopyEmail = () => {
    playSnap();
    navigator.clipboard?.writeText('khanhassan5451@gmail.com').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1900);
  };

  return (
    <div ref={trayRef} className="relative flex items-center gap-1.5 shrink-0">
      {/* Copy Confirmation Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 440, damping: 28 }}
            className="fixed bottom-[78px] md:bottom-[88px] right-2.5 md:right-8 z-[95] pointer-events-none inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary text-primary-on shadow-hard text-xs font-semibold"
          >
            <Check size={13} />
            <span>Copied khanhassan5451@gmail.com</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Tray / Hire Popover */}
      <AnimatePresence>
        {activePopover === 'tray' && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed bottom-[78px] md:bottom-[88px] right-2.5 md:right-8 z-[90] w-72 max-w-[calc(100vw-20px)] rounded-2xl bg-surface border border-border shadow-hard p-4 space-y-3.5 text-text-main pointer-events-auto"
          >
            <div className="flex items-baseline justify-between border-b border-border pb-2.5">
              <div>
                <div className="text-lg font-bold tabular-nums leading-none">
                  {time.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })}
                </div>
                <div className="text-xs text-text-muted mt-1">{formatDate(time)}</div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Open to Roles
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleSound}
                className={`flex items-center gap-2 px-3 py-2.5 md:py-2 rounded-xl border text-xs font-medium transition-colors touch-manipulation ${
                  soundEnabled
                    ? 'border-primary bg-primary-container/25 text-text-main'
                    : 'border-border bg-bg-app text-text-muted'
                }`}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span>{soundEnabled ? 'SFX On' : 'Muted'}</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  onToggleInkMode();
                  setActivePopover('none');
                }}
                className={`flex items-center justify-center px-3 py-2.5 md:py-2 rounded-xl border text-xs font-medium transition-colors touch-manipulation ${
                  isInkMode
                    ? 'border-primary bg-primary-container/25 text-text-main'
                    : 'border-border bg-bg-app text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10'
                }`}
              >
                {isInkMode ? 'Exit Ink' : 'Desktop Ink'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  playClick();
                  toggleDarkMode();
                }}
                className="flex items-center justify-between px-3 py-2.5 md:py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium transition-colors touch-manipulation"
              >
                <span>{theme.isDark ? 'Dark' : 'Light'}</span>
                {theme.isDark ? <Moon size={13} className="text-primary" /> : <Sun size={13} className="text-primary" />}
              </button>

              <button
                onClick={() => {
                  playClick();
                  onCycleToyMode();
                }}
                className="flex items-center justify-between px-3 py-2.5 md:py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium transition-colors touch-manipulation"
              >
                <span>Cursor</span>
                <span className="font-mono text-[11px] text-text-muted capitalize">
                  {toyMode === 'trail' ? 'Trail' : 'Std'}
                </span>
              </button>
            </div>

            <button
              onClick={() => {
                playClick();
                setActivePopover('none');
                onOpenSettings();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 md:py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium text-text-main transition-colors touch-manipulation"
            >
              <span className="inline-flex items-center gap-2">
                <Settings size={14} className="text-primary" />
                <span>Settings</span>
              </span>
              <ChevronRight size={14} className="text-text-muted" />
            </button>

            {/* Mobile Contact / Hire Quick Actions */}
            <div className="md:hidden pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-main">
                <span>Connect with Khan</span>
                <button
                  onClick={() => {
                    playClick();
                    setActivePopover('none');
                    onOpenResume();
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Open Resume
                </button>
              </div>
              <button
                onClick={handleCopyEmail}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-[11px] font-mono transition-colors touch-manipulation"
              >
                <span className="truncate">khanhassan5451@gmail.com</span>
                {copied ? <Check size={13} className="text-primary shrink-0" /> : <Copy size={13} className="shrink-0" />}
              </button>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href="https://github.com/KHAN5461"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 font-medium touch-manipulation"
                >
                  GitHub <ExternalLink size={11} />
                </a>
                <a
                  href="https://www.linkedin.com/in/khan-hassan-eng/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 font-medium touch-manipulation"
                >
                  LinkedIn <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {activePopover === 'hire' && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed bottom-[78px] md:bottom-[88px] right-2.5 md:right-8 z-[90] w-72 max-w-[calc(100vw-20px)] rounded-2xl bg-surface border border-border shadow-hard p-4 space-y-3 text-text-main pointer-events-auto"
          >
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open to Cloud · GenAI · SWE Roles
              </div>
              <div className="text-sm font-bold">Connect with Khan Hassan</div>
              <div className="text-xs text-text-muted">
                Computer Engineering · GCP, Backend &amp; Generative AI · Mumbai
              </div>
            </div>

            <button
              onClick={handleCopyEmail}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-mono transition-colors"
            >
              <span className="truncate">khanhassan5451@gmail.com</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-primary shrink-0">
                {copied ? (
                  <>
                    <Check size={13} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copy
                  </>
                )}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="https://github.com/KHAN5461"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 font-medium"
              >
                GitHub <ExternalLink size={11} />
              </a>
              <a
                href="https://www.linkedin.com/in/khan-hassan-eng/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 font-medium"
              >
                LinkedIn <ExternalLink size={11} />
              </a>
            </div>

            <button
              onClick={() => {
                playClick();
                setActivePopover('none');
                onOpenResume();
              }}
              className="w-full py-2 rounded-xl bg-primary text-primary-on text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Open Full Resume / Dossier
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sound Quick Mute (Desktop & Tablet Tray) */}
      <button
        onClick={toggleSound}
        title={soundEnabled ? 'Mute sound FX' : 'Unmute sound FX'}
        aria-label={soundEnabled ? 'Mute sound FX' : 'Unmute sound FX'}
        className="hidden sm:flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-full border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-text-main transition-colors touch-manipulation"
      >
        {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-text-muted" />}
      </button>

      {/* Contact / Hire Quick Card Trigger */}
      <button
        onClick={() => {
          playClick();
          setActivePopover((p) => (p === 'hire' ? 'none' : 'hire'));
        }}
        className={`hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
          activePopover === 'hire'
            ? 'border-primary bg-primary text-primary-on'
            : 'border-border bg-bg-app text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <Mail size={13} />
        <span>Hire</span>
      </button>

      {/* Tabular Clock + Status Tray Toggle */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          playClick();
          setActivePopover((p) => (p === 'tray' ? 'none' : 'tray'));
        }}
        title="System Status Tray & Settings"
        className={`flex flex-shrink-0 items-center justify-center border shadow-sm box-border h-[44px] min-w-[64px] px-3.5 md:h-[40px] md:min-w-0 md:px-4 rounded-full transition-colors cursor-pointer select-none touch-manipulation ${
          activePopover === 'tray'
            ? 'border-primary bg-primary-container/30 text-text-main'
            : 'border-border bg-bg-app text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10'
        }`}
      >
        <span className="font-sans tabular-nums text-[13px] md:text-sm font-semibold leading-none">
          {formatTime(time)}
        </span>
      </motion.button>
    </div>
  );
};

export default Clock;
