import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Eraser, Pen } from 'lucide-react';

const ScribbleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#222222');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Update context when state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = tool === 'eraser' ? '#fafafa' : color;
    ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
  }, [color, lineWidth, tool]);

  const startDrawing = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-[#fafafa]">
        <div className="absolute top-20 left-0 right-0 flex justify-center gap-4 z-10 pointer-events-auto">
            <button 
                onClick={() => setTool('pen')}
                className={`p-3 rounded-full border border-[#222] ${tool === 'pen' ? 'bg-[#222] text-white' : 'bg-white text-[#222]'} shadow-sm transition-colors`}
            >
                <Pen size={20} />
            </button>
            <button 
                onClick={() => setTool('eraser')}
                className={`p-3 rounded-full border border-[#222] ${tool === 'eraser' ? 'bg-[#222] text-white' : 'bg-white text-[#222]'} shadow-sm transition-colors`}
            >
                <Eraser size={20} />
            </button>
            <button 
                onClick={clearCanvas}
                className="p-3 rounded-full border border-[#222] bg-white text-red-500 shadow-sm hover:bg-red-50 transition-colors"
            >
                <Trash2 size={20} />
            </button>
        </div>
        
        <div className="absolute top-40 text-[#222] opacity-20 font-roboto text-sm pointer-events-none select-none">
            Start scribbling...
        </div>

      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        className="touch-none cursor-crosshair"
      />
    </div>
  );
};

export default ScribbleCanvas;