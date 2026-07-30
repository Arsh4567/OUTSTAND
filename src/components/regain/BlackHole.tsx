import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BlackHoleProps {
  onDestructionComplete?: () => void;
}

export default function BlackHole({ onDestructionComplete }: BlackHoleProps) {
  const [inputText, setInputText] = useState('');
  const [isDestroying, setIsDestroying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDestroy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isDestroying) return;
    
    setIsDestroying(true);
    
    // Trigger mobile haptic feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  };

  useEffect(() => {
    if (!isDestroying) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    // STRICT NULL CHECK: Prevents the runtime anomaly
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let particles: any[] = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: (Math.random() * 100) + (centerY - 50),
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? '#3b82f6' : '#eab308',
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
      });
    }

    let animationFrameId: number;
    let eventHorizonRadius = 0;

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (eventHorizonRadius < 40) eventHorizonRadius += 0.5;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, eventHorizonRadius + 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#3b82f6';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, eventHorizonRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 0;
      ctx.fill();

      let activeParticles = 0;

      particles.forEach((p) => {
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > eventHorizonRadius) {
          activeParticles++;
          const pull = 200 / (distance + 10);
          p.vx += (dx / distance) * pull;
          p.vy += (dy / distance) * pull;
          p.x += p.vx;
          p.y += p.vy;
          p.x += (dy / distance) * 5;
          p.y -= (dx / distance) * 5;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
        }
      });

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Use a slight timeout for the flash effect, then reset
        setTimeout(() => {
          if (onDestructionComplete) onDestructionComplete();
          setIsDestroying(false);
          setInputText('');
        }, 300);
      }
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isDestroying, onDestructionComplete]);

  return (
    <div ref={containerRef} className="relative w-full h-[40vh] bg-black rounded-3xl overflow-hidden border border-blue-900/30 flex items-center justify-center">
      {isDestroying && (
        <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none" />
      )}

      <AnimatePresence>
        {!isDestroying && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.4 }}
            className="z-10 w-full max-w-sm px-6 flex flex-col items-center gap-6"
          >
            <div className="text-center">
              <h3 className="text-blue-500 font-mono tracking-[0.2em] uppercase text-sm mb-2">
                Memory Purge
              </h3>
              <p className="text-gray-400 text-xs">
                Enter the distraction or guilt. Let the system annihilate it.
              </p>
            </div>

            <form onSubmit={handleDestroy} className="w-full flex flex-col gap-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., Wasted 3 hours on TikTok"
                className="w-full bg-black/50 border-b-2 border-blue-900/50 px-4 py-3 text-center text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors font-mono"
                required
              />
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-900/40 to-black border border-blue-800/50 rounded-xl text-blue-400 uppercase tracking-widest font-bold hover:bg-blue-900/60 hover:text-white transition-all active:scale-95"
              >
                Eradicate
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
