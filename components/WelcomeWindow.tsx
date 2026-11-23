import React, { useState } from 'react';
import { ArrowUpRight, FileText, FolderKanban, Mail, Copy, Check, Sparkles } from 'lucide-react';
import { PORTFOLIO_PROJECTS } from '../data/projects';
import { WindowId } from '../types';
import { useSound } from '../contexts/SoundContext';

interface WelcomeWindowProps {
  onOpenWindow: (id: WindowId) => void;
  onSelectProject: (projectId: string) => void;
  onOpenContact: () => void;
  onClose: () => void;
}

const WelcomeWindow: React.FC<WelcomeWindowProps> = ({
  onOpenWindow,
  onSelectProject,
  onOpenContact,
  onClose,
}) => {
  const { playClick } = useSound();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const featured = PORTFOLIO_PROJECTS.slice(0, 3);

  const handleCopyEmail = () => {
    playClick();
    navigator.clipboard?.writeText('khanhassan5451@gmail.com').catch(() => {});
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1600);
  };

  return (
    <div className="flex flex-col h-full bg-surface text-text-main overflow-y-auto overscroll-contain select-none">
      {/* Release Header */}
      <div className="p-4 sm:p-6 @4xl:px-10 @4xl:py-8 pb-5 border-b border-border bg-bg-app/60 shrink-0">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                aria-hidden="true"
                className="w-10 h-10 rounded-xl bg-primary text-primary-on font-bold text-sm tracking-tight flex items-center justify-center shrink-0 shadow-soft"
              >
                KH
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-main truncate">
                  Khan Hassan
                </div>
                <div className="text-[11px] font-mono text-text-muted truncate">
                  Mumbai, IN · Open to Internships &amp; Collaborations
                </div>
              </div>
            </div>
            <span className="hidden sm:inline text-xs font-mono text-text-muted shrink-0">
              Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface text-text-main">⌘K</kbd> to search
            </span>
          </div>

          <h1 className="mt-4 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-text-main leading-tight max-w-2xl [text-wrap:balance]">
            Building cloud-native &amp; GenAI software designed to feel effortless.
          </h1>
          <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-text-muted leading-relaxed max-w-xl">
            Computer Engineering student in Mumbai bridging resilient cloud architecture with
            tactile software craft — from localizing regional tourism data to disaster-communication
            frameworks like CrisisMesh AI.
          </p>

          <div className="mt-3.5 sm:mt-4 text-[11px] sm:text-xs font-mono text-text-muted leading-relaxed">
            Python · GCP · Vertex AI · Gemini · Streamlit · DevOps · React · TypeScript
          </div>

          <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => {
                playClick();
                onOpenWindow('projects');
              }}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-primary text-primary-on text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 touch-manipulation"
            >
              <FolderKanban size={14} />
              <span>Explore Showcase</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                onOpenWindow('resume');
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-3 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl border border-border bg-surface hover:bg-neutral-90 dark:hover:bg-neutral-10 active:scale-[0.98] text-xs font-semibold text-text-main transition-all whitespace-nowrap shrink-0 touch-manipulation"
            >
              <FileText size={14} />
              <span>View Resume</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                onOpenContact();
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 active:scale-[0.98] text-xs font-medium text-text-main transition-all whitespace-nowrap shrink-0 touch-manipulation"
            >
              <Mail size={14} />
              <span>Quick Contact</span>
            </button>
            <button
              type="button"
              onClick={handleCopyEmail}
              title="Copy khanhassan5451@gmail.com"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-main hover:bg-neutral-90/70 dark:hover:bg-neutral-10/70 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedEmail ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
              <span>{copiedEmail ? 'Email Copied' : 'Copy Email'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Releases Strip */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 @4xl:px-10 @4xl:py-8">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-text-muted">
                Featured Releases
              </h2>
              <button
                type="button"
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
                  type="button"
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
                Tip: Drag windows to screen edges to snap 50%, press ⌘/ for Window Overview, or right-click desktop to cycle wallpapers.
              </span>
              <span className="sm:hidden">
                Tip: Swipe horizontally to switch apps, pinch inward to close, or 3-finger swipe for the clean desktop clock.
              </span>
            </span>
            <button
              type="button"
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
