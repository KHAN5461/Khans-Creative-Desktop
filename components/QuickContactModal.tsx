import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Copy, Check, ExternalLink, Send } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';

interface QuickContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ContactIntent = 'internship' | 'collab' | 'project' | 'hello';

const INTENTS: { id: ContactIntent; label: string; subject: string; placeholder: string }[] = [
  {
    id: 'internship',
    label: 'Internship',
    subject: 'Internship Opportunity — Khan Hassan',
    placeholder: 'Hi Khan, we have an engineering / cloud internship opening and would love to chat...',
  },
  {
    id: 'collab',
    label: 'Collaboration',
    subject: 'Collaboration Idea — Khan Hassan',
    placeholder: 'Hey Khan, saw your work on CrisisMesh AI and wanted to collaborate on...',
  },
  {
    id: 'project',
    label: 'Project Inquiry',
    subject: 'Project Inquiry via KhanOS',
    placeholder: 'Hi Khan, I am reaching out regarding a web or GenAI build...',
  },
  {
    id: 'hello',
    label: 'Say Hi',
    subject: 'Hello from KhanOS!',
    placeholder: 'Hey Khan, just explored your desktop portfolio and wanted to say hi!',
  },
];

const EMAIL = 'khanhassan5451@gmail.com';

const QuickContactModal: React.FC<QuickContactModalProps> = ({ isOpen, onClose }) => {
  const [intent, setIntent] = useState<ContactIntent>('internship');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const { playClick, playStick } = useSound();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const activeIntent = INTENTS.find((i) => i.id === intent) || INTENTS[0];

  const buildFormattedBody = () => {
    const trimmedMsg = message.trim() || activeIntent.placeholder;
    const signOff = senderName.trim() ? `\n\n— ${senderName.trim()}` : '';
    return `${trimmedMsg}${signOff}`;
  };

  const handleCopyEmail = () => {
    playClick();
    navigator.clipboard?.writeText(EMAIL).catch(() => {});
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1800);
  };

  const handleCopyMessage = () => {
    playStick();
    const formatted = `To: ${EMAIL}\nSubject: ${activeIntent.subject}\n\n${buildFormattedBody()}`;
    navigator.clipboard?.writeText(formatted).catch(() => {});
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 1800);
  };

  const mailtoHref = `mailto:${EMAIL}?subject=${encodeURIComponent(
    activeIntent.subject
  )}&body=${encodeURIComponent(buildFormattedBody())}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-no-context-menu="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[128] bg-black/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-surface/95 backdrop-blur-xl backdrop-saturate-150 border border-border shadow-hard overflow-hidden text-text-main"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-app/60">
              <div>
                <h2 className="text-base font-bold tracking-tight text-text-main">Quick Contact</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Khan Hassan · Mumbai, IN · Typically replies within 24h
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onClose();
                }}
                aria-label="Close contact sheet"
                className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-main hover:bg-neutral-90 dark:hover:bg-neutral-10 transition-colors touch-manipulation"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Direct Email Copy Row */}
              <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-bg-app">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail size={15} className="text-primary shrink-0" />
                  <span className="text-xs font-mono text-text-main truncate">{EMAIL}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium text-text-main shrink-0 whitespace-nowrap touch-manipulation"
                >
                  {copiedEmail ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                  <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Intent Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Topic</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-bg-app border border-border">
                  {INTENTS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setIntent(item.id);
                      }}
                      className={`py-2 sm:py-1.5 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap touch-manipulation ${
                        intent === item.id
                          ? 'bg-primary text-primary-on font-semibold shadow-sm'
                          : 'text-text-muted hover:text-text-main'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name / Team */}
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="text-xs font-medium text-text-muted">
                  Your Name or Team (optional)
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Alex from Cloud Studio"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg-app text-sm text-text-main placeholder:text-text-muted/70 outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label htmlFor="contact-note" className="text-xs font-medium text-text-muted">
                  Message
                </label>
                <textarea
                  id="contact-note"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={activeIntent.placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg-app text-sm text-text-main placeholder:text-text-muted/70 outline-none focus:border-primary resize-none transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <a
                  href={mailtoHref}
                  onClick={() => playClick()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-primary text-primary-on text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap touch-manipulation"
                >
                  <Send size={13} />
                  <span>Open in Mail App</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium text-text-main transition-colors whitespace-nowrap touch-manipulation"
                >
                  {copiedNote ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                  <span>{copiedNote ? 'Copied Note' : 'Copy Note'}</span>
                </button>
              </div>
            </div>

            {/* Footer Links */}
            <div className="px-5 py-3 border-t border-border bg-bg-app/50 flex items-center justify-between text-xs text-text-muted">
              <span>Or connect directly</span>
              <div className="flex items-center gap-3 font-medium">
                <a
                  href="https://www.linkedin.com/in/khan-hassan-eng/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playClick()}
                  className="inline-flex items-center gap-1 text-text-main hover:text-primary transition-colors"
                >
                  LinkedIn <ExternalLink size={11} />
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href="https://github.com/KHAN5461"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playClick()}
                  className="inline-flex items-center gap-1 text-text-main hover:text-primary transition-colors"
                >
                  GitHub <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickContactModal;
