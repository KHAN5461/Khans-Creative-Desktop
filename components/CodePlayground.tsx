import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';

export type CodePresetId = 'spring-card' | 'wave-canvas' | 'profile';

interface CodePlaygroundProps {
  initialPreset?: CodePresetId;
}

const CodePlayground: React.FC<CodePlaygroundProps> = ({ initialPreset = 'spring-card' }) => {
  const [preset, setPreset] = useState<CodePresetId>(initialPreset);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialPreset) {
      setPreset(initialPreset);
    }
  }, [initialPreset]);

  // SpringCard live state
  const [cardTilt, setCardTilt] = useState(14);
  const [cardRadius, setCardRadius] = useState(20);
  const [cardHeadline, setCardHeadline] = useState('Motion with Intent');
  const [tiltPos, setTiltPos] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  // WaveCanvas live state
  const [waveAmp, setWaveAmp] = useState(28);
  const [waveFreq, setWaveFreq] = useState(0.025);
  const [waveSpeed, setWaveSpeed] = useState(2.2);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);

  // Profile live state
  const [profileName, setProfileName] = useState('Khan Hassan');
  const [profileRole, setProfileRole] = useState('Cloud, Backend & GenAI Engineer');
  const [profileStatus, setProfileStatus] = useState('Open to Cloud-Native & AI Roles');

  const { playClick, playKey } = useSound();

  // Animate WaveCanvas when active
  useEffect(() => {
    if (preset !== 'wave-canvas') return;
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let t = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-40').trim() || '#7A5900';
      const muted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#787579';

      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        ctx.strokeStyle = layer === 0 ? primary : muted;
        ctx.globalAlpha = layer === 0 ? 0.95 : 0.35 - layer * 0.1;
        ctx.lineWidth = layer === 0 ? 2.5 : 1.5;

        for (let x = 0; x <= w; x += 4) {
          const y =
            h / 2 +
            Math.sin(x * waveFreq + t + layer * 0.9) * (waveAmp * (1 - layer * 0.2)) +
            Math.cos(x * waveFreq * 0.5 - t * 0.6) * (waveAmp * 0.28);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      t += 0.025 * waveSpeed;
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [preset, waveAmp, waveFreq, waveSpeed]);

  const codeString =
    preset === 'spring-card'
      ? `const cardConfig = {\n  headline: "${cardHeadline}",\n  tiltStrength: ${cardTilt},\n  borderRadius: "${cardRadius}px",\n  spring: { stiffness: 320, damping: 24 }\n};`
      : preset === 'wave-canvas'
        ? `function drawHarmonicWave(ctx, t) {\n  const amplitude = ${waveAmp};\n  const frequency = ${waveFreq.toFixed(3)};\n  const speed = ${waveSpeed.toFixed(1)};\n  return Math.sin(x * frequency + t * speed) * amplitude;\n}`
        : `export const developer = {\n  name: "${profileName}",\n  role: "${profileRole}",\n  availability: "${profileStatus}",\n  location: "Mumbai, India",\n  stack: ["Python", "GCP", "Vertex AI", "Gemini", "React"],\n  github: "github.com/KHAN5461",\n  email: "khanhassan5451@gmail.com"\n};`;

  const handleCopy = () => {
    playClick();
    navigator.clipboard?.writeText(codeString).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReset = () => {
    playClick();
    setCardTilt(14);
    setCardRadius(20);
    setCardHeadline('Motion with Intent');
    setWaveAmp(28);
    setWaveFreq(0.025);
    setWaveSpeed(2.2);
    setProfileName('Khan Hassan');
    setProfileRole('Cloud, Backend & GenAI Engineer');
    setProfileStatus('Open to Cloud-Native & AI Roles');
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b] text-neutral-200 select-none">
      {/* Tabs Bar */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-white/10 bg-[#121215] shrink-0">
        <div data-no-swipe="true" className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {(
            [
              { id: 'spring-card', label: 'SpringCard.tsx' },
              { id: 'wave-canvas', label: 'WaveCanvas.js' },
              { id: 'profile', label: 'KhanProfile.ts' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playClick();
                setPreset(tab.id);
              }}
              className={`px-3 py-2 sm:py-1.5 min-h-[38px] sm:min-h-0 rounded-lg text-xs font-mono transition-colors whitespace-nowrap shrink-0 touch-manipulation ${
                preset === tab.id
                  ? 'bg-white/12 text-white font-medium'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleReset}
            title="Reset parameters"
            className="p-2 sm:p-1.5 min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-2.5 sm:py-1 min-h-[38px] sm:min-h-0 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0 touch-manipulation"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Split Sandbox: Live Preview + Interactive Parameters & Code */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-2 min-h-0 overflow-y-auto md:overflow-hidden overscroll-contain">
        {/* Live Preview Pane */}
        <div className="p-4 sm:p-5 @4xl:p-10 flex flex-col items-center justify-center bg-[#1e1e22] border-b md:border-b-0 md:border-r border-white/10 min-h-[195px] sm:min-h-[220px] shrink-0">
          {preset === 'spring-card' && (
            <div
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const px = (e.clientX - rect.left) / rect.width;
                const py = (e.clientY - rect.top) / rect.height;
                setTiltPos({
                  rx: (0.5 - py) * cardTilt * 2,
                  ry: (px - 0.5) * cardTilt * 2,
                  gx: px * 100,
                  gy: py * 100,
                });
              }}
              onPointerLeave={() => setTiltPos({ rx: 0, ry: 0, gx: 50, gy: 50 })}
              className="w-full max-w-[240px] @4xl:max-w-[340px] p-5 @4xl:p-7 border border-white/15 bg-gradient-to-br from-white/10 to-white/[0.03] shadow-xl cursor-pointer transition-transform duration-150 ease-out"
              style={{
                borderRadius: `${cardRadius}px`,
                transform: `perspective(700px) rotateX(${tiltPos.rx}deg) rotateY(${tiltPos.ry}deg)`,
                backgroundImage: `radial-gradient(circle at ${tiltPos.gx}% ${tiltPos.gy}%, rgba(255,255,255,0.16), transparent 60%)`,
              }}
            >
              <span className="text-[11px] font-mono text-amber-300/90">Interactive Component</span>
              <h3 className="mt-2 text-lg @4xl:text-xl font-bold text-white leading-snug">{cardHeadline}</h3>
              <p className="mt-2 text-xs @4xl:text-sm text-neutral-400 leading-relaxed">
                Move cursor across this surface to feel live perspective tilt and radial sheen.
              </p>
            </div>
          )}

          {preset === 'wave-canvas' && (
            <div className="w-full flex flex-col items-center gap-2.5">
              <canvas
                ref={waveCanvasRef}
                width={320}
                height={180}
                className="w-full max-w-[260px] @4xl:max-w-[420px] h-[150px] @4xl:h-[220px] rounded-xl bg-[#121215] border border-white/10"
              />
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                amp {waveAmp}px · freq {waveFreq.toFixed(3)} · {waveSpeed.toFixed(1)}x
              </span>
            </div>
          )}

          {preset === 'profile' && (
            <div className="w-full max-w-[250px] @4xl:max-w-[340px] rounded-2xl border border-white/15 bg-[#121215] p-5 @4xl:p-7 space-y-3">
              <div>
                <h3 className="text-base @4xl:text-lg font-bold text-white">{profileName || 'Khan Hassan'}</h3>
                <p className="text-xs @4xl:text-sm text-neutral-400 mt-0.5">{profileRole}</p>
              </div>
              <div className="h-px bg-white/10" />
              <div className="text-xs @4xl:text-sm text-neutral-300">{profileStatus}</div>
              <div className="text-[11px] font-mono text-amber-300">github.com/KHAN5461</div>
            </div>
          )}
        </div>

        {/* Controls + Readout Code */}
        <div className="flex flex-col p-4 @4xl:p-8 md:overflow-y-auto">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between gap-5">
            <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Live Parameters
            </span>

            {preset === 'spring-card' && (
              <div className="space-y-3 text-xs">
                <label className="block">
                  <span className="text-neutral-400">Headline</span>
                  <input
                    value={cardHeadline}
                    onChange={(e) => {
                      playKey();
                      setCardHeadline(e.target.value);
                    }}
                    className="mt-1 w-full px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 text-base sm:text-xs text-white outline-none focus:border-amber-400"
                  />
                </label>
                <label className="block">
                  <div className="flex justify-between text-neutral-400">
                    <span>Tilt Strength</span>
                    <span className="font-mono tabular-nums">{cardTilt}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={cardTilt}
                    onChange={(e) => setCardTilt(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </label>
                <label className="block">
                  <div className="flex justify-between text-neutral-400">
                    <span>Corner Radius</span>
                    <span className="font-mono tabular-nums">{cardRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={32}
                    value={cardRadius}
                    onChange={(e) => setCardRadius(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </label>
              </div>
            )}

            {preset === 'wave-canvas' && (
              <div className="space-y-2.5 text-xs">
                <label className="block">
                  <div className="flex justify-between text-neutral-400">
                    <span>Amplitude</span>
                    <span className="font-mono tabular-nums">{waveAmp}px</span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={52}
                    value={waveAmp}
                    onChange={(e) => setWaveAmp(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </label>
                <label className="block">
                  <div className="flex justify-between text-neutral-400">
                    <span>Frequency</span>
                    <span className="font-mono tabular-nums">{waveFreq.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.008}
                    max={0.06}
                    step={0.002}
                    value={waveFreq}
                    onChange={(e) => setWaveFreq(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </label>
                <label className="block">
                  <div className="flex justify-between text-neutral-400">
                    <span>Speed</span>
                    <span className="font-mono tabular-nums">{waveSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={5}
                    step={0.2}
                    value={waveSpeed}
                    onChange={(e) => setWaveSpeed(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </label>
              </div>
            )}

            {preset === 'profile' && (
              <div className="space-y-3 text-xs">
                <label className="block">
                  <span className="text-neutral-400">Display Name</span>
                  <input
                    value={profileName}
                    onChange={(e) => {
                      playKey();
                      setProfileName(e.target.value);
                    }}
                    className="mt-1 w-full px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 text-base sm:text-xs text-white outline-none focus:border-amber-400"
                  />
                </label>
                <label className="block">
                  <span className="text-neutral-400">Role</span>
                  <input
                    value={profileRole}
                    onChange={(e) => {
                      playKey();
                      setProfileRole(e.target.value);
                    }}
                    className="mt-1 w-full px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 text-base sm:text-xs text-white outline-none focus:border-amber-400"
                  />
                </label>
                <label className="block">
                  <span className="text-neutral-400">Status</span>
                  <input
                    value={profileStatus}
                    onChange={(e) => {
                      playKey();
                      setProfileStatus(e.target.value);
                    }}
                    className="mt-1 w-full px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 text-base sm:text-xs text-white outline-none focus:border-amber-400"
                  />
                </label>
              </div>
            )}
          </div>

            <pre className="p-3.5 rounded-xl bg-[#111114] border border-white/8 font-mono text-[11px] @4xl:text-xs leading-relaxed text-emerald-300/90 overflow-x-auto select-text">
              {codeString}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePlayground;
