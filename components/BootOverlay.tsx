import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootOverlayProps {
  onComplete?: () => void;
}

const BootOverlay: React.FC<BootOverlayProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return false;
    return sessionStorage.getItem('khanos-booted') !== '1';
  });
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!visible) {
      onCompleteRef.current?.();
      return;
    }
    sessionStorage.setItem('khanos-booted', '1');
    const timer = setTimeout(() => {
      setVisible(false);
    }, 680);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence onExitComplete={() => onCompleteRef.current?.()}>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          onClick={() => setVisible(false)}
          className="fixed inset-0 z-[200] bg-bg-app flex flex-col items-center justify-center gap-4 select-none cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl border border-border bg-surface shadow-hard flex items-center justify-center">
              <span className="w-5 h-5 rounded-full bg-primary inline-block" />
            </div>
            <div className="text-center">
              <div className="text-base font-bold tracking-tight text-text-main">KhanOS</div>
              <div className="text-[11px] font-mono text-text-muted mt-0.5">
                Release 2.4 · Tactile Web Desktop
              </div>
            </div>
          </motion.div>

          <div className="w-40 h-1 rounded-full bg-border/60 overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full rounded-full bg-primary"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BootOverlay;
