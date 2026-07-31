import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BlackHoleProps {
  onDestructionComplete?: () => void;
}

export default function BlackHole({ onDestructionComplete }: BlackHoleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [distraction, setDistraction] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sized to prevent navbar overlap
    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId: number;
    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const eventHorizonRadius = 45;

    class Particle {
      x: number;
      y: number;
      size: number;
      color: string;
      angle: number;
      distance: number;
      speed: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? '#60a5fa' : '#c084fc'; // Blue & Purple
        
        const dx = centerX - x;
        const dy = centerY - y;
        this.angle = Math.atan2(dy, dx);
        this.distance = Math.sqrt(dx * dx + dy * dy);
        this.speed = Math.random() * 2 + 1;
      }

      update() {
        // Spiral inwards
        this.angle += 0.05;
        this.distance -= this.speed;
        this.speed += 0.1; // Accelerate as it gets closer

        this.x = centerX - Math.cos(this.angle) * this.distance;
        this.y = centerY - Math.sin(this.angle) * this.distance;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
      }
    }

    const drawSingularity = () => {
      // The Accretion Disk (Glow)
      const gradient = ctx.createRadialGradient(centerX, centerY, eventHorizonRadius * 0.8, centerX, centerY, eventHorizonRadius * 3);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(0.2, 'rgba(30, 58, 138, 0.4)'); // Deep blue edge
      gradient.addColorStop(1, 'rgba(3, 7, 18, 0)'); // Fade to background
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, eventHorizonRadius * 3, 0, Math.PI * 2);
      ctx.fill();

      // The Void (Pure Black Center)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, eventHorizonRadius, 0, Math.PI * 2);
      ctx.shadowBlur = 0;
      ctx.fill();
    };

    const render = () => {
      // Deep space trail effect (replaces the ugly yellow)
      ctx.fillStyle = 'rgba(3, 7, 18, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawSingularity();

      if (isPurging) {
        // Generate particles randomly around the screen edges if purging
        if (Math.random() > 0.5) {
          const startX = Math.random() > 0.5 ? 0 : canvas.width;
          const startY = Math.random() * canvas.height;
          particles.push(new Particle(startX, startY));
        }

        for (let i = 0; i < particles.length; i++) {
          particles[i].update();
          particles[i].draw();

          // Remove particles that cross the event horizon
          if (particles[i].distance <= eventHorizonRadius) {
            particles.splice(i, 1);
            i--;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPurging]);

  const handlePurge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distraction.trim()) return;
    
    setIsPurging(true);
    
    // Mobile haptic feedback for dopamine hit
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 30]); 
    }

    // Reset after 2.5 seconds of destruction
    setTimeout(() => {
      setIsPurging(false);
      setDistraction('');
      if (onDestructionComplete) onDestructionComplete();
    }, 2500);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[40vh] min-h-[300px] max-h-[400px] bg-[#030712] rounded-3xl overflow-hidden border border-slate-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)_inset] mb-8"
    >
      {/* The Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 block" />

      {/* The UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-8 px-6">
        <AnimatePresence>
          {!isPurging ? (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              onSubmit={handlePurge}
              className="w-full flex flex-col items-center gap-4"
            >
              <input
                type="text"
                value={distraction}
                onChange={(e) => setDistraction(e.target.value)}
                placeholder="What is distracting you?"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-center text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono text-sm"
                autoComplete="off"
              />
              <button 
                type="submit"
                disabled={!distraction.trim()}
                className="px-6 py-2 bg-red-950/40 text-red-400 border border-red-900/50 rounded-full font-mono text-xs tracking-widest uppercase hover:bg-red-900/60 hover:text-red-300 disabled:opacity-30 transition-all"
              >
                Eradicate
              </button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-blue-400 font-mono text-xs tracking-[0.3em] uppercase animate-pulse"
            >
              Purging...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
