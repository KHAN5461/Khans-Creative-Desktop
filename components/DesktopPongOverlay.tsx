import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, RotateCcw, Trophy, Cpu, Users, LayoutGrid } from 'lucide-react';
import { StickerTone } from '../types';
import { useSound } from '../contexts/SoundContext';

export type PongMode = 'ai' | '2p' | 'bricks';

export interface RectBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface StickerSnapshot {
  id: string;
  text: string;
  tone: StickerTone;
  rotation: number;
  rect: RectBox;
}

export interface PongUiGeometry {
  menuBallRect: RectBox;
  dockRect: RectBox;
  isMobile: boolean;
  searchPillRect: RectBox | null;
  notePillRect: RectBox | null;
  mobileTopRect: RectBox | null;
  stickerSnapshots: StickerSnapshot[];
}

interface DesktopPongOverlayProps {
  geometry: PongUiGeometry;
  initialMode?: PongMode;
  onHideDesktopStickersChange: (hide: boolean) => void;
  onFinishExit: (summary?: { won: boolean; mode: PongMode; scoreText: string }) => void;
}

type PongPhase = 'morph-in' | 'playing' | 'gameover' | 'morph-out';
type ExitOutcome = 'player-win' | 'ai-win' | 'neutral';

interface BrickItem {
  id: string;
  text: string;
  tone: StickerTone;
  isDesktopSticker: boolean;
  origRect: RectBox;
  origRotation: number;
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  spawnProgress: number;
  hitFlash: number;
}

interface FlatParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  color: string;
  life: number;
  maxLife: number;
}

interface CalloutChip {
  id: number;
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
}

const WIN_SCORE = 5;
const MORPH_IN_MS = 640;
const MORPH_OUT_MS = 600;
const FLOURISH_PLAYER_MS = 380;
const FLOURISH_AI_MS = 400;

const TONE_HEX: Record<StickerTone, { bg: string; border: string; text: string }> = {
  surface: { bg: 'var(--bg-surface)', border: 'var(--border-subtle)', text: 'var(--text-main)' },
  amber: { bg: '#FFF3C4', border: '#E0BE58', text: '#3B2C00' },
  mint: { bg: '#DDF7E4', border: '#96D8AA', text: '#0E361B' },
  lavender: { bg: '#EAE4FF', border: '#BDB0F2', text: '#28165A' },
  rose: { bg: '#FFE2E8', border: '#F0A8B8', text: '#4E1021' },
};

const FALLBACK_BRICKS: Array<{ text: string; tone: StickerTone }> = [
  { text: 'gcp-cloud', tone: 'surface' },
  { text: 'crisismesh-ai', tone: 'mint' },
  { text: 'genai-builder', tone: 'amber' },
  { text: 'python-devops', tone: 'lavender' },
  { text: 'mumbai-eng', tone: 'rose' },
  { text: 'vertex-ai', tone: 'amber' },
  { text: 'react-19', tone: 'mint' },
  { text: 'm3-expressive', tone: 'lavender' },
  { text: 'docker-run', tone: 'surface' },
  { text: 'ship-fast', tone: 'rose' },
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOutCubic = (t: number) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const easeOutBack = (t: number) => {
  const x = clamp(t, 0, 1);
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const buildBrickGrid = (
  vw: number,
  vh: number,
  snapshots: StickerSnapshot[],
  wave: number
): BrickItem[] => {
  const isNarrow = vw < 768;
  const cols = isNarrow ? 3 : 5;
  const targetCount = isNarrow ? 9 : 10;
  const gapX = isNarrow ? 8 : 12;
  const gapY = isNarrow ? 8 : 10;
  const maxGridW = Math.min(vw - 32, isNarrow ? 360 : 720);
  const brickW = Math.floor((maxGridW - gapX * (cols - 1)) / cols);
  const brickH = isNarrow ? 34 : 38;
  const startX = Math.round((vw - (brickW * cols + gapX * (cols - 1))) / 2);
  const startY = Math.round(clamp(vh * 0.14, 78, 128));

  const items: BrickItem[] = [];
  const baseList: Array<{
    id: string;
    text: string;
    tone: StickerTone;
    isDesktopSticker: boolean;
    origRect: RectBox;
    origRotation: number;
  }> = [];

  snapshots.forEach((s) => {
    baseList.push({
      id: s.id,
      text: s.text,
      tone: s.tone,
      isDesktopSticker: true,
      origRect: s.rect,
      origRotation: s.rotation,
    });
  });

  let fallbackIdx = (wave - 1) * 3;
  while (baseList.length < targetCount) {
    const fb = FALLBACK_BRICKS[fallbackIdx % FALLBACK_BRICKS.length];
    baseList.push({
      id: `extra-brick-${wave}-${baseList.length}`,
      text: fb.text,
      tone: fb.tone,
      isDesktopSticker: false,
      origRect: {
        left: vw / 2 - brickW / 2,
        top: startY - 40,
        width: brickW,
        height: brickH,
      },
      origRotation: 0,
    });
    fallbackIdx++;
  }

  baseList.slice(0, Math.max(targetCount, snapshots.length)).forEach((entry, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    items.push({
      ...entry,
      x: startX + col * (brickW + gapX),
      y: startY + row * (brickH + gapY),
      w: brickW,
      h: brickH,
      alive: true,
      spawnProgress: 0,
      hitFlash: 0,
    });
  });

  return items;
};

const triggerDomRecoil = (el: HTMLElement, nx: number, ny: number, isWindow: boolean) => {
  try {
    const dist = isWindow ? 9 : 11;
    const rot = isWindow ? 0 : (nx >= 0 ? 1 : -1) * 5;
    el.animate(
      [
        {
          translate: '0px 0px',
          outline: '2px solid var(--primary)',
          outlineOffset: '0px',
        },
        {
          translate: `${Math.round(nx * dist)}px ${Math.round(ny * dist)}px`,
          outline: isWindow ? '3px solid var(--primary)' : '2px solid var(--primary)',
          outlineOffset: isWindow ? '2px' : '1px',
          ...(rot !== 0 ? { rotate: `${rot}deg` } : {}),
        },
        {
          translate: '0px 0px',
          outline: '2px solid transparent',
          outlineOffset: '0px',
        },
      ],
      {
        duration: isWindow ? 230 : 260,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    );
  } catch {
    // Web Animations API fallback: no-op
  }
};

const DesktopPongOverlay: React.FC<DesktopPongOverlayProps> = ({
  geometry,
  initialMode = 'ai',
  onHideDesktopStickersChange,
  onFinishExit,
}) => {
  const {
    playClick,
    playPongMorph,
    playPongPaddle,
    playPongWall,
    playPongBumper,
    playPongBrick,
    playPongScore,
    playPongHop,
    playLevelClear,
  } = useSound();

  const [mode, setMode] = useState<PongMode>(initialMode);
  const [phase, setPhase] = useState<PongPhase>('morph-in');
  const [scores, setScores] = useState({ player: 0, opponent: 0 });
  const [brickScore, setBrickScore] = useState(0);
  const [brickBest, setBrickBest] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = Number(localStorage.getItem('khan-pong-brick-best') || '0');
      return Number.isFinite(saved) ? saved : 0;
    }
    return 0;
  });
  const [brickLives, setBrickLives] = useState(3);
  const [brickWave, setBrickWave] = useState(1);
  const [brickList, setBrickList] = useState<BrickItem[]>([]);
  const [gameOverInfo, setGameOverInfo] = useState<{
    headline: string;
    subline: string;
    outcome: ExitOutcome;
  } | null>(null);
  const [show2PHints, setShow2PHints] = useState(true);
  const [exitSmugLabel, setExitSmugLabel] = useState<string | null>(null);
  const [exitWinLabel, setExitWinLabel] = useState<string | null>(null);

  // Refs for 60-120fps direct DOM updates (zero React re-renders per frame!)
  const dockProxyRef = useRef<HTMLDivElement>(null);
  const dockGhostIconsRef = useRef<HTMLDivElement>(null);
  const topUnifiedRef = useRef<HTMLDivElement>(null);
  const topPillARef = useRef<HTMLDivElement>(null);
  const topPillBRef = useRef<HTMLDivElement>(null);
  const topMobileProxyRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const ballFillRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<Array<HTMLDivElement | null>>([]);
  const brickLayerRef = useRef<HTMLDivElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);

  const modeRef = useRef<PongMode>(mode);
  const phaseRef = useRef<PongPhase>(phase);
  const scoresRef = useRef(scores);
  const brickScoreRef = useRef(brickScore);
  const brickBestRef = useRef(brickBest);
  const brickLivesRef = useRef(brickLives);
  const brickWaveRef = useRef(brickWave);
  const exitOutcomeRef = useRef<ExitOutcome>('neutral');

  modeRef.current = mode;
  phaseRef.current = phase;
  scoresRef.current = scores;
  brickScoreRef.current = brickScore;
  brickBestRef.current = brickBest;
  brickLivesRef.current = brickLives;
  brickWaveRef.current = brickWave;

  // Mutable live game state
  const stateRef = useRef({
    vw: typeof window !== 'undefined' ? window.innerWidth : 1280,
    vh: typeof window !== 'undefined' ? window.innerHeight : 800,
    phaseStart: performance.now(),
    morphOutSnapshot: {
      ballX: 0,
      ballY: 0,
      bottomX: 0,
      bottomW: 156,
      topX: 0,
      topW: 156,
      hopSoundPlayed: false,
      morphSoundPlayed: false,
    },
    // Paddles
    bottomX: 0,
    bottomTargetX: 0,
    bottomPrevX: 0,
    bottomW: 156,
    bottomH: 18,
    bottomY: 0,
    bottomKick: 0,
    topX: 0,
    topTargetX: 0,
    topPrevX: 0,
    topW: 156,
    topCurrentW: 156,
    topH: 18,
    topY: 32,
    topKick: 0,
    // Ball
    ballX: 0,
    ballY: 0,
    ballVx: 0,
    ballVy: 0,
    ballR: 10,
    ballSquashX: 1,
    ballSquashY: 1,
    ballAngle: 0,
    servePauseMs: 0,
    rallyStep: 0,
    combo: 0,
    trail: [] as Array<{ x: number; y: number }>,
    // Input
    keys: {
      left: false,
      right: false,
      a: false,
      d: false,
    },
    activeTouches: new Map<number, { x: number; y: number; side: 'top' | 'bottom' }>(),
    // Obstacles cooldown
    obstacleCooldown: new Map<Element, number>(),
    // Bricks
    bricks: [] as BrickItem[],
    brickMorphProgress: 0, // 0 = original desktop spot, 1 = breakout grid
    brickMorphTarget: 0,
    // Particles & Callouts
    particles: [] as FlatParticle[],
    callouts: [] as CalloutChip[],
    calloutSeq: 1,
  });

  // Keep parent informed whether real desktop stickers should hide (in Brick-Break mode)
  useEffect(() => {
    onHideDesktopStickersChange(mode === 'bricks');
  }, [mode, onHideDesktopStickersChange]);

  useEffect(() => {
    return () => {
      onHideDesktopStickersChange(false);
    };
  }, [onHideDesktopStickersChange]);

  const spawnCallout = useCallback((x: number, y: number, text: string) => {
    const s = stateRef.current;
    s.callouts.push({
      id: s.calloutSeq++,
      x,
      y,
      text,
      life: 0,
      maxLife: 620,
    });
  }, []);

  const spawnConfetti = useCallback((x: number, y: number, tone: StickerTone, count = 7) => {
    const s = stateRef.current;
    const palette =
      tone === 'surface'
        ? ['#D5A700', '#3B82F6', '#10B981', '#EC4899']
        : [TONE_HEX[tone].bg, TONE_HEX[tone].border, TONE_HEX[tone].text];
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spd = 90 + Math.random() * 190;
      s.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        size: 5 + Math.random() * 5,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 520,
        color: palette[i % palette.length],
        life: 0,
        maxLife: 420 + Math.random() * 240,
      });
    }
  }, []);

  const computeClearServePos = useCallback((vw: number, vh: number, currentMode: PongMode) => {
    if (currentMode === 'bricks') {
      return { x: vw / 2, y: Math.max(vh * 0.62, vh - 190) };
    }
    const candidateYs = [vh * 0.5, vh * 0.34, vh * 0.66, vh * 0.25, vh * 0.74];
    const winEls = Array.from(document.querySelectorAll<HTMLElement>('[data-pong-window]'));
    for (const cy of candidateYs) {
      const blocked = winEls.some((el) => {
        const r = el.getBoundingClientRect();
        return vw / 2 >= r.left - 18 && vw / 2 <= r.right + 18 && cy >= r.top - 18 && cy <= r.bottom + 18;
      });
      if (!blocked) return { x: vw / 2, y: cy };
    }
    return { x: vw / 2, y: vh - 120 };
  }, []);

  const serveBall = useCallback(
    (towardBottom = true, pauseMs = 380) => {
      const s = stateRef.current;
      const curMode = modeRef.current;
      const pos = computeClearServePos(s.vw, s.vh, curMode);
      s.ballX = pos.x;
      s.ballY = pos.y;
      s.trail = [];
      s.rallyStep = 0;
      s.combo = 0;
      s.servePauseMs = pauseMs;

      const baseSpeed = s.vw < 768 ? 390 : 480;
      if (curMode === 'bricks') {
        const angle = -Math.PI / 2 + (Math.random() * 0.65 - 0.325);
        s.ballVx = Math.cos(angle) * baseSpeed;
        s.ballVy = Math.sin(angle) * baseSpeed;
      } else {
        const spread = (Math.random() * 0.7 - 0.35) + (Math.random() > 0.5 ? 0.18 : -0.18);
        const dirY = towardBottom ? 1 : -1;
        s.ballVx = Math.sin(spread) * baseSpeed;
        s.ballVy = Math.cos(spread) * baseSpeed * dirY;
      }
    },
    [computeClearServePos]
  );

  const resetForMode = useCallback(
    (nextMode: PongMode, playAudio = true) => {
      const s = stateRef.current;
      setMode(nextMode);
      modeRef.current = nextMode;
      setScores({ player: 0, opponent: 0 });
      scoresRef.current = { player: 0, opponent: 0 };
      setBrickScore(0);
      brickScoreRef.current = 0;
      setBrickLives(3);
      brickLivesRef.current = 3;
      setBrickWave(1);
      brickWaveRef.current = 1;
      setGameOverInfo(null);
      setShow2PHints(nextMode === '2p');

      if (nextMode === 'bricks') {
        const built = buildBrickGrid(s.vw, s.vh, geometry.stickerSnapshots, 1);
        s.bricks = built;
        setBrickList(built);
        s.brickMorphProgress = 0;
        s.brickMorphTarget = 1;
      } else {
        s.brickMorphTarget = 0;
      }

      if (phaseRef.current === 'gameover') {
        setPhase('playing');
        phaseRef.current = 'playing';
      }

      if (phaseRef.current === 'playing') {
        serveBall(nextMode !== 'bricks', 420);
      }
      if (playAudio) playClick();
    },
    [geometry.stickerSnapshots, playClick, serveBall]
  );

  const beginExit = useCallback(
    (explicitOutcome?: ExitOutcome) => {
      if (phaseRef.current === 'morph-out') return;
      const s = stateRef.current;
      const outcome = explicitOutcome ?? exitOutcomeRef.current ?? 'neutral';
      exitOutcomeRef.current = outcome;

      s.morphOutSnapshot = {
        ballX: s.ballX,
        ballY: s.ballY,
        bottomX: s.bottomX,
        bottomW: s.bottomW,
        topX: s.topX,
        topW: s.topCurrentW,
        hopSoundPlayed: false,
        morphSoundPlayed: false,
      };
      s.phaseStart = performance.now();
      s.brickMorphTarget = 0;

      if (outcome === 'ai-win') {
        setExitSmugLabel('gg :)');
      } else if (outcome === 'player-win') {
        setExitWinLabel('WIN!');
      } else {
        setExitSmugLabel(null);
        setExitWinLabel(null);
      }

      setGameOverInfo(null);
      setPhase('morph-out');
      phaseRef.current = 'morph-out';
    },
    []
  );

  // Initialize dimensions & kick off morph-in sound
  useEffect(() => {
    const s = stateRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isNarrow = vw < 768;

    s.vw = vw;
    s.vh = vh;
    s.bottomW = isNarrow ? 124 : 156;
    s.bottomH = isNarrow ? 16 : 18;
    s.bottomY = vh - (isNarrow ? 34 : 38);
    s.bottomX = vw / 2;
    s.bottomTargetX = vw / 2;
    s.bottomPrevX = vw / 2;

    s.topW = isNarrow ? 124 : 156;
    s.topCurrentW = initialMode === 'bricks' ? Math.min(isNarrow ? vw - 36 : 620, vw * 0.84) : s.topW;
    s.topH = isNarrow ? 16 : 18;
    s.topY = isNarrow ? 28 : 30;
    s.topX = vw / 2;
    s.topTargetX = vw / 2;
    s.topPrevX = vw / 2;

    s.ballR = isNarrow ? 9 : 10;
    const servePos = computeClearServePos(vw, vh, initialMode);
    s.ballX = servePos.x;
    s.ballY = servePos.y;
    s.phaseStart = performance.now();

    if (initialMode === 'bricks') {
      const built = buildBrickGrid(vw, vh, geometry.stickerSnapshots, 1);
      s.bricks = built;
      setBrickList(built);
      s.brickMorphProgress = 0;
      s.brickMorphTarget = 1;
    }

    playPongMorph(true);
  }, [computeClearServePos, geometry.stickerSnapshots, initialMode, playPongMorph]);

  // Keyboard & resize listeners
  useEffect(() => {
    const onResize = () => {
      const s = stateRef.current;
      s.vw = window.innerWidth;
      s.vh = window.innerHeight;
      const isNarrow = s.vw < 768;
      s.bottomW = isNarrow ? 124 : 156;
      s.bottomY = s.vh - (isNarrow ? 34 : 38);
      s.topW = isNarrow ? 124 : 156;
      s.topY = isNarrow ? 28 : 30;
      s.bottomX = clamp(s.bottomX, s.bottomW / 2 + 12, s.vw - s.bottomW / 2 - 12);
      s.topX = clamp(s.topX, s.topCurrentW / 2 + 12, s.vw - s.topCurrentW / 2 - 12);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        beginExit(exitOutcomeRef.current);
        return;
      }
      const k = e.key.toLowerCase();
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = true;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = true;
      if (k === 'a') {
        stateRef.current.keys.a = true;
        if (modeRef.current === '2p') setShow2PHints(false);
      }
      if (k === 'd') {
        stateRef.current.keys.d = true;
        if (modeRef.current === '2p') setShow2PHints(false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = false;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = false;
      if (k === 'a') stateRef.current.keys.a = false;
      if (k === 'd') stateRef.current.keys.d = false;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [beginExit]);

  // Main 60-120fps Morph + Physics + Render Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const drawCanvasFx = (ctx: CanvasRenderingContext2D, vw: number, vh: number, dt: number) => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, vw, vh);

      // Update & render flat matte confetti particles (zero glow)
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt * 1000;
        if (p.life >= p.maxLife) {
          s.particles.splice(i, 1);
          continue;
        }
        p.vy += 420 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.72);
        ctx.restore();
      }

      // Update & render crisp flat callout chips ("BANK!", "+20", etc.)
      for (let i = s.callouts.length - 1; i >= 0; i--) {
        const c = s.callouts[i];
        c.life += dt * 1000;
        if (c.life >= c.maxLife) {
          s.callouts.splice(i, 1);
          continue;
        }
        const progress = c.life / c.maxLife;
        const y = c.y - progress * 28;
        const alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
        ctx.save();
        ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.font = '700 11px ui-monospace, SFMono-Regular, Menlo, monospace';
        const tw = ctx.measureText(c.text).width;
        const bw = tw + 14;
        const bh = 20;
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim() || '#111';
        ctx.beginPath();
        ctx.roundRect(c.x - bw / 2, y - bh / 2, bw, bh, 999);
        ctx.fill();
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim() || '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.text, c.x, y + 0.5);
        ctx.restore();
      }
    };

    const syncBricksDom = () => {
      const container = brickLayerRef.current;
      if (!container) return;
      const s = stateRef.current;
      const p = easeOutCubic(s.brickMorphProgress);
      const children = container.children;

      for (let i = 0; i < s.bricks.length; i++) {
        const b = s.bricks[i];
        const el = children[i] as HTMLElement | undefined;
        if (!el) continue;

        const curLeft = lerp(b.origRect.left, b.x, p);
        const curTop = lerp(b.origRect.top, b.y, p);
        const curW = lerp(b.origRect.width, b.w, p);
        const curH = lerp(b.origRect.height, b.h, p);
        const curRot = lerp(b.origRotation, 0, p);

        const returningDesktopSticker =
          !b.alive && b.isDesktopSticker && phaseRef.current === 'morph-out';

        if (!b.alive && !returningDesktopSticker) {
          el.style.opacity = '0';
          el.style.transform = `translate3d(${curLeft}px, ${curTop}px, 0) scale(0.6)`;
          continue;
        }

        const scale = returningDesktopSticker ? lerp(1, 0.72, p) : 1;
        const opacity = returningDesktopSticker
          ? clamp(1 - p * 0.9, 0, 1)
          : !b.isDesktopSticker
            ? clamp(p * 1.4, 0, 1)
            : 1;

        el.style.width = `${curW}px`;
        el.style.height = `${curH}px`;
        el.style.opacity = `${opacity}`;
        el.style.transform = `translate3d(${curLeft}px, ${curTop}px, 0) rotate(${curRot}deg) scale(${scale})`;
      }
    };

    const updateDomElements = (
      dockBox: { x: number; y: number; w: number; h: number; r: number; ghostAlpha: number },
      topState: {
        mode: 'unified' | 'desktop-split' | 'mobile-single';
        unified?: { x: number; y: number; w: number; h: number; r: number; rot?: number };
        pillA?: { x: number; y: number; w: number; h: number; labelAlpha: number; opacity: number };
        pillB?: { x: number; y: number; w: number; h: number; labelAlpha: number; opacity: number };
        mobile?: { x: number; y: number; w: number; h: number; labelAlpha: number };
      },
      ballState: {
        x: number;
        y: number;
        d: number;
        fillScale: number;
        ringOpacity: number;
        squashX: number;
        squashY: number;
        angle: number;
        showTrail: boolean;
      }
    ) => {
      // Bottom Dock / Paddle
      if (dockProxyRef.current) {
        const el = dockProxyRef.current;
        el.style.transform = `translate3d(${dockBox.x}px, ${dockBox.y}px, 0)`;
        el.style.width = `${dockBox.w}px`;
        el.style.height = `${dockBox.h}px`;
        el.style.borderRadius = `${dockBox.r}px`;
      }
      if (dockGhostIconsRef.current) {
        dockGhostIconsRef.current.style.opacity = `${clamp(dockBox.ghostAlpha, 0, 1)}`;
      }

      // Top Paddle / Chrome Pills
      if (topUnifiedRef.current) {
        if (topState.mode === 'unified' && topState.unified) {
          const u = topState.unified;
          topUnifiedRef.current.style.opacity = '1';
          topUnifiedRef.current.style.transform = `translate3d(${u.x}px, ${u.y}px, 0) rotate(${u.rot ?? 0}deg)`;
          topUnifiedRef.current.style.width = `${u.w}px`;
          topUnifiedRef.current.style.height = `${u.h}px`;
          topUnifiedRef.current.style.borderRadius = `${u.r}px`;
        } else {
          topUnifiedRef.current.style.opacity = '0';
        }
      }

      if (topPillARef.current) {
        if (topState.mode === 'desktop-split' && topState.pillA) {
          const a = topState.pillA;
          topPillARef.current.style.opacity = `${a.opacity}`;
          topPillARef.current.style.transform = `translate3d(${a.x}px, ${a.y}px, 0)`;
          topPillARef.current.style.width = `${a.w}px`;
          topPillARef.current.style.height = `${a.h}px`;
          const inner = topPillARef.current.firstElementChild as HTMLElement | null;
          if (inner) inner.style.opacity = `${a.labelAlpha}`;
        } else {
          topPillARef.current.style.opacity = '0';
        }
      }

      if (topPillBRef.current) {
        if (topState.mode === 'desktop-split' && topState.pillB) {
          const b = topState.pillB;
          topPillBRef.current.style.opacity = `${b.opacity}`;
          topPillBRef.current.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
          topPillBRef.current.style.width = `${b.w}px`;
          topPillBRef.current.style.height = `${b.h}px`;
          const inner = topPillBRef.current.firstElementChild as HTMLElement | null;
          if (inner) inner.style.opacity = `${b.labelAlpha}`;
        } else {
          topPillBRef.current.style.opacity = '0';
        }
      }

      if (topMobileProxyRef.current) {
        if (topState.mode === 'mobile-single' && topState.mobile) {
          const m = topState.mobile;
          topMobileProxyRef.current.style.opacity = '1';
          topMobileProxyRef.current.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
          topMobileProxyRef.current.style.width = `${m.w}px`;
          topMobileProxyRef.current.style.height = `${m.h}px`;
          const inner = topMobileProxyRef.current.firstElementChild as HTMLElement | null;
          if (inner) inner.style.opacity = `${m.labelAlpha}`;
        } else {
          topMobileProxyRef.current.style.opacity = '0';
        }
      }

      // Matte Ball (no glow)
      if (ballRef.current) {
        const half = ballState.d / 2;
        ballRef.current.style.width = `${ballState.d}px`;
        ballRef.current.style.height = `${ballState.d}px`;
        ballRef.current.style.transform = `translate3d(${ballState.x - half}px, ${ballState.y - half}px, 0) rotate(${ballState.angle}rad) scale(${ballState.squashX}, ${ballState.squashY})`;
      }
      if (ballFillRef.current) {
        ballFillRef.current.style.transform = `scale(${clamp(ballState.fillScale, 0, 1)})`;
        ballFillRef.current.style.opacity = `${clamp(ballState.fillScale * 1.15, 0, 1)}`;
      }

      // Crisp flat matte trail dots (zero glow)
      const trail = stateRef.current.trail;
      for (let i = 0; i < 5; i++) {
        const dot = trailRefs.current[i];
        if (!dot) continue;
        const pt = ballState.showTrail ? trail[trail.length - 1 - i] : undefined;
        if (!pt) {
          dot.style.opacity = '0';
        } else {
          const size = Math.max(4, ballState.d * (0.58 - i * 0.09));
          dot.style.width = `${size}px`;
          dot.style.height = `${size}px`;
          dot.style.opacity = `${0.24 - i * 0.042}`;
          dot.style.transform = `translate3d(${pt.x - size / 2}px, ${pt.y - size / 2}px, 0)`;
        }
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const s = stateRef.current;
      const curPhase = phaseRef.current;
      const curMode = modeRef.current;

      // Resize canvas cleanly if needed
      const canvas = fxCanvasRef.current;
      if (canvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetW = Math.round(s.vw * dpr);
        const targetH = Math.round(s.vh * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawCanvasFx(ctx, s.vw, s.vh, dt);
        }
      }

      // Smoothly animate top paddle width when switching between Bricks wall & Rally paddle
      const desiredTopW =
        curMode === 'bricks'
          ? Math.min(s.vw < 768 ? s.vw - 36 : 620, s.vw * 0.84)
          : s.topW;
      s.topCurrentW = lerp(s.topCurrentW, desiredTopW, 1 - Math.exp(-12 * dt));

      // Smooth brick grid morph progress
      s.brickMorphProgress = lerp(s.brickMorphProgress, s.brickMorphTarget, 1 - Math.exp(-10 * dt));
      if (Math.abs(s.brickMorphProgress - s.brickMorphTarget) < 0.004) {
        s.brickMorphProgress = s.brickMorphTarget;
      }

      // Recover ball squash/stretch & paddle kicks
      s.ballSquashX = lerp(s.ballSquashX, 1, 1 - Math.exp(-18 * dt));
      s.ballSquashY = lerp(s.ballSquashY, 1, 1 - Math.exp(-18 * dt));
      s.bottomKick = lerp(s.bottomKick, 0, 1 - Math.exp(-18 * dt));
      s.topKick = lerp(s.topKick, 0, 1 - Math.exp(-18 * dt));

      const menuStartX = geometry.menuBallRect.left + geometry.menuBallRect.width / 2;
      const menuStartY = geometry.menuBallRect.top + geometry.menuBallRect.height / 2;
      const ballDiameter = s.ballR * 2;

      // =====================================================
      // PHASE 1: MORPH-IN (UI -> Pong Arena)
      // =====================================================
      if (curPhase === 'morph-in') {
        const rawT = clamp((now - s.phaseStart) / MORPH_IN_MS, 0, 1);
        const t = easeOutCubic(rawT);
        const backT = easeOutBack(rawT);

        // Dock -> Bottom Paddle
        const targetBottomLeft = s.bottomX - s.bottomW / 2;
        const targetBottomTop = s.bottomY - s.bottomH / 2;
        const dockBox = {
          x: lerp(geometry.dockRect.left, targetBottomLeft, t),
          y: lerp(geometry.dockRect.top, targetBottomTop, t),
          w: lerp(geometry.dockRect.width, s.bottomW, t),
          h: lerp(geometry.dockRect.height, s.bottomH, t),
          r: lerp(28, 999, t),
          ghostAlpha: clamp(1 - rawT * 2.8, 0, 1),
        };

        // Top Chrome -> Top Paddle
        const targetTopLeft = s.topX - s.topCurrentW / 2;
        const targetTopTop = s.topY - s.topH / 2;
        let topState: Parameters<typeof updateDomElements>[1];

        if (!geometry.isMobile && geometry.searchPillRect && geometry.notePillRect) {
          if (rawT < 0.8) {
            const mergeT = easeInOutCubic(rawT / 0.8);
            const halfW = s.topCurrentW / 2;
            topState = {
              mode: 'desktop-split',
              pillA: {
                x: lerp(geometry.searchPillRect.left, targetTopLeft, mergeT),
                y: lerp(geometry.searchPillRect.top, targetTopTop, mergeT),
                w: lerp(geometry.searchPillRect.width, halfW + 10, mergeT),
                h: lerp(geometry.searchPillRect.height, s.topH, mergeT),
                labelAlpha: clamp(1 - rawT * 3.2, 0, 1),
                opacity: 1,
              },
              pillB: {
                x: lerp(geometry.notePillRect.left, targetTopLeft + halfW - 10, mergeT),
                y: lerp(geometry.notePillRect.top, targetTopTop, mergeT),
                w: lerp(geometry.notePillRect.width, halfW + 10, mergeT),
                h: lerp(geometry.notePillRect.height, s.topH, mergeT),
                labelAlpha: clamp(1 - rawT * 3.2, 0, 1),
                opacity: 1,
              },
            };
          } else {
            topState = {
              mode: 'unified',
              unified: {
                x: targetTopLeft,
                y: targetTopTop,
                w: s.topCurrentW,
                h: s.topH,
                r: 999,
              },
            };
          }
        } else if (geometry.mobileTopRect) {
          if (rawT < 0.85) {
            const mt = easeInOutCubic(rawT / 0.85);
            topState = {
              mode: 'mobile-single',
              mobile: {
                x: lerp(geometry.mobileTopRect.left, targetTopLeft, mt),
                y: lerp(geometry.mobileTopRect.top, targetTopTop, mt),
                w: lerp(geometry.mobileTopRect.width, s.topCurrentW, mt),
                h: lerp(geometry.mobileTopRect.height, s.topH, mt),
                labelAlpha: clamp(1 - rawT * 3.2, 0, 1),
              },
            };
          } else {
            topState = {
              mode: 'unified',
              unified: {
                x: targetTopLeft,
                y: targetTopTop,
                w: s.topCurrentW,
                h: s.topH,
                r: 999,
              },
            };
          }
        } else {
          topState = {
            mode: 'unified',
            unified: {
              x: targetTopLeft,
              y: targetTopTop,
              w: s.topCurrentW,
              h: s.topH,
              r: 999,
            },
          };
        }

        // Menu Button Ring -> Solid Matte Ball arcing to center
        const arcLift = Math.sin(rawT * Math.PI) * 90;
        const bx = lerp(menuStartX, s.ballX, backT);
        const by = lerp(menuStartY, s.ballY, t) - arcLift;
        const stretch = 1 + Math.sin(rawT * Math.PI) * 0.14;

        updateDomElements(dockBox, topState, {
          x: bx,
          y: by,
          d: lerp(20, ballDiameter, t),
          fillScale: easeOutCubic((rawT - 0.12) / 0.55),
          ringOpacity: 1,
          squashX: stretch,
          squashY: 1 / stretch,
          angle: Math.atan2(s.ballY - menuStartY, s.ballX - menuStartX),
          showTrail: false,
        });

        syncBricksDom();

        if (rawT >= 1) {
          setPhase('playing');
          phaseRef.current = 'playing';
          serveBall(curMode !== 'bricks', 320);
        }
      }

      // =====================================================
      // PHASE 2 & 3: PLAYING & GAMEOVER
      // =====================================================
      else if (curPhase === 'playing' || curPhase === 'gameover') {
        const keySpeed = s.vw < 768 ? 520 : 680;

        if (curPhase === 'playing') {
          // Bottom paddle movement (keyboard + pointer/touch target)
          s.bottomPrevX = s.bottomX;
          if (s.keys.left) s.bottomTargetX -= keySpeed * dt;
          if (s.keys.right) s.bottomTargetX += keySpeed * dt;
          s.bottomTargetX = clamp(s.bottomTargetX, s.bottomW / 2 + 10, s.vw - s.bottomW / 2 - 10);
          s.bottomX = lerp(s.bottomX, s.bottomTargetX, 1 - Math.exp(-26 * dt));

          // Top paddle movement
          s.topPrevX = s.topX;
          if (curMode === 'bricks') {
            s.topTargetX = s.vw / 2;
            s.topX = lerp(s.topX, s.topTargetX, 1 - Math.exp(-12 * dt));
          } else if (curMode === '2p') {
            if (s.keys.a) s.topTargetX -= keySpeed * dt;
            if (s.keys.d) s.topTargetX += keySpeed * dt;
            s.topTargetX = clamp(s.topTargetX, s.topCurrentW / 2 + 10, s.vw - s.topCurrentW / 2 - 10);
            s.topX = lerp(s.topX, s.topTargetX, 1 - Math.exp(-26 * dt));
          } else {
            // Playful human-like AI for Search + Notes top paddle
            const ballComingUp = s.ballVy < 0;
            const aiTarget = ballComingUp
              ? s.ballX + Math.sin(now * 0.004) * 18
              : s.vw / 2 + Math.sin(now * 0.0018) * 60;
            const aiMaxSpeed = s.vw < 768 ? 370 : 490;
            const diff = clamp(aiTarget, s.topCurrentW / 2 + 10, s.vw - s.topCurrentW / 2 - 10) - s.topX;
            const step = clamp(diff, -aiMaxSpeed * dt, aiMaxSpeed * dt);
            s.topX += step;
          }

          // Ball serve pause countdown
          if (s.servePauseMs > 0) {
            s.servePauseMs = Math.max(0, s.servePauseMs - dt * 1000);
          } else {
            // Move ball
            s.ballX += s.ballVx * dt;
            s.ballY += s.ballVy * dt;

            // Update flat trail breadcrumbs
            s.trail.push({ x: s.ballX, y: s.ballY });
            if (s.trail.length > 6) s.trail.shift();

            // Side wall collisions
            if (s.ballX - s.ballR <= 8) {
              s.ballX = 8 + s.ballR;
              s.ballVx = Math.abs(s.ballVx);
              s.ballSquashX = 0.78;
              s.ballSquashY = 1.24;
              playPongWall();
            } else if (s.ballX + s.ballR >= s.vw - 8) {
              s.ballX = s.vw - 8 - s.ballR;
              s.ballVx = -Math.abs(s.ballVx);
              s.ballSquashX = 0.78;
              s.ballSquashY = 1.24;
              playPongWall();
            }

            const maxBallSpeed = s.vw < 768 ? 670 : 820;

            // Bottom Dock Paddle collision
            const bTop = s.bottomY - s.bottomH / 2;
            const bBot = s.bottomY + s.bottomH / 2;
            if (
              s.ballVy > 0 &&
              s.ballY + s.ballR >= bTop &&
              s.ballY - s.ballR <= bBot + 10 &&
              s.ballX >= s.bottomX - s.bottomW / 2 - s.ballR &&
              s.ballX <= s.bottomX + s.bottomW / 2 + s.ballR
            ) {
              const offset = clamp((s.ballX - s.bottomX) / (s.bottomW / 2), -1, 1);
              const paddleVel = (s.bottomX - s.bottomPrevX) / dt;
              const speed = Math.min(maxBallSpeed, Math.hypot(s.ballVx, s.ballVy) * 1.045 + 8);
              const angle = offset * 1.02 + clamp(paddleVel * 0.00045, -0.24, 0.24);
              s.ballVx = Math.sin(angle) * speed;
              s.ballVy = -Math.abs(Math.cos(angle) * speed);
              if (Math.abs(s.ballVy) < speed * 0.45) {
                s.ballVy = -speed * 0.45;
              }
              s.ballY = bTop - s.ballR - 1;
              s.ballSquashX = 1.28;
              s.ballSquashY = 0.75;
              s.bottomKick = 5;
              s.rallyStep += 1;
              s.combo = 0;
              playPongPaddle(s.rallyStep);
            }

            // Top Search+Notes Paddle (or Brick-Break Rebound Bar) collision
            const tTop = s.topY - s.topH / 2;
            const tBot = s.topY + s.topH / 2;
            if (
              s.ballVy < 0 &&
              s.ballY - s.ballR <= tBot &&
              s.ballY + s.ballR >= tTop - 10 &&
              s.ballX >= s.topX - s.topCurrentW / 2 - s.ballR &&
              s.ballX <= s.topX + s.topCurrentW / 2 + s.ballR
            ) {
              if (curMode === 'bricks') {
                s.ballVy = Math.abs(s.ballVy);
                s.ballY = tBot + s.ballR + 1;
                s.topKick = -4;
                s.ballSquashX = 1.24;
                s.ballSquashY = 0.78;
                playPongWall();
              } else {
                const offset = clamp((s.ballX - s.topX) / (s.topCurrentW / 2), -1, 1);
                const paddleVel = (s.topX - s.topPrevX) / dt;
                const speed = Math.min(maxBallSpeed, Math.hypot(s.ballVx, s.ballVy) * 1.045 + 8);
                const angle = offset * 1.02 + clamp(paddleVel * 0.00045, -0.24, 0.24);
                s.ballVx = Math.sin(angle) * speed;
                s.ballVy = Math.abs(Math.cos(angle) * speed);
                if (Math.abs(s.ballVy) < speed * 0.45) {
                  s.ballVy = speed * 0.45;
                }
                s.ballY = tBot + s.ballR + 1;
                s.ballSquashX = 1.28;
                s.ballSquashY = 0.75;
                s.topKick = -5;
                s.rallyStep += 1;
                playPongPaddle(s.rallyStep);
              }
            }

            // Top ceiling bounce in Bricks mode (if ball slips past wider bar edges)
            if (curMode === 'bricks' && s.ballY - s.ballR <= 8) {
              s.ballY = 8 + s.ballR;
              s.ballVy = Math.abs(s.ballVy);
              playPongWall();
            }

            // Brick-Break Sticker Brick Collisions
            if (curMode === 'bricks' && s.brickMorphProgress > 0.75) {
              let aliveCount = 0;
              let hitThisFrame = false;
              for (const b of s.bricks) {
                if (!b.alive) continue;
                aliveCount++;
                if (hitThisFrame) continue;

                const closestX = clamp(s.ballX, b.x, b.x + b.w);
                const closestY = clamp(s.ballY, b.y, b.y + b.h);
                const dx = s.ballX - closestX;
                const dy = s.ballY - closestY;
                if (dx * dx + dy * dy <= s.ballR * s.ballR) {
                  hitThisFrame = true;
                  b.alive = false;
                  aliveCount--;

                  // Reflect along dominant penetration axis
                  const overlapLeft = s.ballX + s.ballR - b.x;
                  const overlapRight = b.x + b.w - (s.ballX - s.ballR);
                  const overlapTop = s.ballY + s.ballR - b.y;
                  const overlapBottom = b.y + b.h - (s.ballY - s.ballR);
                  const minOverlapX = Math.min(overlapLeft, overlapRight);
                  const minOverlapY = Math.min(overlapTop, overlapBottom);
                  if (minOverlapX < minOverlapY) {
                    s.ballVx = -s.ballVx;
                  } else {
                    s.ballVy = -s.ballVy;
                  }

                  s.ballSquashX = 1.25;
                  s.ballSquashY = 0.78;
                  s.combo += 1;
                  const pts = 10 * Math.min(s.combo, 5);
                  const nextScore = brickScoreRef.current + pts;
                  brickScoreRef.current = nextScore;
                  setBrickScore(nextScore);
                  if (nextScore > brickBestRef.current) {
                    brickBestRef.current = nextScore;
                    setBrickBest(nextScore);
                    try {
                      localStorage.setItem('khan-pong-brick-best', String(nextScore));
                    } catch {
                      // ignore
                    }
                  }

                  playPongBrick(s.combo - 1);
                  spawnConfetti(b.x + b.w / 2, b.y + b.h / 2, b.tone, 8);
                  spawnCallout(b.x + b.w / 2, b.y + b.h / 2, s.combo > 1 ? `+${pts} ×${s.combo}` : `+${pts}`);
                }
              }

              // Wave Cleared -> spawn next wave!
              if (aliveCount === 0 && s.bricks.length > 0) {
                const nextWave = brickWaveRef.current + 1;
                brickWaveRef.current = nextWave;
                setBrickWave(nextWave);
                playLevelClear();
                spawnCallout(s.vw / 2, s.vh * 0.42, `WAVE ${nextWave}!`);
                const built = buildBrickGrid(s.vw, s.vh, geometry.stickerSnapshots, nextWave);
                s.bricks = built;
                setBrickList(built);
                s.brickMorphProgress = 0.35;
                s.brickMorphTarget = 1;
              }
            }

            // Open Floating Windows & Desktop Stickers as Live Bumpers
            const bumperSelector =
              curMode === 'bricks' ? '[data-pong-window]' : '[data-pong-window], [data-pong-sticker]';
            const obstacles = document.querySelectorAll<HTMLElement>(bumperSelector);
            for (const el of obstacles) {
              const lastHit = s.obstacleCooldown.get(el) || 0;
              if (now - lastHit < 120) continue;

              const rect = el.getBoundingClientRect();
              if (rect.width <= 0 || rect.height <= 0) continue;
              // Skip if window covers almost the entire viewport
              if (rect.width > s.vw * 0.78 && rect.height > s.vh * 0.72) continue;

              const closestX = clamp(s.ballX, rect.left, rect.right);
              const closestY = clamp(s.ballY, rect.top, rect.bottom);
              const dx = s.ballX - closestX;
              const dy = s.ballY - closestY;

              if (dx * dx + dy * dy <= s.ballR * s.ballR) {
                s.obstacleCooldown.set(el, now);
                const overlapL = s.ballX + s.ballR - rect.left;
                const overlapR = rect.right - (s.ballX - s.ballR);
                const overlapT = s.ballY + s.ballR - rect.top;
                const overlapB = rect.bottom - (s.ballY - s.ballR);
                const minX = Math.min(overlapL, overlapR);
                const minY = Math.min(overlapT, overlapB);

                let nx = 0;
                let ny = 0;
                if (minX < minY) {
                  nx = overlapL < overlapR ? 1 : -1;
                  s.ballVx = -nx * Math.max(Math.abs(s.ballVx), 260);
                  s.ballX = overlapL < overlapR ? rect.left - s.ballR - 1 : rect.right + s.ballR + 1;
                } else {
                  ny = overlapT < overlapB ? 1 : -1;
                  s.ballVy = -ny * Math.max(Math.abs(s.ballVy), 260);
                  s.ballY = overlapT < overlapB ? rect.top - s.ballR - 1 : rect.bottom + s.ballR + 1;
                }

                const isWindow = el.hasAttribute('data-pong-window');
                triggerDomRecoil(el, nx, ny, isWindow);
                s.ballSquashX = 1.24;
                s.ballSquashY = 0.78;
                s.combo += 1;
                playPongBumper(s.combo);

                const toneAttr = (el.getAttribute('data-pong-sticker-tone') as StickerTone) || 'surface';
                spawnConfetti(closestX, closestY, isWindow ? 'surface' : toneAttr, 4);
                spawnCallout(closestX, closestY - 12, isWindow ? 'BANK!' : 'BOUNCE!');
                break;
              }
            }

            // Scoring / Life Loss Checks
            if (s.ballY - s.ballR > s.vh + 12) {
              if (curMode === 'bricks') {
                const nextLives = brickLivesRef.current - 1;
                brickLivesRef.current = nextLives;
                setBrickLives(nextLives);
                playPongScore(false);
                if (nextLives <= 0) {
                  const wonRun = brickScoreRef.current >= 100 || brickWaveRef.current > 1;
                  exitOutcomeRef.current = wonRun ? 'player-win' : 'neutral';
                  setGameOverInfo({
                    headline: wonRun ? 'Great Brick Run!' : 'Run Complete',
                    subline: `Score ${brickScoreRef.current} · Best ${brickBestRef.current} · Wave ${brickWaveRef.current}`,
                    outcome: exitOutcomeRef.current,
                  });
                  setPhase('gameover');
                  phaseRef.current = 'gameover';
                } else {
                  serveBall(false, 480);
                }
              } else {
                const nextOpp = scoresRef.current.opponent + 1;
                const nextScores = { ...scoresRef.current, opponent: nextOpp };
                scoresRef.current = nextScores;
                setScores(nextScores);
                playPongScore(false);

                if (nextOpp >= WIN_SCORE) {
                  const outcome: ExitOutcome = curMode === 'ai' ? 'ai-win' : 'neutral';
                  exitOutcomeRef.current = outcome;
                  setGameOverInfo({
                    headline: curMode === 'ai' ? 'Search & Notes Wins!' : 'Top Paddle Wins!',
                    subline: `Final Score ${nextScores.opponent} — ${nextScores.player}`,
                    outcome,
                  });
                  setPhase('gameover');
                  phaseRef.current = 'gameover';
                } else {
                  serveBall(false, 520);
                }
              }
            } else if (curMode !== 'bricks' && s.ballY + s.ballR < -12) {
              const nextPlayer = scoresRef.current.player + 1;
              const nextScores = { ...scoresRef.current, player: nextPlayer };
              scoresRef.current = nextScores;
              setScores(nextScores);
              playPongScore(true);

              if (nextPlayer >= WIN_SCORE) {
                exitOutcomeRef.current = 'player-win';
                playLevelClear();
                setGameOverInfo({
                  headline: curMode === 'ai' ? 'You Beat Search & Notes!' : 'Dock Paddle Wins!',
                  subline: `Final Score ${nextScores.player} — ${nextScores.opponent}`,
                  outcome: 'player-win',
                });
                setPhase('gameover');
                phaseRef.current = 'gameover';
              } else {
                serveBall(true, 520);
              }
            }
          }
        }

        // Update Live DOM Positions
        updateDomElements(
          {
            x: s.bottomX - s.bottomW / 2,
            y: s.bottomY - s.bottomH / 2 + s.bottomKick,
            w: s.bottomW,
            h: s.bottomH,
            r: 999,
            ghostAlpha: 0,
          },
          {
            mode: 'unified',
            unified: {
              x: s.topX - s.topCurrentW / 2,
              y: s.topY - s.topH / 2 + s.topKick,
              w: s.topCurrentW,
              h: s.topH,
              r: 999,
            },
          },
          {
            x: s.ballX,
            y: s.ballY,
            d: ballDiameter,
            fillScale: 1,
            ringOpacity: 1,
            squashX: s.ballSquashX,
            squashY: s.ballSquashY,
            angle: Math.atan2(s.ballVy, s.ballVx),
            showTrail: curPhase === 'playing' && s.servePauseMs <= 0,
          }
        );

        syncBricksDom();
      }

      // =====================================================
      // PHASE 4: MORPH-OUT (Reverse Morph + #7 Playful Exit!)
      // =====================================================
      else if (curPhase === 'morph-out') {
        const elapsed = now - s.phaseStart;
        const outcome = exitOutcomeRef.current;
        const snap = s.morphOutSnapshot;

        const flourishMs =
          outcome === 'player-win'
            ? FLOURISH_PLAYER_MS
            : outcome === 'ai-win'
              ? FLOURISH_AI_MS
              : 0;

        // Play #7 Flourish beat before the reverse morph
        if (elapsed < flourishMs) {
          const ft = clamp(elapsed / flourishMs, 0, 1);

          if (!snap.hopSoundPlayed) {
            snap.hopSoundPlayed = true;
            playPongHop();
          }

          let bx = snap.ballX;
          let by = snap.ballY;
          let bSquashX = 1;
          let bSquashY = 1;
          let bottomKickOffset = 0;
          let topHopY = 0;
          let topHopRot = 0;

          if (outcome === 'player-win') {
            // Ball hops down onto the top of the dock paddle, then bounces high with excitement!
            const dockTopY = s.bottomY - s.bottomH / 2 - s.ballR;
            if (ft < 0.45) {
              const p1 = easeInOutCubic(ft / 0.45);
              bx = lerp(snap.ballX, snap.bottomX, p1);
              by = lerp(snap.ballY, dockTopY, p1);
            } else {
              const p2 = (ft - 0.45) / 0.55;
              bx = snap.bottomX;
              by = dockTopY - Math.sin(p2 * Math.PI) * 96;
              if (p2 < 0.22) {
                bottomKickOffset = Math.sin((p2 / 0.22) * Math.PI) * 7;
                bSquashX = 1.32;
                bSquashY = 0.72;
              } else {
                bSquashX = 0.9;
                bSquashY = 1.12;
              }
            }
          } else if (outcome === 'ai-win') {
            // Search & Notes top paddle does two smug playful bounces + tilt wiggle
            const bounce = Math.abs(Math.sin(ft * Math.PI * 2));
            topHopY = bounce * 14;
            topHopRot = Math.sin(ft * Math.PI * 4) * 5.5;
            bx = lerp(snap.ballX, s.vw / 2, ft * 0.4);
            by = lerp(snap.ballY, s.vh * 0.52, ft * 0.4);
          }

          updateDomElements(
            {
              x: snap.bottomX - snap.bottomW / 2,
              y: s.bottomY - s.bottomH / 2 + bottomKickOffset,
              w: snap.bottomW,
              h: s.bottomH,
              r: 999,
              ghostAlpha: 0,
            },
            {
              mode: 'unified',
              unified: {
                x: snap.topX - snap.topW / 2,
                y: s.topY - s.topH / 2 + topHopY,
                w: snap.topW,
                h: s.topH,
                r: 999,
                rot: topHopRot,
              },
            },
            {
              x: bx,
              y: by,
              d: ballDiameter,
              fillScale: 1,
              ringOpacity: 1,
              squashX: bSquashX,
              squashY: bSquashY,
              angle: 0,
              showTrail: false,
            }
          );

          syncBricksDom();
        } else {
          // Main synchronized reverse morph back to normal KhanOS UI
          if (!snap.morphSoundPlayed) {
            snap.morphSoundPlayed = true;
            playPongMorph(false);
            setExitSmugLabel(null);
            setExitWinLabel(null);
          }

          const rawT = clamp((elapsed - flourishMs) / MORPH_OUT_MS, 0, 1);
          const t = easeInOutCubic(rawT);

          // Bottom Paddle -> Full Floating Shelf
          const startBottomLeft = snap.bottomX - snap.bottomW / 2;
          const startBottomTop = s.bottomY - s.bottomH / 2;
          const dockBox = {
            x: lerp(startBottomLeft, geometry.dockRect.left, t),
            y: lerp(startBottomTop, geometry.dockRect.top, t),
            w: lerp(snap.bottomW, geometry.dockRect.width, t),
            h: lerp(s.bottomH, geometry.dockRect.height, t),
            r: lerp(999, 28, t),
            ghostAlpha: clamp((rawT - 0.48) / 0.5, 0, 1),
          };

          // Top Paddle -> Split back into Search + New Note (Desktop) or Mobile Top Bar
          const startTopLeft = snap.topX - snap.topW / 2;
          const startTopTop = s.topY - s.topH / 2;
          let topState: Parameters<typeof updateDomElements>[1];

          if (!geometry.isMobile && geometry.searchPillRect && geometry.notePillRect) {
            if (rawT < 0.14) {
              topState = {
                mode: 'unified',
                unified: {
                  x: startTopLeft,
                  y: startTopTop,
                  w: snap.topW,
                  h: s.topH,
                  r: 999,
                },
              };
            } else {
              const splitT = easeInOutCubic((rawT - 0.14) / 0.86);
              const halfW = snap.topW / 2;
              topState = {
                mode: 'desktop-split',
                pillA: {
                  x: lerp(startTopLeft, geometry.searchPillRect.left, splitT),
                  y: lerp(startTopTop, geometry.searchPillRect.top, splitT),
                  w: lerp(halfW + 10, geometry.searchPillRect.width, splitT),
                  h: lerp(s.topH, geometry.searchPillRect.height, splitT),
                  labelAlpha: clamp((splitT - 0.55) / 0.45, 0, 1),
                  opacity: 1,
                },
                pillB: {
                  x: lerp(startTopLeft + halfW - 10, geometry.notePillRect.left, splitT),
                  y: lerp(startTopTop, geometry.notePillRect.top, splitT),
                  w: lerp(halfW + 10, geometry.notePillRect.width, splitT),
                  h: lerp(s.topH, geometry.notePillRect.height, splitT),
                  labelAlpha: clamp((splitT - 0.55) / 0.45, 0, 1),
                  opacity: 1,
                },
              };
            }
          } else if (geometry.mobileTopRect) {
            topState = {
              mode: 'mobile-single',
              mobile: {
                x: lerp(startTopLeft, geometry.mobileTopRect.left, t),
                y: lerp(startTopTop, geometry.mobileTopRect.top, t),
                w: lerp(snap.topW, geometry.mobileTopRect.width, t),
                h: lerp(s.topH, geometry.mobileTopRect.height, t),
                labelAlpha: clamp((rawT - 0.52) / 0.48, 0, 1),
              },
            };
          } else {
            topState = {
              mode: 'unified',
              unified: {
                x: startTopLeft,
                y: startTopTop,
                w: snap.topW,
                h: s.topH,
                r: 999,
              },
            };
          }

          // Matte Ball -> Arcs gracefully back into left Menu slot & opens back into hollow Menu ring
          const ballOriginX = outcome === 'player-win' ? snap.bottomX : snap.ballX;
          const ballOriginY =
            outcome === 'player-win' ? s.bottomY - s.bottomH / 2 - s.ballR : snap.ballY;
          const arcLift = Math.sin(rawT * Math.PI) * (outcome === 'player-win' ? 110 : 72);
          const bx = lerp(ballOriginX, menuStartX, t);
          const by = lerp(ballOriginY, menuStartY, t) - arcLift;

          updateDomElements(dockBox, topState, {
            x: bx,
            y: by,
            d: lerp(ballDiameter, 20, t),
            fillScale: clamp(1 - rawT * 1.4, 0, 1),
            ringOpacity: 1,
            squashX: 1,
            squashY: 1,
            angle: 0,
            showTrail: false,
          });

          // Fly any Brick-Break stickers back to exact desktop spots
          s.brickMorphProgress = 1 - t;
          syncBricksDom();

          if (rawT >= 1) {
            onFinishExit({
              won: outcome === 'player-win',
              mode: curMode,
              scoreText:
                curMode === 'bricks'
                  ? `${brickScoreRef.current} pts`
                  : `${scoresRef.current.player}–${scoresRef.current.opponent}`,
            });
            return;
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    geometry,
    onFinishExit,
    playLevelClear,
    playPongBrick,
    playPongBumper,
    playPongHop,
    playPongMorph,
    playPongPaddle,
    playPongScore,
    playPongWall,
    serveBall,
    spawnCallout,
    spawnConfetti,
  ]);

  // Pointer & Multi-Touch Handlers for smooth desktop mouse + 2P mobile tabletop controls
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'playing') return;
    const s = stateRef.current;

    if (e.pointerType === 'mouse') {
      s.bottomTargetX = e.clientX;
      return;
    }

    const tracked = s.activeTouches.get(e.pointerId);
    if (tracked) {
      tracked.x = e.clientX;
      tracked.y = e.clientY;
      if (tracked.side === 'top' && modeRef.current === '2p') {
        s.topTargetX = e.clientX;
        setShow2PHints(false);
      } else {
        s.bottomTargetX = e.clientX;
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'playing') return;
    const s = stateRef.current;
    const side: 'top' | 'bottom' =
      modeRef.current === '2p' && e.clientY < s.vh * 0.45 ? 'top' : 'bottom';
    s.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY, side });
    if (side === 'top' && modeRef.current === '2p') {
      s.topTargetX = e.clientX;
      setShow2PHints(false);
    } else {
      s.bottomTargetX = e.clientX;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    stateRef.current.activeTouches.delete(e.pointerId);
  };

  const isPlayingOrOver = phase === 'playing' || phase === 'gameover';

  return (
    <>
      {/* Subtle Wallpaper Scoreboard & Court Line (sits behind open floating windows!) */}
      <AnimatePresence>
        {isPlayingOrOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[5] pointer-events-none select-none flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Dashed Center Court Line */}
            {mode !== 'bricks' && (
              <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-text-main/10" />
            )}

            {/* Editorial Score Watermark */}
            {mode === 'bricks' ? (
              <div className="flex flex-col items-center gap-2 text-text-main/[0.11] mt-24">
                <div className="font-mono text-xs uppercase tracking-[0.26em] font-semibold">
                  WAVE {brickWave} · BEST {brickBest}
                </div>
                <div className="font-sans font-black tabular-nums text-[clamp(4.5rem,13vw,9rem)] leading-none tracking-tighter">
                  {String(brickScore).padStart(3, '0')}
                </div>
                <div className="flex items-center gap-2.5 mt-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`w-3 h-3 rounded-full border-2 border-text-main/30 transition-all ${
                        i < brickLives ? 'bg-text-main/35 scale-100' : 'bg-transparent scale-75 opacity-40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between h-[62vh] text-text-main/[0.11]">
                <div className="font-sans font-black tabular-nums text-[clamp(4.5rem,12vw,8.5rem)] leading-none tracking-tighter">
                  {String(scores.opponent).padStart(2, '0')}
                </div>
                <div className="font-sans font-black tabular-nums text-[clamp(4.5rem,12vw,8.5rem)] leading-none tracking-tighter">
                  {String(scores.player).padStart(2, '0')}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transparent Input Capture Layer (above windows so dragging/moving never fights window UI) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`fixed inset-0 z-[82] touch-none select-none ${
          phase === 'playing' ? 'pointer-events-auto cursor-none' : 'pointer-events-none'
        }`}
      />

      {/* Brick-Break Morphing Sticker Bricks Layer */}
      <div
        ref={brickLayerRef}
        className={`fixed inset-0 z-[84] pointer-events-none select-none ${
          mode === 'bricks' ? 'block' : 'hidden'
        }`}
      >
        {brickList.map((b) => {
          const toneStyle = TONE_HEX[b.tone];
          return (
            <div
              key={b.id}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                backgroundColor: toneStyle.bg,
                borderColor: toneStyle.border,
                color: toneStyle.text,
                willChange: 'transform, width, height, opacity',
              }}
              className="flex items-center justify-center rounded-lg border shadow-sm px-2.5 overflow-hidden"
            >
              <span className="text-[11px] sm:text-xs font-medium tracking-tight truncate">
                {b.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Flat Confetti & Impact Callout Canvas (zero glow) */}
      <canvas
        ref={fxCanvasRef}
        className="fixed inset-0 w-full h-full z-[85] pointer-events-none"
      />

      {/* Morphing UI Actors Layer (Dock Paddle, Search+Notes Top Paddle, Matte Menu Ball) */}
      <div className="fixed inset-0 z-[86] pointer-events-none select-none">
        {/* Flat Matte Trail Dots (no glow) */}
        {[0, 1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            ref={(el) => {
              trailRefs.current[idx] = el;
            }}
            style={{ opacity: 0, willChange: 'transform, opacity' }}
            className="fixed top-0 left-0 rounded-full bg-text-main"
          />
        ))}

        {/* Bottom Floating Shelf -> Player Paddle Proxy */}
        <div
          ref={dockProxyRef}
          style={{ willChange: 'transform, width, height, border-radius' }}
          className="fixed top-0 left-0 bg-surface border border-border shadow-hard overflow-hidden flex items-center justify-center"
        >
          {/* Subtle central paddle grip mark */}
          <span
            className={`w-9 h-1 rounded-full bg-text-main/30 transition-opacity duration-200 ${
              isPlayingOrOver ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Ghost Shelf Silhouette during morph-in / morph-out */}
          <div
            ref={dockGhostIconsRef}
            className="absolute inset-0 flex items-center justify-between px-3 md:px-4 pointer-events-none"
          >
            <div className="w-9 h-9 rounded-full border border-border/50 bg-bg-app/60" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full border border-border/50 bg-bg-app/60" />
              <div className="w-9 h-9 rounded-full border border-border/50 bg-bg-app/60" />
              <div className="w-9 h-9 rounded-full border border-border/50 bg-bg-app/60" />
              <div className="hidden md:block w-9 h-9 rounded-full border border-border/50 bg-bg-app/60" />
              <div className="hidden md:block w-9 h-9 rounded-full border border-border/50 bg-bg-app/60" />
            </div>
            <div className="w-16 h-9 rounded-full border border-border/50 bg-bg-app/60" />
          </div>
        </div>

        {/* Top Unified Opponent / Rebound Paddle */}
        <div
          ref={topUnifiedRef}
          style={{ opacity: 0, willChange: 'transform, width, height, opacity' }}
          className="fixed top-0 left-0 bg-surface border border-border shadow-hard flex items-center justify-center"
        >
          <span className="w-9 h-1 rounded-full bg-primary/80" />
          {mode === '2p' && show2PHints && phase === 'playing' && (
            <span className="absolute -bottom-6 px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] font-mono text-text-muted whitespace-nowrap">
              A / D · Top Touch
            </span>
          )}
          {exitSmugLabel && (
            <span className="absolute -bottom-7 px-2.5 py-0.5 rounded-full bg-text-main text-surface text-[11px] font-mono font-bold whitespace-nowrap shadow-sm">
              {exitSmugLabel}
            </span>
          )}
        </div>

        {/* Desktop Morph Proxy A: Search (⌘K) Pill */}
        <div
          ref={topPillARef}
          style={{ opacity: 0, willChange: 'transform, width, height, opacity' }}
          className="fixed top-0 left-0 rounded-full bg-surface border border-border shadow-medium flex items-center justify-center overflow-hidden"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-text-main whitespace-nowrap px-2">
            <Search size={13} />
            <span>⌘K</span>
          </div>
        </div>

        {/* Desktop Morph Proxy B: + New Note Pill */}
        <div
          ref={topPillBRef}
          style={{ opacity: 0, willChange: 'transform, width, height, opacity' }}
          className="fixed top-0 left-0 rounded-full bg-surface border border-border shadow-medium flex items-center justify-center overflow-hidden"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-text-main whitespace-nowrap px-2">
            <Plus size={14} />
            <span>New Note</span>
          </div>
        </div>

        {/* Mobile Morph Proxy: Top Bar Pill */}
        <div
          ref={topMobileProxyRef}
          style={{ opacity: 0, willChange: 'transform, width, height, opacity' }}
          className="fixed top-0 left-0 rounded-full bg-surface border border-border shadow-sm flex items-center justify-between px-4 overflow-hidden"
        >
          <div className="flex items-center justify-between w-full text-xs font-semibold text-text-main">
            <span>KhanOS</span>
            <span className="font-mono text-[11px] text-text-muted">Search · Notes</span>
          </div>
        </div>

        {/* Menu Button Ring -> Solid Matte Ball (STRICTLY NO GLOW) */}
        <div
          ref={ballRef}
          style={{ willChange: 'transform, width, height' }}
          className="fixed top-0 left-0 rounded-full border-[2.6px] border-text-main box-border flex items-center justify-center"
        >
          <div
            ref={ballFillRef}
            className="w-full h-full rounded-full bg-text-main"
            style={{ transform: 'scale(0)', opacity: 0 }}
          />
          {exitWinLabel && (
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-on text-[10px] font-mono font-bold whitespace-nowrap">
              {exitWinLabel}
            </span>
          )}
        </div>
      </div>

      {/* Compact Top-Left Mode Switcher & Exit Pill (#5 Playful Game Modes) */}
      <AnimatePresence>
        {isPlayingOrOver && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 440, damping: 28 }}
            className="fixed top-3 left-3 md:top-4 md:left-5 z-[88] flex items-center gap-1 p-1 rounded-full bg-surface/95 backdrop-blur-md border border-border shadow-hard pointer-events-auto"
          >
            <button
              onClick={() => resetForMode('ai')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors touch-manipulation ${
                mode === 'ai'
                  ? 'bg-primary text-primary-on'
                  : 'text-text-muted hover:text-text-main hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60'
              }`}
              title="Classic Rally vs Search & Notes AI"
            >
              <Cpu size={12} />
              <span className="hidden sm:inline">vs AI</span>
            </button>

            <button
              onClick={() => resetForMode('2p')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors touch-manipulation ${
                mode === '2p'
                  ? 'bg-primary text-primary-on'
                  : 'text-text-muted hover:text-text-main hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60'
              }`}
              title="Local 2-Player Split (Bottom: Mouse/Arrows, Top: A/D or Top Touch)"
            >
              <Users size={12} />
              <span className="hidden sm:inline">2P</span>
            </button>

            <button
              onClick={() => resetForMode('bricks')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors touch-manipulation ${
                mode === 'bricks'
                  ? 'bg-primary text-primary-on'
                  : 'text-text-muted hover:text-text-main hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60'
              }`}
              title="Endless Sticker Brick-Break"
            >
              <LayoutGrid size={12} />
              <span className="hidden sm:inline">Bricks</span>
            </button>

            <div className="w-px h-4 bg-border mx-0.5" />

            <button
              onClick={() => {
                playClick();
                beginExit(exitOutcomeRef.current);
              }}
              aria-label="Exit Pong and restore desktop"
              title="Restore Desktop (ESC)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-text-main hover:bg-neutral-90/70 dark:hover:bg-neutral-10/70 transition-colors touch-manipulation"
            >
              <X size={13} />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Result Modal */}
      <AnimatePresence>
        {phase === 'gameover' && gameOverInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="fixed inset-0 z-[89] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-xs rounded-2xl bg-surface/95 backdrop-blur-md border border-border shadow-hard p-5 text-center space-y-4 text-text-main">
              <div className="mx-auto w-11 h-11 rounded-2xl bg-primary-container/35 border border-primary/40 flex items-center justify-center text-primary">
                <Trophy size={20} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold tracking-tight">{gameOverInfo.headline}</h3>
                <p className="text-xs font-mono text-text-muted">{gameOverInfo.subline}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    exitOutcomeRef.current = 'neutral';
                    resetForMode(mode);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-primary text-primary-on text-xs font-semibold hover:opacity-90 transition-opacity touch-manipulation"
                >
                  <RotateCcw size={13} />
                  Play Again
                </button>
                <button
                  onClick={() => {
                    playClick();
                    beginExit(gameOverInfo.outcome);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-semibold text-text-main transition-colors touch-manipulation"
                >
                  Restore Desk
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DesktopPongOverlay;
