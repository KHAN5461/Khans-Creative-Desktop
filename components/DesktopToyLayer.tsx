import React, { useEffect, useRef } from 'react';
import { ToyMode } from '../types';

interface DesktopToyLayerProps {
  mode: ToyMode;
}

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
}

const DesktopToyLayer: React.FC<DesktopToyLayerProps> = ({ mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<TrailParticle[]>([]);

  useEffect(() => {
    if (mode !== 'trail') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onPointerMove = (e: PointerEvent) => {
      const style = getComputedStyle(document.documentElement);
      const c1 = style.getPropertyValue('--primary-40').trim() || '#D5A700';
      const c2 = style.getPropertyValue('--tertiary-40').trim() || '#54634F';
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 1.4,
          vy: (Math.random() - 0.5) * 1.4 - 0.5,
          size: 3 + Math.random() * 4,
          life: 1,
          color: Math.random() > 0.4 ? c1 : c2,
        });
      }
      if (particlesRef.current.length > 90) {
        particlesRef.current.splice(0, particlesRef.current.length - 90);
      }
    };

    window.addEventListener('pointermove', onPointerMove);

    let raf = 0;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0.03);
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life *= 0.91;
        ctx.save();
        ctx.globalAlpha = p.life * 0.75;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [mode]);

  if (mode !== 'trail') return null;

  return <canvas ref={canvasRef} className="fixed inset-0 z-[98] pointer-events-none" />;
};

export default DesktopToyLayer;
