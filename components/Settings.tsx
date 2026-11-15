import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { ThemeId } from '../theme/types';
import { Check } from 'lucide-react';

const THEME_PRESETS: { id: ThemeId; label: string; color: string }[] = [
  { id: 'warm', label: 'Warm (Default)', color: '#D5A700' },
  { id: 'dark', label: 'Focus Dark', color: '#313033' },
  { id: 'dev', label: 'Cyber Dev', color: '#00FF94' },
  { id: 'minimal', label: 'Swiss Minimal', color: '#FFFFFF' },
  { id: 'ocean', label: 'Pacific Blue', color: '#0061A4' },
  { id: 'lavender', label: 'Lavender Mist', color: '#6750A4' },
];

const Settings: React.FC = () => {
  const { themeId, setTheme } = useTheme();

  return (
    <div className="flex flex-col h-full bg-surface text-text-main">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold font-roboto">System Settings</h2>
        <p className="text-text-muted text-sm mt-1">Appearance & Desktop Behavior</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Theme Section */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">Theme Preset</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setTheme(preset.id)}
                className={`
                  relative flex items-center p-4 rounded-xl border transition-all
                  ${themeId === preset.id ? 'border-primary ring-1 ring-primary bg-primary-container/10' : 'border-border hover:bg-black/5 dark:hover:bg-white/5'}
                `}
              >
                <div 
                  className="w-10 h-10 rounded-full border border-black/10 shadow-sm mr-4"
                  style={{ backgroundColor: preset.color }}
                />
                <span className="font-medium text-text-main">{preset.label}</span>
                {themeId === preset.id && (
                  <div className="absolute right-4 text-primary">
                    <Check size={20} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Info Section */}
        <section className="bg-primary-container/20 border border-primary/20 rounded-xl p-4">
          <h4 className="font-bold text-primary mb-2">About this Theme System</h4>
          <p className="text-sm text-text-main leading-relaxed opacity-80">
            This system uses CSS Variables mapped to a 100-step tonal palette. 
            Backgrounds, text, borders, and glassmorphism effects transition smoothly (300ms) 
            without React re-renders for style changes.
          </p>
        </section>

      </div>
    </div>
  );
};

export default Settings;
