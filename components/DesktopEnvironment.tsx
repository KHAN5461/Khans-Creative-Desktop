import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  PenTool,
  FileText,
  Search,
  User,
  Columns2,
  Briefcase,
  Minimize2,
} from 'lucide-react';
import Sticker from './Sticker';
import StickerCreatorModal from './StickerCreatorModal';
import BootOverlay from './BootOverlay';
import Dock from './Dock';
import DraggableWindow from './DraggableWindow';
import WelcomeWindow from './WelcomeWindow';
import FileExplorer from './FileExplorer';
import ResumeWindow from './ResumeWindow';
import Terminal from './Terminal';
import CodePlayground, { CodePresetId } from './CodePlayground';
import PixelArtCanvas from './PixelArtCanvas';
import ScribbleCanvas from './ScribbleCanvas';
import { PORTFOLIO_PROJECTS } from '../data/projects';
import Settings from './Settings';
import DesktopToyLayer from './DesktopToyLayer';
import SpotlightLauncher from './SpotlightLauncher';
import { ContextMenu } from './ContextMenu';
import { useTheme } from '../theme/ThemeContext';
import { useSound } from '../contexts/SoundContext';
import {
  StampIconId,
  StickerData,
  StickerTone,
  StickerVariant,
  DockItemData,
  WindowId,
  WindowState,
  SnapSide,
  WorkspacePreset,
  ToyMode,
  ThemeId,
} from '../types';
import { themes } from '../theme/themes';
import {
  IconCodeBracket,
  IconFolder,
  IconLinkedIn,
  IconGithub,
  IconTerminal,
  IconApps,
  IconRefresh,
  IconPlus,
  IconPalette,
  IconMonitor,
  IconPixelGrid,
} from './Icons';

const INITIAL_STICKERS: StickerData[] = [
  { id: '1', text: "hi-i'm-khan", rotation: -1.7, left: '6%', top: '8%', tone: 'amber' },
  { id: '2', text: 'pixel-perfect', rotation: 1.4, left: '72%', top: '10%', tone: 'surface' },
  { id: '3', text: 'design-systems', rotation: -1.1, left: '80%', top: '26%', tone: 'mint' },
  { id: '4', text: 'logic-with-soul', rotation: -1.4, left: '6%', top: '24%', variant: 'highlight', tone: 'amber' },
  { id: '5', text: 'creative-dev', rotation: 2.1, left: '75%', top: '42%', tone: 'lavender' },
  { id: '6', text: 'ui-ux-craft', rotation: -2.2, left: '8%', top: '42%', tone: 'rose' },
];

const WINDOW_Z_BASE = 30;

const INITIAL_WINDOWS: Record<WindowId, WindowState> = {
  welcome: {
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    snapSide: null,
    zIndex: 36,
    position: { x: 0, y: -12 },
    size: { width: 660, height: 500 },
  },
  projects: {
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    snapSide: null,
    zIndex: 30,
    position: { x: -30, y: -15 },
    size: { width: 700, height: 540 },
  },
  resume: {
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    snapSide: null,
    zIndex: 31,
    position: { x: 25, y: -5 },
    size: { width: 660, height: 540 },
  },
  pixel: {
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    snapSide: null,
    zIndex: 32,
    position: { x: 20, y: -10 },
    size: { width: 620, height: 540 },
  },
  code: {
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    snapSide: null,
    zIndex: 33,
    position: { x: 0, y: 0 },
    size: { width: 700, height: 490 },
  },
  terminal: {
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    snapSide: null,
    zIndex: 34,
    position: { x: 35, y: 20 },
    size: { width: 580, height: 430 },
  },
  settings: {
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    snapSide: null,
    zIndex: 35,
    position: { x: -20, y: 15 },
    size: { width: 620, height: 500 },
  },
};

const normalizeWindowZ = (
  wins: Record<WindowId, WindowState>,
  frontOrder: WindowId[] = []
): Record<WindowId, WindowState> => {
  const rest = (Object.keys(wins) as WindowId[])
    .filter((id) => !frontOrder.includes(id))
    .sort((a, b) => wins[a].zIndex - wins[b].zIndex);
  const ordered = [...rest, ...frontOrder];
  const next = { ...wins };
  ordered.forEach((id, idx) => {
    next[id] = { ...next[id], zIndex: WINDOW_Z_BASE + idx };
  });
  return next;
};

const TONE_CYCLE: StickerTone[] = ['surface', 'amber', 'mint', 'lavender', 'rose'];

const DesktopEnvironment: React.FC = () => {
  const [stickers, setStickers] = useState<StickerData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('khan-desktop-stickers');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_STICKERS;
  });

  const [windows, setWindows] = useState<Record<WindowId, WindowState>>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      const projectParam = params.get('project');
      const appParam = params.get('app') as WindowId | null;
      if (projectParam && PORTFOLIO_PROJECTS.some((p) => p.id === projectParam)) {
        return normalizeWindowZ(
          {
            ...INITIAL_WINDOWS,
            welcome: { ...INITIAL_WINDOWS.welcome, isOpen: false },
            projects: { ...INITIAL_WINDOWS.projects, isOpen: true, isMinimized: false },
          },
          ['projects']
        );
      }
      if (appParam && appParam in INITIAL_WINDOWS) {
        return normalizeWindowZ(
          {
            ...INITIAL_WINDOWS,
            welcome: { ...INITIAL_WINDOWS.welcome, isOpen: appParam === 'welcome' },
            [appParam]: { ...INITIAL_WINDOWS[appParam], isOpen: true, isMinimized: false },
          },
          [appParam]
        );
      }
    }
    return INITIAL_WINDOWS;
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const projectParam = params.get('project');
      if (projectParam && PORTFOLIO_PROJECTS.some((p) => p.id === projectParam)) {
        return projectParam;
      }
    }
    return null;
  });
  const [codePreset, setCodePreset] = useState<CodePresetId>('spring-card');
  const [snapPreview, setSnapPreview] = useState<SnapSide>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isInkMode, setIsInkMode] = useState(false);
  const [toyMode, setToyMode] = useState<ToyMode>('default');
  const [showMobileStickers, setShowMobileStickers] = useState(false);

  const { themeId, setTheme, wallpaper } = useTheme();
  const { soundEnabled, setSoundEnabled, playOpen, playClick, playStick, playSnap, playMinimize } =
    useSound();
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Determine top-most visible focused window
  const focusedWindowId = React.useMemo<WindowId | null>(() => {
    let topId: WindowId | null = null;
    let topZ = -1;
    (Object.keys(windows) as WindowId[]).forEach((id) => {
      const w = windows[id];
      if (w.isOpen && !w.isMinimized && w.zIndex > topZ) {
        topZ = w.zIndex;
        topId = id;
      }
    });
    return topId;
  }, [windows]);

  // Keep URL hash synced with focused app or active project
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let nextHash = '';
    if (focusedWindowId === 'projects' && selectedProjectId) {
      nextHash = `#project=${encodeURIComponent(selectedProjectId)}`;
    } else if (focusedWindowId && focusedWindowId !== 'welcome') {
      nextHash = `#app=${focusedWindowId}`;
    }
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash || window.location.pathname + window.location.search);
    }
  }, [focusedWindowId, selectedProjectId]);

  useEffect(() => {
    try {
      localStorage.setItem('khan-desktop-stickers', JSON.stringify(stickers));
    } catch {
      // ignore
    }
  }, [stickers]);

  // Global Cmd/Ctrl + K Spotlight shortcut & Escape dismiss
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playClick();
        setIsSpotlightOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isCreatorOpen) setIsCreatorOpen(false);
        else if (isInkMode) setIsInkMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playClick, isCreatorOpen, isInkMode]);

  const resetDesktop = useCallback(() => {
    playClick();
    setStickers(INITIAL_STICKERS);
  }, [playClick]);

  const addSticker = (payload: {
    text: string;
    tone?: StickerTone;
    variant?: StickerVariant;
    rotation?: number;
    imageUrl?: string;
    stampIcon?: StampIconId;
  }) => {
    const id = `stk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const top = `${16 + Math.random() * 44}%`;
    const left = `${14 + Math.random() * 54}%`;
    setStickers((prev) => [
      ...prev,
      {
        id,
        text: payload.text,
        rotation: payload.rotation ?? Math.round((Math.random() * 8 - 4) * 10) / 10,
        top,
        left,
        variant: payload.variant ?? 'default',
        tone: payload.tone ?? 'surface',
        imageUrl: payload.imageUrl,
        stampIcon: payload.stampIcon,
      },
    ]);
  };

  const handleNextTheme = () => {
    playClick();
    const themeKeys = Object.keys(themes) as ThemeId[];
    const currentIndex = themeKeys.indexOf(themeId);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setTheme(themeKeys[nextIndex]);
  };

  const cycleToyMode = () => {
    setToyMode((prev) => (prev === 'default' ? 'trail' : 'default'));
  };

  const handleCloseSticker = (id: string) =>
    setStickers((prev) => prev.filter((s) => s.id !== id));

  const handleInteractSticker = (id: string) => {
    setStickers((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index === -1 || index === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.push(item);
      return next;
    });
  };

  const focusWindow = (id: WindowId) => {
    setWindows((prev) => {
      const current = prev[id];
      const maxZ = Math.max(...(Object.values(prev) as WindowState[]).map((w) => w.zIndex));
      if (current.zIndex === maxZ && !current.isMinimized) return prev;
      return normalizeWindowZ(
        {
          ...prev,
          [id]: { ...current, isMinimized: false },
        },
        [id]
      );
    });
  };

  const openWindowExplicit = useCallback(
    (id: WindowId) => {
      playOpen();
      const isNarrow = typeof window !== 'undefined' && window.innerWidth < 768;
      if (isNarrow) setShowMobileStickers(false);
      setWindows((prev) => {
        const next = { ...prev };
        if (isNarrow) {
          (Object.keys(next) as WindowId[]).forEach((k) => {
            if (k !== id && next[k].isOpen) {
              next[k] = { ...next[k], isMinimized: true };
            }
          });
        }
        next[id] = { ...next[id], isOpen: true, isMinimized: false };
        return normalizeWindowZ(next, [id]);
      });
    },
    [playOpen]
  );

  const openOrToggleWindow = (id: WindowId) => {
    const isNarrow = typeof window !== 'undefined' && window.innerWidth < 768;
    setWindows((prev) => {
      const win = prev[id];
      const maxZ = Math.max(...(Object.values(prev) as WindowState[]).map((w) => w.zIndex));
      if (win.isOpen && !win.isMinimized && win.zIndex === maxZ) {
        return { ...prev, [id]: { ...win, isMinimized: true } };
      }
      playOpen();
      if (isNarrow) setShowMobileStickers(false);
      const next = { ...prev };
      if (isNarrow) {
        (Object.keys(next) as WindowId[]).forEach((k) => {
          if (k !== id && next[k].isOpen) {
            next[k] = { ...next[k], isMinimized: true };
          }
        });
      }
      next[id] = { ...next[id], isOpen: true, isMinimized: false };
      return normalizeWindowZ(next, [id]);
    });
  };

  const toggleMobileNotes = () => {
    playClick();
    setShowMobileStickers((prev) => {
      const next = !prev;
      if (next) {
        // Minimize open mobile sheets so stickers on desktop are immediately visible
        setWindows((wins) => {
          const updated = { ...wins };
          (Object.keys(updated) as WindowId[]).forEach((k) => {
            if (updated[k].isOpen && !updated[k].isMinimized) {
              updated[k] = { ...updated[k], isMinimized: true };
            }
          });
          return updated;
        });
      } else {
        // Restore top-most open window if all are minimized when returning from Notes
        setWindows((wins) => {
          const hasVisible = (Object.values(wins) as WindowState[]).some(
            (w) => w.isOpen && !w.isMinimized
          );
          if (hasVisible) return wins;
          return {
            ...wins,
            welcome: { ...wins.welcome, isOpen: true, isMinimized: false },
          };
        });
      }
      return next;
    });
  };

  const openProjectShowcase = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      openWindowExplicit('projects');
    },
    [openWindowExplicit]
  );

  const closeWindow = (id: WindowId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: false, isMinimized: false, isMaximized: false, snapSide: null },
    }));
  };

  const minimizeWindow = (id: WindowId) => {
    setWindows((prev) => ({ ...prev, [id]: { ...prev[id], isMinimized: true } }));
  };

  const toggleMaximizeWindow = (id: WindowId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isMaximized: !prev[id].isMaximized, snapSide: null },
    }));
  };

  const updateWindowDragEnd = (id: WindowId, pos: { x: number; y: number }, snap: SnapSide) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], position: pos, snapSide: snap, isMaximized: false },
    }));
  };

  const updateWindowSize = (id: WindowId, size: { width: number; height: number }) => {
    setWindows((prev) => ({ ...prev, [id]: { ...prev[id], size } }));
  };

  const MOBILE_SHEET_ORDER: WindowId[] = [
    'welcome',
    'projects',
    'resume',
    'pixel',
    'code',
    'terminal',
    'settings',
  ];

  const cycleMobileWindow = useCallback(
    (currentId: WindowId, direction: 1 | -1) => {
      const idx = MOBILE_SHEET_ORDER.indexOf(currentId);
      if (idx === -1) return;
      const nextIdx = (idx + direction + MOBILE_SHEET_ORDER.length) % MOBILE_SHEET_ORDER.length;
      openWindowExplicit(MOBILE_SHEET_ORDER[nextIdx]);
    },
    [openWindowExplicit]
  );

  const applyWorkspacePreset = useCallback(
    (preset: WorkspacePreset) => {
      const isNarrow = typeof window !== 'undefined' && window.innerWidth < 768;
      if (preset === 'clean-desk') {
        playMinimize();
        setShowMobileStickers(isNarrow);
        setWindows((prev) => {
          const next = { ...prev };
          (Object.keys(next) as WindowId[]).forEach((k) => {
            if (next[k].isOpen) next[k] = { ...next[k], isMinimized: true };
          });
          return next;
        });
        return;
      }

      playSnap();
      if (isNarrow) setShowMobileStickers(false);

      setWindows((prev) => {
        const next = { ...prev };
        let frontOrder: WindowId[] = [];

        (Object.keys(next) as WindowId[]).forEach((k) => {
          if (next[k].isOpen) {
            next[k] = { ...next[k], isMinimized: true, snapSide: null, isMaximized: false };
          }
        });

        if (preset === 'showcase-split') {
          if (isNarrow) {
            next.projects = {
              ...next.projects,
              isOpen: true,
              isMinimized: false,
              isMaximized: false,
              snapSide: null,
            };
            frontOrder = ['projects'];
          } else {
            next.projects = {
              ...next.projects,
              isOpen: true,
              isMinimized: false,
              isMaximized: false,
              snapSide: 'left',
            };
            next.code = {
              ...next.code,
              isOpen: true,
              isMinimized: false,
              isMaximized: false,
              snapSide: 'right',
            };
            frontOrder = ['code', 'projects'];
          }
        } else if (preset === 'recruiter-mode') {
          if (isNarrow) {
            next.resume = {
              ...next.resume,
              isOpen: true,
              isMinimized: false,
              isMaximized: false,
              snapSide: null,
            };
            frontOrder = ['resume'];
          } else {
            next.welcome = {
              ...next.welcome,
              isOpen: true,
              isMinimized: false,
              isMaximized: false,
              snapSide: 'left',
            };
            next.resume = {
              ...next.resume,
              isOpen: true,
              isMinimized: false,
              isMaximized: false,
              snapSide: 'right',
            };
            frontOrder = ['welcome', 'resume'];
          }
        }

        return normalizeWindowZ(next, frontOrder);
      });
    },
    [playMinimize, playSnap]
  );

  const handleTerminalCommand = (cmd: string, args: string[]): string | void => {
    if (cmd === 'error') {
      const newErrors: StickerData[] = [];
      for (let i = 0; i < 5; i++) {
        const id = `err-${Date.now()}-${i}`;
        newErrors.push({
          id,
          text: 'Task failed successfully.',
          rotation: 0,
          top: `${18 + i * 5}%`,
          left: `${28 + i * 4.5}%`,
          variant: 'error',
        });
      }
      setStickers((prev) => [...prev, ...newErrors]);
      return;
    }

    if (cmd === 'sticker') {
      const phrase = args.join(' ').trim();
      if (!phrase) return 'Usage: sticker <your note text>';
      addSticker({ text: phrase, tone: 'amber' });
      playStick();
      return `Pinned sticker "${phrase}" to desktop.`;
    }

    if (cmd === 'party') {
      setStickers((prev) =>
        prev.map((s) => ({
          ...s,
          rotation: Math.round((Math.random() * 14 - 7) * 10) / 10,
          tone: TONE_CYCLE[Math.floor(Math.random() * TONE_CYCLE.length)],
        }))
      );
      return 'Stickers remixed & shuffled!';
    }

    if (cmd === 'ink') {
      setIsInkMode((prev) => !prev);
      return 'Toggled Desktop Ink drawing mode.';
    }

    if (cmd === 'sound') {
      const flag = (args[0] || '').toLowerCase();
      if (flag === 'on') {
        setSoundEnabled(true);
        return 'Web Audio SFX enabled.';
      }
      if (flag === 'off') {
        setSoundEnabled(false);
        return 'Web Audio SFX muted.';
      }
      setSoundEnabled(!soundEnabled);
      return `Web Audio SFX ${!soundEnabled ? 'enabled' : 'muted'}.`;
    }
  };

  const activeProjectTitle = selectedProjectId
    ? PORTFOLIO_PROJECTS.find((p) => p.id === selectedProjectId)?.title
    : null;

  const dockItems: DockItemData[] = [
    {
      id: 'welcome',
      icon: <User size={19} />,
      label: 'Profile',
      previewSubtitle: 'Release Notes · Bio & Stack',
      windowId: 'welcome',
      isActive: windows.welcome.isOpen,
      isMinimized: windows.welcome.isMinimized,
      onClick: () => openOrToggleWindow('welcome'),
      onCloseWindow: () => closeWindow('welcome'),
    },
    {
      id: 'folder',
      icon: <IconFolder size={20} />,
      label: 'Projects Showcase',
      previewSubtitle: activeProjectTitle ? `Viewing: ${activeProjectTitle}` : '6 Portfolio Releases',
      windowId: 'projects',
      isActive: windows.projects.isOpen,
      isMinimized: windows.projects.isMinimized,
      onClick: () => openOrToggleWindow('projects'),
      onCloseWindow: () => closeWindow('projects'),
    },
    {
      id: 'resume',
      icon: <FileText size={19} />,
      label: 'Resume / Dossier',
      previewSubtitle: 'Principal Frontend & Systems',
      windowId: 'resume',
      isActive: windows.resume.isOpen,
      isMinimized: windows.resume.isMinimized,
      onClick: () => openOrToggleWindow('resume'),
      onCloseWindow: () => closeWindow('resume'),
    },
    {
      id: 'pixel',
      icon: <IconPixelGrid size={19} />,
      label: 'Pixel Studio',
      previewSubtitle: '16×16 / 32×32 Pixel Editor',
      windowId: 'pixel',
      isActive: windows.pixel.isOpen,
      isMinimized: windows.pixel.isMinimized,
      onClick: () => openOrToggleWindow('pixel'),
      onCloseWindow: () => closeWindow('pixel'),
    },
    {
      id: 'code-brackets',
      icon: <IconCodeBracket size={19} />,
      label: 'Code Lab',
      previewSubtitle: 'Interactive Parameter Sandbox',
      windowId: 'code',
      isActive: windows.code.isOpen,
      isMinimized: windows.code.isMinimized,
      onClick: () => openOrToggleWindow('code'),
      onCloseWindow: () => closeWindow('code'),
    },
    {
      id: 'terminal',
      icon: <IconTerminal size={19} />,
      label: 'Terminal',
      previewSubtitle: 'khan@os — zsh ready',
      windowId: 'terminal',
      isActive: windows.terminal.isOpen,
      isMinimized: windows.terminal.isMinimized,
      onClick: () => openOrToggleWindow('terminal'),
      onCloseWindow: () => closeWindow('terminal'),
    },
    {
      id: 'settings',
      icon: <IconApps size={19} />,
      label: 'Settings',
      previewSubtitle: 'Material 3 Tonal Engine',
      windowId: 'settings',
      isActive: windows.settings.isOpen,
      isMinimized: windows.settings.isMinimized,
      onClick: () => openOrToggleWindow('settings'),
      onCloseWindow: () => closeWindow('settings'),
    },
    { id: 'separator-1', type: 'separator' },
    {
      id: 'linkedin',
      icon: <IconLinkedIn />,
      label: 'LinkedIn',
      href: 'https://linkedin.com',
    },
    {
      id: 'github',
      icon: <IconGithub size={19} />,
      label: 'GitHub',
      href: 'https://github.com',
    },
  ];

  const contextMenuItems = [
    { label: 'Spotlight Search', shortcut: '⌘K', action: () => setIsSpotlightOpen(true), icon: <Search size={14} /> },
    { label: 'New Note / Stamp', action: () => setIsCreatorOpen(true), icon: <IconPlus size={14} /> },
    { label: isInkMode ? 'Exit Ink Draw' : 'Draw on Desktop', action: () => setIsInkMode((v) => !v), icon: <PenTool size={14} /> },
    { label: '', action: () => {}, separator: true },
    { label: 'Showcase Split', action: () => applyWorkspacePreset('showcase-split'), icon: <Columns2 size={14} /> },
    { label: 'Recruiter Mode', action: () => applyWorkspacePreset('recruiter-mode'), icon: <Briefcase size={14} /> },
    { label: 'Clean Desk', action: () => applyWorkspacePreset('clean-desk'), icon: <Minimize2 size={14} /> },
    { label: '', action: () => {}, separator: true },
    { label: 'Next Theme', action: handleNextTheme, icon: <IconPalette size={14} /> },
    { label: 'Refresh Stickers', action: resetDesktop, icon: <IconRefresh size={14} /> },
    { label: 'System Settings', action: () => openWindowExplicit('settings'), icon: <IconMonitor size={14} /> },
  ];

  return (
    <ContextMenu items={contextMenuItems}>
      <BootOverlay onComplete={() => {}} />
      <div
        ref={constraintsRef}
        className="relative h-[100dvh] w-screen overflow-hidden overscroll-none touch-none cursor-auto"
      >
        {/* Mobile Top Bar */}
        <div className="fixed top-[8px] left-[10px] right-[10px] z-[60] h-[48px] md:hidden pointer-events-none flex items-center gap-2">
          <div className="flex-1 h-full bg-surface/95 backdrop-blur-md border border-border rounded-full flex items-center justify-between pl-4 pr-1 pointer-events-auto shadow-sm">
            <span className="font-sans font-semibold text-sm text-text-main select-none tracking-tight">
              KhanOS
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  playClick();
                  setIsSpotlightOpen(true);
                }}
                aria-label="Open Search"
                className="flex items-center justify-center h-11 w-11 rounded-full hover:bg-neutral-90 dark:hover:bg-neutral-10 text-text-main touch-manipulation"
              >
                <Search size={17} />
              </button>
              <button
                onClick={() => {
                  playClick();
                  setIsCreatorOpen(true);
                }}
                aria-label="New sticky note"
                className="flex items-center justify-center h-11 w-11 rounded-full hover:bg-neutral-90 dark:hover:bg-neutral-10 text-text-main touch-manipulation"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={toggleMobileNotes}
                className={`text-xs font-mono h-10 min-w-[64px] px-3.5 rounded-full border transition-colors touch-manipulation ${
                  showMobileStickers
                    ? 'border-primary bg-primary text-primary-on font-semibold'
                    : 'border-border bg-bg-app text-text-main'
                }`}
              >
                {showMobileStickers ? 'Done' : 'Notes'}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Background Layer */}
        <div className="absolute inset-0 z-[-2] transition-all duration-300 ease-in-out bg-bg-app">
          {wallpaper.type === 'default' && (
            <>
              <div
                className="hidden md:block absolute inset-0 opacity-85 dark:opacity-55"
                style={{
                  background:
                    'radial-gradient(circle at 60% 40%, var(--wallpaper-glow-1) 0%, transparent 68%)',
                }}
              />
              <div
                className="hidden md:block absolute inset-0 opacity-65 dark:opacity-45"
                style={{
                  background:
                    'radial-gradient(circle at 20% 80%, var(--wallpaper-glow-2) 0%, transparent 55%)',
                }}
              />
              <div
                className="md:hidden absolute inset-0 opacity-80 dark:opacity-45"
                style={{
                  background:
                    'linear-gradient(to bottom, var(--wallpaper-glow-1), var(--bg-app) 45%, var(--bg-app))',
                }}
              />
            </>
          )}

          {wallpaper.type === 'gradient' && (
            <div className="w-full h-full" style={{ background: wallpaper.value }} />
          )}

          {(wallpaper.type === 'image' || wallpaper.type === 'custom') && (
            <>
              <img
                src={wallpaper.value}
                alt={wallpaper.label}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/15 dark:bg-black/35" />
            </>
          )}
        </div>

        {/* Desktop Ink Canvas Layer */}
        <ScribbleCanvas isActive={isInkMode} onExit={() => setIsInkMode(false)} />

        {/* Snap Zone Ghost Preview */}
        <AnimatePresence>
          {snapPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className={`fixed top-16 bottom-[88px] z-[28] rounded-2xl border-2 border-primary/60 bg-primary/10 backdrop-blur-[2px] pointer-events-none max-w-[720px] ${
                snapPreview === 'left' ? 'left-5 w-[calc(50vw-28px)]' : 'right-5 w-[calc(50vw-28px)]'
              }`}
            />
          )}
        </AnimatePresence>

        {/* Desktop Freeform Stickers Layer */}
        <div className="hidden md:block absolute inset-0 z-10">
          <AnimatePresence>
            {stickers.map((sticker, idx) => (
              <Sticker
                key={sticker.id}
                {...sticker}
                index={idx}
                layoutMode="freeform"
                constraintsRef={constraintsRef}
                onClose={handleCloseSticker}
                onInteract={handleInteractSticker}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Mobile Pinboard Notes Layer */}
        <AnimatePresence>
          {showMobileStickers && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.18 }}
              className="md:hidden fixed inset-x-0 top-[64px] bottom-[78px] z-20 overflow-y-auto overscroll-contain px-3.5 pt-2 pb-6 pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] font-mono text-text-muted">
                  Sticky Notes · {stickers.length} pinned
                </span>
                <button
                  onClick={resetDesktop}
                  className="text-[11px] font-medium text-primary hover:underline py-1 px-2"
                >
                  Reset defaults
                </button>
              </div>

              {stickers.length === 0 ? (
                <div className="mt-10 mx-auto p-5 rounded-2xl bg-surface/95 border border-border shadow-medium max-w-xs text-center space-y-3">
                  <div className="text-sm font-semibold text-text-main">No sticky notes yet</div>
                  <p className="text-xs text-text-muted">
                    Add a custom note or restore the default sticker collection.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        playClick();
                        setIsCreatorOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-on text-xs font-semibold"
                    >
                      + New Note
                    </button>
                    <button
                      onClick={resetDesktop}
                      className="px-4 py-2.5 rounded-xl border border-border bg-bg-app text-xs font-medium text-text-main"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 items-start">
                  <AnimatePresence>
                    {stickers.map((sticker, idx) => (
                      <Sticker
                        key={sticker.id}
                        {...sticker}
                        index={idx}
                        layoutMode="grid"
                        onClose={handleCloseSticker}
                        onInteract={handleInteractSticker}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Top-Right Quick Actions */}
        <div className="hidden md:flex fixed top-4 right-5 z-[60] items-center gap-2">
          <motion.button
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              playClick();
              setIsSpotlightOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface/95 border border-border shadow-medium text-xs font-medium text-text-main hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60"
          >
            <Search size={13} />
            <span>⌘K</span>
          </motion.button>
          <motion.button
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              playClick();
              setIsCreatorOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface/95 border border-border shadow-medium text-xs font-medium text-text-main hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60"
          >
            <Plus size={14} />
            New Note
          </motion.button>
        </div>

        {/* App Windows */}
        <DraggableWindow
          isOpen={windows.welcome.isOpen}
          isMinimized={windows.welcome.isMinimized}
          isMaximized={windows.welcome.isMaximized}
          isFocused={focusedWindowId === 'welcome'}
          snapSide={windows.welcome.snapSide}
          onClose={() => closeWindow('welcome')}
          onMinimize={() => minimizeWindow('welcome')}
          onToggleMaximize={() => toggleMaximizeWindow('welcome')}
          onFocus={() => focusWindow('welcome')}
          onDragEnd={(pos, snap) => updateWindowDragEnd('welcome', pos, snap)}
          onSnapPreview={setSnapPreview}
          onResize={(sz) => updateWindowSize('welcome', sz)}
          onSwipeLeft={() => cycleMobileWindow('welcome', 1)}
          onSwipeRight={() => cycleMobileWindow('welcome', -1)}
          zIndex={windows.welcome.zIndex}
          defaultPosition={windows.welcome.position}
          size={windows.welcome.size}
          constraintsRef={constraintsRef}
          title="Welcome to KhanOS — Release Notes & Bio"
          contentClassName="p-0 bg-surface"
        >
          <WelcomeWindow
            onOpenWindow={openWindowExplicit}
            onSelectProject={openProjectShowcase}
            onClose={() => closeWindow('welcome')}
          />
        </DraggableWindow>

        <DraggableWindow
          isOpen={windows.projects.isOpen}
          isMinimized={windows.projects.isMinimized}
          isMaximized={windows.projects.isMaximized}
          isFocused={focusedWindowId === 'projects'}
          snapSide={windows.projects.snapSide}
          onClose={() => closeWindow('projects')}
          onMinimize={() => minimizeWindow('projects')}
          onToggleMaximize={() => toggleMaximizeWindow('projects')}
          onFocus={() => focusWindow('projects')}
          onDragEnd={(pos, snap) => updateWindowDragEnd('projects', pos, snap)}
          onSnapPreview={setSnapPreview}
          onResize={(sz) => updateWindowSize('projects', sz)}
          onSwipeLeft={() => cycleMobileWindow('projects', 1)}
          onSwipeRight={() => cycleMobileWindow('projects', -1)}
          zIndex={windows.projects.zIndex}
          defaultPosition={windows.projects.position}
          size={windows.projects.size}
          constraintsRef={constraintsRef}
          title="Product Showcase — Releases & Lab"
          contentClassName="p-0 bg-surface"
        >
          <FileExplorer
            selectedProjectId={selectedProjectId}
            onSelectProjectId={setSelectedProjectId}
            onOpenCodeLab={(preset) => {
              if (preset) setCodePreset(preset);
              openWindowExplicit('code');
            }}
          />
        </DraggableWindow>

        <DraggableWindow
          isOpen={windows.resume.isOpen}
          isMinimized={windows.resume.isMinimized}
          isMaximized={windows.resume.isMaximized}
          isFocused={focusedWindowId === 'resume'}
          snapSide={windows.resume.snapSide}
          onClose={() => closeWindow('resume')}
          onMinimize={() => minimizeWindow('resume')}
          onToggleMaximize={() => toggleMaximizeWindow('resume')}
          onFocus={() => focusWindow('resume')}
          onDragEnd={(pos, snap) => updateWindowDragEnd('resume', pos, snap)}
          onSnapPreview={setSnapPreview}
          onResize={(sz) => updateWindowSize('resume', sz)}
          onSwipeLeft={() => cycleMobileWindow('resume', 1)}
          onSwipeRight={() => cycleMobileWindow('resume', -1)}
          zIndex={windows.resume.zIndex}
          defaultPosition={windows.resume.position}
          size={windows.resume.size}
          constraintsRef={constraintsRef}
          title="Resume / Dossier — Khan"
          contentClassName="p-0 bg-surface"
        >
          <ResumeWindow />
        </DraggableWindow>

        <DraggableWindow
          isOpen={windows.pixel.isOpen}
          isMinimized={windows.pixel.isMinimized}
          isMaximized={windows.pixel.isMaximized}
          isFocused={focusedWindowId === 'pixel'}
          snapSide={windows.pixel.snapSide}
          onClose={() => closeWindow('pixel')}
          onMinimize={() => minimizeWindow('pixel')}
          onToggleMaximize={() => toggleMaximizeWindow('pixel')}
          onFocus={() => focusWindow('pixel')}
          onDragEnd={(pos, snap) => updateWindowDragEnd('pixel', pos, snap)}
          onSnapPreview={setSnapPreview}
          onResize={(sz) => updateWindowSize('pixel', sz)}
          onSwipeLeft={() => cycleMobileWindow('pixel', 1)}
          onSwipeRight={() => cycleMobileWindow('pixel', -1)}
          zIndex={windows.pixel.zIndex}
          defaultPosition={windows.pixel.position}
          size={windows.pixel.size}
          constraintsRef={constraintsRef}
          title="Pixel Studio"
          contentClassName="p-0 bg-surface"
        >
          <PixelArtCanvas
            onPinToDesktop={(imageUrl, label) =>
              addSticker({ text: label, variant: 'pixel', imageUrl, tone: 'surface' })
            }
          />
        </DraggableWindow>

        <DraggableWindow
          isOpen={windows.code.isOpen}
          isMinimized={windows.code.isMinimized}
          isMaximized={windows.code.isMaximized}
          isFocused={focusedWindowId === 'code'}
          snapSide={windows.code.snapSide}
          onClose={() => closeWindow('code')}
          onMinimize={() => minimizeWindow('code')}
          onToggleMaximize={() => toggleMaximizeWindow('code')}
          onFocus={() => focusWindow('code')}
          onDragEnd={(pos, snap) => updateWindowDragEnd('code', pos, snap)}
          onSnapPreview={setSnapPreview}
          onResize={(sz) => updateWindowSize('code', sz)}
          onSwipeLeft={() => cycleMobileWindow('code', 1)}
          onSwipeRight={() => cycleMobileWindow('code', -1)}
          zIndex={windows.code.zIndex}
          defaultPosition={windows.code.position}
          size={windows.code.size}
          constraintsRef={constraintsRef}
          title="Live Code Lab"
          contentClassName="p-0 bg-[#18181b]"
        >
          <CodePlayground initialPreset={codePreset} />
        </DraggableWindow>

        <DraggableWindow
          isOpen={windows.terminal.isOpen}
          isMinimized={windows.terminal.isMinimized}
          isMaximized={windows.terminal.isMaximized}
          isFocused={focusedWindowId === 'terminal'}
          snapSide={windows.terminal.snapSide}
          onClose={() => closeWindow('terminal')}
          onMinimize={() => minimizeWindow('terminal')}
          onToggleMaximize={() => toggleMaximizeWindow('terminal')}
          onFocus={() => focusWindow('terminal')}
          onDragEnd={(pos, snap) => updateWindowDragEnd('terminal', pos, snap)}
          onSnapPreview={setSnapPreview}
          onResize={(sz) => updateWindowSize('terminal', sz)}
          onSwipeLeft={() => cycleMobileWindow('terminal', 1)}
          onSwipeRight={() => cycleMobileWindow('terminal', -1)}
          zIndex={windows.terminal.zIndex}
          defaultPosition={windows.terminal.position}
          size={windows.terminal.size}
          constraintsRef={constraintsRef}
          title="khan@os — zsh"
          contentClassName="p-0 bg-[#161618]"
        >
          <Terminal
            onCommand={handleTerminalCommand}
            onOpenWindow={openWindowExplicit}
            onSwitchTheme={(t) => setTheme(t)}
          />
        </DraggableWindow>

        <DraggableWindow
          isOpen={windows.settings.isOpen}
          isMinimized={windows.settings.isMinimized}
          isMaximized={windows.settings.isMaximized}
          isFocused={focusedWindowId === 'settings'}
          snapSide={windows.settings.snapSide}
          onClose={() => closeWindow('settings')}
          onMinimize={() => minimizeWindow('settings')}
          onToggleMaximize={() => toggleMaximizeWindow('settings')}
          onFocus={() => focusWindow('settings')}
          onDragEnd={(pos, snap) => updateWindowDragEnd('settings', pos, snap)}
          onSnapPreview={setSnapPreview}
          onResize={(sz) => updateWindowSize('settings', sz)}
          onSwipeLeft={() => cycleMobileWindow('settings', 1)}
          onSwipeRight={() => cycleMobileWindow('settings', -1)}
          zIndex={windows.settings.zIndex}
          defaultPosition={windows.settings.position}
          size={windows.settings.size}
          constraintsRef={constraintsRef}
          title="System Settings"
          contentClassName="p-0 bg-surface"
        >
          <Settings
            toyMode={toyMode}
            onChangeToyMode={setToyMode}
            onResetDesktop={resetDesktop}
          />
        </DraggableWindow>

        {/* Modals & Spotlight */}
        <StickerCreatorModal
          isOpen={isCreatorOpen}
          onClose={() => setIsCreatorOpen(false)}
          onCreate={(payload) => addSticker(payload)}
        />

        <SpotlightLauncher
          isOpen={isSpotlightOpen}
          onClose={() => setIsSpotlightOpen(false)}
          onOpenWindow={openWindowExplicit}
          onOpenProject={openProjectShowcase}
          onApplyWorkspace={applyWorkspacePreset}
          onToggleInk={() => setIsInkMode((v) => !v)}
          onOpenNoteCreator={() => setIsCreatorOpen(true)}
          onSetTheme={(t) => setTheme(t)}
          onResetDesktop={resetDesktop}
        />

        {/* Cursor Trail Layer */}
        <DesktopToyLayer mode={toyMode} />

        {/* FydeOS Floating Shelf */}
        <Dock
          items={dockItems}
          isInkMode={isInkMode}
          onToggleInkMode={() => setIsInkMode((v) => !v)}
          toyMode={toyMode}
          onCycleToyMode={cycleToyMode}
          onOpenSpotlight={() => setIsSpotlightOpen(true)}
          onOpenResume={() => openWindowExplicit('resume')}
        />
      </div>
    </ContextMenu>
  );
};

export default DesktopEnvironment;
