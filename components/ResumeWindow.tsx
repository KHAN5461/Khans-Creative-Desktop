import React, { useState } from 'react';
import { Printer, Copy, Check, ExternalLink, Download, Award, MapPin } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';

const EXPERIENCE = [
  {
    role: 'Student — Computer Engineering',
    company: "Anjuman-I-Islam's Kalsekar Technical Campus",
    location: 'Maharashtra, India',
    period: 'Sep 2024 — Present',
    bullets: [
      'Studying core concepts of Computer Engineering, Software Development, and Systems.',
      'Building with Python, APIs, containerized backends, and Google Cloud Platform (GCP).',
      'Developing AI-powered systems, automation workflows, and multimedia tools.',
      'Actively completing cloud and generative AI technical learning programs and certifications.',
    ],
  },
  {
    role: 'Video Editor',
    company: 'Srividyaniketan Classes',
    location: 'Mumbai, Maharashtra, India',
    period: 'Jul 2023 — Jan 2024',
    bullets: [
      'Conceptualized and produced engaging technical content in Hinglish to make complex engineering concepts accessible and viral-ready for online video platforms.',
    ],
  },
];

const EDUCATION = [
  {
    institution: "Anjuman-I-Islam's Kalsekar Technical Campus School of Engineering",
    degree: 'Bachelor of Engineering (BE) — Computer Engineering',
    period: 'Sep 2024 — Sep 2028',
  },
  {
    institution: 'University of Mumbai',
    degree: 'Bachelor of Engineering (BE) — Computer & Information Sciences and Support Services',
    period: 'Sep 2024 — Sep 2028',
  },
];

const CERTIFICATIONS = [
  'Develop GenAI Apps with Gemini and Streamlit',
  'Prompt Design in Vertex AI',
  'McKinsey Forward Graduate',
  'Python',
  'Graphic Design Essentials',
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
      <div className="px-4 sm:px-5 @4xl:px-8 py-3 border-b border-border bg-bg-app/70 shrink-0 select-none">
        <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-xs font-mono text-text-muted">
            Dossier · Curriculum Vitae · Mumbai, IN
          </div>
          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2.5 sm:py-1.5 min-h-[42px] sm:min-h-0 rounded-lg border border-border bg-surface hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium whitespace-nowrap min-w-0 touch-manipulation"
            >
              {copied ? <Check size={13} className="text-primary shrink-0" /> : <Copy size={13} className="shrink-0" />}
              <span className="truncate">{copied ? 'Copied' : 'Email'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2.5 sm:py-1.5 min-h-[42px] sm:min-h-0 rounded-lg border border-border bg-surface hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium whitespace-nowrap min-w-0 touch-manipulation"
            >
              <Printer size={13} className="shrink-0" />
              <span className="truncate">Print</span>
            </button>
            <a
              href="/assets/aistudio/Profile__2__2298aec1.pdf"
              download="Khan_Hassan_Profile.pdf"
              onClick={() => playClick()}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-1.5 min-h-[42px] sm:min-h-0 rounded-lg bg-primary text-primary-on text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 touch-manipulation"
            >
              <Download size={13} className="shrink-0" />
              <span>PDF</span>
            </a>
          </div>
        </div>
      </div>

      {/* Printable Resume Sheet */}
      <div
        id="resume-print-sheet"
        className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 @4xl:bg-bg-app/35 @4xl:py-8"
      >
        <div className="max-w-3xl @4xl:max-w-4xl mx-auto w-full space-y-6 sm:space-y-7 @4xl:bg-surface @4xl:border @4xl:border-border @4xl:rounded-2xl @4xl:p-10 @4xl:shadow-soft">
          {/* Identity Header */}
          <header className="border-b border-border pb-4 sm:pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-main">Khan Hassan</h1>
              <p className="text-sm font-medium text-primary mt-0.5">
                Computer Engineering Student · Cloud, Software &amp; GenAI Engineer
              </p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-text-muted">
                <MapPin size={12} className="shrink-0" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>
            <div className="text-xs font-mono text-text-muted space-y-1 sm:text-right">
              <div>khanhassan5451@gmail.com</div>
              <div className="inline-flex items-center gap-2">
                <a
                  href="https://github.com/KHAN5461"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text-main inline-flex items-center gap-1"
                >
                  GitHub <ExternalLink size={11} />
                </a>
                <span>·</span>
                <a
                  href="https://www.linkedin.com/in/khan-hassan-eng/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text-main inline-flex items-center gap-1"
                >
                  LinkedIn <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </header>

          {/* Summary */}
          <section className="space-y-2 border-b border-border pb-4 sm:pb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Summary
            </h2>
            <p className="text-xs sm:text-sm text-text-main/90 leading-relaxed">
              Second-year Computer Engineering student bridging complex cloud architecture and
              user-centric software design. Driven by building AI-powered systems for real-world
              challenges—from localizing tourism data to engineering resilient disaster-communication
              frameworks like CrisisMesh AI. Focused on the intersection of DevOps, Backend
              Engineering, and Generative AI on serverless infrastructure.
            </p>
          </section>

          {/* Key Highlights Strip */}
          <section className="grid grid-cols-3 gap-2.5 sm:gap-4 border-b border-border pb-4 sm:pb-5">
            <div>
              <div className="text-base sm:text-lg font-bold tabular-nums text-text-main">BE &apos;28</div>
              <div className="text-[11px] sm:text-xs text-text-muted">Computer Engineering</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold tabular-nums text-text-main">GCP &amp; AI</div>
              <div className="text-[11px] sm:text-xs text-text-muted">Vertex AI · Gemini</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold tabular-nums text-text-main">5 Certs</div>
              <div className="text-[11px] sm:text-xs text-text-muted">Cloud, Python &amp; Design</div>
            </div>
          </section>

          {/* Experience */}
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Experience
            </h2>
            <div className="space-y-5">
              {EXPERIENCE.map((item) => (
                <div key={item.company} className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-sm font-semibold text-text-main">
                      {item.role} <span className="font-normal text-text-muted">· {item.company}</span>
                    </div>
                    <span className="text-xs font-mono text-text-muted tabular-nums">
                      {item.period}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-text-muted">{item.location}</div>
                  <ul className="space-y-1 pt-0.5 text-xs md:text-sm text-text-muted leading-relaxed list-disc pl-4">
                    {item.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="space-y-3 pt-2 border-t border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Education
            </h2>
            <div className="space-y-3">
              {EDUCATION.map((ed) => (
                <div key={ed.institution} className="space-y-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-sm font-semibold text-text-main">{ed.institution}</div>
                    <span className="text-xs font-mono text-text-muted tabular-nums">{ed.period}</span>
                  </div>
                  <div className="text-xs text-text-muted">{ed.degree}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Certifications & Skills */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-border">
            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-1.5">
                <Award size={12} /> Certifications
              </h2>
              <ul className="space-y-1.5 text-xs md:text-sm text-text-main">
                {CERTIFICATIONS.map((cert) => (
                  <li key={cert} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Technical &amp; Creative Skills
              </h2>
              <div className="space-y-2 text-xs md:text-sm text-text-main leading-relaxed">
                <p>
                  <span className="font-semibold text-text-muted">Cloud &amp; AI:</span> Google Cloud
                  Platform (GCP) · Vertex AI · Gemini · Streamlit · Python · APIs · DevOps · Serverless
                  &amp; Containers
                </p>
                <p>
                  <span className="font-semibold text-text-muted">Web &amp; Media:</span> React ·
                  TypeScript · Graphic Design · Video Editing · Videography · Offline Editing
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResumeWindow;
