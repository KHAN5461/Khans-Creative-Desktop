import React from 'react';

const GRID_SIZE = 32;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const PixelArtCanvas: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-full h-full bg-[#edeeff] p-4 font-sans text-[#4d4d4d] overflow-hidden select-none">
      
      {/* Board Area - Centered and Scrollable if needed */}
      <div className="flex-1 w-full overflow-auto flex items-center justify-center min-h-0 py-4">
        <div 
          className="grid bg-white shadow-sm flex-shrink-0"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: 'fit-content',
            // Using gap-0 to match pixel art style, though specification had blocks. 
            // The visual result of the spec is a tight grid.
          }}
        >
          {Array.from({ length: TOTAL_CELLS }).map((_, i) => (
            <div 
              key={i} 
              // Responsive cell sizing to try and fit in window, but maintaining pixel aspect
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-[#85e850] transition-colors hover:opacity-90"
              style={{ boxShadow: 'inset 1px 1px #00000029' }}
              title={`Pixel ${i}`}
            />
          ))}
        </div>
      </div>

      {/* Footer Area */}
      <div className="w-full flex-shrink-0 flex flex-col gap-4 pt-4 border-t border-black/5 bg-[#edeeff]">
        <div className="flex flex-wrap justify-between items-end gap-4">
          
          {/* Title */}
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-xl md:text-2xl leading-none font-roboto">
              {GRID_SIZE} x {GRID_SIZE}
            </h2>
            <span className="text-lg leading-none opacity-80 font-roboto">Pixel Art canvas</span>
          </div>

          {/* Legend / Palette */}
          <div className="flex gap-4 md:gap-6 items-end">
            <LegendItem label="1 X" color="#340303" borderColor="#2f2f2f" />
            <LegendItem label="2 X" color="#3bcf07" borderColor="#2f2f2f" />
            <LegendItem label="3 X" color="#9df270" borderColor="#2f2f2f" />
            <LegendItem label="4 X" color="#fff" borderColor="#2f2f2f" />
            <LegendItem label="5 X" color="#85e850" borderColor="#2f2f2f" isRounded />
          </div>
        </div>

        {/* Branding */}
        <div className="flex justify-between items-center pt-2 opacity-80">
          <div className="flex items-center gap-3">
             <LogoIcon />
             <span className="font-bold tracking-tight">vektoria!</span>
          </div>
          <span className="font-roboto text-sm md:text-base">[your name here]</span>
        </div>
      </div>
    </div>
  );
};

// Helper Components

const LegendItem: React.FC<{ label: string; color: string; borderColor: string; isRounded?: boolean }> = ({ label, color, borderColor, isRounded }) => (
  <div className="flex flex-col items-center gap-2">
    <span className="text-xs md:text-sm font-bold opacity-80 font-roboto shadow-sm text-shadow">{label}</span>
    <div 
      className={`w-8 h-8 md:w-10 md:h-10 box-border border-2 md:border-4 ${isRounded ? 'rounded-full' : 'rounded-sm'}`}
      style={{ backgroundColor: color, borderColor: borderColor }}
    />
  </div>
);

const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 42 43" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32.0272 0C26.9597 0.000128406 22.8517 4.10637 22.8516 9.17166C22.8565 12.9903 25.2277 16.4065 28.8047 17.7477C29.7763 18.2865 30.3793 19.3096 30.3796 20.4202L30.2953 21.4007C30.2954 23.0892 31.6648 24.4579 33.354 24.4578C34.329 24.456 35.0805 23.9404 35.8191 23.2021C39.6488 19.3741 41.5979 15.9126 41.6075 11.258C41.6014 9.67283 41.3485 8.09824 40.858 6.59071H40.8261C39.6803 2.68611 36.0978 0.00287281 32.0269 0.000298564L32.0272 0Z" fill="#2F2F35" />
    <path d="M6.11723 0.000427246C2.73878 0.000476163 6.72899e-05 2.73803 0 6.11498V9.31805C0.011684 21.1842 5.32704 32.4245 14.4928 39.9656C16.1677 41.2803 18.8359 42.7989 21.4107 42.8025C26.4784 42.8023 30.5864 38.6959 30.5863 33.6305C30.5802 31.1869 29.6015 28.8527 27.8744 27.1384C25.7408 25.5921 23.9432 24.0848 20.837 20.9734C14.9304 15.0693 13.9153 11.546 12.0599 4.61376C11.3155 1.83691 8.4839 0.00343562 6.11754 0.000427246H6.11723Z" fill="#2F2F35" />
  </svg>
);

export default PixelArtCanvas;
