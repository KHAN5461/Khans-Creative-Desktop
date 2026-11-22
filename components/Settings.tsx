import React, { useState, useRef } from 'react';
import { useTheme, PRESET_WALLPAPERS, Wallpaper } from '../theme/ThemeContext';
import { useSound } from '../contexts/SoundContext';
import { ContrastLevel } from '../theme/types';
import { ThemeId, ToyMode } from '../types';
import { Check, Upload, Volume2, VolumeX, RotateCcw, Sun, Moon } from 'lucide-react';

interface SettingsProps {
  toyMode: ToyMode;
  onChangeToyMode: (mode: ToyMode) => void;
  onResetDesktop: () => void;
}

const THEME_PRESETS: { id: ThemeId; label: string; color: string; bg: string }[] = [
  { id: 'warm', label: 'Warm & Cozy', color: '#D5A700', bg: '#FCF8F9' },
  { id: 'dark', label: 'Focus Dark', color: '#F4C300', bg: '#1A181C' },
  { id: 'dev', label: 'Cyber Dev', color: '#39FFAC', bg: '#101814' },
  { id: 'minimal', label: 'Swiss Minimal', color: '#111111', bg: '#FFFFFF' },
  { id: 'ocean', label: 'Pacific Blue', color: '#0061A4', bg: '#F8F9FC' },
  { id: 'lavender', label: 'Lavender Mist', color: '#6750A4', bg: '#FEF7FF' },
];

const CONTRAST_OPTIONS: { id: ContrastLevel; label: string; desc: string }[] = [
  { id: 'standard', label: 'Standard', desc: 'Balanced M3 tones' },
  { id: 'medium', label: 'Medium', desc: 'Boosted clarity' },
  { id: 'high', label: 'High', desc: 'Max legibility' },
];

const Settings: React.FC<SettingsProps> = ({ toyMode, onChangeToyMode, onResetDesktop }) => {
  const [tab, setTab] = useState<'themes' | 'wallpapers' | 'behavior'>('themes');
  const {
    theme,
    themeId,
    setTheme,
    contrast,
    setContrast,
    toggleDarkMode,
    isDynamicActive,
    dynamicDark,
    setDynamicDark,
    wallpaper,
    setWallpaper,
    customWallpaper,
    setCustomWallpaper,
    extractedSeed,
    resetAppearance,
  } = useTheme();
  const { soundEnabled, toggleSound, playClick, playStick } = useSound();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTheme = (id: ThemeId) => {
    playClick();
    setTheme(id);
  };

  const handleSelectWallpaper = (wp: Wallpaper) => {
    playClick();
    setWallpaper(wp);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const custom: Wallpaper = {
          id: `custom-${Date.now()}`,
          type: 'custom',
          value: reader.result,
          label: file.name.slice(0, 18),
        };
        setCustomWallpaper(custom);
        setWallpaper(custom);
        playStick();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-surface text-text-main select-none">
      {/* Header + Segmented Tabs */}
      <div className="px-4 sm:px-5 @4xl:px-8 pt-4 pb-3 border-b border-border">
        <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">System Settings</h2>
            <p className="text-text-muted text-xs">Unified Material 3 Tonal Engine &amp; OS preferences</p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-app border border-border self-stretch sm:self-auto">
            {(
              [
                { id: 'themes', label: 'Themes' },
                { id: 'wallpapers', label: 'Wallpapers' },
                { id: 'behavior', label: 'Behavior' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  playClick();
                  setTab(t.id);
                }}
                className={`flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 touch-manipulation ${
                  tab === t.id
                    ? 'bg-surface text-text-main shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 @4xl:p-8">
        <div className="max-w-5xl mx-auto w-full space-y-5 sm:space-y-6">
        {tab === 'themes' && (
          <section className="space-y-4 sm:space-y-5">
            {/* Appearance Mode + Contrast Level (M3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-bg-app flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-text-main">Appearance</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {theme.isDark ? 'Dark tone-based surfaces' : 'Light tone-based surfaces'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    toggleDarkMode();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-3 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg border border-border bg-surface hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium shrink-0 touch-manipulation"
                >
                  {theme.isDark ? <Moon size={13} className="text-primary" /> : <Sun size={13} className="text-primary" />}
                  <span>{theme.isDark ? 'Dark' : 'Light'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-bg-app space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-main">Contrast Level</span>
                  <span className="text-[10px] font-mono text-text-muted capitalize">
                    {CONTRAST_OPTIONS.find((c) => c.id === contrast)?.desc}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-surface border border-border">
                  {CONTRAST_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        playClick();
                        setContrast(opt.id);
                      }}
                      className={`py-2 sm:py-1 text-[11px] font-medium rounded-md transition-colors touch-manipulation ${
                        contrast === opt.id
                          ? 'bg-primary text-primary-on font-semibold'
                          : 'text-text-muted hover:text-text-main'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 @4xl:grid-cols-3 gap-3">
              {THEME_PRESETS.map((preset) => {
                const selected = !isDynamicActive && themeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectTheme(preset.id)}
                    className={`relative flex items-center p-3.5 rounded-xl border transition-all text-left ${
                      selected
                        ? 'border-primary ring-1 ring-primary bg-primary-container/25'
                        : 'border-border hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full border border-border shadow-sm mr-3.5 shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: preset.bg }}
                    >
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: preset.color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-semibold text-sm text-text-main truncate">
                        {preset.label}
                      </span>
                      <span className="block text-[11px] font-mono text-text-muted">
                        M3 tonal roles
                      </span>
                    </div>
                    {selected && (
                      <div className="ml-auto text-primary">
                        <Check size={18} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active M3 Role Swatches */}
            <div className="p-3.5 rounded-xl border border-border bg-bg-app space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>Active Material 3 Roles</span>
                <span>{theme.isDark ? 'Dark' : 'Light'} · {contrast}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[10px] font-mono text-text-muted">
                {[
                  { label: 'Primary', bg: 'var(--m3-primary)' },
                  { label: 'Container', bg: 'var(--m3-primary-container)' },
                  { label: 'Canvas', bg: 'var(--bg-app)' },
                  { label: 'Surface', bg: 'var(--bg-surface)' },
                  { label: 'Elevated', bg: 'var(--surface-high)' },
                ].map((r) => (
                  <div key={r.label} className="space-y-1">
                    <div className="h-7 rounded-lg border border-border" style={{ backgroundColor: r.bg }} />
                    <span className="block truncate">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === 'wallpapers' && (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-text-main">Dynamic Wallpaper Gallery</h3>
                <p className="text-xs text-text-muted">
                  Picking an artwork or uploading an image extracts Material tonal tokens live.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-app hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium whitespace-nowrap shrink-0"
              >
                <Upload size={13} />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 @4xl:grid-cols-4 gap-3 @4xl:gap-4">
              {[...PRESET_WALLPAPERS, ...(customWallpaper ? [customWallpaper] : [])].map((wp) => {
                const isSelected = wallpaper.id === wp.id;
                return (
                  <button
                    key={wp.id}
                    onClick={() => handleSelectWallpaper(wp)}
                    className={`group relative rounded-xl overflow-hidden border text-left transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/40'
                        : 'border-border hover:border-text-muted'
                    }`}
                  >
                    <div className="h-24 w-full bg-bg-app relative overflow-hidden">
                      {wp.type === 'default' && (
                        <div
                          className="w-full h-full"
                          style={{
                            background:
                              'radial-gradient(circle at 30% 30%, var(--wallpaper-glow-1), var(--bg-app) 70%)',
                          }}
                        />
                      )}
                      {wp.type === 'gradient' && (
                        <div className="w-full h-full" style={{ background: wp.value }} />
                      )}
                      {(wp.type === 'image' || wp.type === 'custom') && (
                        <img
                          src={wp.value}
                          alt={wp.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-on flex items-center justify-center shadow-sm">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <div className="px-2.5 py-2 bg-surface text-xs font-medium truncate">
                      {wp.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {isDynamicActive && (
              <div className="p-4 rounded-xl border border-border bg-bg-app flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-text-main">
                    Extracted Tonal Palette {extractedSeed ? `· ${extractedSeed}` : ''}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[
                      'var(--m3-primary)',
                      'var(--m3-primary-container)',
                      'var(--m3-secondary)',
                      'var(--m3-tertiary)',
                    ].map(
                      (c, i) => (
                        <span
                          key={i}
                          className="w-5 h-5 rounded-full border border-border"
                          style={{ backgroundColor: c }}
                        />
                      )
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    playClick();
                    setDynamicDark(!dynamicDark);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-medium hover:bg-neutral-90 dark:hover:bg-neutral-10"
                >
                  {dynamicDark ? <Moon size={13} /> : <Sun size={13} />}
                  {dynamicDark ? 'Dark Surface' : 'Light Surface'}
                </button>
              </div>
            )}
          </section>
        )}

        {tab === 'behavior' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-bg-app">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                  {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-main">Tactile Web Audio SFX</div>
                  <div className="text-xs text-text-muted">
                    Synthesized pops, clicks, paint notes &amp; window chimes
                  </div>
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-semibold transition-colors touch-manipulation ${
                  soundEnabled
                    ? 'bg-primary text-primary-on'
                    : 'bg-surface border border-border text-text-muted'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-app space-y-3">
              <div>
                <div className="text-sm font-semibold text-text-main">Cursor Style</div>
                <div className="text-xs text-text-muted">
                  Choose between a clean pointer or subtle tonal particle sparks.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    { id: 'default', label: 'Standard', desc: 'Clean pointer' },
                    { id: 'trail', label: 'Tonal Trail', desc: 'Cursor sparks' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      playClick();
                      onChangeToyMode(m.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      toyMode === m.id
                        ? 'border-primary bg-primary-container/25'
                        : 'border-border bg-surface hover:bg-neutral-90/60 dark:hover:bg-neutral-10/60'
                    }`}
                  >
                    <div className="text-xs font-semibold text-text-main">{m.label}</div>
                    <div className="text-[11px] text-text-muted mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-bg-app">
              <div>
                <div className="text-sm font-semibold text-text-main">Reset Desktop State</div>
                <div className="text-xs text-text-muted">
                  Restore default notes, clear custom errors, and reset tonal theme.
                </div>
              </div>
              <button
                onClick={() => {
                  playClick();
                  resetAppearance();
                  onResetDesktop();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl border border-border bg-surface hover:bg-neutral-90 dark:hover:bg-neutral-10 text-xs font-medium shrink-0 touch-manipulation"
              >
                <RotateCcw size={13} />
                Reset Desktop
              </button>
            </div>
          </section>
        )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
