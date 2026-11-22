import React, { useState, useRef, useEffect } from 'react';
import { ThemeId, WindowId } from '../types';
import { useSound } from '../contexts/SoundContext';

interface TerminalLine {
  type: 'input' | 'output' | 'accent' | 'error';
  text: string;
}

interface TerminalProps {
  onCommand?: (command: string, args: string[]) => string | void;
  onOpenWindow?: (id: WindowId) => void;
  onSwitchTheme?: (id: ThemeId) => void;
}

const KNOWN_COMMANDS = [
  'help',
  'about',
  'projects',
  'resume',
  'welcome',
  'open',
  'theme',
  'sticker',
  'party',
  'ink',
  'sound',
  'whoami',
  'contact',
  'date',
  'clear',
  'error',
  'reboot',
  'restart',
  'pong',
];

const QUICK_CHIPS = ['help', 'pong', 'open resume', 'open pixel', 'theme dev', 'sticker hello', 'party', 'reboot'];

const Terminal: React.FC<TerminalProps> = ({ onCommand, onOpenWindow, onSwitchTheme }) => {
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'accent', text: 'KhanOS Shell · Portfolio Terminal' },
    { type: 'output', text: "Type 'help' or click a command chip below." },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number>(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playKey, playError, playChime, playClick } = useSound();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const execute = (raw: string) => {
    const trimmed = raw.trim();
    const parts = trimmed.split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    const args = parts.slice(1);

    if (trimmed) {
      setCmdHistory((prev) => [trimmed, ...prev.slice(0, 29)]);
      setHistoryCursor(-1);
    }

    const nextLines: TerminalLine[] = [...history, { type: 'input', text: raw }];

    if (!cmd) {
      setHistory(nextLines);
      setInput('');
      return;
    }

    if (cmd === 'clear') {
      setHistory([]);
      setInput('');
      return;
    }

    let output = '';
    let lineType: TerminalLine['type'] = 'output';

    switch (cmd) {
      case 'help':
        output =
          'Commands: about · projects · resume · welcome · pong [2p|bricks] · open <welcome|projects|resume|pixel|code|settings|ink> · theme <warm|dark|dev|minimal|ocean|lavender> · sticker <text> · party · sound <on|off> · contact · error · reboot · clear';
        break;
      case 'about':
        output =
          'Khan Hassan — Computer Engineering Student (Mumbai) · Cloud, Backend & GenAI Engineer building scalable AI systems on GCP, Vertex AI, Gemini & Python.';
        lineType = 'accent';
        break;
      case 'projects':
        onOpenWindow?.('projects');
        output = 'Launching Projects Showcase...';
        break;
      case 'resume':
        onOpenWindow?.('resume');
        output = 'Opening Resume / Dossier...';
        break;
      case 'welcome':
        onOpenWindow?.('welcome');
        output = 'Opening Release Notes & Bio...';
        break;
      case 'open': {
        const target = (args[0] || '').toLowerCase();
        if (
          target === 'welcome' ||
          target === 'projects' ||
          target === 'resume' ||
          target === 'pixel' ||
          target === 'code' ||
          target === 'settings'
        ) {
          onOpenWindow?.(target);
          output = `Opened ${target} window.`;
        } else if (target === 'ink' || target === 'scribble') {
          output = onCommand?.('ink', args) || 'Toggled Desktop Ink mode.';
        } else {
          output = 'Usage: open <welcome|projects|resume|pixel|code|settings|ink>';
        }
        break;
      }
      case 'theme': {
        const t = (args[0] || '').toLowerCase() as ThemeId;
        const valid: ThemeId[] = ['warm', 'dark', 'dev', 'minimal', 'ocean', 'lavender'];
        if (valid.includes(t)) {
          onSwitchTheme?.(t);
          output = `Switched theme preset to '${t}'.`;
          lineType = 'accent';
        } else {
          output = `Available themes: ${valid.join(', ')}`;
        }
        break;
      }
      case 'whoami':
        output = 'visitor@khan-os';
        break;
      case 'contact':
        output = 'khanhassan5451@gmail.com · github.com/KHAN5461 · linkedin.com/in/khan-hassan-eng';
        lineType = 'accent';
        break;
      case 'date':
        output = new Date().toLocaleString();
        break;
      case 'error':
        output = 'ALERT: Spawning classic system error cascade...';
        lineType = 'error';
        playError();
        onCommand?.('error', args);
        break;
      case 'party':
        playChime();
        output = onCommand?.('party', args) || 'Stickers remixed!';
        lineType = 'accent';
        break;
      case 'reboot':
      case 'restart':
        playChime();
        output = onCommand?.('reboot', args) || 'Initiating KhanOS system reboot...';
        lineType = 'accent';
        break;
      case 'pong':
        playChime();
        output = onCommand?.('pong', args) || 'Morphing desktop into KhanOS Pong...';
        lineType = 'accent';
        break;
      case 'sticker':
      case 'ink':
      case 'sound':
        output = onCommand?.(cmd, args) || `Executed ${cmd}.`;
        lineType = 'accent';
        break;
      default:
        output = `Command not found: ${cmd}. Try 'help'.`;
        lineType = 'error';
    }

    if (output) {
      nextLines.push({ type: lineType, text: output });
    }
    setHistory(nextLines);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      execute(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = Math.min(historyCursor + 1, cmdHistory.length - 1);
      setHistoryCursor(nextIdx);
      setInput(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyCursor <= 0) {
        setHistoryCursor(-1);
        setInput('');
      } else {
        const nextIdx = historyCursor - 1;
        setHistoryCursor(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const val = input.trim().toLowerCase();
      if (!val) return;
      const match = KNOWN_COMMANDS.find((c) => c.startsWith(val));
      if (match) setInput(match + ' ');
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="h-full flex flex-col font-mono text-xs bg-[#161618] text-neutral-300 select-text"
    >
      <div
        data-no-swipe="true"
        className="flex items-center gap-1.5 px-3 @4xl:px-6 py-2 border-b border-white/10 overflow-x-auto scrollbar-hide shrink-0"
      >
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={(e) => {
              e.stopPropagation();
              playClick();
              execute(chip);
            }}
            className="px-3 py-1.5 sm:px-2 sm:py-1 min-h-[34px] sm:min-h-0 rounded-md bg-white/5 hover:bg-white/12 text-xs sm:text-[11px] text-neutral-300 whitespace-nowrap shrink-0 transition-colors touch-manipulation"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain space-y-1.5 p-3.5 sm:p-3 @4xl:px-6 @4xl:py-4">
        {history.map((line, i) => (
          <div
            key={i}
            className={`leading-relaxed break-words ${
              line.type === 'input'
                ? 'text-white'
                : line.type === 'error'
                  ? 'text-rose-400'
                  : line.type === 'accent'
                    ? 'text-amber-300'
                    : 'text-neutral-400'
            }`}
          >
            {line.type === 'input' && <span className="text-emerald-400 mr-2">➜ ~</span>}
            {line.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 px-3.5 py-3 sm:px-3 sm:py-2.5 @4xl:px-6 border-t border-white/10 bg-[#111113]">
        <span className="text-emerald-400">➜</span>
        <span className="text-sky-400">~</span>
        <input
          ref={inputRef}
          className="bg-transparent border-none outline-none flex-1 text-base sm:text-xs text-neutral-100 placeholder:text-neutral-600"
          placeholder="Type a command..."
          value={input}
          onChange={(e) => {
            playKey();
            setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          autoFocus={typeof window !== 'undefined' && window.innerWidth >= 768}
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default Terminal;
