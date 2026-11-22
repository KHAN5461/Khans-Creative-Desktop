import React from 'react';
import { ArrowUpRight, FileText, FolderKanban, Code2, Sparkles } from 'lucide-react';
import { PORTFOLIO_PROJECTS } from '../data/projects';
import { WindowId } from '../types';
import { useSound } from '../contexts/SoundContext';

interface WelcomeWindowProps {
  onOpenWindow: (id: WindowId) => void;
  onSelectProject: (projectId: string) => void;
  onClose: () => void;
}

const WelcomeWindow: React.FC<WelcomeWindowProps> = ({
  onOpenWindow,
  onSelectProject,
  onClose,
}) => {
  const { playClick } = useSound();
  const featured = PORTFOLIO_PROJECTS.slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-surface text-text-main overflow-y-auto overscroll-contain select-none">
      {/* Release Header */}
      <div className="p-4 sm:p-6 @4xl:px-10 @4xl:py-8 pb-5 border-b border-border bg-bg-app/60 shrink-0">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-mono text-text-muted">
              KhanOS Release 2.4 · Portfolio Edition
            </span>
            <span className="hidden sm:inline text-xs font-mono text-text-muted">
              Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface text-text-main">⌘K</kbd> to search
            </span>
          </div>

          <h1 className="mt-2.5 sm:mt-3 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-text-main leading-tight max-w-2xl">
            Hi, I&apos;m Khan Hassan — building cloud-native &amp; GenAI software.
          </h1>
          <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-text-muted leading-relaxed max-w-xl">
            Computer Engineering student in Mumbai bridging complex cloud architecture with
            user-centric software design — from localizing tourism data to resilient
            disaster-communication frameworks like CrisisMesh AI.
          </p>

          <div className="mt-3.5 sm:mt-4 text-[11px] sm:text-xs font-mono text-text-muted leading-relaxed">
            Python · GCP · Vertex AI · Gemini · Streamlit · DevOps · React · TypeScript
          </div>

          <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => {
                playClick();
                onOpenWindow('projects');
              }}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-primary text-primary-on text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 touch-manipulation"
            >
              <FolderKanban size={14} />
              Explore Showcase
            </button>
            <button
              onClick={() => {
                playClick();
                onOpenWindow('resume');
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-3 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl border border-border bg-surface hover:bg-neutral-90 dark:hover:bg-neutral-10 active:scale-[0.98] text-xs font-semibold text-text-main transition-all whitespace-nowrap shrink-0 touch-manipulation"
            >
              <FileText size={14} />
              View Resume
            </button>
            <button
              onClick={() => {
                playClick();
                onOpenWindow('code');
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 active:scale-[0.98] text-xs font-medium text-text-main transition-all whitespace-nowrap shrink-0 touch-manipulation"
            >
              <Code2 size={14} />
              Code Lab
            </button>
          </div>
        </div>
      </div>

      {/* Featured Releases Strip */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 @4xl:px-10 @4xl:py-8">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Featured Releases
              </h2>
              <button
                onClick={() => {
                  playClick();
                  onOpenWindow('projects');
                }}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 py-1"
              >
                All 6 projects <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 @4xl:gap-4">
              {featured.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    playClick();
                    onSelectProject(item.id);
                  }}
                  className="group p-3.5 sm:p-4 @4xl:p-5 rounded-xl border border-border bg-bg-app/70 hover:bg-neutral-90/70 dark:hover:bg-neutral-10/70 active:scale-[0.985] text-left transition-all flex flex-col justify-between gap-3 touch-manipulation"
                >
                  <div>
                    <div className="text-[11px] font-mono text-text-muted">
                      {item.category} · {item.year}
                    </div>
                    <div className="mt-1.5 text-sm @4xl:text-base font-semibold text-text-main group-hover:text-primary transition-colors">
                      {item.title}
                    </div>
                    <p className="mt-1 text-xs text-text-muted line-clamp-2 @4xl:line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-text-muted truncate">
                    {item.stack.slice(0, 3).join(' · ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Tips */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={13} className="text-primary shrink-0" />
              <span className="hidden sm:inline">
                Tip: Drag windows to screen edges to snap 50%, or fling stickers across the desk.
              </span>
              <span className="sm:hidden">
                Tip: Swipe horizontally to switch apps, pinch inward to close, or 3-finger swipe to toggle desktop.
              </span>
            </span>
            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              className="font-medium text-text-main hover:underline py-1"
            >
              Dismiss to Desktop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeWindow;
