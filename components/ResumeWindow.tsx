import React, { useState } from 'react';
import { Printer, Copy, Check, ExternalLink } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';

const EXPERIENCE = [
  {
    role: 'Principal Frontend & Design Engineer',
    company: 'Atelier Systems Studio',
    period: '2024 — Present',
    summary:
      'Architected real-time treasury & spatial design tooling in React 19 and TypeScript, cutting interaction latency below 16ms and standardizing a unified Material tonal token system across 14 product surfaces.',
  },
  {
    role: 'Senior Creative Technologist',
    company: 'Northstar Interactive',
    period: '2022 — 2024',
    summary:
      'Led flagship editorial launches and WebGL/Canvas micro-interaction prototypes for consumer technology brands, achieving 99 Lighthouse scores with full keyboard and reduced-motion accessibility.',
  },
  {
    role: 'Frontend Engineer',
    company: 'Gridline Labs',
    period: '2020 — 2022',
    summary:
      'Built modular data-visualization components, rich text workflows, and automated visual regression pipelines.',
  },
];

const ResumeWindow: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { playClick } = useSound();

  const handleCopyEmail = () => {
    playClick();
    navigator.clipboard?.writeText('khanhassan5451@gmail.com').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handlePrint = () => {
    playClick();
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-surface text-text-main">
      {/* Toolbar */}
      <div className="px-4 sm:px-5 py-3 border-b border-border bg-bg-app/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 select-none">
        <div className="text-xs font-mono text-text-muted">
          Dossier · Curriculum Vitae · Updated 2026
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopyEmail}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-1.5 min-h-[42px] sm:min-h-0 rounded-lg border border-border bg-surface hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium whitespace-nowrap min-w-0 touch-manipulation"
          >
            {copied ? <Check size={13} className="text-primary shrink-0" /> : <Copy size={13} className="shrink-0" />}
            <span className="truncate">{copied ? 'Copied' : 'Copy Email'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-1.5 min-h-[42px] sm:min-h-0 rounded-lg bg-primary text-primary-on text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 touch-manipulation"
          >
            <Printer size={13} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Resume Sheet */}
      <div id="resume-print-sheet" className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto w-full space-y-6 sm:space-y-7">
        {/* Identity Header */}
        <header className="border-b border-border pb-4 sm:pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main">Khan</h1>
            <p className="text-sm font-medium text-primary mt-0.5">
              Principal Design Engineer &amp; Creative Technologist
            </p>
          </div>
          <div className="text-xs font-mono text-text-muted space-y-0.5 sm:text-right">
            <div>khanhassan5451@gmail.com</div>
            <div className="inline-flex items-center gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-main inline-flex items-center gap-1"
              >
                GitHub <ExternalLink size={11} />
              </a>
              <span>·</span>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-main inline-flex items-center gap-1"
              >
                LinkedIn <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </header>

        {/* Key Impact Strip */}
        <section className="grid grid-cols-3 gap-2.5 sm:gap-4 border-b border-border pb-4 sm:pb-5">
          <div>
            <div className="text-base sm:text-lg font-bold tabular-nums text-text-main">6+ Years</div>
            <div className="text-[11px] sm:text-xs text-text-muted">Frontend Systems</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold tabular-nums text-text-main">14 Apps</div>
            <div className="text-[11px] sm:text-xs text-text-muted">Unified Tokens</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold tabular-nums text-text-main">&lt; 16ms</div>
            <div className="text-[11px] sm:text-xs text-text-muted">Frame Budget</div>
          </div>
        </section>

        {/* Experience */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Experience
          </h2>
          <div className="space-y-5">
            {EXPERIENCE.map((item) => (
              <div key={item.company} className="space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm font-semibold text-text-main">
                    {item.role} <span className="font-normal text-text-muted">· {item.company}</span>
                  </div>
                  <span className="text-xs font-mono text-text-muted tabular-nums">
                    {item.period}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-text-muted leading-relaxed">{item.summary}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Competencies & Education */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-border">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Core Competencies
            </h2>
            <p className="text-xs md:text-sm text-text-main leading-relaxed">
              React · TypeScript · Next.js · Tailwind CSS · Framer Motion · HTML5 Canvas · WebGL / Three.js · Web Audio API · Design Systems · WCAG Accessibility
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Education
            </h2>
            <div className="text-sm font-semibold text-text-main">B.S. in Computer Science</div>
            <div className="text-xs text-text-muted">
              Focus in Human-Computer Interaction &amp; Real-Time Graphics · 2016 — 2020
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
};

export default ResumeWindow;
