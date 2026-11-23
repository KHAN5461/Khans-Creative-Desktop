import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  PenTool,
  FileText,
  Search,
  User,
  Columns2,
  LayoutGrid,
  Image as ImageIcon,
} from 'lucide-react';
import Sticker from './Sticker';
import StickerCreatorModal from './StickerCreatorModal';
import QuickContactModal from './QuickContactModal';
import WindowExposeOverlay, { ExposeWindowMeta } from './WindowExposeOverlay';
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
import DesktopPongOverlay, { PongMode, PongUiGeometry, StickerSnapshot } from './DesktopPongOverlay';
import { ContextMenu, ContextMenuItem, ContextMenuQuickAction } from './ContextMenu';
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
  { id: '2', text: 'gcp-cloud', rotation: 1.4, left: '72%', top: '10%', tone: 'surface' },
  { id: '3', text: 'crisismesh-ai', rotation: -1.1, left: '80%', top: '26%', tone: 'mint' },
  { id: '4', text: 'genai-builder', rotation: -1.4, left: '6%', top: '24%', variant: 'highlight', tone: 'amber' },
  { id: '5', text: 'python-devops', rotation: 2.1, left: '75%', top: '42%', tone: 'lavender' },
  { id: '6', text: 'mumbai-eng', rotation: -2.2, left: '8%', top: '42%', tone: 'rose' },
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

const parseDeepLinkRoute = (): {
  app: WindowId | null;
  projectId: string | null;
  openContact: boolean;
} => {
  if (typeof window === 'undefined') {
    return { app: null, projectId: null, openContact: false };
  }
  const searchParams = new URLSearchParams(window.location.search);
  const rawHash = window.location.hash.replace(/^#/, '');

  // Support path-style hashes like #/projects/crisismesh-ai, #/resume, #/contact
  if (rawHash.startsWith('/')) {
    const parts = rawHash.replace(/^\/+/, '').split('/').filter(Boolean);
    if (parts[0] === 'contact') {
      return { app: null, projectId: null, openContact: true };
    }
    if (parts[0] === 'projects' && parts[1] && PORTFOLIO_PROJECTS.some((p) => p.id === parts[1])) {
      return { app: 'projects', projectId: parts[1], openContact: false };
    }
    if (parts[0] && parts[0] in INITIAL_WINDOWS) {
      return { app: parts[0] as WindowId, projectId: null, openContact: false };
    }
  }

  const hashParams = new URLSearchParams(rawHash);
  const projectParam = hashParams.get('project') || searchParams.get('project');
  const appParam = (hashParams.get('app') || searchParams.get('app')) as WindowId | null;
  const contactParam =
    rawHash === 'contact' || hashParams.get('contact') === '1' || searchParams.get('contact') === '1';

  if (projectParam && PORTFOLIO_PROJECTS.some((p) => p.id === projectParam)) {
    return { app: 'projects', projectId: projectParam, openContact: contactParam };
  }
  if (appParam && appParam in INITIAL_WINDOWS) {
    return { app: appParam, projectId: null, openContact: contactParam };
  }
  return { app: null, projectId: null, openContact: contactParam };
};

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
    const route = parseDeepLinkRoute();
    if (route.app) {
      return normalizeWindowZ(
        {
          ...INITIAL_WINDOWS,
          welcome: { ...INITIAL_WINDOWS.welcome, isOpen: route.app === 'welcome' },
          [route.app]: { ...INITIAL_WINDOWS[route.app], isOpen: true, isMinimized: false },
        },
        [route.app]
      );
    }
    return INITIAL_WINDOWS;
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => parseDeepLinkRoute().projectId
  );
  const [codePreset, setCodePreset] = useState<CodePresetId>('spring-card');
  const [snapPreview, setSnapPreview] = useState<SnapSide>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(() => parseDeepLinkRoute().openContact);
  const [isExposeOpen, setIsExposeOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isInkMode, setIsInkMode] = useState(false);
  const [toyMode, setToyMode] = useState<ToyMode>('default');
  const [showMobileStickers, setShowMobileStickers] = useState(false);
  const [gestureHud, setGestureHud] = useState<string | null>(null);
  const [rebootCount, setRebootCount] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [pongSession, setPongSession] = useState<{
    geometry: PongUiGeometry;
    initialMode: PongMode;
  } | null>(null);
  const [pongHideStickers, setPongHideStickers] = useState(false);
  const [isPongExiting, setIsPongExiting] = useState(false);

  const {
    themeId,
    setTheme,
    wallpaper,
    cycleWallpaper,
    wallpaperBlur,
    wallpaperDim,
    wallpaperParallax,
    focusDepthBlur,
  } = useTheme();
  const { soundEnabled, setSoundEnabled, playOpen, playClick, playStick, playSnap, playMinimize, playChime } =
    useSound();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const desktopSnapshotRef = useRef<WindowId[] | null>(null);
  const pongTuckedWindowsRef = useRef<WindowId[] | null>(null);
  const gestureHudTimerRef = useRef<number | null>(null);
  const rebootTimerRef = useRef<number | null>(null);

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

  const hasVisibleWindow = focusedWindowId !== null;

  const hasMaximizedWindow = React.useMemo(
    () =>
      (Object.keys(windows) as WindowId[]).some((id) => {
        const w = windows[id];
        return w.isOpen && !w.isMinimized && w.isMaximized;
      }),
    [windows]
  );

  const hideWallpaperForPong = Boolean(pongSession) && !isPongExiting;

  const effectiveWallpaperBlur =
    wallpaperBlur + (focusDepthBlur && hasVisibleWindow ? 6 : 0);
  const effectiveDimOpacity = Math.min(
    0.72,
    (wallpaperDim + (focusDepthBlur && hasVisibleWindow ? 8 : 0)) / 100
  );

  // Keep URL hash synced with focused app, active project, or contact sheet
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let nextHash = '';
    if (isContactOpen) {
      nextHash = '#contact';
    } else if (focusedWindowId === 'projects' && selectedProjectId) {
      nextHash = `#project=${encodeURIComponent(selectedProjectId)}`;
    } else if (focusedWindowId && focusedWindowId !== 'welcome') {
      nextHash = `#app=${focusedWindowId}`;
    }
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash || window.location.pathname + window.location.search);
    }
  }, [focusedWindowId, selectedProjectId, isContactOpen]);

  // Live deep-link hashchange listener (browser back/forward or pasted hash links)
  useEffect(() => {
    const onHashChange = () => {
      const route = parseDeepLinkRoute();
      if (route.openContact) {
        setIsContactOpen(true);
        return;
      }
      if (route.projectId) {
        setSelectedProjectId(route.projectId);
      }
      if (route.app) {
        const target = route.app;
        setWindows((prev) =>
          normalizeWindowZ(
            {
              ...prev,
              [target]: { ...prev[target], isOpen: true, isMinimized: false },
            },
            [target]
          )
        );
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Subtle desktop cursor parallax for wallpaper depth
  useEffect(() => {
    if (!wallpaperParallax || typeof window === 'undefined') {
      setParallaxOffset({ x: 0, y: 0 });
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setParallaxOffset({ x: 0, y: 0 });
      return;
    }
    let rafId = 0;
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || window.innerWidth < 768) return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setParallaxOffset({
          x: Math.round(-nx * 10 * 10) / 10,
          y: Math.round(-ny * 8 * 10) / 10,
        });
      });
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [wallpaperParallax]);

  useEffect(() => {
    try {
      localStorage.setItem('khan-desktop-stickers', JSON.stringify(stickers));
    } catch {
      // ignore
    }
  }, [stickers]);

  const showGestureNotice = useCallback((message: string) => {
    setGestureHud(message);
    if (gestureHudTimerRef.current !== null) {
      window.clearTimeout(gestureHudTimerRef.current);
    }
    gestureHudTimerRef.current = window.setTimeout(() => {
      setGestureHud(null);
      gestureHudTimerRef.current = null;
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (gestureHudTimerRef.current !== null) {
        window.clearTimeout(gestureHudTimerRef.current);
      }
      if (rebootTimerRef.current !== null) {
        window.clearTimeout(rebootTimerRef.current);
      }
    };
  }, []);

  const rebootSystem = useCallback(() => {
    playChime();
    setIsSpotlightOpen(false);
    setIsCreatorOpen(false);
    setIsInkMode(false);
    setShowMobileStickers(false);
    setSnapPreview(null);
    setPongSession(null);
    setPongHideStickers(false);
    setIsPongExiting(false);
    desktopSnapshotRef.current = null;
    pongTuckedWindowsRef.current = null;
    setRebootCount((c) => c + 1);

    if (rebootTimerRef.current !== null) {
      window.clearTimeout(rebootTimerRef.current);
    }
    // Reset transient windows and spawned error stickers cleanly behind the reboot splash
    rebootTimerRef.current = window.setTimeout(() => {
      setWindows(INITIAL_WINDOWS);
      setSelectedProjectId(null);
      setStickers((prev) => prev.filter((s) => s.variant !== 'error'));
      rebootTimerRef.current = null;
    }, 260);
  }, [playChime]);

  const startPong = useCallback(
    (initialMode: PongMode = 'ai') => {
      if (pongSession) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 768;

      const toBox = (r: DOMRect) => ({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      });

      const menuEl = document.querySelector<HTMLElement>('[data-pong-menu-btn]');
      const dockEl = document.querySelector<HTMLElement>('[data-pong-dock]');
      const searchEl = document.querySelector<HTMLElement>('[data-pong-search-pill]');
      const noteEl = document.querySelector<HTMLElement>('[data-pong-note-pill]');
      const mobileTopEl = document.querySelector<HTMLElement>('[data-pong-mobile-top]');

      const dockRect = dockEl
        ? toBox(dockEl.getBoundingClientRect())
        : { left: 24, top: vh - 74, width: Math.min(vw - 48, 1024), height: 62 };

      const menuBallRect = menuEl
        ? toBox(menuEl.getBoundingClientRect())
        : { left: dockRect.left + 16, top: dockRect.top + 11, width: 40, height: 40 };

      const searchPillRect =
        !isMobile && searchEl && searchEl.getBoundingClientRect().width > 0
          ? toBox(searchEl.getBoundingClientRect())
          : null;
      const notePillRect =
        !isMobile && noteEl && noteEl.getBoundingClientRect().width > 0
          ? toBox(noteEl.getBoundingClientRect())
          : null;
      const mobileTopRect =
        isMobile && mobileTopEl && mobileTopEl.getBoundingClientRect().width > 0
          ? toBox(mobileTopEl.getBoundingClientRect())
          : null;

      // Capture exact positions of visible desktop stickers so Brick-Break can morph them cleanly
      const stickerEls = Array.from(document.querySelectorAll<HTMLElement>('[data-pong-sticker]'));
      const stickerSnapshots: StickerSnapshot[] = stickerEls
        .map((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return null;
          const id = el.getAttribute('data-pong-sticker') || '';
          const match = stickers.find((st) => st.id === id);
          return {
            id: id || `st-${Math.random()}`,
            text: match?.text || el.getAttribute('data-pong-sticker-text') || 'note',
            tone: (match?.tone || el.getAttribute('data-pong-sticker-tone') || 'surface') as StickerTone,
            rotation: match?.rotation ?? 0,
            rect: toBox(rect),
          };
        })
        .filter((s): s is StickerSnapshot => Boolean(s));

      // Tuck full-screen/maximized windows (or mobile sheets) temporarily so court is playable,
      // while leaving normal floating desktop windows open as live bumpers!
      setWindows((prev) => {
        const tucked: WindowId[] = [];
        const next = { ...prev };
        (Object.keys(next) as WindowId[]).forEach((id) => {
          const w = next[id];
          if (w.isOpen && !w.isMinimized && (isMobile || w.isMaximized)) {
            tucked.push(id);
            next[id] = { ...w, isMinimized: true };
          }
        });
        pongTuckedWindowsRef.current = tucked.length > 0 ? tucked : null;
        return tucked.length > 0 ? next : prev;
      });

      setIsSpotlightOpen(false);
      setIsCreatorOpen(false);
      setIsInkMode(false);
      setShowMobileStickers(false);
      setSnapPreview(null);

      setIsPongExiting(false);
      setPongSession({
        geometry: {
          menuBallRect,
          dockRect,
          isMobile,
          searchPillRect,
          notePillRect,
          mobileTopRect,
          stickerSnapshots,
        },
        initialMode,
      });
    },
    [pongSession, stickers]
  );

  const handleFinishPong = useCallback(
    (summary?: { won: boolean; mode: PongMode; scoreText: string }) => {
      setPongSession(null);
      setPongHideStickers(false);
      setIsPongExiting(false);

      const tucked = pongTuckedWindowsRef.current;
      pongTuckedWindowsRef.current = null;
      if (tucked && tucked.length > 0) {
        setWindows((prev) => {
          const next = { ...prev };
          tucked.forEach((id) => {
            if (next[id]?.isOpen) {
              next[id] = { ...next[id], isMinimized: false };
            }
          });
          return next;
        });
      }

      if (summary?.won) {
        showGestureNotice(`Pong Victory (${summary.scoreText}) · Desktop restored`);
      }
    },
    [showGestureNotice]
  );

  const toggleDesktopVisibility = useCallback(() => {
    const isNarrow = typeof window !== 'undefined' && window.innerWidth < 768;
    setWindows((prev) => {
      const visibleIds = (Object.keys(prev) as WindowId[]).filter(
        (id) => prev[id].isOpen && !prev[id].isMinimized
      );

      if (visibleIds.length > 0) {
        // Hide all visible windows and snapshot them so a second 3-finger swipe restores them
        desktopSnapshotRef.current = visibleIds;
        playMinimize();
        if (isNarrow) setShowMobileStickers(true);
        showGestureNotice('Desktop shown · 3-finger swipe to restore');
        const next = { ...prev };
        visibleIds.forEach((id) => {
          next[id] = { ...next[id], isMinimized: true };
        });
        return next;
      }

      // Restore previously hidden windows (or any minimized open window, or Welcome)
      const snapIds = (desktopSnapshotRef.current || []).filter((id) => prev[id]?.isOpen);
      desktopSnapshotRef.current = null;
      const minimizedOpenIds = (Object.keys(prev) as WindowId[]).filter(
        (id) => prev[id].isOpen && prev[id].isMinimized
      );
      const restoreIds =
        snapIds.length > 0
          ? snapIds
          : minimizedOpenIds.length > 0
            ? isNarrow
              ? [minimizedOpenIds[minimizedOpenIds.length - 1]]
              : minimizedOpenIds
            : (['welcome'] as WindowId[]);

      playOpen();
      if (isNarrow) setShowMobileStickers(false);
      showGestureNotice('Windows restored');

      const next = { ...prev };
      restoreIds.forEach((id) => {
        next[id] = { ...next[id], isOpen: true, isMinimized: false };
      });
      return normalizeWindowZ(next, restoreIds);
    });
  }, [playMinimize, playOpen, showGestureNotice]);

  // Global three-finger swipe gesture to toggle desktop visibility
  useEffect(() => {
    const el = constraintsRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let active = false;
    let triggered = false;

    const getCentroid = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX + touches[2].clientX) / 3,
      y: (touches[0].clientY + touches[1].clientY + touches[2].clientY) / 3,
    });

    const onTouchStart = (e: TouchEvent) => {
      if (isInkMode || isSpotlightOpen || isCreatorOpen || pongSession) return;
      if (e.touches.length === 3 && !triggered) {
        const c = getCentroid(e.touches);
        startX = c.x;
        startY = c.y;
        active = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isInkMode || isSpotlightOpen || isCreatorOpen || pongSession) return;
      if (e.touches.length === 3) {
        e.preventDefault();
        const c = getCentroid(e.touches);
        if (!active && !triggered) {
          startX = c.x;
          startY = c.y;
          active = true;
          return;
        }
        if (active && !triggered) {
          const dist = Math.hypot(c.x - startX, c.y - startY);
          if (dist >= 60) {
            triggered = true;
            active = false;
            toggleDesktopVisibility();
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 3) {
        active = false;
      }
      if (e.touches.length === 0) {
        triggered = false;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isInkMode, isSpotlightOpen, isCreatorOpen, pongSession, toggleDesktopVisibility]);

  // Global Cmd/Ctrl + K Spotlight, Cmd/Ctrl + / Window Overview, & Escape dismiss
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (pongSession) return;
        e.preventDefault();
        playClick();
        setIsExposeOpen(false);
        setIsSpotlightOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        if (pongSession) return;
        e.preventDefault();
        playClick();
        setIsSpotlightOpen(false);
        setIsExposeOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isExposeOpen) setIsExposeOpen(false);
        else if (isContactOpen) setIsContactOpen(false);
        else if (isCreatorOpen) setIsCreatorOpen(false);
        else if (isInkMode) setIsInkMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playClick, isCreatorOpen, isInkMode, isExposeOpen, isContactOpen, pongSession]);

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

  const handleNextWallpaper = useCallback(() => {
    playClick();
    const next = cycleWallpaper();
    showGestureNotice(`Wallpaper · ${next.label}`);
  }, [playClick, cycleWallpaper, showGestureNotice]);

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
      desktopSnapshotRef.current = null;
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
      desktopSnapshotRef.current = null;
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

    if (cmd === 'reboot' || cmd === 'restart') {
      window.setTimeout(() => {
        rebootSystem();
      }, 320);
      return 'Rebooting KhanOS... restarting desktop session.';
    }

    if (cmd === 'pong') {
      const sub = (args[0] || '').toLowerCase();
      const targetMode: PongMode =
        sub === '2p' || sub === 'split'
          ? '2p'
          : sub === 'bricks' || sub === 'break' || sub === 'breakout'
            ? 'bricks'
            : 'ai';
      window.setTimeout(() => {
        startPong(targetMode);
      }, 160);
      return `Morphing KhanOS into Pong (${targetMode === 'ai' ? 'vs AI' : targetMode === '2p' ? '2P Split' : 'Sticker Brick-Break'})...`;
    }

    if (cmd === 'wallpaper' || cmd === 'wp') {
      const next = cycleWallpaper();
      return `Switched wallpaper to "${next.label}" with live Material 3 tones.`;
    }

    if (cmd === 'contact' || cmd === 'email') {
      setIsContactOpen(true);
      return 'Opened Quick Contact sheet.';
    }

    if (cmd === 'overview' || cmd === 'expose') {
      setIsExposeOpen(true);
      return 'Opened Window Overview (⌘/).';
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
      previewSubtitle: 'Cloud, GenAI & BE Comp Eng',
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
      href: 'https://www.linkedin.com/in/khan-hassan-eng/',
    },
    {
      id: 'github',
      icon: <IconGithub size={19} />,
      label: 'GitHub',
      href: 'https://github.com/KHAN5461',
    },
  ];

  const contextQuickActions: ContextMenuQuickAction[] = [
    {
      label: 'Refresh',
      title: 'Refresh desktop stickers',
      icon: <IconRefresh size={14} />,
      action: resetDesktop,
    },
    {
      label: isInkMode ? 'Exit Draw' : 'Draw',
      title: isInkMode ? 'Exit Draw on Desktop' : 'Draw on Desktop',
      icon: <PenTool size={14} />,
      action: () => setIsInkMode((v) => !v),
      active: isInkMode,
    },
  ];

  const exposeWindowMeta: ExposeWindowMeta[] = [
    {
      id: 'welcome',
      title: 'Welcome & Bio',
      subtitle: 'Khan Hassan · Cloud & GenAI Engineer · Featured Releases',
      icon: <User size={15} />,
    },
    {
      id: 'projects',
      title: 'Projects Showcase',
      subtitle: activeProjectTitle
        ? `Case Study: ${activeProjectTitle}`
        : '6 Releases with interactive demos & architecture diagrams',
      icon: <IconFolder size={15} />,
    },
    {
      id: 'resume',
      title: 'Resume / Dossier',
      subtitle: 'Experience, verified credentials & interactive skill links',
      icon: <FileText size={15} />,
    },
    {
      id: 'pixel',
      title: 'Pixel Studio',
      subtitle: '16×16 / 32×32 pixel art editor with desktop sticker export',
      icon: <IconPixelGrid size={15} />,
    },
    {
      id: 'code',
      title: 'Code Lab',
      subtitle: 'Interactive spring & generative canvas parameter sandbox',
      icon: <IconCodeBracket size={15} />,
    },
    {
      id: 'terminal',
      title: 'Terminal (zsh)',
      subtitle: 'khan@os interactive shell, themes & desktop commands',
      icon: <IconTerminal size={15} />,
    },
    {
      id: 'settings',
      title: 'System Settings',
      subtitle: 'Material 3 tonal engine, wallpaper atmosphere & seed picker',
      icon: <IconApps size={15} />,
    },
  ];

  const contextMenuItems: ContextMenuItem[] = [
    { label: 'New Note / Stamp', action: () => setIsCreatorOpen(true), icon: <IconPlus size={14} /> },
    { label: 'Spotlight Search', shortcut: '⌘K', action: () => setIsSpotlightOpen(true), icon: <Search size={14} /> },
    { label: 'Window Overview', shortcut: '⌘/', action: () => setIsExposeOpen(true), icon: <LayoutGrid size={14} /> },
    { label: 'Showcase Split', action: () => applyWorkspacePreset('showcase-split'), icon: <Columns2 size={14} /> },
    { label: '', separator: true },
    { label: 'Next Wallpaper', action: handleNextWallpaper, icon: <ImageIcon size={14} /> },
    { label: 'Cycle Theme', action: handleNextTheme, icon: <IconPalette size={14} /> },
    { label: 'System Settings', action: () => openWindowExplicit('settings'), icon: <IconMonitor size={14} /> },
  ];

  return (
    <ContextMenu
      quickActions={contextQuickActions}
      items={contextMenuItems}
      disabled={Boolean(
        pongSession || isSpotlightOpen || isCreatorOpen || isContactOpen || isExposeOpen || isInkMode
      )}
    >
      <BootOverlay bootNonce={rebootCount} isReboot={rebootCount > 0} onComplete={() => {}} />
      <div
        ref={constraintsRef}
        className="relative isolate h-[100dvh] w-screen overflow-hidden overscroll-none touch-none cursor-auto"
      >
        {/* Gesture Feedback HUD Pill */}
        <AnimatePresence>
          {gestureHud && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 440, damping: 28 }}
              className="fixed top-[64px] md:top-5 left-1/2 -translate-x-1/2 z-[95] pointer-events-none px-4 py-2 rounded-full bg-surface/92 backdrop-blur-xl backdrop-saturate-150 border border-border shadow-hard text-xs font-medium text-text-main whitespace-nowrap"
            >
              {gestureHud}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Top Bar (swaps seamlessly to the Ink toolbar while drawing on mobile) */}
        <div
          className={`fixed top-[8px] left-[10px] right-[10px] z-[60] h-[48px] md:hidden pointer-events-none flex items-center gap-2 transition-opacity duration-150 ${
            pongSession || isInkMode ? 'opacity-0' : ''
          }`}
        >
          <div
            data-pong-mobile-top="true"
            className={`flex-1 h-full bg-surface/90 backdrop-blur-xl backdrop-saturate-150 border border-border rounded-full flex items-center justify-between pl-4 pr-1 shadow-sm ${
              pongSession || isInkMode ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
          >
            <span className="font-sans font-semibold text-sm text-text-main select-none tracking-tight">
              KhanOS
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsSpotlightOpen(true);
                }}
                aria-label="Open Search"
                className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-neutral-90 dark:hover:bg-neutral-10 text-text-main touch-manipulation"
              >
                <Search size={17} />
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsExposeOpen(true);
                }}
                aria-label="Window Overview"
                className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-neutral-90 dark:hover:bg-neutral-10 text-text-main touch-manipulation"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsCreatorOpen(true);
                }}
                aria-label="New sticky note"
                className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-neutral-90 dark:hover:bg-neutral-10 text-text-main touch-manipulation"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                onClick={toggleMobileNotes}
                className={`text-xs font-mono h-10 min-w-[60px] px-3 rounded-full border transition-colors touch-manipulation ${
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

        {/* Dynamic Background Layer with Smooth Crossfade, Focus Depth Blur, Parallax & Pong Fade-Out */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-bg-app">
          <div
            className="absolute inset-0"
            style={{
              opacity: hideWallpaperForPong ? 0 : 1,
              transition: 'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) scale(${
                  wallpaperParallax || effectiveWallpaperBlur > 0 ? 1.05 : 1
                })`,
                filter: effectiveWallpaperBlur > 0 ? `blur(${effectiveWallpaperBlur}px)` : 'none',
                transition:
                  'filter 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms ease-out',
              }}
            >
              <AnimatePresence mode="sync" initial={false}>
                <motion.div
                  key={wallpaper.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
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

                  {(wallpaper.type === 'image' || wallpaper.type === 'custom') && wallpaper.value && (
                    <img
                      src={wallpaper.value}
                      alt={wallpaper.label}
                      draggable={false}
                      className="block w-full h-full object-cover select-none"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dynamic Contrast Dim Scrim */}
            {wallpaper.type !== 'default' && (
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none bg-black"
                style={{
                  opacity: effectiveDimOpacity,
                  transition: 'opacity 420ms ease',
                }}
              />
            )}
          </div>
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
        <div
          className={`hidden md:block absolute inset-0 z-10 ${
            pongHideStickers ? 'opacity-0 pointer-events-none' : ''
          }`}
        >
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

        {/* Desktop Top-Right Quick Actions (auto-hides while a window is maximized or Pong is active) */}
        <div
          className={`hidden md:flex fixed top-4 right-5 z-[60] items-center gap-2 ${
            pongSession
              ? 'opacity-0 pointer-events-none'
              : `transition-all duration-200 ${
                  hasMaximizedWindow ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                }`
          }`}
        >
          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              playClick();
              setIsExposeOpen(true);
            }}
            title="Window Overview (⌘/)"
            aria-label="Window Overview"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface/90 backdrop-blur-xl backdrop-saturate-150 border border-border shadow-medium text-xs font-medium text-text-main hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60"
          >
            <LayoutGrid size={13} />
            <span>Overview</span>
          </motion.button>
          <motion.button
            type="button"
            data-pong-search-pill="true"
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              playClick();
              setIsSpotlightOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface/90 backdrop-blur-xl backdrop-saturate-150 border border-border shadow-medium text-xs font-medium text-text-main hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60"
          >
            <Search size={13} />
            <span>⌘K</span>
          </motion.button>
          <motion.button
            type="button"
            data-pong-note-pill="true"
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              playClick();
              setIsCreatorOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface/90 backdrop-blur-xl backdrop-saturate-150 border border-border shadow-medium text-xs font-medium text-text-main hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60"
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
            onOpenContact={() => setIsContactOpen(true)}
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
          title="Resume / Dossier — Khan Hassan"
          contentClassName="p-0 bg-surface"
        >
          <ResumeWindow
            onOpenProject={openProjectShowcase}
            onOpenContact={() => setIsContactOpen(true)}
          />
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

        {/* Modals, Window Overview & Spotlight */}
        <StickerCreatorModal
          isOpen={isCreatorOpen}
          onClose={() => setIsCreatorOpen(false)}
          onCreate={(payload) => addSticker(payload)}
        />

        <QuickContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
        />

        <WindowExposeOverlay
          isOpen={isExposeOpen}
          onClose={() => setIsExposeOpen(false)}
          windows={windows}
          focusedWindowId={focusedWindowId}
          windowMeta={exposeWindowMeta}
          onFocusWindow={openWindowExplicit}
          onCloseWindow={closeWindow}
          onMinimizeAll={() => applyWorkspacePreset('clean-desk')}
        />

        <SpotlightLauncher
          isOpen={isSpotlightOpen}
          onClose={() => setIsSpotlightOpen(false)}
          onOpenWindow={openWindowExplicit}
          onOpenProject={openProjectShowcase}
          onApplyWorkspace={applyWorkspacePreset}
          onToggleInk={() => setIsInkMode((v) => !v)}
          onOpenNoteCreator={() => setIsCreatorOpen(true)}
          onOpenContact={() => setIsContactOpen(true)}
          onOpenExpose={() => setIsExposeOpen(true)}
          onNextWallpaper={handleNextWallpaper}
          onSetTheme={(t) => setTheme(t)}
          onResetDesktop={resetDesktop}
          onReboot={rebootSystem}
          onStartPong={startPong}
        />

        {/* Cursor Trail Layer */}
        <DesktopToyLayer mode={toyMode} />

        {/* Morphing Desktop Pong / Window Breakout Overlay */}
        {pongSession && (
          <DesktopPongOverlay
            geometry={pongSession.geometry}
            initialMode={pongSession.initialMode}
            onHideDesktopStickersChange={setPongHideStickers}
            onMorphOutStart={() => setIsPongExiting(true)}
            onFinishExit={handleFinishPong}
          />
        )}

        {/* FydeOS Floating Shelf */}
        <Dock
          items={dockItems}
          isInkMode={isInkMode}
          onToggleInkMode={() => setIsInkMode((v) => !v)}
          toyMode={toyMode}
          onCycleToyMode={cycleToyMode}
          onOpenSpotlight={() => setIsSpotlightOpen(true)}
          onOpenResume={() => openWindowExplicit('resume')}
          onOpenSettings={() => openWindowExplicit('settings')}
          onStartPong={() => startPong('ai')}
          isPongActive={Boolean(pongSession)}
        />
      </div>
    </ContextMenu>
  );
};

export default DesktopEnvironment;
