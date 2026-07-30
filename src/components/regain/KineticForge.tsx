import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function KineticForge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isForging, setIsForging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    // STRICT NULL CHECK: Prevents DOM crashes
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match container size
    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId: number;
    const particles: Particle[] = [];
    let pointer = { x: canvas.width / 2, y: canvas.height / 2, active: false };

    // Particle class for the high-speed kinetic effect
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      life: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.color = Math.random() > 0.5 ? '#3b82f6' : '#8b5cf6'; // Blue & Violet
        this.life = 1.0;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.1) this.size -= 0.05;
        this.life -= 0.02;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      
      if (pointer.active) {
        for (let i = 0; i < 5; i++) {
          particles.push(new Particle(pointer.x, pointer.y));
        }
      }
    };

    const handlePointerDown = () => {
      pointer.active = true;
      setIsForging(true);
      // Fire mobile haptics to replace the dopamine of scrolling
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    };

    const handlePointerUp = () => {
      pointer.active = false;
      setIsForging(false);
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    const render = () => {
      // Fade effect for trails
      ctx.fillStyle = 'rgba(3, 7, 18, 0.2)'; // Matches your #030712 background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].life <= 0 || particles[i].size <= 0.1) {
          particles.splice(i, 1);
          i--;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[30vh] bg-[#030712] rounded-3xl overflow-hidden border border-violet-900/30 flex items-center justify-center cursor-crosshair group touch-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-10 block" />
      
      <motion.div 
        animate={{ opacity: isForging ? 0 : 1, scale: isForging ? 0.9 : 1 }}
        className="z-20 pointer-events-none text-center"
      >
        <h3 className="text-violet-500 font-mono tracking-[0.2em] uppercase text-sm mb-2">
          Kinetic Forge
        </h3>
        <p className="text-slate-500 text-xs">
          Swipe aggressively to generate kinetic feedback.
        </p>
      </motion.div>
    </div>
  );
}
