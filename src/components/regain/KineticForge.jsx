import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KineticForge({ onForgeComplete }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [energy, setEnergy] = useState(0);
  const [isOverloaded, setIsOverloaded] = useState(false);

  // Constants for the physics engine
  const MAX_ENERGY = 1000;
  const ENERGY_DECAY = 2; // Energy lost per frame if not swiping
  const VELOCITY_MULTIPLIER = 1.5; // How much energy swiping generates

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let currentEnergy = 0;
    
    // Track pointer position and velocity
    let lastX = 0;
    let lastY = 0;
    let isPointerDown = false;

    // Resize canvas to match container perfectly (handles mobile screens)
    const resizeCanvas = () => {
      const parent = containerRef.current;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
      constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx + (Math.random() - 0.5) * 4;
        this.vy = vy + (Math.random() - 0.5) * 4;
        this.life = 1.0; // Fades out over time
        this.size = Math.random() * 4 + 2;
        // Sci-fi blue/cyan colors
        this.hue = Math.floor(Math.random() * 40) + 190; 
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02; // Decay rate
        this.size *= 0.96; // Shrink over time
      }

      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.life})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, ${this.life})`;
        ctx.fill();
      }
    }

    const handlePointerMove = (e) => {
      if (!isPointerDown || isOverloaded) return;

      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      // Calculate velocity
      const dx = currentX - lastX;
      const dy = currentY - lastY;
      const velocity = Math.sqrt(dx * dx + dy * dy);

      if (velocity > 5) { // Only spawn on fast movements
        // Generate energy based on swipe speed
        currentEnergy = Math.min(currentEnergy + velocity * VELOCITY_MULTIPLIER, MAX_ENERGY);
        setEnergy(currentEnergy);

        // Spawn particles based on velocity intensity
        const particleCount = Math.min(Math.floor(velocity / 5), 10);
        for (let i = 0; i < particleCount; i++) {
          particles.push(new Particle(currentX, currentY, dx * 0.1, dy * 0.1));
        }
      }

      lastX = currentX;
      lastY = currentY;
    };

    const handlePointerDown = (e) => {
      isPointerDown = true;
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
    };

    const handlePointerUp = () => {
      isPointerDown = false;
    };

    // Attach listeners (Pointer events handle both mouse and touch natively)
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const render = () => {
      // Dark cinematic trail effect instead of clearing the whole canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decay energy when not swiping
      if (currentEnergy > 0 && !isPointerDown) {
        currentEnergy = Math.max(currentEnergy - ENERGY_DECAY, 0);
        setEnergy(currentEnergy);
      }

      // Trigger Overload
      if (currentEnergy >= MAX_ENERGY && !isOverloaded) {
        setIsOverloaded(true);
        if (onForgeComplete) setTimeout(onForgeComplete, 1500); // Trigger reward after flash
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0 || p.size <= 0.1) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOverloaded, onForgeComplete]);

  // Calculate percentage for the UI bar
  const energyPercentage = Math.min((energy / 1000) * 100, 100);

  return (
    <div ref={containerRef} className="relative w-full h-[60vh] bg-black rounded-3xl overflow-hidden border border-blue-900/30 touch-none">
      
      {/* The HTML5 Canvas for High-Performance Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 touch-none" />

      {/* UI Overlay: Instructions */}
      <div className="absolute top-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <motion.p 
          animate={{ opacity: isPointerDown ? 0.2 : 1 }}
          className="text-blue-500/70 uppercase tracking-[0.3em] font-mono text-sm font-semibold"
        >
          Swipe to generate kinetic charge
        </motion.p>
      </div>

      {/* UI Overlay: Energy Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-3/4 max-w-md pointer-events-none">
        <div className="flex justify-between items-end mb-2 font-mono">
          <span className="text-blue-500 text-xs tracking-widest uppercase">System Core</span>
          <span className="text-white font-bold text-lg">{Math.floor(energyPercentage)}%</span>
        </div>
        
        {/* The Bar Background */}
        <div className="h-3 w-full bg-blue-950/50 rounded-full overflow-hidden border border-blue-900/50 relative p-[2px]">
          {/* The Fill */}
          <motion.div 
            className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"
            initial={{ width: "0%" }}
            animate={{ width: `${energyPercentage}%` }}
            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
          />
        </div>
      </div>

      {/* Supernova Flash (Overload State) */}
      <AnimatePresence>
        {isOverloaded && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.5, backgroundColor: "#ffffff" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 z-50 flex items-center justify-center mix-blend-screen pointer-events-none"
          >
            <div className="w-full h-full bg-blue-400 blur-3xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
          }
        
