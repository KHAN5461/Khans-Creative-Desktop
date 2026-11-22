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
  playChargeTick: (progress?: number) => void;
  playWaka: (step?: number) => void;
  playFruitPower: () => void;
  playGhostEat: (combo?: number) => void;
  playPacmanDeath: () => void;
  playLevelClear: () => void;
  playPongMorph: (entering?: boolean) => void;
  playPongPaddle: (rallyStep?: number) => void;
  playPongWall: () => void;
  playPongBumper: (combo?: number) => void;
  playPongBrick: (combo?: number) => void;
  playPongScore: (playerScored?: boolean) => void;
  playPongHop: () => void;
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

  const playChargeTick = useCallback(
    (progress = 0.5) => {
      const base = 300 + Math.max(0, Math.min(1, progress)) * 340;
      tone(base, base * 1.12, 0.05, 'sine', 0.03);
    },
    [tone]
  );

  const playWaka = useCallback(
    (step = 0) => {
      if (step % 2 === 0) {
        tone(270, 430, 0.065, 'triangle', 0.045);
      } else {
        tone(430, 260, 0.065, 'triangle', 0.045);
      }
    },
    [tone]
  );

  const playFruitPower = useCallback(() => {
    tone(523.25, 659.25, 0.08, 'triangle', 0.065, 0);
    tone(659.25, 783.99, 0.09, 'triangle', 0.06, 0.055);
    tone(783.99, 1046.5, 0.14, 'sine', 0.065, 0.11);
    tone(1046.5, 1318.5, 0.18, 'sine', 0.05, 0.17);
  }, [tone]);

  const playGhostEat = useCallback(
    (combo = 1) => {
      const mult = 1 + Math.min(combo, 8) * 0.08;
      tone(320 * mult, 780 * mult, 0.11, 'square', 0.04, 0);
      tone(620 * mult, 1120 * mult, 0.12, 'triangle', 0.055, 0.055);
    },
    [tone]
  );

  const playPacmanDeath = useCallback(() => {
    tone(520, 390, 0.11, 'sawtooth', 0.04, 0);
    tone(390, 280, 0.12, 'sawtooth', 0.04, 0.1);
    tone(280, 190, 0.14, 'triangle', 0.045, 0.21);
    tone(190, 95, 0.22, 'triangle', 0.05, 0.34);
  }, [tone]);

  const playLevelClear = useCallback(() => {
    tone(523.25, 523.25, 0.1, 'triangle', 0.06, 0);
    tone(659.25, 659.25, 0.1, 'triangle', 0.06, 0.085);
    tone(783.99, 783.99, 0.11, 'triangle', 0.06, 0.17);
    tone(1046.5, 1046.5, 0.14, 'sine', 0.065, 0.26);
    tone(1318.5, 1318.5, 0.28, 'sine', 0.06, 0.37);
  }, [tone]);

  const playPongMorph = useCallback(
    (entering = true) => {
      if (entering) {
        tone(260, 520, 0.16, 'sine', 0.055, 0);
        tone(440, 660, 0.14, 'triangle', 0.045, 0.08);
      } else {
        tone(560, 310, 0.16, 'sine', 0.05, 0);
        tone(380, 240, 0.14, 'triangle', 0.045, 0.09);
      }
    },
    [tone]
  );

  const playPongPaddle = useCallback(
    (rallyStep = 0) => {
      const pentatonic = [329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
      const f = pentatonic[Math.min(Math.max(0, rallyStep), pentatonic.length - 1)];
      tone(f, f * 1.06, 0.075, 'triangle', 0.065, 0);
      tone(f * 0.5, f * 0.45, 0.04, 'sine', 0.04, 0);
    },
    [tone]
  );

  const playPongWall = useCallback(() => {
    tone(280, 210, 0.045, 'sine', 0.045, 0);
  }, [tone]);

  const playPongBumper = useCallback(
    (combo = 0) => {
      const f = 360 + Math.min(combo, 8) * 38;
      tone(f, f * 1.25, 0.085, 'triangle', 0.06, 0);
    },
    [tone]
  );

  const playPongBrick = useCallback(
    (combo = 0) => {
      const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
      const f = scale[Math.min(Math.max(0, combo), scale.length - 1)];
      tone(f, f * 1.18, 0.09, 'sine', 0.06, 0);
      tone(f * 1.5, f * 1.5, 0.06, 'triangle', 0.035, 0.03);
    },
    [tone]
  );

  const playPongScore = useCallback(
    (playerScored = true) => {
      if (playerScored) {
        tone(523.25, 523.25, 0.09, 'triangle', 0.055, 0);
        tone(659.25, 659.25, 0.1, 'triangle', 0.055, 0.07);
        tone(783.99, 783.99, 0.16, 'sine', 0.055, 0.14);
      } else {
        tone(340, 260, 0.11, 'triangle', 0.05, 0);
        tone(250, 185, 0.16, 'sine', 0.05, 0.09);
      }
    },
    [tone]
  );

  const playPongHop = useCallback(() => {
    tone(420, 680, 0.09, 'sine', 0.055, 0);
    tone(540, 820, 0.1, 'triangle', 0.05, 0.11);
  }, [tone]);

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
        playChargeTick,
        playWaka,
        playFruitPower,
        playGhostEat,
        playPacmanDeath,
        playLevelClear,
        playPongMorph,
        playPongPaddle,
        playPongWall,
        playPongBumper,
        playPongBrick,
        playPongScore,
        playPongHop,
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
