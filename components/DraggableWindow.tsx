import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DraggableWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  contentClassName?: string;
  zIndex?: number;
  defaultPosition?: { x: number; y: number };
  onFocus?: () => void;
  onDragEnd?: (pos: { x: number; y: number }) => void;
  constraintsRef?: React.RefObject<Element>;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({ 
    isOpen, onClose, title, children, contentClassName, 
    zIndex = 40, defaultPosition = { x: 0, y: 0 }, onFocus, onDragEnd, constraintsRef
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0, x: defaultPosition.x, y: defaultPosition.y }}
          animate={{ scale: 1, opacity: 1, x: defaultPosition.x, y: defaultPosition.y }}
          exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.1 } }}
          className="fixed left-1/2 top-[10%] md:top-[15%] w-[90vw] md:w-[600px] h-[70vh] md:h-[500px] 
                     flex flex-col rounded-xl overflow-hidden -ml-[45vw] md:-ml-[300px] transition-all duration-150
                     border shadow-hard bg-surface"
          style={{ 
             zIndex, 
             borderColor: `rgba(var(--border-main-rgb), 1)`, 
          } as any}
          drag
          dragConstraints={constraintsRef}
          dragMomentum={false}
          dragElastic={0}
          whileDrag={{ cursor: 'grabbing', boxShadow: 'var(--shadow-hard)' }}
          onDragEnd={(_, info) => {
             if (onDragEnd) {
                 onDragEnd({
                     x: defaultPosition.x + info.offset.x,
                     y: defaultPosition.y + info.offset.y
                 });
             }
          }}
          onPointerDown={onFocus}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-4 py-3 
                       border-b border-border bg-neutral-90 dark:bg-neutral-10 
                       cursor-grab active:cursor-grabbing select-none shrink-0" 
            onPointerDown={() => onFocus?.()}
          >
            <span className="font-roboto font-bold text-text-main text-sm md:text-base tracking-wide">{title}</span>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                onPointerDown={(e) => e.stopPropagation()} 
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-text-main"
            >
                <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Content */}
          <div 
            className={`flex-1 overflow-y-auto cursor-auto ${contentClassName ?? 'p-6 bg-surface'}`}
            onPointerDown={(e) => e.stopPropagation()} 
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DraggableWindow;