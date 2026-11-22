import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../contexts/SoundContext';

export interface ContextMenuQuickAction {
  label: string;
  title?: string;
  icon: React.ReactNode;
  action: () => void;
  active?: boolean;
}

export interface ContextMenuItem {
  label: string;
  action?: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  separator?: boolean;
}

interface ContextMenuProps {
  children: React.ReactNode;
  quickActions?: ContextMenuQuickAction[];
  items: ContextMenuItem[];
  disabled?: boolean;
}

const BLOCKED_CONTEXT_SELECTOR = [
  '[data-no-context-menu="true"]',
  '[data-pong-dock="true"]',
  '[data-pong-menu-btn="true"]',
  '[data-pong-mobile-top="true"]',
  '[data-pong-search-pill="true"]',
  '[data-pong-note-pill="true"]',
  '[data-pong-window]',
  '[data-pong-sticker]',
  'button',
  'a',
  'input',
  'textarea',
  'select',
].join(', ');

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  quickActions = [],
  items,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const { playClick } = useSound();

  useEffect(() => {
    if (disabled && isVisible) {
      setIsVisible(false);
    }
  }, [disabled, isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setIsVisible(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVisible(false);
    };
    const handleScroll = () => setIsVisible(false);

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { capture: true });
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isVisible]);

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;

    // Never hijack right-click or long-press on Dock, Menu button, Top Bar, Windows, Stickers, or controls
    if (disabled || target?.closest(BLOCKED_CONTEXT_SELECTOR)) {
      if (isVisible) setIsVisible(false);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 224;
    const quickBarHeight = quickActions.length > 0 ? 52 : 0;
    const menuHeight =
      quickBarHeight +
      items.reduce((acc, item) => acc + (item.separator ? 11 : 34), 16);

    const x = Math.max(12, Math.min(e.clientX, window.innerWidth - menuWidth - 12));
    const y = Math.max(12, Math.min(e.clientY, window.innerHeight - menuHeight - 12));

    setPosition({ x, y });
    setIsVisible(true);
  };

  return (
    <div onContextMenu={handleContextMenu} className="h-full w-full">
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={menuRef}
            data-no-context-menu="true"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -2 }}
            transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-[92] w-[224px] bg-surface/95 backdrop-blur-xl border border-border shadow-hard rounded-xl overflow-hidden py-1.5 cursor-default select-none"
            style={{ top: position.y, left: position.x }}
          >
            {/* Windows 11-Style Top Quick Action Strip */}
            {quickActions.length > 0 && (
              <>
                <div className="flex items-center gap-1 px-1.5 pb-1">
                  {quickActions.map((qa, idx) => (
                    <button
                      type="button"
                      key={`${qa.label}-${idx}`}
                      title={qa.title || qa.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        playClick();
                        qa.action();
                        setIsVisible(false);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-lg text-[12px] font-medium transition-colors ${
                        qa.active
                          ? 'bg-primary-container/40 text-primary border border-primary/35'
                          : 'text-text-main hover:bg-neutral-90/70 dark:hover:bg-neutral-10/70 active:bg-neutral-90 dark:active:bg-neutral-10'
                      }`}
                    >
                      <span className="shrink-0 opacity-85">{qa.icon}</span>
                      <span className="truncate">{qa.label}</span>
                    </button>
                  ))}
                </div>
                <div className="h-px bg-border my-1 mx-2 opacity-60" />
              </>
            )}

            {/* Clean Action List */}
            {items.map((item, index) => {
              if (item.separator) {
                return (
                  <div
                    key={`sep-${index}`}
                    className="h-px bg-border my-1.5 mx-2 opacity-60"
                  />
                );
              }

              return (
                <button
                  type="button"
                  key={`${item.label}-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    playClick();
                    item.action?.();
                    setIsVisible(false);
                  }}
                  className="w-[calc(100%-10px)] flex items-center gap-2.5 px-2.5 py-1.5 mx-[5px] rounded-lg text-left text-text-main hover:bg-neutral-90/70 dark:hover:bg-neutral-10/70 active:bg-neutral-90 dark:active:bg-neutral-10 transition-colors"
                >
                  {item.icon && <span className="opacity-75 shrink-0">{item.icon}</span>}
                  <span className="flex-1 font-medium text-[12.5px] leading-tight truncate">
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <span className="text-[10px] opacity-50 font-mono ml-2 shrink-0">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
