import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface StickerProps {
  id: string;
  text: string;
  rotation: number;
  top: string;
  left: string;
  variant?: 'default' | 'error';
  onClose: (id: string) => void;
  onInteract: (id: string) => void;
}

const Sticker: React.FC<StickerProps> = ({ id, text, rotation, top, left, onClose, onInteract, variant = 'default' }) => {
  
  if (variant === 'error') {
    return (
      <motion.div
        drag
        dragMomentum={false}
        initial={{ top, left, scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute flex flex-col bg-[#c0c0c0] border-2 border-t-[#dfdfdf] border-l-[#dfdfdf] border-b-[#000000] border-r-[#000000] shadow-hard w-64 select-none z-50 font-sans"
        style={{ rotate: 0 }} 
        onPointerDown={() => onInteract(id)}
      >
        <div className="flex items-center justify-between bg-[#000080] text-white px-1 py-0.5 cursor-grab active:cursor-grabbing">
            <span className="font-bold text-[11px] tracking-wide">System Error</span>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(id); }} 
                className="bg-[#c0c0c0] w-[14px] h-[14px] flex items-center justify-center border border-t-[#dfdfdf] border-l-[#dfdfdf] border-b-[#000000] border-r-[#000000] active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#dfdfdf] active:border-r-[#dfdfdf]"
            >
                <X size={10} color="black" strokeWidth={3} />
            </button>
        </div>
        <div className="p-3 flex flex-row items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-red-600 text-white flex items-center justify-center font-bold border-2 border-[#dfdfdf]/20 shadow-inner text-xl">
                <span className="drop-shadow-md">X</span>
            </div>
            <span className="text-black text-[11px] leading-tight">{text}</span>
        </div>
         <div className="flex justify-center pb-2">
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(id); }} 
                className="px-4 py-0.5 bg-[#c0c0c0] border border-t-[#dfdfdf] border-l-[#dfdfdf] border-b-[#000000] border-r-[#000000] text-[11px] text-black active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#dfdfdf] active:border-r-[#dfdfdf] active:translate-y-[1px]"
            >
                OK
            </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ top, left, rotate: rotation, scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, cursor: 'grab', zIndex: 10 }}
      whileDrag={{ scale: 1.1, cursor: 'grabbing', zIndex: 20 }}
      whileTap={{ scale: 1.05, cursor: 'grabbing', zIndex: 20 }}
      onPointerDown={() => onInteract(id)}
      className="absolute flex items-center justify-center 
                 bg-surface border border-border shadow-hard
                 pl-4 pr-7 py-2 md:pl-6 md:pr-8 md:py-3 select-none transition-colors duration-200"
      style={{ rotate: rotation }}
    >
      <span className="font-roboto text-sm md:text-base text-text-main whitespace-nowrap leading-none pt-[1px]">
        {text}
      </span>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onClose(id); }}
        className="absolute top-1 right-1 p-0.5 flex items-center justify-center text-text-main opacity-40 hover:opacity-100 transition-opacity"
      >
        <X size={12} className="md:w-3.5 md:h-3.5" />
      </button>
    </motion.div>
  );
};

export default Sticker;
