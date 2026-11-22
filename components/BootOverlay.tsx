import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootOverlayProps {
  bootNonce?: number;
  isReboot?: boolean;
  onComplete?: () => void;
}

const SAMPLE_COUNT = 24;

function buildPolarShapePath(
  baseRadius: number,
  amplitude: number,
  lobes: number,
  phase = 0
): string {
  const cx = 32;
  const cy = 32;
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const theta = (i / SAMPLE_COUNT) * Math.PI * 2;
    const r = baseRadius + amplitude * Math.cos(lobes * theta + phase);
    pts.push({
      x: cx + Math.cos(theta) * r,
      y: cy + Math.sin(theta) * r,
    });
  }

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const p0 = pts[(i - 1 + SAMPLE_COUNT) % SAMPLE_COUNT];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % SAMPLE_COUNT];
    const p3 = pts[(i + 2) % SAMPLE_COUNT];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return `${d} Z`;
}

// Material 3 Expressive morphing shape sequence (identical 24-segment cubic topology for smooth spring morphing)
const M3_SHAPES = [
  buildPolarShapePath(22, 2.8, 8, 0),            // 8-scallop cookie
  buildPolarShapePath(20.2, 5.4, 4, Math.PI / 4), // 4-leaf clover
  buildPolarShapePath(20.5, 4.6, 2, 0),          // soft expressive pill
  buildPolarShapePath(21.5, 3.6, 6, 0),          // 6-petal sunny burst
  buildPolarShapePath(21, 4.4, 3, -Math.PI / 2), // rounded trefoil
];

const BootOverlay: React.FC<BootOverlayProps> = ({
  bootNonce = 0,
  isReboot = false,
  onComplete,
}) => {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return false;
    return sessionStorage.getItem('khanos-booted') !== '1';
  });
  const [shapeStep, setShapeStep] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (bootNonce > 0) {
      setShapeStep(0);
      setVisible(true);
    }
  }, [bootNonce]);

  useEffect(() => {
    if (!visible) return;
    const morphInterval = window.setInterval(() => {
      setShapeStep((s) => s + 1);
    }, 380);
    return () => window.clearInterval(morphInterval);
  }, [visible, bootNonce]);

  useEffect(() => {
    if (!visible) {
      onCompleteRef.current?.();
      return;
    }
    sessionStorage.setItem('khanos-booted', '1');
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = isReboot ? (reduced ? 260 : 1450) : 1150;
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, bootNonce, isReboot]);

  const activeShape = M3_SHAPES[shapeStep % M3_SHAPES.length];

  return (
    <AnimatePresence onExitComplete={() => onCompleteRef.current?.()}>
      {visible && (
        <motion.div
          key={`boot-${bootNonce}`}
          initial={{ opacity: isReboot ? 0 : 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          onClick={() => setVisible(false)}
          className="fixed inset-0 z-[200] bg-bg-app flex flex-col items-center justify-center gap-4 select-none cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Material 3 Expressive Contained Shape Loading Indicator */}
            <div className="w-16 h-16 rounded-full bg-primary-container/60 border border-primary/15 shadow-medium flex items-center justify-center">
              <motion.svg
                viewBox="0 0 64 64"
                className="w-11 h-11 text-primary"
                animate={{ rotate: shapeStep * 60 }}
                transition={{ type: 'spring', stiffness: 210, damping: 18, mass: 0.9 }}
                aria-label="Loading KhanOS"
              >
                <motion.path
                  fill="currentColor"
                  animate={{ d: activeShape }}
                  transition={{ type: 'spring', stiffness: 260, damping: 19 }}
                />
              </motion.svg>
            </div>

            <div className="text-center">
              <div className="text-base font-bold tracking-tight text-text-main">
                {isReboot ? 'Rebooting KhanOS' : 'KhanOS'}
              </div>
              <div className="text-[11px] font-mono text-text-muted mt-0.5">
                {isReboot ? 'Restarting desktop session...' : 'Release 2.4 · Tactile Web Desktop'}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BootOverlay;
