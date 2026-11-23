import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  ExternalLink,
  Code2,
  Sparkles,
  Crosshair,
  X,
  Link2,
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { IconBack, IconGithub } from './Icons';
import { PORTFOLIO_PROJECTS } from '../data/projects';
import { ProjectCategory, ProjectItem } from '../types';
import { CodePresetId } from './CodePlayground';
import { useSound } from '../contexts/SoundContext';

interface FileExplorerProps {
  selectedProjectId?: string | null;
  onSelectProjectId?: (id: string | null) => void;
  onOpenCodeLab?: (preset?: CodePresetId) => void;
}

const CATEGORIES: ('All' | ProjectCategory)[] = [
  'All',
  'Featured Releases',
  'Lab Experiments',
  'Open Source',
  'Design Assets',
];

// --- Live Interactive Sandboxes ---

const FintechPreview: React.FC = () => {
  const [range, setRange] = useState<'1D' | '1W' | '1M'>('1W');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const { playClick } = useSound();

  const datasets: Record<'1D' | '1W' | '1M', number[]> = {
    '1D': [42, 45, 44, 49, 53, 51, 58, 62, 60, 67],
    '1W': [38, 41, 47, 45, 52, 59, 57, 64, 71, 76],
    '1M': [24, 30, 29, 39, 44, 42, 55, 61, 68, 82],
  };

  const points = datasets[range];
  const activeVal = hoverIdx !== null ? points[hoverIdx] : points[points.length - 1];
  const pathD = points
    .map((val, i) => {
      const x = (i / (points.length - 1)) * 280;
      const y = 96 - ((val - 20) / 70) * 76;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="rounded-xl border border-border bg-bg-app p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-text-muted">CrisisMesh · Active Relay Throughput</span>
          <div className="text-xl font-bold tabular-nums text-text-main">
            {(activeVal * 18).toLocaleString()} <span className="text-xs font-mono font-normal text-text-muted">msg/min</span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface border border-border text-xs">
          {(['1D', '1W', '1M'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                playClick();
                setRange(r);
              }}
              className={`px-2.5 py-1.5 sm:px-2 sm:py-0.5 rounded font-mono transition-colors touch-manipulation ${
                range === r ? 'bg-primary text-primary-on' : 'text-text-muted hover:text-text-main'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox="0 0 280 104"
        className="w-full h-28 overflow-visible cursor-crosshair touch-none"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const idx = Math.round(ratio * (points.length - 1));
          setHoverIdx(idx);
        }}
        onPointerLeave={() => setHoverIdx(null)}
      >
        <path
          d={pathD}
          fill="none"
          stroke="var(--m3-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((val, i) => {
          const x = (i / (points.length - 1)) * 280;
          const y = 96 - ((val - 20) / 70) * 76;
          return (
            <g key={i} onPointerEnter={() => setHoverIdx(i)}>
              <rect x={x - 14} y={0} width={28} height={104} fill="transparent" />
              <circle
                cx={x}
                cy={y}
                r={hoverIdx === i ? 5 : 2.5}
                fill="var(--m3-primary)"
                className="transition-all"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const EcommPreview: React.FC = () => {
  const [region, setRegion] = useState<'Konkan' | 'Sahyadri' | 'Mumbai'>('Konkan');
  const { playClick } = useSound();
  const colors = { Konkan: '#D5A700', Sahyadri: '#4F7759', Mumbai: '#334155' };

  return (
    <div className="rounded-xl border border-border bg-bg-app p-4 flex flex-col sm:flex-row items-center gap-4">
      <motion.div
        whileHover={{ rotateY: 12, rotateX: -6, scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-28 h-28 rounded-xl border border-black/10 shadow-medium shrink-0 flex items-center justify-center text-white font-serif italic text-lg"
        style={{ backgroundColor: colors[region] }}
      >
        {region}
      </motion.div>
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div className="text-sm font-semibold text-text-main">Localized Guide · {region}</div>
        <p className="text-xs text-text-muted">
          Switch regional datasets to preview localized cultural metadata and contextual palettes.
        </p>
        <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
          {(['Konkan', 'Sahyadri', 'Mumbai'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                playClick();
                setRegion(r);
              }}
              className={`px-3 py-1.5 sm:px-2.5 sm:py-1 min-h-[36px] sm:min-h-0 rounded-md text-xs border transition-colors touch-manipulation ${
                region === r
                  ? 'border-primary bg-primary text-primary-on'
                  : 'border-border bg-surface text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const GenerativePreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<{ x: number; y: number; r: number }[]>([]);
  const { playPop } = useSound();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let angle = 0;

    const tick = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = 'rgba(18, 18, 22, 0.22)';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 18; i++) {
        const a = angle + i * ((Math.PI * 2) / 18);
        const radius = 34 + Math.sin(angle * 2 + i) * 14;
        const x = w / 2 + Math.cos(a) * radius * 1.4;
        const y = h / 2 + Math.sin(a) * radius;
        ctx.fillStyle = i % 2 === 0 ? '#F4C300' : '#9BCBFF';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ripplesRef.current = ripplesRef.current.filter((rp) => rp.r < 90);
      ripplesRef.current.forEach((rp) => {
        rp.r += 2.2;
        ctx.strokeStyle = `rgba(244, 195, 0, ${Math.max(0, 1 - rp.r / 90)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      angle += 0.025;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-[#121216] p-3 flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={130}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 320;
          const y = ((e.clientY - rect.top) / rect.height) * 130;
          ripplesRef.current.push({ x, y, r: 2 });
          playPop();
        }}
        className="w-full h-32 rounded-lg cursor-pointer"
      />
      <span className="text-[11px] font-mono text-neutral-400">
        Click inside canvas to inject harmonic ripples
      </span>
    </div>
  );
};

const SynthPreview: React.FC = () => {
  const [steps, setSteps] = useState<boolean[]>([true, false, true, true, false, true, false, true]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const { playClick } = useSound();

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.close().catch(() => {});
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % 8;
        if (steps[next]) {
          if (!audioRef.current) {
            const Ctx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (Ctx) audioRef.current = new Ctx();
          }
          const ctx = audioRef.current;
          if (ctx) {
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(notes[next], ctx.currentTime);
            g.gain.setValueAtTime(0.08, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.18);
          }
        }
        return next;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [isPlaying, steps]);

  return (
    <div className="rounded-xl border border-border bg-bg-app p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-main">8-Step Pentatonic Sequencer</span>
        <button
          onClick={() => {
            playClick();
            setIsPlaying((p) => !p);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-primary-on text-xs font-semibold"
        >
          {isPlaying ? <Square size={12} /> : <Play size={12} />}
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-1.5">
        {steps.map((active, i) => (
          <button
            key={i}
            onClick={() => {
              playClick();
              setSteps((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
            }}
            className={`h-11 sm:h-10 rounded-lg border font-mono text-xs sm:text-[11px] tabular-nums transition-all touch-manipulation ${
              active
                ? 'bg-primary text-primary-on border-primary'
                : 'bg-surface text-text-muted border-border hover:border-text-muted'
            } ${isPlaying && currentStep === i ? 'ring-2 ring-text-main scale-105' : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

const SpringHookPreview: React.FC = () => {
  const [stiffness, setStiffness] = useState(340);
  const [damping, setDamping] = useState(20);
  const [pulled, setPulled] = useState(false);
  const { playPop } = useSound();

  return (
    <div className="rounded-xl border border-border bg-bg-app p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 overflow-hidden">
        <motion.button
          onClick={() => {
            playPop();
            setPulled((p) => !p);
          }}
          animate={{ x: pulled ? 72 : 0, rotate: pulled ? 6 : 0 }}
          transition={{ type: 'spring', stiffness, damping }}
          className="px-4 py-2.5 min-h-[42px] rounded-xl bg-primary text-primary-on text-xs font-semibold shadow-sm cursor-pointer touch-manipulation shrink-0"
        >
          Tap to Spring
        </motion.button>
        <span className="text-[11px] font-mono text-text-muted tabular-nums shrink-0">
          k={stiffness} · c={damping}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <label className="block text-text-muted">
          Stiffness
          <input
            type="range"
            min={120}
            max={600}
            value={stiffness}
            onChange={(e) => setStiffness(Number(e.target.value))}
            className="w-full accent-primary mt-1"
          />
        </label>
        <label className="block text-text-muted">
          Damping
          <input
            type="range"
            min={8}
            max={40}
            value={damping}
            onChange={(e) => setDamping(Number(e.target.value))}
            className="w-full accent-primary mt-1"
          />
        </label>
      </div>
    </div>
  );
};

const TokensPreview: React.FC = () => (
  <div className="rounded-xl border border-border bg-bg-app p-4 space-y-3">
    <span className="text-xs font-medium text-text-main">Live Active Theme Swatches</span>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-2 text-[11px] font-mono">
      {[
        { label: 'Primary', bg: 'var(--m3-primary)' },
        { label: 'Container', bg: 'var(--m3-primary-container)' },
        { label: 'Surface', bg: 'var(--bg-surface)' },
        { label: 'Elevated', bg: 'var(--surface-high)' },
      ].map((t) => (
        <div key={t.label} className="space-y-1">
          <div className="h-10 rounded-lg border border-border" style={{ backgroundColor: t.bg }} />
          <span className="block text-text-muted truncate">{t.label}</span>
        </div>
      ))}
    </div>
  </div>
);

// --- Product Showcase Explorer ---

const FileExplorer: React.FC<FileExplorerProps> = ({
  selectedProjectId = null,
  onSelectProjectId,
  onOpenCodeLab,
}) => {
  const [category, setCategory] = useState<'All' | ProjectCategory>('All');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(selectedProjectId);
  const [inspectMode, setInspectMode] = useState(false);
  const [activeSpecId, setActiveSpecId] = useState<string | null>(null);
  const [activeArchId, setActiveArchId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { playClick, playPop } = useSound();

  useEffect(() => {
    setInternalSelectedId(selectedProjectId);
    setActiveSpecId(null);
    setActiveArchId(null);
    setInspectMode(false);
    setIsScrolled(false);
  }, [selectedProjectId]);

  const activeId = selectedProjectId !== undefined ? selectedProjectId : internalSelectedId;
  const setActiveId = (id: string | null) => {
    setInternalSelectedId(id);
    setActiveSpecId(null);
    setActiveArchId(null);
    setInspectMode(false);
    setIsScrolled(false);
    onSelectProjectId?.(id);
  };

  const activeProjectIndex = PORTFOLIO_PROJECTS.findIndex((p) => p.id === activeId);
  const activeProject: ProjectItem | undefined =
    activeProjectIndex >= 0 ? PORTFOLIO_PROJECTS[activeProjectIndex] : undefined;
  const activeSpecs = activeProject?.specs || [];
  const selectedSpec = activeSpecs.find((sp) => sp.id === activeSpecId) || activeSpecs[0] || null;
  const activeArchNodes = activeProject?.architecture || [];
  const selectedArch =
    activeArchNodes.find((n) => n.id === activeArchId) || activeArchNodes[0] || null;

  const prevProject =
    activeProjectIndex >= 0
      ? PORTFOLIO_PROJECTS[
          (activeProjectIndex - 1 + PORTFOLIO_PROJECTS.length) % PORTFOLIO_PROJECTS.length
        ]
      : null;
  const nextProject =
    activeProjectIndex >= 0
      ? PORTFOLIO_PROJECTS[(activeProjectIndex + 1) % PORTFOLIO_PROJECTS.length]
      : null;

  const visibleProjects =
    category === 'All'
      ? PORTFOLIO_PROJECTS
      : PORTFOLIO_PROJECTS.filter((p) => p.category === category);

  const handleCopyProjectLink = (projectId: string) => {
    playClick();
    const url = `${window.location.origin}${window.location.pathname}#project=${encodeURIComponent(
      projectId
    )}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1600);
  };

  if (activeProject) {
    return (
      <div className="flex flex-col h-full bg-surface text-text-main">
        {/* Detail Header with Scroll Elevation */}
        <div
          className={`border-b border-border bg-surface/92 backdrop-blur-md backdrop-saturate-150 sticky top-0 z-10 px-3.5 sm:px-4 @4xl:px-6 py-3 transition-shadow duration-150 ${
            isScrolled
              ? 'shadow-[0_8px_20px_-12px_rgba(0,0,0,0.28)] dark:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)]'
              : ''
          }`}
        >
          <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setActiveId(null);
                }}
                aria-label="Back to showcase"
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-neutral-90 dark:hover:bg-neutral-10 rounded-full transition-colors shrink-0 touch-manipulation"
              >
                <IconBack size={18} />
              </button>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{activeProject.title}</div>
                <div className="text-xs text-text-muted font-mono tabular-nums truncate">
                  {activeProject.role} · {activeProject.year} · {activeProject.filename}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleCopyProjectLink(activeProject.id)}
                title="Copy direct link to this project"
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2.5 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium whitespace-nowrap shrink-0 touch-manipulation"
              >
                {copiedLink ? (
                  <Check size={13} className="text-primary" />
                ) : (
                  <Link2 size={13} />
                )}
                <span>{copiedLink ? 'Copied' : 'Link'}</span>
              </button>
              {onOpenCodeLab && (
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    const mappedPreset: CodePresetId =
                      activeProject.previewKind === 'generative'
                        ? 'wave-canvas'
                        : activeProject.previewKind === 'tokens'
                          ? 'profile'
                          : 'spring-card';
                    onOpenCodeLab(mappedPreset);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2.5 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium whitespace-nowrap shrink-0 touch-manipulation"
                >
                  <Code2 size={13} />
                  <span>Sandbox</span>
                </button>
              )}
              {activeProject.liveUrl && (
                <a
                  href={activeProject.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2.5 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium whitespace-nowrap shrink-0 touch-manipulation"
                >
                  <span>Live Demo</span>
                  <ExternalLink size={11} />
                </a>
              )}
              <a
                href={activeProject.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2.5 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg bg-primary text-primary-on text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 touch-manipulation"
              >
                <IconGithub size={13} />
                <span>Source</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Detail Body */}
        <div
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 4)}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6 @4xl:p-8"
        >
          <div className="max-w-6xl mx-auto w-full space-y-6">
            <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-6 @4xl:gap-8 items-start">
              <div className="@4xl:col-span-7 @4xl:sticky @4xl:top-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-xs font-semibold text-text-muted">
                    Interactive Demo Sandbox
                  </h3>
                  {activeSpecs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setInspectMode((v) => {
                          const next = !v;
                          if (next && activeSpecs[0]) setActiveSpecId(activeSpecs[0].id);
                          return next;
                        });
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-2.5 sm:py-1 min-h-[36px] sm:min-h-0 rounded-lg border text-[11px] font-medium transition-colors touch-manipulation ${
                        inspectMode
                          ? 'border-primary bg-primary text-primary-on shadow-sm'
                          : 'border-border bg-bg-app text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10'
                      }`}
                    >
                      <Crosshair size={12} />
                      <span>{inspectMode ? 'Inspector Active' : 'Inspect Specs'}</span>
                    </button>
                  )}
                </div>

                <div className="relative">
                  {activeProject.previewKind === 'fintech' && <FintechPreview />}
                  {activeProject.previewKind === 'ecomm' && <EcommPreview />}
                  {activeProject.previewKind === 'generative' && <GenerativePreview />}
                  {activeProject.previewKind === 'synth' && <SynthPreview />}
                  {activeProject.previewKind === 'spring-hook' && <SpringHookPreview />}
                  {activeProject.previewKind === 'tokens' && <TokensPreview />}

                  {/* Engineering Spec Pins Overlay */}
                  <AnimatePresence>
                    {inspectMode &&
                      activeSpecs.map((pin, idx) => {
                        const isSelected = selectedSpec?.id === pin.id;
                        return (
                          <motion.button
                            type="button"
                            key={pin.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 450,
                              damping: 24,
                              delay: idx * 0.05,
                            }}
                            onClick={() => {
                              playPop();
                              setActiveSpecId(pin.id);
                            }}
                            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                            aria-label={`Inspect ${pin.label}`}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-full border text-[11px] font-mono font-bold shadow-hard transition-transform cursor-pointer touch-manipulation ${
                              isSelected
                                ? 'bg-primary text-primary-on border-text-main scale-110'
                                : 'bg-surface/95 text-text-main border-primary hover:scale-105'
                            }`}
                          >
                            <span>0{idx + 1}</span>
                          </motion.button>
                        );
                      })}
                  </AnimatePresence>
                </div>

                {/* Active Spec Pin Detail Card */}
                <AnimatePresence>
                  {inspectMode && selectedSpec && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16 }}
                      className="mt-2.5 p-3.5 rounded-xl border border-primary/40 bg-primary-container/15 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-xs font-bold text-text-main">
                            {selectedSpec.label}
                          </span>
                          <span className="text-[11px] font-mono text-primary font-semibold tabular-nums">
                            {selectedSpec.metric}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInspectMode(false)}
                          aria-label="Close inspector"
                          className="p-1 rounded-md text-text-muted hover:text-text-main"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {selectedSpec.reason}
                      </p>
                      {selectedSpec.preset && onOpenCodeLab && (
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            onOpenCodeLab(selectedSpec.preset);
                          }}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
                        >
                          <Code2 size={12} />
                          <span>Open matching sandbox in Code Lab →</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="@4xl:col-span-5 space-y-5 sm:space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-text-muted">
                    Summary
                  </h3>
                  <p className="text-sm text-text-main leading-relaxed">{activeProject.summary}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-text-muted">
                    Engineering Highlights
                  </h3>
                  <ul className="space-y-2 text-sm text-text-main">
                    {activeProject.highlights.map((hl, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary font-mono text-xs mt-1 tabular-nums">
                          0{i + 1}.
                        </span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-border">
                  <span className="text-xs font-mono text-text-muted">
                    {activeProject.stack.join(' · ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive System Architecture Flow */}
            {activeArchNodes.length > 0 && selectedArch && (
              <section className="pt-5 border-t border-border space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xs font-semibold text-text-muted">
                    Interactive System Architecture
                  </h3>
                  <span className="text-[11px] font-mono text-text-muted">
                    Select any node to inspect data flow &amp; tradeoffs
                  </span>
                </div>

                {/* Node Flow Pipeline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 @4xl:grid-cols-4 gap-2.5">
                  {activeArchNodes.map((node, idx) => {
                    const isSelected = selectedArch.id === node.id;
                    return (
                      <div key={node.id} className="relative flex items-stretch">
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setActiveArchId(node.id);
                          }}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 touch-manipulation ${
                            isSelected
                              ? 'border-primary bg-primary-container/25 shadow-soft'
                              : 'border-border bg-bg-app/65 hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                            <span className={isSelected ? 'text-primary font-semibold' : 'text-text-muted'}>
                              {node.stage}
                            </span>
                            <span className="text-text-muted tabular-nums truncate">
                              {node.metric}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-text-main leading-snug">
                              {node.title}
                            </div>
                            <div className="mt-0.5 text-[11px] font-mono text-text-muted truncate">
                              {node.tech}
                            </div>
                          </div>
                        </button>
                        {idx < activeArchNodes.length - 1 && (
                          <div
                            aria-hidden="true"
                            className="hidden @4xl:flex items-center justify-center -mr-2.5 pl-0.5 z-10 text-text-muted/60 pointer-events-none"
                          >
                            <ArrowRight size={13} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Architecture Node Inspector */}
                <motion.div
                  key={selectedArch.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16 }}
                  className="p-4 rounded-xl border border-border bg-bg-app/80 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 text-xs">
                      <span className="font-mono font-semibold text-primary">
                        Stage {selectedArch.stage}
                      </span>
                      <span className="font-semibold text-text-main">{selectedArch.title}</span>
                      <span className="text-text-muted font-mono">· {selectedArch.tech}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                      {selectedArch.detail}
                    </p>
                  </div>
                  <div className="text-xs font-mono text-text-main tabular-nums shrink-0 sm:text-right">
                    {selectedArch.metric}
                  </div>
                </motion.div>
              </section>
            )}

            {/* Previous / Next Case Study Footer */}
            {prevProject && nextProject && (
              <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setActiveId(prevProject.id);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-left transition-colors min-w-0 touch-manipulation"
                >
                  <ChevronLeft size={14} className="text-text-muted shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-text-muted">Previous</div>
                    <div className="text-xs font-semibold text-text-main truncate">
                      {prevProject.title}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setActiveId(nextProject.id);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-right transition-colors min-w-0 touch-manipulation"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-text-muted">Next</div>
                    <div className="text-xs font-semibold text-text-main truncate">
                      {nextProject.title}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-text-muted shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface text-text-main select-none">
      {/* Category Filter Bar with Scroll Elevation */}
      <div
        data-no-swipe="true"
        className={`px-3.5 sm:px-4 @4xl:px-6 py-2.5 border-b border-border bg-bg-app/80 backdrop-blur-md backdrop-saturate-150 shrink-0 transition-shadow duration-150 z-10 ${
          isScrolled
            ? 'shadow-[0_8px_20px_-12px_rgba(0,0,0,0.26)] dark:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.68)]'
            : ''
        }`}
      >
        <div className="max-w-6xl mx-auto w-full flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => {
                playClick();
                setCategory(cat);
              }}
              className={`px-3.5 py-2 sm:px-3 sm:py-1.5 min-h-[38px] sm:min-h-0 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 touch-manipulation ${
                category === cat
                  ? 'bg-surface text-text-main border border-border shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div
        onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 4)}
        className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4 md:p-5 @4xl:p-7"
      >
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 @4xl:grid-cols-3 gap-3 sm:gap-4">
          {visibleProjects.map((project) => (
            <motion.button
              type="button"
              key={project.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => {
                playClick();
                setActiveId(project.id);
              }}
              className="group p-4 @4xl:p-5 rounded-xl border border-border bg-bg-app/60 hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60 text-left transition-colors flex flex-col justify-between gap-3 touch-manipulation"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-text-muted">
                  <span>{project.category}</span>
                  <span className="tabular-nums">{project.year}</span>
                </div>
                <h3 className="mt-1.5 text-base font-semibold text-text-main group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <p className="mt-1 text-xs text-text-muted line-clamp-2 @4xl:line-clamp-3 leading-relaxed">
                  {project.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span className="truncate">{project.stack.slice(0, 3).join(' · ')}</span>
                <span className="text-primary shrink-0 ml-2">Open →</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer Strip */}
      <div className="px-4 @4xl:px-6 py-2 border-t border-border bg-bg-app/70 text-[11px] text-text-muted font-mono tabular-nums">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2">
          <span>{visibleProjects.length} releases</span>
          <span className="inline-flex items-center gap-1 truncate">
            <Sparkles size={11} className="text-primary shrink-0" />
            <span className="truncate">Interactive demos &amp; architecture diagrams inside</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
