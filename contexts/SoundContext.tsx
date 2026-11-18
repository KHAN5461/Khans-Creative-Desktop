import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  playPop: () => void;
  playStick: () => void;
  playClick: () => void;
  playOpen: () => void;
  playClose: () => void;
  playMinimize: () => void;
  playSnap: () => void;
  playPaint: (step?: number) => void;
  playChime: () => void;
  playError: () => void;
  playKey: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-sound-enabled');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('app-sound-enabled', String(soundEnabled));
  }, [soundEnabled]);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (!soundEnabled || typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, [soundEnabled]);

  const tone = useCallback(
    (
      freqStart: number,
      freqEnd: number,
      duration: number,
      type: OscillatorType = 'sine',
      gainVal = 0.08,
      delay = 0
    ) => {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
      }
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    },
    [getAudioContext]
  );

  const playPop = useCallback(() => tone(360, 620, 0.075, 'sine', 0.06), [tone]);
  const playStick = useCallback(() => tone(240, 140, 0.07, 'triangle', 0.07), [tone]);
  const playClick = useCallback(() => tone(520, 420, 0.045, 'sine', 0.045), [tone]);
  const playOpen = useCallback(() => {
    tone(330, 495, 0.09, 'sine', 0.055, 0);
    tone(495, 660, 0.11, 'sine', 0.05, 0.045);
  }, [tone]);
  const playClose = useCallback(() => tone(420, 210, 0.09, 'sine', 0.055), [tone]);
  const playMinimize = useCallback(() => tone(520, 240, 0.12, 'triangle', 0.05), [tone]);
  const playSnap = useCallback(() => {
    tone(190, 260, 0.06, 'triangle', 0.075);
    tone(520, 520, 0.05, 'sine', 0.04, 0.03);
  }, [tone]);
  const playPaint = useCallback(
    (step = 0) => {
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      const f = pentatonic[Math.abs(step) % pentatonic.length];
      tone(f, f * 1.04, 0.045, 'sine', 0.035);
    },
    [tone]
  );
  const playChime = useCallback(() => {
    tone(523.25, 523.25, 0.14, 'sine', 0.055, 0);
    tone(659.25, 659.25, 0.14, 'sine', 0.05, 0.06);
    tone(783.99, 783.99, 0.18, 'sine', 0.05, 0.12);
    tone(1046.5, 1046.5, 0.25, 'sine', 0.045, 0.18);
  }, [tone]);
  const playError = useCallback(() => {
    tone(220, 180, 0.1, 'square', 0.04, 0);
    tone(160, 120, 0.16, 'square', 0.04, 0.1);
  }, [tone]);
  const playKey = useCallback(() => tone(700 + Math.random() * 140, 480, 0.025, 'triangle', 0.02), [tone]);

  const setSoundEnabled = (enabled: boolean) => setSoundEnabledState(enabled);
  const toggleSound = () => setSoundEnabledState((prev) => !prev);

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        toggleSound,
        playPop,
        playStick,
        playClick,
        playOpen,
        playClose,
        playMinimize,
        playSnap,
        playPaint,
        playChime,
        playError,
        playKey,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within a SoundProvider');
  return ctx;
};
