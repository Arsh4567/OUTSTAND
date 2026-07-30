import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WarpSpeedEffectProps {
  /** Determines if the stars are moving at warp speed (timer running) or idle */
  isActive: boolean;
}

export function WarpSpeedEffect({ isActive }: WarpSpeedEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number; y: number; z: number; pz: number }[] = [];
    
    // Configuration
    const numStars = 400;
    const maxDepth = 2000;
    
    // Resize handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    // Initialize stars
    const initStars = () => {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: (Math.random() - 0.5) * canvas.width * 2,
          y: (Math.random() - 0.5) * canvas.height * 2,
          z: Math.random() * maxDepth,
          pz: Math.random() * maxDepth,
        });
      }
    };
    initStars();

    // Animation Loop
    const draw = () => {
      // Clear the canvas with a deep, transparent blue to create trails
      ctx.fillStyle = "rgba(5, 8, 20, 0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Speed changes drastically if the timer is active
      const speed = isActive ? 25 : 0.5;

      stars.forEach((star) => {
        star.pz = star.z;
        star.z -= speed;

        // Reset star if it passes the camera
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width * 2;
          star.y = (Math.random() - 0.5) * canvas.height * 2;
          star.z = maxDepth;
          star.pz = maxDepth;
        }

        // 3D to 2D projection
        const fov = 300;
        const sx = (star.x / star.z) * fov + centerX;
        const sy = (star.y / star.z) * fov + centerY;
        const px = (star.x / star.pz) * fov + centerX;
        const py = (star.y / star.pz) * fov + centerY;

        // Calculate opacity based on distance
        const opacity = 1 - star.z / maxDepth;
        
        // Draw the star (or streak if moving fast)
        ctx.beginPath();
        if (isActive) {
          // Warp speed streaks (Cyan/Blue)
          ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`; // Tailwind cyan-400
          ctx.lineWidth = 1.5;
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        } else {
          // Idle stars (White/Blue)
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2 }}
        className="fixed inset-0 z-0 pointer-events-none"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
        />
        
        {/* Vignette to blend the edges into your dark theme */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#050814_100%)] opacity-80" />
      </motion.div>
    </AnimatePresence>
  );
            }
