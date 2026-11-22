import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pause,
  Play,
  RotateCcw,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import { StickerData } from '../types';
import { useSound } from '../contexts/SoundContext';

interface PacmanGameOverlayProps {
  stickers: StickerData[];
  launcherOrigin?: { x: number; y: number } | null;
  onExit: () => void;
}

type GamePhase = 'INTRO' | 'PLAYING' | 'PAUSED' | 'LEVEL_CLEAR' | 'GAME_OVER';
type Dir = 'up' | 'down' | 'left' | 'right';
type GhostId = 'profile' | 'projects' | 'resume' | 'terminal';
type GhostState = 'chase' | 'frightened' | 'eyes';
type FruitKind = 'cherry' | 'mango' | 'strawberry' | 'melon' | 'peach' | 'grape';

interface Pellet {
  x: number;
  y: number;
  eaten: boolean;
}

interface FruitItem {
  id: string;
  label: string;
  kind: FruitKind;
  x: number;
  y: number;
  points: number;
  eaten: boolean;
  bobOffset: number;
}

interface GhostEntity {
  id: GhostId;
  label: string;
  color: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  state: GhostState;
  personalityPhase: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface EdgeFlash {
  edge: Dir;
  pos: number;
  life: number;
}

interface HudSnapshot {
  score: number;
  highScore: number;
  level: number;
  lives: number;
  frightenedTimeLeft: number;
  ghostsEaten: number;
  fruitsEaten: number;
  isNewBest: boolean;
}

const HIGH_SCORE_KEY = 'khanos-pacman-highscore';
const FRIGHTENED_DURATION = 7.0;
const INTRO_DURATION = 1.15;
const LEVEL_CLEAR_DURATION = 1.6;
const FRUIT_KINDS: FruitKind[] = ['cherry', 'mango', 'strawberry', 'melon', 'peach', 'grape'];
const FRUIT_POINTS: Record<FruitKind, number> = {
  cherry: 150,
  mango: 200,
  strawberry: 200,
  melon: 250,
  peach: 250,
  grape: 300,
};

const DIR_VEC: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const DIR_ANGLE: Record<Dir, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const parsePercent = (raw: string, total: number, fallbackRatio: number): number => {
  const num = parseFloat(raw);
  if (Number.isFinite(num)) {
    return (num / 100) * total;
  }
  return fallbackRatio * total;
};

const getPlayBounds = (w: number, h: number) => {
  const isMobile = w < 768;
  return {
    left: isMobile ? 22 : 34,
    right: w - (isMobile ? 22 : 34),
    top: isMobile ? 74 : 78,
    bottom: h - (isMobile ? 26 : 32),
    isMobile,
  };
};

const isInMobileDpadZone = (x: number, y: number, w: number, h: number) => {
  if (w >= 768) return false;
  return x > w - 172 && y > h - 178;
};

const drawGhostGlyph = (
  ctx: CanvasRenderingContext2D,
  id: GhostId,
  x: number,
  y: number,
  alpha: number
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = 1.65;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (id === 'profile') {
    // User silhouette icon
    ctx.beginPath();
    ctx.arc(0, -2.5, 2.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 6.2, 5.1, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (id === 'projects') {
    // Folder icon
    ctx.beginPath();
    ctx.moveTo(-5.5, -3.5);
    ctx.lineTo(-1.8, -3.5);
    ctx.lineTo(-0.4, -1.8);
    ctx.lineTo(5.5, -1.8);
    ctx.lineTo(5.5, 4.4);
    ctx.lineTo(-5.5, 4.4);
    ctx.closePath();
    ctx.stroke();
  } else if (id === 'resume') {
    // Document / FileText icon
    ctx.beginPath();
    ctx.roundRect(-4.5, -5.2, 9, 10.6, 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2.3, -1.8);
    ctx.lineTo(2.3, -1.8);
    ctx.moveTo(-2.3, 0.8);
    ctx.lineTo(2.3, 0.8);
    ctx.moveTo(-2.3, 3.2);
    ctx.lineTo(0.8, 3.2);
    ctx.stroke();
  } else {
    // Terminal >_ icon
    ctx.beginPath();
    ctx.moveTo(-5, -2.8);
    ctx.lineTo(-1.4, 0.2);
    ctx.lineTo(-5, 3.2);
    ctx.moveTo(0.4, 3.2);
    ctx.lineTo(5.2, 3.2);
    ctx.stroke();
  }

  ctx.restore();
};

const drawFruitSprite = (
  ctx: CanvasRenderingContext2D,
  fruit: FruitItem,
  time: number,
  reducedMotion: boolean
) => {
  const bob = reducedMotion ? 0 : Math.sin(time * 3.4 + fruit.bobOffset) * 3.2;
  const pulse = reducedMotion ? 0.24 : 0.22 + Math.sin(time * 4.5 + fruit.bobOffset) * 0.1;
  const cx = fruit.x;
  const cy = fruit.y + bob;

  ctx.save();

  // Power-up ambient halo
  const haloGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 24);
  haloGrad.addColorStop(0, `rgba(251, 191, 36, ${pulse + 0.16})`);
  haloGrad.addColorStop(0.65, `rgba(244, 195, 0, ${pulse * 0.45})`);
  haloGrad.addColorStop(1, 'rgba(244, 195, 0, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();

  // Crisp tonal badge backing so fruit stays readable on any wallpaper
  ctx.fillStyle = 'rgba(18, 20, 28, 0.56)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(cx, cy, 15.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.translate(cx, cy);

  if (fruit.kind === 'cherry') {
    // Stems
    ctx.strokeStyle = '#86EFAC';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-4, 2);
    ctx.quadraticCurveTo(-1, -7, 4, -9);
    ctx.moveTo(4.5, 3);
    ctx.quadraticCurveTo(3.5, -5, 4, -9);
    ctx.stroke();
    // Leaf
    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.ellipse(6.5, -7.5, 3.6, 1.9, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Two cherries
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.arc(-4.2, 4.2, 4.7, 0, Math.PI * 2);
    ctx.arc(4.2, 5.2, 4.7, 0, Math.PI * 2);
    ctx.fill();
    // Gloss
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.arc(-5.6, 2.7, 1.3, 0, Math.PI * 2);
    ctx.arc(2.7, 3.6, 1.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (fruit.kind === 'mango') {
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.ellipse(0, 1, 8.2, 6.2, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.ellipse(-2, -0.4, 4.2, 2.4, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.ellipse(4.5, -6.5, 4, 2, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (fruit.kind === 'strawberry') {
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(0, 9.5);
    ctx.bezierCurveTo(-8.5, 5, -9, -4.5, 0, -5.5);
    ctx.bezierCurveTo(9, -4.5, 8.5, 5, 0, 9.5);
    ctx.fill();
    // Seeds
    ctx.fillStyle = '#FEF08A';
    [
      [-3, -1],
      [2.8, -0.8],
      [0, 2.2],
      [-2.5, 4.5],
      [2.4, 4.4],
    ].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 0.9, 0, Math.PI * 2);
      ctx.fill();
    });
    // Crown
    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.moveTo(-5.5, -4.5);
    ctx.lineTo(-2, -7.8);
    ctx.lineTo(0, -5.2);
    ctx.lineTo(2, -7.8);
    ctx.lineTo(5.5, -4.5);
    ctx.closePath();
    ctx.fill();
  } else if (fruit.kind === 'melon') {
    // Watermelon wedge
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(0, -1, 9.5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(0, -1.2, 7.4, 0.17 * Math.PI, 0.83 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#18181B';
    [
      [-3, 2.6],
      [0, 3.8],
      [3, 2.6],
    ].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (fruit.kind === 'peach') {
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.arc(-2.4, 1.4, 6.2, 0, Math.PI * 2);
    ctx.arc(2.4, 1.4, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath();
    ctx.arc(-3.2, 0.2, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.ellipse(3.6, -6.5, 4, 2, -0.35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Grape cluster
    ctx.fillStyle = '#A855F7';
    const grapes = [
      [-4, -2],
      [0, -2.2],
      [4, -2],
      [-2.2, 2.2],
      [2.2, 2.2],
      [0, 6],
    ];
    grapes.forEach(([gx, gy]) => {
      ctx.beginPath();
      ctx.arc(gx, gy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = '#86EFAC';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -5.2);
    ctx.lineTo(1.5, -8.8);
    ctx.stroke();
  }

  ctx.restore();

  // Subtle sticker origin micro-tag underneath
  if (fruit.label) {
    ctx.save();
    ctx.font = '600 9.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const shortTag = fruit.label.length > 13 ? `${fruit.label.slice(0, 12)}…` : fruit.label;
    const textWidth = ctx.measureText(shortTag).width;
    ctx.fillStyle = 'rgba(15, 17, 23, 0.62)';
    ctx.beginPath();
    ctx.roundRect(cx - textWidth / 2 - 5, cy + 18, textWidth + 10, 14, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fillText(shortTag, cx, cy + 20);
    ctx.restore();
  }
};

const drawGhostSprite = (
  ctx: CanvasRenderingContext2D,
  ghost: GhostEntity,
  time: number,
  frightenedLeft: number,
  reducedMotion: boolean
) => {
  const r = 17.5;
  const x = ghost.x;
  const y = ghost.y;
  const isFrightened = ghost.state === 'frightened';
  const isEyes = ghost.state === 'eyes';
  const flashWhite = isFrightened && frightenedLeft < 2.0 && Math.floor(time * 9) % 2 === 0;

  ctx.save();
  ctx.translate(x, y);

  if (!isEyes) {
    // Soft ambient shadow/glow
    ctx.save();
    ctx.shadowColor = isFrightened ? 'rgba(67, 56, 202, 0.55)' : `${ghost.color}66`;
    ctx.shadowBlur = 14;
    ctx.fillStyle = isFrightened ? (flashWhite ? '#F8FAFC' : '#4338CA') : ghost.color;

    // Classic scalloped ghost dome + skirt
    const wave = reducedMotion ? 0 : Math.sin(time * 10 + ghost.personalityPhase) * 1.6;
    ctx.beginPath();
    ctx.arc(0, -3, r, Math.PI, 0, false);
    ctx.lineTo(r, r - 2);
    // 3 scalloped waves along bottom
    const seg = (r * 2) / 3;
    ctx.quadraticCurveTo(r - seg * 0.5, r + 4 + wave, r - seg, r - 2);
    ctx.quadraticCurveTo(0, r + 4 - wave, -r + seg, r - 2);
    ctx.quadraticCurveTo(-r + seg * 0.5, r + 4 + wave, -r, r - 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Subtle rim highlight
    ctx.strokeStyle = flashWhite ? 'rgba(67, 56, 202, 0.5)' : 'rgba(255, 255, 255, 0.34)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Draw OS app icon glyph on lower ghost body when active
    if (!isFrightened) {
      drawGhostGlyph(ctx, ghost.id, 0, 5.5, 0.92);
    }
  }

  // Eyes (directional pupils or frightened hollow eyes)
  const lookAngle = Math.atan2(ghost.vy, ghost.vx);
  const pupilDx = Math.cos(lookAngle) * 2.1;
  const pupilDy = Math.sin(lookAngle) * 2.1;

  if (isFrightened) {
    const faceColor = flashWhite ? '#312E81' : '#E0E7FF';
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.arc(-5.2, -5.2, 2.4, 0, Math.PI * 2);
    ctx.arc(5.2, -5.2, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Startled wavy mouth
    ctx.strokeStyle = faceColor;
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7, 4.5);
    ctx.lineTo(-4.2, 2.2);
    ctx.lineTo(-1.4, 4.5);
    ctx.lineTo(1.4, 2.2);
    ctx.lineTo(4.2, 4.5);
    ctx.lineTo(7, 2.2);
    ctx.stroke();
  } else {
    // Expressive sclera + directional pupils
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-5.4, -6.5, 4.1, 4.8, 0, 0, Math.PI * 2);
    ctx.ellipse(5.4, -6.5, 4.1, 4.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(-5.4 + pupilDx, -6.5 + pupilDy, 2.2, 0, Math.PI * 2);
    ctx.arc(5.4 + pupilDx, -6.5 + pupilDy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny OS app name pill below active ghost
  if (!isEyes) {
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(isFrightened ? 'CHOMP!' : ghost.label, 0, r + 5);
  }

  ctx.restore();
};

const drawPacmanSprite = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Dir,
  mouthProgress: number,
  introProgress: number,
  invulnTimer: number,
  time: number
) => {
  if (invulnTimer > 0 && Math.floor(time * 14) % 2 === 0) return;

  const r = 17.5;
  ctx.save();
  ctx.translate(x, y);

  // Morph smoothly from Menu circular ring (introProgress < 0.65) into chomping Pac-Man
  if (introProgress < 0.55) {
    const t = introProgress / 0.55;
    ctx.strokeStyle = '#F4C300';
    ctx.lineWidth = 3 + t * 14;
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.68 + t * 0.32), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const angle = DIR_ANGLE[dir];
  const mouthAngle = 0.1 + Math.abs(Math.sin(mouthProgress)) * 0.58;

  ctx.rotate(angle);
  ctx.shadowColor = 'rgba(244, 195, 0, 0.55)';
  ctx.shadowBlur = 16;

  // Golden primary body
  ctx.fillStyle = '#F4C300';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, mouthAngle, Math.PI * 2 - mouthAngle);
  ctx.closePath();
  ctx.fill();

  // Crisp subtle edge & eye dot
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 251, 235, 0.65)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Expressive eye aligned to top of Pac-Man
  const eyeY = dir === 'left' ? 6.5 : -6.5;
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.arc(2.5, eyeY, 2.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

const PacmanLifeIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
    <path d="M8 8 L14.8 4.4 A7.4 7.4 0 1 0 14.8 11.6 Z" fill="#F4C300" />
  </svg>
);

const PacmanGameOverlay: React.FC<PacmanGameOverlayProps> = ({
  stickers,
  launcherOrigin,
  onExit,
}) => {
  const {
    playClick,
    playChime,
    playWaka,
    playFruitPower,
    playGhostEat,
    playPacmanDeath,
    playLevelClear,
  } = useSound();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotionRef = useRef<boolean>(false);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const phaseRef = useRef<GamePhase>('INTRO');

  const [activeDirUi, setActiveDirUi] = useState<Dir>('right');
  const [hud, setHud] = useState<HudSnapshot>(() => {
    let savedBest = 0;
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(HIGH_SCORE_KEY);
      const parsed = raw ? parseInt(raw, 10) : 0;
      if (Number.isFinite(parsed) && parsed > 0) savedBest = parsed;
    }
    return {
      score: 0,
      highScore: savedBest,
      level: 1,
      lives: 3,
      frightenedTimeLeft: 0,
      ghostsEaten: 0,
      fruitsEaten: 0,
      isNewBest: false,
    };
  });

  // Mutable 60fps engine state (zero per-frame React re-renders)
  const engineRef = useRef({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    time: 0,
    introTimer: 0,
    levelClearTimer: 0,
    hitStopTimer: 0,
    wakaStep: 0,
    lastWakaAt: 0,
    score: 0,
    highScore: hud.highScore,
    isNewBest: false,
    level: 1,
    lives: 3,
    ghostsEaten: 0,
    fruitsEaten: 0,
    frightenedTimer: 0,
    ghostCombo: 1,
    pacman: {
      x: 120,
      y: 420,
      startX: 80,
      startY: 700,
      homeX: 120,
      homeY: 420,
      dir: 'right' as Dir,
      queuedDir: 'right' as Dir,
      mouthPhase: 0,
      invulnTimer: 0,
    },
    ghosts: [] as GhostEntity[],
    pellets: [] as Pellet[],
    fruits: [] as FruitItem[],
    texts: [] as FloatingText[],
    particles: [] as Particle[],
    edgeFlashes: [] as EdgeFlash[],
  });

  const syncPhase = useCallback((next: GamePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const pushHud = useCallback(() => {
    const e = engineRef.current;
    setHud({
      score: e.score,
      highScore: e.highScore,
      level: e.level,
      lives: e.lives,
      frightenedTimeLeft: e.frightenedTimer,
      ghostsEaten: e.ghostsEaten,
      fruitsEaten: e.fruitsEaten,
      isNewBest: e.isNewBest,
    });
  }, []);

  const addScore = useCallback((points: number) => {
    const e = engineRef.current;
    e.score += points;
    if (e.score > e.highScore) {
      e.highScore = e.score;
      e.isNewBest = true;
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(e.highScore));
      } catch {
        // ignore storage failures
      }
    }
  }, []);

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count: number) => {
      const e = engineRef.current;
      const actualCount = reducedMotionRef.current ? Math.min(4, count) : count;
      for (let i = 0; i < actualCount; i++) {
        const angle = (Math.PI * 2 * i) / actualCount + Math.random() * 0.45;
        const speed = 55 + Math.random() * 145;
        e.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: 2.5 + Math.random() * 3,
          life: 0.45 + Math.random() * 0.25,
          maxLife: 0.7,
        });
      }
    },
    []
  );

  const spawnFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    engineRef.current.texts.push({
      x,
      y,
      text,
      color,
      life: 0.95,
      maxLife: 0.95,
    });
  }, []);

  const buildWave = useCallback(
    (levelNum: number, w: number, h: number, isFirstSpawn: boolean) => {
      const e = engineRef.current;
      const bounds = getPlayBounds(w, h);
      const centerX = (bounds.left + bounds.right) / 2;
      const centerY = (bounds.top + bounds.bottom) / 2;

      // Pac-Man origin: morph from Menu launcher button on first launch
      const originX = launcherOrigin?.x ?? bounds.left + 44;
      const originY = launcherOrigin?.y ?? h - 42;
      const pacHomeX = centerX;
      const pacHomeY = clamp(centerY + (bounds.bottom - bounds.top) * 0.22, bounds.top + 80, bounds.bottom - 54);

      e.pacman = {
        x: isFirstSpawn ? originX : pacHomeX,
        y: isFirstSpawn ? originY : pacHomeY,
        startX: isFirstSpawn ? originX : pacHomeX,
        startY: isFirstSpawn ? originY : pacHomeY,
        homeX: pacHomeX,
        homeY: pacHomeY,
        dir: 'right',
        queuedDir: 'right',
        mouthPhase: 0,
        invulnTimer: isFirstSpawn ? 0 : 1.0,
      };
      setActiveDirUi('right');

      // 4 OS App-Icon Ghosts emerging from Dock strip into upper arena
      const dockY = h - 40;
      const ghostDefs: Array<{
        id: GhostId;
        label: string;
        color: string;
        dockRatio: number;
        homeOffsetX: number;
        homeOffsetY: number;
      }> = [
        { id: 'profile', label: 'Profile', color: '#EF4444', dockRatio: 0.34, homeOffsetX: -120, homeOffsetY: -125 },
        { id: 'projects', label: 'Projects', color: '#F59E0B', dockRatio: 0.44, homeOffsetX: -40, homeOffsetY: -155 },
        { id: 'resume', label: 'Resume', color: '#10B981', dockRatio: 0.56, homeOffsetX: 40, homeOffsetY: -155 },
        { id: 'terminal', label: 'Terminal', color: '#8B5CF6', dockRatio: 0.66, homeOffsetX: 120, homeOffsetY: -125 },
      ];

      const spreadScale = bounds.isMobile ? 0.68 : 1;
      e.ghosts = ghostDefs.map((def, idx) => {
        const homeX = clamp(centerX + def.homeOffsetX * spreadScale, bounds.left + 44, bounds.right - 44);
        const homeY = clamp(centerY + def.homeOffsetY * spreadScale, bounds.top + 48, centerY - 24);
        const startX = isFirstSpawn ? w * def.dockRatio : homeX;
        const startY = isFirstSpawn ? dockY : homeY;
        return {
          id: def.id,
          label: def.label,
          color: def.color,
          x: startX,
          y: startY,
          startX,
          startY,
          homeX,
          homeY,
          vx: idx % 2 === 0 ? -70 : 70,
          vy: 0,
          state: 'chase',
          personalityPhase: idx * 1.55,
        };
      });

      // Map user's Desktop Stickers into collectible Power Fruits (min 4 fruits for balanced power-ups)
      const fruits: FruitItem[] = [];
      const padX = bounds.isMobile ? 36 : 64;
      const padYTop = bounds.top + 46;
      const padYBottom = bounds.bottom - (bounds.isMobile ? 52 : 48);

      const isFruitPositionSafe = (fx: number, fy: number) => {
        if (isInMobileDpadZone(fx, fy, w, h)) return false;
        if (Math.hypot(fx - pacHomeX, fy - pacHomeY) < 76) return false;
        if (fruits.some((other) => Math.hypot(other.x - fx, other.y - fy) < 68)) return false;
        return true;
      };

      stickers.slice(0, 8).forEach((stk, idx) => {
        const rawX = parsePercent(stk.left, w, 0.2 + ((idx * 0.23) % 0.65));
        const rawY = parsePercent(stk.top, h, 0.2 + ((idx * 0.19) % 0.55));
        let fx = clamp(rawX + (bounds.isMobile ? 0 : 48), bounds.left + padX, bounds.right - padX);
        let fy = clamp(rawY + 26, padYTop, padYBottom);

        if (!isFruitPositionSafe(fx, fy)) {
          // Shift gently to a nearby open spot
          fx = clamp(bounds.left + padX + ((idx * 137) % Math.max(80, bounds.right - bounds.left - padX * 2)), bounds.left + padX, bounds.right - padX);
          fy = clamp(padYTop + ((idx * 97) % Math.max(80, padYBottom - padYTop)), padYTop, padYBottom);
          if (isInMobileDpadZone(fx, fy, w, h)) {
            fx = bounds.left + padX + 36;
          }
        }

        const kind = FRUIT_KINDS[idx % FRUIT_KINDS.length];
        fruits.push({
          id: `fruit-${stk.id}-${levelNum}`,
          label: stk.text,
          kind,
          x: fx,
          y: fy,
          points: FRUIT_POINTS[kind],
          eaten: false,
          bobOffset: idx * 0.9,
        });
      });

      // Guarantee at least 4 balanced power fruits across quadrants if user has < 4 stickers
      const fallbackQuadrants = [
        { rx: 0.18, ry: 0.26, tag: 'power-berry' },
        { rx: 0.82, ry: 0.26, tag: 'cloud-mango' },
        { rx: 0.18, ry: 0.74, tag: 'pixel-melon' },
        { rx: 0.76, ry: 0.68, tag: 'synth-grape' },
      ];
      let qIdx = 0;
      while (fruits.length < 4 && qIdx < fallbackQuadrants.length) {
        const q = fallbackQuadrants[qIdx];
        let fx = clamp(w * q.rx, bounds.left + padX, bounds.right - padX);
        const fy = clamp(h * q.ry, padYTop, padYBottom);
        if (isInMobileDpadZone(fx, fy, w, h)) {
          fx = clamp(w * 0.46, bounds.left + padX, bounds.right - padX);
        }
        const kind = FRUIT_KINDS[(fruits.length + qIdx) % FRUIT_KINDS.length];
        if (!fruits.some((f) => Math.hypot(f.x - fx, f.y - fy) < 60)) {
          fruits.push({
            id: `fruit-bonus-${qIdx}-${levelNum}`,
            label: q.tag,
            kind,
            x: fx,
            y: fy,
            points: FRUIT_POINTS[kind],
            eaten: false,
            bobOffset: fruits.length * 1.1,
          });
        }
        qIdx++;
      }

      e.fruits = fruits;

      // Populate clean open-arena glowing pellets avoiding fruits, Pac-Man spawn, and mobile D-Pad
      const spacing = bounds.isMobile ? 56 : 72;
      const pellets: Pellet[] = [];
      const usableW = bounds.right - bounds.left - 44;
      const usableH = bounds.bottom - bounds.top - 40;
      const cols = Math.max(4, Math.floor(usableW / spacing));
      const rows = Math.max(4, Math.floor(usableH / spacing));
      const stepX = usableW / Math.max(1, cols);
      const stepY = usableH / Math.max(1, rows);
      const startGridX = bounds.left + 22;
      const startGridY = bounds.top + 22;

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const px = startGridX + c * stepX;
          const py = startGridY + r * stepY;
          if (isInMobileDpadZone(px, py, w, h)) continue;
          if (Math.hypot(px - pacHomeX, py - pacHomeY) < 42) continue;
          if (fruits.some((f) => Math.hypot(px - f.x, py - f.y) < 38)) continue;
          pellets.push({ x: px, y: py, eaten: false });
        }
      }

      e.pellets = pellets;
      e.frightenedTimer = 0;
      e.ghostCombo = 1;
      e.introTimer = 0;
      e.levelClearTimer = 0;
      e.hitStopTimer = 0;
      e.texts = [];
      e.particles = [];
      e.edgeFlashes = [];
    },
    [launcherOrigin, stickers]
  );

  const steer = useCallback((dir: Dir) => {
    const e = engineRef.current;
    e.pacman.queuedDir = dir;
    setActiveDirUi(dir);
    if (phaseRef.current === 'INTRO' && e.introTimer > 0.65) {
      e.pacman.dir = dir;
    }
  }, []);

  const resetFullGame = useCallback(() => {
    playChime();
    const e = engineRef.current;
    e.score = 0;
    e.level = 1;
    e.lives = 3;
    e.ghostsEaten = 0;
    e.fruitsEaten = 0;
    e.isNewBest = false;
    buildWave(1, e.width, e.height, true);
    syncPhase('INTRO');
    pushHud();
  }, [buildWave, playChime, pushHud, syncPhase]);

  const togglePause = useCallback(() => {
    playClick();
    if (phaseRef.current === 'PLAYING') {
      syncPhase('PAUSED');
    } else if (phaseRef.current === 'PAUSED') {
      syncPhase('PLAYING');
    }
  }, [playClick, syncPhase]);

  // Initialize game & reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    engineRef.current.width = w;
    engineRef.current.height = h;
    buildWave(1, w, h, true);
    playChime();
    syncPhase('INTRO');
    pushHud();
  }, [buildWave, playChime, pushHud, syncPhase]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (k === 'escape') {
        ev.preventDefault();
        playClick();
        onExit();
        return;
      }
      if (k === ' ' || k === 'p') {
        if (phaseRef.current === 'PLAYING' || phaseRef.current === 'PAUSED') {
          ev.preventDefault();
          togglePause();
        }
        return;
      }
      if (k === 'enter' && phaseRef.current === 'GAME_OVER') {
        ev.preventDefault();
        resetFullGame();
        return;
      }
      if (k === 'arrowup' || k === 'w') {
        ev.preventDefault();
        steer('up');
      } else if (k === 'arrowdown' || k === 's') {
        ev.preventDefault();
        steer('down');
      } else if (k === 'arrowleft' || k === 'a') {
        ev.preventDefault();
        steer('left');
      } else if (k === 'arrowright' || k === 'd') {
        ev.preventDefault();
        steer('right');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onExit, playClick, resetFullGame, steer, togglePause]);

  // Responsive canvas resize
  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      engineRef.current.width = w;
      engineRef.current.height = h;
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Main 60fps Game Loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    let hudAccumulator = 0;

    const step = (now: number) => {
      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      const dt = Math.min(rawDt, 0.05);
      const e = engineRef.current;
      const w = e.width;
      const h = e.height;
      const bounds = getPlayBounds(w, h);

      e.time += dt;

      if (phaseRef.current === 'INTRO') {
        e.introTimer += dt;
        const t = clamp(e.introTimer / INTRO_DURATION, 0, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        e.pacman.x = e.pacman.startX + (e.pacman.homeX - e.pacman.startX) * ease;
        e.pacman.y = e.pacman.startY + (e.pacman.homeY - e.pacman.startY) * ease;
        e.pacman.mouthPhase += dt * 10;

        e.ghosts.forEach((g) => {
          g.x = g.startX + (g.homeX - g.startX) * ease;
          g.y = g.startY + (g.homeY - g.startY) * ease;
        });

        if (t >= 1) {
          syncPhase('PLAYING');
          pushHud();
        }
      } else if (phaseRef.current === 'LEVEL_CLEAR') {
        e.levelClearTimer += dt;
        if (e.levelClearTimer >= LEVEL_CLEAR_DURATION) {
          e.level += 1;
          buildWave(e.level, w, h, false);
          syncPhase('INTRO');
          pushHud();
        }
      } else if (phaseRef.current === 'PLAYING') {
        if (e.hitStopTimer > 0) {
          e.hitStopTimer = Math.max(0, e.hitStopTimer - dt);
        } else {
          // Update invulnerability & frightened timer
          if (e.pacman.invulnTimer > 0) {
            e.pacman.invulnTimer = Math.max(0, e.pacman.invulnTimer - dt);
          }

          if (e.frightenedTimer > 0) {
            e.frightenedTimer = Math.max(0, e.frightenedTimer - dt);
            if (e.frightenedTimer === 0) {
              e.ghostCombo = 1;
              e.ghosts.forEach((g) => {
                if (g.state === 'frightened') g.state = 'chase';
              });
            }
          }

          // Move Pac-Man with smooth wrap-around edges
          e.pacman.dir = e.pacman.queuedDir;
          const pacSpeed = (bounds.isMobile ? 195 : 238) + Math.min(e.level - 1, 5) * 10;
          const dirVec = DIR_VEC[e.pacman.dir];
          e.pacman.x += dirVec.x * pacSpeed * dt;
          e.pacman.y += dirVec.y * pacSpeed * dt;
          e.pacman.mouthPhase += dt * 16;

          // 4-edge wrap-around portals
          if (e.pacman.x < bounds.left - 16) {
            e.pacman.x = bounds.right + 14;
            e.edgeFlashes.push({ edge: 'left', pos: e.pacman.y, life: 0.4 });
            e.edgeFlashes.push({ edge: 'right', pos: e.pacman.y, life: 0.4 });
          } else if (e.pacman.x > bounds.right + 16) {
            e.pacman.x = bounds.left - 14;
            e.edgeFlashes.push({ edge: 'right', pos: e.pacman.y, life: 0.4 });
            e.edgeFlashes.push({ edge: 'left', pos: e.pacman.y, life: 0.4 });
          }

          if (e.pacman.y < bounds.top - 16) {
            e.pacman.y = bounds.bottom + 14;
            e.edgeFlashes.push({ edge: 'up', pos: e.pacman.x, life: 0.4 });
            e.edgeFlashes.push({ edge: 'down', pos: e.pacman.x, life: 0.4 });
          } else if (e.pacman.y > bounds.bottom + 16) {
            e.pacman.y = bounds.top - 14;
            e.edgeFlashes.push({ edge: 'down', pos: e.pacman.x, life: 0.4 });
            e.edgeFlashes.push({ edge: 'up', pos: e.pacman.x, life: 0.4 });
          }

          // Collect glowing pellets
          let scoreChanged = false;
          for (let i = 0; i < e.pellets.length; i++) {
            const p = e.pellets[i];
            if (p.eaten) continue;
            if (Math.hypot(p.x - e.pacman.x, p.y - e.pacman.y) < 22) {
              p.eaten = true;
              addScore(10);
              scoreChanged = true;
              if (e.time - e.lastWakaAt > 0.12) {
                playWaka(e.wakaStep++);
                e.lastWakaAt = e.time;
              }
            }
          }

          // Collect converted Sticker Fruits (triggers 7s Ghost-Chomp Mode!)
          for (let i = 0; i < e.fruits.length; i++) {
            const f = e.fruits[i];
            if (f.eaten) continue;
            if (Math.hypot(f.x - e.pacman.x, f.y - e.pacman.y) < 29) {
              f.eaten = true;
              e.fruitsEaten += 1;
              addScore(f.points);
              e.frightenedTimer = FRIGHTENED_DURATION;
              e.ghostCombo = 1;
              scoreChanged = true;
              playFruitPower();
              spawnParticles(f.x, f.y, '#F4C300', 14);
              spawnFloatingText(f.x, f.y - 12, `+${f.points} CHOMP!`, '#FDE047');

              e.ghosts.forEach((g) => {
                if (g.state !== 'eyes') {
                  g.state = 'frightened';
                  g.vx = -g.vx;
                  g.vy = -g.vy;
                }
              });
            }
          }

          // Move 4 OS App-Icon Ghosts with distinct personalities
          const baseGhostSpeed = (bounds.isMobile ? 114 : 138) + Math.min(e.level - 1, 6) * 11;
          const profileGhost = e.ghosts[0];

          e.ghosts.forEach((g, idx) => {
            let targetX = e.pacman.x;
            let targetY = e.pacman.y;
            let speed = baseGhostSpeed;

            if (g.state === 'eyes') {
              targetX = g.homeX;
              targetY = g.homeY;
              speed = baseGhostSpeed * 2.1;
              if (Math.hypot(g.x - g.homeX, g.y - g.homeY) < 16) {
                g.state = e.frightenedTimer > 1.2 ? 'frightened' : 'chase';
              }
            } else if (g.state === 'frightened') {
              // Flee away from Pac-Man
              targetX = g.x + (g.x - e.pacman.x) * 2.2;
              targetY = g.y + (g.y - e.pacman.y) * 2.2;
              speed = baseGhostSpeed * 0.58;
            } else {
              // Active personality targeting
              if (g.id === 'profile') {
                // Direct Chaser
                targetX = e.pacman.x;
                targetY = e.pacman.y;
                speed = baseGhostSpeed * 1.03;
              } else if (g.id === 'projects') {
                // Intercept Ambusher: aims 125px ahead of Pac-Man
                targetX = e.pacman.x + dirVec.x * 125;
                targetY = e.pacman.y + dirVec.y * 125;
                speed = baseGhostSpeed * 0.99;
              } else if (g.id === 'resume') {
                // Flanker: projects vector from Profile ghost through Pac-Man
                const px = profileGhost ? profileGhost.x : bounds.left;
                const py = profileGhost ? profileGhost.y : bounds.top;
                targetX = e.pacman.x + (e.pacman.x - px) * 0.55;
                targetY = e.pacman.y + (e.pacman.y - py) * 0.55;
                speed = baseGhostSpeed * 0.95;
              } else {
                // Terminal: Wild Card — chases from far, orbits unpredictably when close
                const distToPac = Math.hypot(g.x - e.pacman.x, g.y - e.pacman.y);
                if (distToPac < 140) {
                  const orbitAngle = e.time * 2.4 + g.personalityPhase;
                  targetX = e.pacman.x + Math.cos(orbitAngle) * 190;
                  targetY = e.pacman.y + Math.sin(orbitAngle) * 190;
                } else {
                  targetX = e.pacman.x + Math.sin(e.time * 1.9) * 70;
                  targetY = e.pacman.y + Math.cos(e.time * 1.9) * 70;
                }
                speed = baseGhostSpeed * 0.98;
              }
            }

            let dx = targetX - g.x;
            let dy = targetY - g.y;
            const len = Math.hypot(dx, dy) || 1;
            dx /= len;
            dy /= len;

            // Soft ghost-to-ghost separation so the 4 OS icons stay legible
            if (g.state !== 'eyes') {
              e.ghosts.forEach((other, oIdx) => {
                if (idx === oIdx || other.state === 'eyes') return;
                const sdx = g.x - other.x;
                const sdy = g.y - other.y;
                const sDist = Math.hypot(sdx, sdy);
                if (sDist > 0 && sDist < 48) {
                  const push = (48 - sDist) / 48;
                  dx += (sdx / sDist) * push * 1.35;
                  dy += (sdy / sDist) * push * 1.35;
                }
              });
            }

            const norm = Math.hypot(dx, dy) || 1;
            const desiredVx = (dx / norm) * speed;
            const desiredVy = (dy / norm) * speed;

            // Smooth steering inertia
            const turnRate = g.state === 'eyes' ? 12 : 4.8;
            g.vx += (desiredVx - g.vx) * Math.min(1, turnRate * dt);
            g.vy += (desiredVy - g.vy) * Math.min(1, turnRate * dt);

            g.x += g.vx * dt;
            g.y += g.vy * dt;

            // Keep ghosts cleanly inside arena bounds (soft bounce on edges)
            if (g.x < bounds.left + 18) {
              g.x = bounds.left + 18;
              g.vx = Math.abs(g.vx);
            } else if (g.x > bounds.right - 18) {
              g.x = bounds.right - 18;
              g.vx = -Math.abs(g.vx);
            }
            if (g.y < bounds.top + 18) {
              g.y = bounds.top + 18;
              g.vy = Math.abs(g.vy);
            } else if (g.y > bounds.bottom - 18) {
              g.y = bounds.bottom - 18;
              g.vy = -Math.abs(g.vy);
            }

            // Pac-Man vs Ghost collision
            const dist = Math.hypot(g.x - e.pacman.x, g.y - e.pacman.y);
            if (dist < 28) {
              if (g.state === 'frightened') {
                const comboPoints = 200 * e.ghostCombo;
                addScore(comboPoints);
                e.ghostsEaten += 1;
                playGhostEat(e.ghostCombo);
                spawnParticles(g.x, g.y, g.color, 16);
                spawnFloatingText(g.x, g.y - 10, `+${comboPoints}`, '#A5B4FC');
                e.ghostCombo = Math.min(e.ghostCombo * 2, 8);
                g.state = 'eyes';
                e.hitStopTimer = 0.085;
                scoreChanged = true;
              } else if (g.state === 'chase' && e.pacman.invulnTimer <= 0) {
                e.lives -= 1;
                playPacmanDeath();
                spawnParticles(e.pacman.x, e.pacman.y, '#F4C300', 18);
                scoreChanged = true;

                if (e.lives <= 0) {
                  syncPhase('GAME_OVER');
                  pushHud();
                } else {
                  // Brief recovery reset
                  e.pacman.x = e.pacman.homeX;
                  e.pacman.y = e.pacman.homeY;
                  e.pacman.invulnTimer = 2.2;
                  e.ghosts.forEach((gh) => {
                    gh.x = gh.homeX;
                    gh.y = gh.homeY;
                    gh.state = 'chase';
                  });
                  e.frightenedTimer = 0;
                  spawnFloatingText(e.pacman.x, e.pacman.y - 22, 'OOPS!', '#FCA5A5');
                }
              }
            }
          });

          // Check Wave Clear condition
          const remainingPellets = e.pellets.some((p) => !p.eaten);
          const remainingFruits = e.fruits.some((f) => !f.eaten);
          if (!remainingPellets && !remainingFruits && phaseRef.current === 'PLAYING') {
            addScore(500);
            playLevelClear();
            spawnFloatingText(w / 2, h / 2 - 20, 'WAVE CLEARED! +500', '#FDE047');
            syncPhase('LEVEL_CLEAR');
            pushHud();
          } else if (scoreChanged) {
            pushHud();
          }
        }
      }

      // Update floating texts, particles & edge portal flashes even during hit-stop/wave clear
      for (let i = e.particles.length - 1; i >= 0; i--) {
        const pt = e.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= 0.94;
        pt.vy *= 0.94;
        pt.life -= dt;
        if (pt.life <= 0) e.particles.splice(i, 1);
      }

      for (let i = e.texts.length - 1; i >= 0; i--) {
        const tx = e.texts[i];
        tx.y -= 34 * dt;
        tx.life -= dt;
        if (tx.life <= 0) e.texts.splice(i, 1);
      }

      for (let i = e.edgeFlashes.length - 1; i >= 0; i--) {
        e.edgeFlashes[i].life -= dt;
        if (e.edgeFlashes[i].life <= 0) e.edgeFlashes.splice(i, 1);
      }

      // Refresh HUD timer smoothly while frightened
      hudAccumulator += dt;
      if (hudAccumulator >= 0.08 && e.frightenedTimer > 0 && phaseRef.current === 'PLAYING') {
        hudAccumulator = 0;
        pushHud();
      }

      // === RENDER CANVAS ===
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, w, h);

        // Subtle open-arena perimeter rail & portal ticks
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 10]);
        ctx.strokeRect(
          bounds.left - 8,
          bounds.top - 8,
          bounds.right - bounds.left + 16,
          bounds.bottom - bounds.top + 16
        );
        ctx.restore();

        // Edge wrap-around portal flashes
        e.edgeFlashes.forEach((fl) => {
          const alpha = clamp(fl.life / 0.4, 0, 1);
          ctx.save();
          ctx.strokeStyle = `rgba(244, 195, 0, ${alpha * 0.85})`;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          if (fl.edge === 'left') {
            ctx.moveTo(bounds.left - 8, fl.pos - 26);
            ctx.lineTo(bounds.left - 8, fl.pos + 26);
          } else if (fl.edge === 'right') {
            ctx.moveTo(bounds.right + 8, fl.pos - 26);
            ctx.lineTo(bounds.right + 8, fl.pos + 26);
          } else if (fl.edge === 'up') {
            ctx.moveTo(fl.pos - 26, bounds.top - 8);
            ctx.lineTo(fl.pos + 26, bounds.top - 8);
          } else {
            ctx.moveTo(fl.pos - 26, bounds.bottom + 8);
            ctx.lineTo(fl.pos + 26, bounds.bottom + 8);
          }
          ctx.stroke();
          ctx.restore();
        });

        // Glowing pellets
        ctx.save();
        const pelletGlow = reducedMotionRef.current ? 0.82 : 0.72 + Math.sin(e.time * 4) * 0.16;
        e.pellets.forEach((p) => {
          if (p.eaten) return;
          ctx.fillStyle = `rgba(254, 243, 199, ${pelletGlow * 0.3})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FEF3C7';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.1, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        // Sticker Fruits
        e.fruits.forEach((f) => {
          if (!f.eaten) {
            drawFruitSprite(ctx, f, e.time, reducedMotionRef.current);
          }
        });

        // 4 OS App-Icon Ghosts
        e.ghosts.forEach((g) => {
          drawGhostSprite(ctx, g, e.time, e.frightenedTimer, reducedMotionRef.current);
        });

        // Pac-Man (Morphed Menu Launcher)
        const introProgress = phaseRef.current === 'INTRO' ? clamp(e.introTimer / INTRO_DURATION, 0, 1) : 1;
        drawPacmanSprite(
          ctx,
          e.pacman.x,
          e.pacman.y,
          e.pacman.dir,
          e.pacman.mouthPhase,
          introProgress,
          e.pacman.invulnTimer,
          e.time
        );

        // Particle bursts
        e.particles.forEach((pt) => {
          ctx.save();
          ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Floating score & combo popups
        e.texts.forEach((tx) => {
          ctx.save();
          ctx.globalAlpha = clamp(tx.life / tx.maxLife, 0, 1);
          ctx.font = '700 13px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillText(tx.text, tx.x + 1, tx.y + 1);
          ctx.fillStyle = tx.color;
          ctx.fillText(tx.text, tx.x, tx.y);
          ctx.restore();
        });
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [
    addScore,
    buildWave,
    playFruitPower,
    playGhostEat,
    playLevelClear,
    playPacmanDeath,
    playWaka,
    pushHud,
    spawnFloatingText,
    spawnParticles,
    syncPhase,
  ]);

  // Touch swipe-anywhere steering on canvas
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    swipeStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!swipeStartRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - swipeStartRef.current.x;
    const dy = e.touches[0].clientY - swipeStartRef.current.y;
    if (Math.hypot(dx, dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      steer(dx > 0 ? 'right' : 'left');
    } else {
      steer(dy > 0 ? 'down' : 'up');
    }
    // Re-anchor so continuous finger swiping turns seamlessly without lifting
    swipeStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = () => {
    swipeStartRef.current = null;
  };

  const frightenedPct = Math.round((hud.frightenedTimeLeft / FRIGHTENED_DURATION) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[85] select-none touch-none overflow-hidden"
    >
      {/* Adaptive contrast scrim over live KhanOS wallpaper */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/30 dark:bg-black/52 backdrop-blur-[1.5px] pointer-events-none"
      />

      {/* Full-viewport 60fps Canvas Arena */}
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="absolute inset-0 block w-full h-full touch-none"
      />

      {/* Unobtrusive Top Arcade HUD */}
      <div className="fixed top-2.5 md:top-3.5 inset-x-2.5 md:inset-x-6 z-[88] flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-4xl h-[50px] md:h-[52px] px-3 md:px-4 rounded-2xl bg-surface/92 backdrop-blur-md border border-border shadow-hard flex items-center justify-between gap-2 md:gap-4">
          {/* Metrics: Score · Best · Wave (tabular-nums, zero pill clutter) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 font-mono text-xs sm:text-[13px] tabular-nums">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-sans font-semibold">
                Score
              </span>
              <span className="font-bold text-text-main">{hud.score}</span>
            </div>
            <span className="text-border" aria-hidden="true">
              ·
            </span>
            <div className="hidden xs:flex sm:flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-sans font-semibold">
                Best
              </span>
              <span className="font-semibold text-primary">{hud.highScore}</span>
            </div>
            <span className="hidden sm:inline text-border" aria-hidden="true">
              ·
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-sans font-semibold">
                Wave
              </span>
              <span className="font-semibold text-text-main">{hud.level}</span>
            </div>
          </div>

          {/* Center: Live Ghost-Chomp Countdown (only while active) */}
          <div className="hidden md:flex flex-1 max-w-[210px] items-center justify-center">
            {hud.frightenedTimeLeft > 0 ? (
              <div className="w-full flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 shrink-0">
                  Chomp
                </span>
                <div className="flex-1 h-2 rounded-full bg-bg-app border border-border overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-75 ${
                      hud.frightenedTimeLeft < 2 ? 'bg-amber-400' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${frightenedPct}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] font-semibold tabular-nums text-text-main w-7 text-right">
                  {hud.frightenedTimeLeft.toFixed(1)}s
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-text-muted truncate">
                Eat sticker fruits to chomp ghosts
              </span>
            )}
          </div>

          {/* Right: Lives + Pause + Exit */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div
              className="flex items-center gap-1 pr-1 sm:pr-1.5"
              aria-label={`${hud.lives} lives remaining`}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={i < hud.lives ? 'opacity-100 scale-100 transition-all' : 'opacity-20 scale-90 transition-all'}
                >
                  <PacmanLifeIcon />
                </span>
              ))}
            </div>

            <button
              onClick={togglePause}
              disabled={phase === 'GAME_OVER' || phase === 'INTRO'}
              aria-label={phase === 'PAUSED' ? 'Resume game' : 'Pause game'}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium text-text-main disabled:opacity-40 transition-colors touch-manipulation"
            >
              {phase === 'PAUSED' ? <Play size={14} /> : <Pause size={14} />}
              <span className="hidden sm:inline">{phase === 'PAUSED' ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={() => {
                playClick();
                onExit();
              }}
              aria-label="Exit Pac-Man Mode"
              className="inline-flex items-center justify-center gap-1 h-9 px-2.5 sm:px-3 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium text-text-main transition-colors touch-manipulation"
            >
              <X size={14} />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Compact Power Timer Bar (when active on narrow viewports) */}
      <AnimatePresence>
        {hud.frightenedTimeLeft > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="md:hidden fixed top-[64px] left-1/2 -translate-x-1/2 z-[88] w-[200px] px-3 py-1 rounded-full bg-surface/90 border border-border shadow-medium flex items-center gap-2 pointer-events-none"
          >
            <span className="text-[10px] font-mono font-bold text-indigo-400">CHOMP</span>
            <div className="flex-1 h-1.5 rounded-full bg-bg-app overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  hud.frightenedTimeLeft < 2 ? 'bg-amber-400' : 'bg-indigo-500'
                }`}
                style={{ width: `${frightenedPct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-text-main">
              {hud.frightenedTimeLeft.toFixed(1)}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Intro Callout */}
      <AnimatePresence>
        {phase === 'INTRO' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[87] flex items-center justify-center pointer-events-none"
          >
            <div className="px-5 py-3 rounded-2xl bg-surface/92 backdrop-blur-md border border-border shadow-hard text-center">
              <div className="text-sm font-bold tracking-tight text-text-main">
                Wave {hud.level} — Ready!
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                WASD / Arrows · Swipe or D-Pad on touch
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wave Clear Banner */}
      <AnimatePresence>
        {phase === 'LEVEL_CLEAR' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[89] flex items-center justify-center pointer-events-none"
          >
            <div className="px-6 py-4 rounded-2xl bg-surface/95 backdrop-blur-md border border-primary/60 shadow-hard text-center space-y-1">
              <div className="text-base font-bold text-text-main">Wave {hud.level} Cleared</div>
              <div className="text-xs font-mono text-primary">+500 Bonus · Next wave incoming</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paused Modal */}
      <AnimatePresence>
        {phase === 'PAUSED' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[89] bg-black/35 backdrop-blur-[2px] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 8 }}
              className="w-full max-w-xs rounded-2xl bg-surface border border-border shadow-hard p-5 text-center space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-base font-bold text-text-main">Game Paused</h2>
                <p className="text-xs text-text-muted">
                  Collect glowing pellets and sticker fruits to turn Profile, Projects, Resume, and Terminal edible.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={togglePause}
                  className="w-full h-11 rounded-xl bg-primary text-primary-on text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  <Play size={14} />
                  Resume Wave {hud.level}
                </button>
                <button
                  onClick={resetFullGame}
                  className="w-full h-10 rounded-xl border border-border bg-bg-app text-text-main text-xs font-medium flex items-center justify-center gap-2 hover:bg-neutral-90 dark:hover:bg-neutral-10 transition-colors"
                >
                  <RotateCcw size={13} />
                  Restart Run
                </button>
                <button
                  onClick={() => {
                    playClick();
                    onExit();
                  }}
                  className="w-full h-10 rounded-xl text-text-muted hover:text-text-main text-xs font-medium transition-colors"
                >
                  Return to Desktop
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {phase === 'GAME_OVER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[89] bg-black/45 backdrop-blur-[3px] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 10 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="w-full max-w-sm rounded-2xl bg-surface border border-border shadow-hard p-6 text-center space-y-5"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-primary-container/40 border border-primary/40 text-primary mx-auto">
                  <Trophy size={20} />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-text-main">Game Over</h2>
                {hud.isNewBest ? (
                  <p className="text-xs font-mono font-semibold text-primary">
                    New Personal Best on KhanOS!
                  </p>
                ) : (
                  <p className="text-xs text-text-muted">
                    Reached Wave {hud.level} before the desktop icons caught up.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-bg-app p-3 font-mono tabular-nums">
                <div>
                  <div className="text-[10px] font-sans uppercase tracking-wider text-text-muted">
                    Score
                  </div>
                  <div className="text-base font-bold text-text-main mt-0.5">{hud.score}</div>
                </div>
                <div className="border-x border-border">
                  <div className="text-[10px] font-sans uppercase tracking-wider text-text-muted">
                    Best
                  </div>
                  <div className="text-base font-bold text-primary mt-0.5">{hud.highScore}</div>
                </div>
                <div>
                  <div className="text-[10px] font-sans uppercase tracking-wider text-text-muted">
                    Chomped
                  </div>
                  <div className="text-base font-bold text-text-main mt-0.5">
                    {hud.ghostsEaten}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={resetFullGame}
                  className="flex-1 h-11 rounded-xl bg-primary text-primary-on text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  <RotateCcw size={14} />
                  Play Again
                </button>
                <button
                  onClick={() => {
                    playClick();
                    onExit();
                  }}
                  className="flex-1 h-11 rounded-xl border border-border bg-bg-app text-text-main text-xs font-medium hover:bg-neutral-90 dark:hover:bg-neutral-10 transition-colors"
                >
                  Return to Desktop
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Translucent D-Pad (>=44px touch targets, bottom-right) */}
      {phase !== 'GAME_OVER' && phase !== 'PAUSED' && (
        <div
          aria-label="Directional controls"
          className="md:hidden fixed bottom-5 right-4 z-[88] grid grid-cols-3 grid-rows-3 gap-1.5 w-[144px] h-[144px] pointer-events-none"
        >
          <div />
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              steer('up');
            }}
            aria-label="Move Up"
            className={`pointer-events-auto flex items-center justify-center w-[44px] h-[44px] rounded-2xl border backdrop-blur-md touch-none transition-transform active:scale-92 ${
              activeDirUi === 'up'
                ? 'border-primary bg-primary/30 text-text-main shadow-medium'
                : 'border-border bg-surface/82 text-text-main'
            }`}
          >
            <ArrowUp size={20} />
          </button>
          <div />

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              steer('left');
            }}
            aria-label="Move Left"
            className={`pointer-events-auto flex items-center justify-center w-[44px] h-[44px] rounded-2xl border backdrop-blur-md touch-none transition-transform active:scale-92 ${
              activeDirUi === 'left'
                ? 'border-primary bg-primary/30 text-text-main shadow-medium'
                : 'border-border bg-surface/82 text-text-main'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-primary/50" />
          </div>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              steer('right');
            }}
            aria-label="Move Right"
            className={`pointer-events-auto flex items-center justify-center w-[44px] h-[44px] rounded-2xl border backdrop-blur-md touch-none transition-transform active:scale-92 ${
              activeDirUi === 'right'
                ? 'border-primary bg-primary/30 text-text-main shadow-medium'
                : 'border-border bg-surface/82 text-text-main'
            }`}
          >
            <ArrowRight size={20} />
          </button>

          <div />
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              steer('down');
            }}
            aria-label="Move Down"
            className={`pointer-events-auto flex items-center justify-center w-[44px] h-[44px] rounded-2xl border backdrop-blur-md touch-none transition-transform active:scale-92 ${
              activeDirUi === 'down'
                ? 'border-primary bg-primary/30 text-text-main shadow-medium'
                : 'border-border bg-surface/82 text-text-main'
            }`}
          >
            <ArrowDown size={20} />
          </button>
          <div />
        </div>
      )}
    </motion.div>
  );
};

export default PacmanGameOverlay;
