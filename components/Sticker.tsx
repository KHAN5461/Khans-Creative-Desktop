import React from 'react';
import { motion } from 'framer-motion';
import { X, Rocket, Sparkles, Coffee, Zap, Terminal, Heart } from 'lucide-react';
import { StampIconId, StickerTone, StickerVariant } from '../types';
import { useSound } from '../contexts/SoundContext';

interface StickerProps {
  id: string;
  text: string;
  rotation: number;
  top: string;
  left: string;
  variant?: StickerVariant;
  tone?: StickerTone;
  imageUrl?: string;
  stampIcon?: StampIconId;
  index?: number;
  layoutMode?: 'freeform' | 'grid';
  constraintsRef?: React.RefObject<Element | null>;
  onClose: (id: string) => void;
  onInteract: (id: string) => void;
}

const STAMP_ICONS: Record<StampIconId, React.ReactNode> = {
  rocket: <Rocket size={16} strokeWidth={2.2} />,
  sparkles: <Sparkles size={16} strokeWidth={2.2} />,
  coffee: <Coffee size={16} strokeWidth={2.2} />,
  zap: <Zap size={16} strokeWidth={2.2} />,
  terminal: <Terminal size={16} strokeWidth={2.2} />,
  heart: <Heart size={16} strokeWidth={2.2} />,
};

const TONE_CLASSES: Record<StickerTone, string> = {
  surface: 'bg-surface text-text-main border-border',
  amber:
    'bg-[#FFF3C4] text-[#3B2C00] border-[#E0BE58] dark:bg-[#4A3B08] dark:text-[#FFE89C] dark:border-[#7A6112]',
  mint:
    'bg-[#DDF7E4] text-[#0E361B] border-[#96D8AA] dark:bg-[#113D22] dark:text-[#B9F2C9] dark:border-[#2C6D43]',
  lavender:
    'bg-[#EAE4FF] text-[#28165A] border-[#BDB0F2] dark:bg-[#2F215E] dark:text-[#E2D9FF] dark:border-[#58459E]',
  rose:
    'bg-[#FFE2E8] text-[#4E1021] border-[#F0A8B8] dark:bg-[#4E1626] dark:text-[#FFD1DC] dark:border-[#8D324A]',
};

const Sticker: React.FC<StickerProps> = ({
  id,
  text,
  rotation,
  top,
  left,
  variant = 'default',
  tone = 'surface',
  imageUrl,
  stampIcon = 'rocket',
  index = 0,
  layoutMode = 'freeform',
  constraintsRef,
  onClose,
  onInteract,
}) => {
  const { playPop, playStick, playClick } = useSound();
  const isGrid = layoutMode === 'grid';

  if (variant === 'error') {
    return (
      <motion.div
        data-pong-sticker={isGrid ? undefined : id}
        data-pong-sticker-text={isGrid ? undefined : text}
        data-pong-sticker-tone={isGrid ? undefined : tone}
        drag
        dragConstraints={isGrid ? undefined : constraintsRef}
        dragSnapToOrigin={isGrid}
        dragMomentum={!isGrid}
        dragElastic={isGrid ? 0.25 : 0.12}
        dragTransition={{ bounceStiffness: 260, bounceDamping: 22 }}
        initial={
          isGrid
            ? { scale: 0.9, opacity: 0, y: 10 }
            : { top, left, scale: 0.72, opacity: 0, y: -12 }
        }
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.75, opacity: 0, transition: { duration: 0.14 } }}
        whileHover={{ scale: 1.02, zIndex: 20 }}
        whileDrag={{ scale: 1.04, cursor: 'grabbing', zIndex: 25 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        className={`${
          isGrid ? 'relative col-span-2 w-full' : 'absolute w-64 z-10'
        } flex flex-col bg-[#c0c0c0] border-2 border-t-[#dfdfdf] border-l-[#dfdfdf] border-b-[#000000] border-r-[#000000] shadow-hard select-none font-sans`}
        style={isGrid ? undefined : { top, left, rotate: 0 }}
        onPointerDown={() => {
          onInteract(id);
          playPop();
        }}
        onDragEnd={() => playStick()}
      >
        <div className="flex items-center justify-between bg-[#000080] text-white px-2 py-1.5 cursor-grab active:cursor-grabbing">
          <span className="font-bold text-[11px] tracking-wide">System Error</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              playClick();
              onClose(id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Close error sticker"
            className="bg-[#c0c0c0] w-6 h-6 md:w-[16px] md:h-[16px] flex items-center justify-center border border-t-[#dfdfdf] border-l-[#dfdfdf] border-b-[#000000] border-r-[#000000] active:border-t-[#000000] active:border-l-[#000000]"
          >
            <X size={11} color="black" strokeWidth={3} />
          </button>
        </div>
        <div className="p-3 flex flex-row items-center gap-3">
          <div className="w-8 h-8 shrink-0 rounded-full bg-red-600 text-white flex items-center justify-center font-bold border-2 border-[#dfdfdf]/20 shadow-inner text-base">
            !
          </div>
          <span className="text-black text-[12px] leading-tight font-medium">{text}</span>
        </div>
        <div className="flex justify-center pb-2.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              playClick();
              onClose(id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="px-6 py-1.5 md:py-0.5 bg-[#c0c0c0] border border-t-[#dfdfdf] border-l-[#dfdfdf] border-b-[#000000] border-r-[#000000] text-xs md:text-[11px] font-medium text-black active:translate-y-[1px]"
          >
            OK
          </button>
        </div>
      </motion.div>
    );
  }

  if (variant === 'pixel' && imageUrl) {
    return (
      <motion.div
        data-pong-sticker={isGrid ? undefined : id}
        data-pong-sticker-text={isGrid ? undefined : text}
        data-pong-sticker-tone={isGrid ? undefined : tone}
        drag
        dragConstraints={isGrid ? undefined : constraintsRef}
        dragSnapToOrigin={isGrid}
        dragMomentum={!isGrid}
        dragElastic={isGrid ? 0.25 : 0.14}
        dragTransition={{ bounceStiffness: 260, bounceDamping: 20 }}
        initial={
          isGrid
            ? { rotate: rotation * 0.6, scale: 0.9, opacity: 0 }
            : { top, left, rotate: rotation, scale: 0.7, opacity: 0 }
        }
        animate={{ scale: 1, opacity: 1, rotate: isGrid ? rotation * 0.6 : rotation }}
        exit={{ scale: 0.65, opacity: 0, transition: { duration: 0.14 } }}
        whileHover={{ scale: 1.05, rotate: 0, y: -4, zIndex: 18 }}
        whileDrag={{ scale: 1.08, rotate: 0, cursor: 'grabbing', zIndex: 25 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        onPointerDown={() => {
          onInteract(id);
          playPop();
        }}
        onDragEnd={() => playStick()}
        style={isGrid ? undefined : { top, left }}
        className={`group ${
          isGrid ? 'relative w-full' : 'absolute'
        } flex flex-col items-center p-3 pb-2.5 rounded-xl border shadow-hard select-none cursor-grab ${TONE_CLASSES[tone]}`}
      >
        <img
          src={imageUrl}
          alt={text}
          draggable={false}
          referrerPolicy="no-referrer"
          className="w-24 h-24 object-contain rounded-lg bg-white/75 dark:bg-black/25 p-1"
          style={{ imageRendering: 'pixelated' }}
        />
        <span className="mt-1.5 text-[11px] font-mono font-medium tracking-tight opacity-85 max-w-[100px] truncate">
          {text}
        </span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            playClick();
            onClose(id);
          }}
          aria-label="Remove pixel sticker"
          className={`absolute flex items-center justify-center rounded-full transition-opacity touch-manipulation ${
            isGrid
              ? 'top-1.5 right-1.5 w-7 h-7 bg-black/5 dark:bg-white/10 text-text-main opacity-80 hover:opacity-100'
              : 'top-1.5 right-1.5 w-5 h-5 text-text-main opacity-0 group-hover:opacity-80 hover:!opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <X size={12} strokeWidth={2.2} />
        </button>
      </motion.div>
    );
  }

  if (variant === 'stamp') {
    const toneClass = TONE_CLASSES[tone];
    return (
      <motion.div
        data-pong-sticker={isGrid ? undefined : id}
        data-pong-sticker-text={isGrid ? undefined : text}
        data-pong-sticker-tone={isGrid ? undefined : tone}
        drag
        dragConstraints={isGrid ? undefined : constraintsRef}
        dragSnapToOrigin={isGrid}
        dragMomentum={!isGrid}
        dragElastic={isGrid ? 0.25 : 0.14}
        dragTransition={{ bounceStiffness: 260, bounceDamping: 20 }}
        initial={
          isGrid
            ? { rotate: rotation * 0.6, scale: 0.85, opacity: 0 }
            : { top, left, rotate: rotation - 8, scale: 1.25, opacity: 0 }
        }
        animate={{ scale: 1, opacity: 1, rotate: isGrid ? rotation * 0.6 : rotation }}
        exit={{ scale: 0.65, opacity: 0, transition: { duration: 0.14 } }}
        whileHover={{ scale: 1.06, rotate: 0, y: -3, cursor: 'grab', zIndex: 18 }}
        whileDrag={{ scale: 1.09, rotate: 0, cursor: 'grabbing', zIndex: 25 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        onPointerDown={() => {
          onInteract(id);
          playPop();
        }}
        onDragEnd={() => playStick()}
        style={isGrid ? undefined : { top, left }}
        className={`group ${
          isGrid ? 'relative w-full min-h-[78px]' : 'absolute'
        } inline-flex items-center justify-center p-1.5 rounded-2xl border-2 shadow-hard select-none ${toneClass}`}
      >
        <div className="flex items-center gap-2 px-3 pr-7 py-2 rounded-xl border border-dashed border-current/45">
          <span className="shrink-0 opacity-90">{STAMP_ICONS[stampIcon]}</span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
            {text}
          </span>
        </div>

        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            playClick();
            onClose(id);
          }}
          aria-label="Remove stamp"
          title="Remove"
          className={`absolute flex items-center justify-center rounded-full transition-opacity touch-manipulation ${
            isGrid
              ? 'top-1.5 right-1.5 w-7 h-7 opacity-65 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
              : 'top-1.5 right-1.5 w-5 h-5 opacity-0 group-hover:opacity-75 hover:!opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <X size={12} strokeWidth={2.2} />
        </button>
      </motion.div>
    );
  }

  const toneClass =
    variant === 'highlight' && tone === 'surface' ? TONE_CLASSES.amber : TONE_CLASSES[tone];

  return (
    <motion.div
      data-pong-sticker={isGrid ? undefined : id}
      data-pong-sticker-text={isGrid ? undefined : text}
      data-pong-sticker-tone={isGrid ? undefined : tone}
      drag
      dragConstraints={isGrid ? undefined : constraintsRef}
      dragSnapToOrigin={isGrid}
      dragMomentum={!isGrid}
      dragElastic={isGrid ? 0.25 : 0.14}
      dragTransition={{ bounceStiffness: 250, bounceDamping: 20 }}
      initial={
        isGrid
          ? { rotate: rotation * 0.6, scale: 0.9, opacity: 0, y: 8 }
          : { top, left, rotate: rotation - 6, scale: 0.72, opacity: 0, y: 12 }
      }
      animate={{ scale: 1, opacity: 1, y: 0, rotate: isGrid ? rotation * 0.6 : rotation }}
      exit={{ scale: 0.68, opacity: 0, y: -8, transition: { duration: 0.14 } }}
      whileHover={{
        scale: 1.05,
        y: -4,
        rotate: rotation * 0.25,
        cursor: 'grab',
        zIndex: 18,
      }}
      whileDrag={{
        scale: 1.08,
        y: -6,
        rotate: 0,
        cursor: 'grabbing',
        zIndex: 25,
      }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 24,
        delay: Math.min(index * 0.03, 0.25),
      }}
      onPointerDown={() => {
        onInteract(id);
        playPop();
      }}
      onDragEnd={() => playStick()}
      title="Drag to fling"
      style={isGrid ? undefined : { top, left }}
      className={`group ${
        isGrid
          ? 'relative w-full min-h-[78px] flex items-center justify-center rounded-lg px-4 pr-8 py-3.5 text-center'
          : 'absolute flex items-center justify-center rounded-md pl-5 pr-8 py-3'
      } border shadow-hard select-none ${toneClass}`}
    >
      {/* Subtle stationery tape notch */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-current opacity-15"
      />

      {/* Subtle corner peel accent */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 opacity-20 group-hover:opacity-45 transition-opacity rounded-br-md"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, currentColor 50%)',
        }}
      />

      <span
        className={`${
          isGrid ? 'text-[14px] leading-snug break-words' : 'text-[15px] whitespace-nowrap leading-none'
        } font-medium tracking-tight ${variant === 'highlight' ? 'font-serif italic' : 'font-sans'}`}
      >
        {text}
      </span>

      {/* Close (X) Only */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          playClick();
          onClose(id);
        }}
        aria-label="Remove sticker"
        title="Remove"
        className={`absolute flex items-center justify-center rounded-full transition-opacity touch-manipulation ${
          isGrid
            ? 'top-1 right-1 w-7 h-7 opacity-65 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
            : 'top-1.5 right-1.5 w-5 h-5 opacity-0 group-hover:opacity-75 hover:!opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
        }`}
      >
        <X size={12} strokeWidth={2.2} />
      </button>
    </motion.div>
  );
};

export default Sticker;
