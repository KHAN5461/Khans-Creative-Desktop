import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FolderKanban,
  FileText,
  Code2,
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
  PenTool,
  Plus,
  Palette,
  RotateCcw,
  Sparkles,
  Columns2,
  Briefcase,
  Minimize2,
} from 'lucide-react';
import { PORTFOLIO_PROJECTS } from '../data/projects';
import { ThemeId, WindowId, WorkspacePreset } from '../types';
import { IconPixelGrid } from './Icons';
import { useSound } from '../contexts/SoundContext';

interface SpotlightAction {
  id: string;
  label: string;
  subtitle: string;
  group: 'Apps' | 'Releases' | 'Actions';
  icon: React.ReactNode;
  run: () => void;
}

interface SpotlightLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWindow: (id: WindowId) => void;
  onOpenProject: (projectId: string) => void;
  onApplyWorkspace: (preset: WorkspacePreset) => void;
  onToggleInk: () => void;
  onOpenNoteCreator: () => void;
  onSetTheme: (id: ThemeId) => void;
  onResetDesktop: () => void;
}

const SpotlightLauncher: React.FC<SpotlightLauncherProps> = ({
  isOpen,
  onClose,
  onOpenWindow,
  onOpenProject,
  onApplyWorkspace,
  onToggleInk,
  onOpenNoteCreator,
  onSetTheme,
  onResetDesktop,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playClick, playKey } = useSound();

  const allActions: SpotlightAction[] = useMemo(
    () => [
      {
        id: 'app-welcome',
        label: 'Welcome & Bio',
        subtitle: 'Release notes, stack overview & featured builds',
        group: 'Apps',
        icon: <Sparkles size={16} />,
        run: () => onOpenWindow('welcome'),
      },
      {
        id: 'app-projects',
        label: 'Projects Showcase',
        subtitle: 'Browse Featured Releases, Experiments & Open Source',
        group: 'Apps',
        icon: <FolderKanban size={16} />,
        run: () => onOpenWindow('projects'),
      },
      {
        id: 'app-resume',
        label: 'Resume / Dossier',
        subtitle: 'Experience, competencies & Print PDF',
        group: 'Apps',
        icon: <FileText size={16} />,
        run: () => onOpenWindow('resume'),
      },
      {
        id: 'app-pixel',
        label: 'Pixel Studio',
        subtitle: '16x16 & 32x32 editor with Pin Sticker',
        group: 'Apps',
        icon: <IconPixelGrid size={16} />,
        run: () => onOpenWindow('pixel'),
      },
      {
        id: 'app-code',
        label: 'Code Lab',
        subtitle: 'Interactive Spring & Canvas parameter sandbox',
        group: 'Apps',
        icon: <Code2 size={16} />,
        run: () => onOpenWindow('code'),
      },
      {
        id: 'app-terminal',
        label: 'Terminal (zsh)',
        subtitle: 'Interactive portfolio shell & easter eggs',
        group: 'Apps',
        icon: <TerminalIcon size={16} />,
        run: () => onOpenWindow('terminal'),
      },
      {
        id: 'app-settings',
        label: 'System Settings',
        subtitle: 'Material 3 Tonal Engine, Wallpapers & Sound',
        group: 'Apps',
        icon: <SettingsIcon size={16} />,
        run: () => onOpenWindow('settings'),
      },
      ...PORTFOLIO_PROJECTS.map((p) => ({
        id: `proj-${p.id}`,
        label: p.title,
        subtitle: `${p.category} · ${p.stack.slice(0, 3).join(', ')}`,
        group: 'Releases' as const,
        icon: <FolderKanban size={16} />,
        run: () => onOpenProject(p.id),
      })),
      {
        id: 'ws-showcase',
        label: 'Workspace: Showcase Split',
        subtitle: 'Snap Projects Showcase left + Live Code Lab right',
        group: 'Actions',
        icon: <Columns2 size={16} />,
        run: () => onApplyWorkspace('showcase-split'),
      },
      {
        id: 'ws-recruiter',
        label: 'Workspace: Recruiter Mode',
        subtitle: 'Snap Bio & Release Notes left + Resume Dossier right',
        group: 'Actions',
        icon: <Briefcase size={16} />,
        run: () => onApplyWorkspace('recruiter-mode'),
      },
      {
        id: 'ws-clean',
        label: 'Workspace: Clean Desk',
        subtitle: 'Minimize all windows to view stickers and ink canvas',
        group: 'Actions',
        icon: <Minimize2 size={16} />,
        run: () => onApplyWorkspace('clean-desk'),
      },
      {
        id: 'act-note',
        label: 'New Note or Stamp',
        subtitle: 'Pin a custom sticky note or visitor stamp to the desktop',
        group: 'Actions',
        icon: <Plus size={16} />,
        run: onOpenNoteCreator,
      },
      {
        id: 'act-ink',
        label: 'Toggle Desktop Ink',
        subtitle: 'Draw freely across the wallpaper and export PNG',
        group: 'Actions',
        icon: <PenTool size={16} />,
        run: onToggleInk,
      },
      {
        id: 'act-theme-dark',
        label: 'Theme: Focus Dark',
        subtitle: 'Switch Material tonal palette to dark mode',
        group: 'Actions',
        icon: <Palette size={16} />,
        run: () => onSetTheme('dark'),
      },
      {
        id: 'act-theme-warm',
        label: 'Theme: Warm & Cozy',
        subtitle: 'Switch Material tonal palette to warm paper',
        group: 'Actions',
        icon: <Palette size={16} />,
        run: () => onSetTheme('warm'),
      },
      {
        id: 'act-theme-dev',
        label: 'Theme: Cyber Dev',
        subtitle: 'Switch Material tonal palette to terminal green',
        group: 'Actions',
        icon: <Palette size={16} />,
        run: () => onSetTheme('dev'),
      },
      {
        id: 'act-reset',
        label: 'Reset Desktop Layout',
        subtitle: 'Restore default stickers and notes',
        group: 'Actions',
        icon: <RotateCcw size={16} />,
        run: onResetDesktop,
      },
    ],
    [onOpenWindow, onOpenProject, onApplyWorkspace, onToggleInk, onOpenNoteCreator, onSetTheme, onResetDesktop]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allActions.slice(0, 10);

    return allActions.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [query, allActions]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const executeItem = (item: SpotlightAction) => {
    playClick();
    item.run();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      executeItem(filtered[activeIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[130] bg-black/30 backdrop-blur-[3px] flex items-start justify-center pt-[6vh] sm:pt-[12vh] px-3 sm:px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 440, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className="w-full max-w-xl rounded-2xl bg-surface border border-border shadow-hard overflow-hidden text-text-main"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-bg-app/50">
              <Search size={18} className="text-text-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  playKey();
                  setQuery(e.target.value);
                }}
                placeholder="Jump to apps, releases, themes, or OS actions..."
                className="flex-1 bg-transparent border-none outline-none text-base sm:text-sm text-text-main placeholder:text-text-muted"
              />
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-mono px-2 py-1 rounded-md border border-border text-text-muted hover:text-text-main sm:pointer-events-none"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[54dvh] sm:max-h-[52vh] overflow-y-auto overscroll-contain p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-xs text-text-muted">
                  No matching apps, releases, or actions found.
                </div>
              ) : (
                filtered.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[52px] sm:min-h-0 rounded-xl text-left transition-colors touch-manipulation ${
                      idx === activeIndex
                        ? 'bg-primary-container/35 text-text-main'
                        : 'hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60'
                    }`}
                  >
                    <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg border border-border bg-bg-app flex items-center justify-center shrink-0 text-text-main">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.label}</div>
                      <div className="text-xs text-text-muted truncate">{item.subtitle}</div>
                    </div>
                    <span className="text-[11px] font-mono text-text-muted shrink-0">
                      {item.group}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpotlightLauncher;
