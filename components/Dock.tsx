import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { DockItemData, ToyMode } from '../types';
import Clock from './Clock';
import { useSound } from '../contexts/SoundContext';

interface DockProps {
  items: DockItemData[];
  isInkMode: boolean;
  onToggleInkMode: () => void;
  toyMode: ToyMode;
  onCycleToyMode: () => void;
  onOpenSpotlight: () => void;
  onOpenResume: () => void;
}

const MenuIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <div className="relative h-[20px] w-[20px] flex items-center justify-center">
    <motion.div
      initial={false}
      animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1, rotate: isOpen ? 180 : 0 }}
      className="absolute inset-0 rounded-full border-[2.6px] border-text-main box-border"
    />
    <motion.div
      initial={false}
      animate={{ scale: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0, rotate: isOpen ? 0 : -180 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <X size={18} className="text-text-main" strokeWidth={2.6} />
    </motion.div>
  </div>
);

const Drawer: React.FC<{ isOpen: boolean; items: DockItemData[]; onClose: () => void }> = ({
  isOpen,
  items,
  onClose,
}) => {
  const { playClick } = useSound();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-[84] pointer-events-auto bg-transparent"
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed bottom-[78px] md:bottom-[88px] left-2.5 md:left-8 z-[90] bg-surface border border-border shadow-hard rounded-2xl p-3.5 sm:p-4 grid grid-cols-3 gap-2 sm:gap-2.5 w-[304px] max-w-[calc(100vw-20px)] pointer-events-auto cursor-default"
          >
            {items.map((item) => {
              if (item.href) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      playClick();
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 p-2 min-h-[70px] rounded-xl hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60 transition-colors touch-manipulation"
                  >
                    <div className="flex items-center justify-center h-11 w-11 rounded-full border border-border bg-bg-app text-text-main">
                      {item.icon}
                    </div>
                    {item.label && (
                      <span className="text-[11px] font-medium text-text-main whitespace-nowrap truncate max-w-full">
                        {item.label}
                      </span>
                    )}
                  </a>
                );
              }

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    playClick();
                    item.onClick?.();
                    onClose();
                  }}
                  className="relative flex flex-col items-center justify-center gap-1.5 p-2 min-h-[70px] rounded-xl hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60 transition-colors touch-manipulation"
                >
                  <div className="flex items-center justify-center h-11 w-11 rounded-full border border-border bg-bg-app text-text-main">
                    {item.icon}
                  </div>
                  {item.label && (
                    <span className="text-[11px] font-medium text-text-main whitespace-nowrap truncate max-w-full">
                      {item.label}
                    </span>
                  )}
                  {item.isActive && (
                    <span
                      className={`h-1 rounded-full ${
                        item.isMinimized ? 'w-1.5 bg-text-muted' : 'w-3 bg-primary'
                      }`}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Dock: React.FC<DockProps> = ({
  items,
  isInkMode,
  onToggleInkMode,
  toyMode,
  onCycleToyMode,
  onOpenSpotlight,
  onOpenResume,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { playClick } = useSound();

  React.useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  const desktopPinnedIds = [
    'welcome',
    'folder',
    'resume',
    'pixel',
    'code-brackets',
    'terminal',
    'settings',
  ];
  const mobilePinnedIds = ['welcome', 'resume', 'github'];

  const desktopItems = items.filter((item) => desktopPinnedIds.includes(item.id));
  const mobileItems = mobilePinnedIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is DockItemData => Boolean(item));
  const drawerItems = items.filter((item) => item.type !== 'separator');

  return (
    <>
      <Drawer
        isOpen={isMenuOpen}
        items={drawerItems}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="fixed bottom-2 md:bottom-3 left-0 right-0 flex justify-center px-2.5 md:px-6 z-[80] pointer-events-none">
        {/* FydeOS Floating Shelf */}
        <div
          className="
            relative pointer-events-auto flex items-center justify-between gap-2
            w-full max-w-5xl h-[60px] md:h-[62px]
            rounded-[28px]
            px-2.5 md:px-4
          "
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-[28px] border border-border bg-surface/95 backdrop-blur-md shadow-hard pointer-events-none"
          />
        {/* Left: App Launcher + Spotlight Search */}
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              playClick();
              setIsMenuOpen((p) => !p);
            }}
            aria-label="Toggle App Launcher"
            title="App Launcher"
            className="flex h-[44px] w-[44px] md:h-[40px] md:w-[40px] items-center justify-center rounded-full border border-border bg-bg-app text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10 transition-colors touch-manipulation"
          >
            <MenuIcon isOpen={isMenuOpen} />
          </motion.button>

          <button
            onClick={() => {
              playClick();
              onOpenSpotlight();
            }}
            title="Spotlight Search (⌘K / Ctrl+K)"
            className="hidden lg:inline-flex items-center gap-2 h-[40px] px-3 rounded-full border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs text-text-muted hover:text-text-main transition-colors whitespace-nowrap shrink-0"
          >
            <Search size={13} />
            <span>Search</span>
            <kbd className="font-mono text-[10px] px-1 py-0.5 rounded border border-border bg-surface text-text-muted">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Center: Pinned Apps (Desktop) */}
        <div className="hidden md:flex items-center gap-2 flex-1 justify-center h-full">
          {desktopItems.map((item) => {
            const hasWindowPeek = Boolean(item.isActive && item.windowId);
            return (
              <div
                key={item.id}
                className="relative flex flex-col items-center justify-center"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId((curr) => (curr === item.id ? null : curr))}
              >
                <AnimatePresence>
                  {hoveredId === item.id && item.label && (
                    hasWindowPeek ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 440, damping: 28 }}
                        className="absolute bottom-[54px] w-52 rounded-2xl bg-surface/95 backdrop-blur-md border border-border shadow-hard p-2.5 text-text-main pointer-events-auto z-[82]"
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/70">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                item.isMinimized ? 'bg-text-muted' : 'bg-primary'
                              }`}
                            />
                            <span className="text-xs font-semibold truncate">{item.label}</span>
                          </div>
                          {item.onCloseWindow && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playClick();
                                item.onCloseWindow?.();
                                setHoveredId(null);
                              }}
                              aria-label={`Close ${item.label}`}
                              title="Close window"
                              className="w-5 h-5 rounded-full flex items-center justify-center text-text-muted hover:text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10 transition-colors shrink-0"
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            playClick();
                            item.onClick?.();
                            setHoveredId(null);
                          }}
                          className="mt-2 w-full rounded-xl border border-border bg-bg-app/80 hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60 p-2.5 text-left transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                              {item.isMinimized ? 'Minimized' : 'Active'}
                            </span>
                            <span className="text-[10px] font-mono text-primary">
                              {item.isMinimized ? 'Restore' : 'Focus'}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-text-main truncate">
                            {item.previewSubtitle || item.label}
                          </div>
                          <div className="flex gap-1 pt-0.5 opacity-60">
                            <span className="h-1 flex-1 rounded-full bg-primary/50" />
                            <span className="h-1 w-8 rounded-full bg-border" />
                          </div>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.92 }}
                        transition={{ duration: 0.12 }}
                        className="absolute -top-10 px-2.5 py-1 rounded-lg bg-surface border border-border shadow-medium text-[11px] font-medium text-text-main whitespace-nowrap pointer-events-none"
                      >
                        {item.label}
                      </motion.div>
                    )
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.14, y: -5 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                  onClick={() => {
                    playClick();
                    item.onClick?.();
                  }}
                  aria-label={item.label}
                  className={`relative flex shrink-0 items-center justify-center border h-[42px] w-[42px] rounded-full transition-colors ${
                    item.isActive
                      ? 'border-primary bg-primary-container/35 text-text-main'
                      : 'border-border bg-bg-app text-text-main hover:bg-neutral-90/70 dark:hover:bg-neutral-10/70'
                  }`}
                >
                  {item.icon}
                </motion.button>

                <div className="h-1 flex items-center justify-center mt-0.5">
                  {item.isActive && (
                    <span
                      className={`h-[3px] rounded-full transition-all ${
                        item.isMinimized ? 'w-1.5 bg-text-muted' : 'w-3.5 bg-primary'
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center: Pinned Apps (Mobile — Profile, Resume, GitHub only, >=44px touch targets) */}
        <div className="flex md:hidden items-center gap-2.5 sm:gap-4 flex-1 justify-center min-w-0">
          {mobileItems.map((item) =>
            item.href ? (
              <motion.a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.92 }}
                onClick={() => playClick()}
                aria-label={item.label}
                title={item.label}
                className="relative flex shrink-0 items-center justify-center border border-border bg-bg-app text-text-main h-[44px] w-[44px] rounded-full touch-manipulation"
              >
                {item.icon}
              </motion.a>
            ) : (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  playClick();
                  item.onClick?.();
                }}
                aria-label={item.label}
                title={item.label}
                className={`relative flex shrink-0 items-center justify-center border h-[44px] w-[44px] rounded-full touch-manipulation ${
                  item.isActive
                    ? 'border-primary bg-primary-container/35'
                    : 'border-border bg-bg-app'
                } text-text-main`}
              >
                {item.icon}
                {item.isActive && (
                  <span
                    className={`absolute -bottom-1.5 h-[3px] rounded-full ${
                      item.isMinimized ? 'w-1.5 bg-text-muted' : 'w-3.5 bg-primary'
                    }`}
                  />
                )}
              </motion.button>
            )
          )}
        </div>

        {/* Right: System Status Tray */}
        <Clock
          isInkMode={isInkMode}
          onToggleInkMode={onToggleInkMode}
          toyMode={toyMode}
          onCycleToyMode={onCycleToyMode}
          onOpenResume={onOpenResume}
        />
        </div>
      </div>
    </>
  );
};

export default Dock;
