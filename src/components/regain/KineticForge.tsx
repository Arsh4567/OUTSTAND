import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KineticForge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId: number;
    const particles: Particle[] = [];
    const shockwaves: Shockwave[] = [];
    const pointerTrail: { x: number; y: number; age: number }[] = [];

    // --- ENHANCED PHYSICS ENTITIES ---

    class Shockwave {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      opacity: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = Math.random() * 40 + 60; // 60-100px radius
        this.opacity = 0.8;
      }

      update() {
        this.radius += (this.maxRadius - this.radius) * 0.15; // Ease-out expansion
        this.opacity -= 0.03;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${Math.max(0, this.opacity)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;

      constructor(x: number, y: number, vx: number, vy: number) {
        this.x = x;
        this.y = y;
        // Explosive scatter
        this.vx = vx * 0.6 + (Math.random() - 0.5) * 12;
        this.vy = vy * 0.6 + (Math.random() - 0.5) * 12;
        this.maxLife = Math.random() * 50 + 20;
        this.life = this.maxLife;
        this.size = Math.random() * 1.5 + 0.5;

        // Heat Signature Color Logic (Faster = Hotter)
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 18) this.color = '255, 255, 255'; // White hot
        else if (speed > 10) this.color = '6, 182, 212'; // Cyan
        else if (speed > 5) this.color = '59, 130, 246'; // Blue
        else this.color = '139, 92, 246'; // Purple cooling off
      }

      update() {
        this.vy += 0.4; // Stronger Gravity
        this.vx *= 0.96; // Air resistance
        this.vy *= 0.96;

        this.x += this.vx;
        this.y += this.vy;
        
        // Floor Bounce
        if (this.y > canvas!.height - 2) {
          this.y = canvas!.height - 2;
          this.vy *= -0.4;
          this.vx *= 0.7;
        }
        this.life--;
      }

      draw() {
        if (!ctx) return;
        const opacity = Math.max(0, this.life / this.maxLife);
        
        const endX = this.x - this.vx * 1.2;
        const endY = this.y - this.vy * 1.2;

        // Layer 1: The Outer Glow (Thick, low opacity)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = `rgba(${this.color}, ${opacity * 0.3})`;
        ctx.lineWidth = this.size * 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Layer 2: The Core Spark (Thin, high opacity)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = `rgba(${this.color}, ${opacity})`;
        ctx.lineWidth = this.size;
        ctx.stroke();
      }
    }

    // --- INTERACTION LOGIC ---
    
    let lastX = 0;
    let lastY = 0;

    const handleMove = (x: number, y: number) => {
      if (!isInteracting) return;
      
      const vx = x - lastX;
      const vy = y - lastY;
      
      // Add to plasma trail
      pointerTrail.push({ x, y, age: 0 });
      
      // Spawn heavy particle clusters on fast swipes
      const speed = Math.sqrt(vx * vx + vy * vy);
      const spawnCount = Math.min(Math.floor(speed / 1.5), 25);

      for (let i = 0; i < spawnCount; i++) {
        particles.push(new Particle(x, y, vx * 0.4, vy * 0.4));
      }

      lastX = x;
      lastY = y;
    };

    const onPointerDown = (e: PointerEvent) => {
      setIsInteracting(true);
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      
      // Spawn Shockwave
      shockwaves.push(new Shockwave(lastX, lastY));

      // Initial spark burst
      for (let i = 0; i < 30; i++) {
        particles.push(new Particle(lastX, lastY, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25));
      }

      // Premium Haptics (Sharp impact)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 20, 20]); 
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      handleMove(e.clientX - rect.left, e.clientY - rect.top);
    };

    const onPointerUp = () => {
      setIsInteracting(false);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // --- RENDER LOOP ---

    const render = () => {
      // Deep space cinematic clear
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(3, 7, 18, 0.35)'; // Slightly faster fade for clean motion blur
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'lighter'; // Additive blending for neon effects

      // 1. Draw Shockwaves
      for (let i = 0; i < shockwaves.length; i++) {
        shockwaves[i].update();
        shockwaves[i].draw();
        if (shockwaves[i].opacity <= 0) {
          shockwaves.splice(i, 1);
          i--;
        }
      }

      // 2. Draw Plasma Trail
      if (pointerTrail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pointerTrail[0].x, pointerTrail[0].y);
        for (let i = 1; i < pointerTrail.length; i++) {
          const pt = pointerTrail[i];
          // Curve smoothing
          const xc = (pointerTrail[i - 1].x + pt.x) / 2;
          const yc = (pointerTrail[i - 1].y + pt.y) / 2;
          ctx.quadraticCurveTo(pointerTrail[i - 1].x, pointerTrail[i - 1].y, xc, yc);
          pt.age += 1;
        }
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)'; // Electric blue plasma
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      
      // Clean up old trail segments
      while (pointerTrail.length > 0 && pointerTrail[0].age > 8) {
        pointerTrail.shift();
      }

      // 3. Draw Kinetic Particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].life <= 0) {
          particles.splice(i, 1);
          i--;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInteracting]);

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      whileTap={{ scale: 0.985 }}
      className={`
        relative w-full h-[35vh] min-h-[250px] max-h-[350px] 
        bg-[#030712] rounded-3xl overflow-hidden mb-8 touch-none
        transition-all duration-700 ease-out
        ${isInteracting 
          ? 'border-cyan-400/50 shadow-[0_0_60px_rgba(6,182,212,0.15)_inset]' 
          : 'border-slate-800/40 shadow-[0_0_30px_rgba(0,0,0,0.9)_inset]'}
        border
      `}
    >
      {/* Background Radial Vignette for Depth */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030712_100%)] pointer-events-none opacity-80" />

      {/* Grid Overlay for Cyberpunk Structure */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 z-10 block w-full h-full cursor-crosshair" />
      
      {/* Premium Glassmorphic Overlay Text */}
      <AnimatePresence>
        {!isInteracting && (
          <motion.div 
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-slate-950/60 backdrop-blur-md border border-cyan-500/20 px-8 py-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center gap-2">
              <div className="flex gap-1 mb-1">
                <span className="w-1 h-1 bg-cyan-500 rounded-full animate-ping" />
                <span className="w-1 h-1 bg-cyan-500 rounded-full animate-ping delay-75" />
                <span className="w-1 h-1 bg-cyan-500 rounded-full animate-ping delay-150" />
              </div>
              <p className="text-cyan-400 font-mono text-xs tracking-[0.5em] uppercase font-bold text-center">
                Kinetic Release
              </p>
              <p className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                Swipe to vent energy
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
            }
                 
