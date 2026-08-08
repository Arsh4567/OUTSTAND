import React from 'react';

interface NeonCityProps {
  level: number;
  completionPercent: number; // 0 to 100, makes the city "glow" brighter
}

export function NeonCity({ level, completionPercent }: NeonCityProps) {
  // Determine city size based on level
  const buildingCount = Math.min(Math.max(3 + Math.floor(level * 1.5), 5), 25);
  
  // Base glow intensity on daily completion
  const glowOpacity = 0.3 + (completionPercent / 100) * 0.7;

  return (
    <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950 border border-slate-800 shadow-[0_0_30px_rgba(99,102,241,0.15)] flex items-end justify-center perspective-1000">
      
      {/* Dynamic Skyline */}
      <div className="absolute bottom-0 w-full flex items-end justify-center gap-1 sm:gap-2 px-4 h-full">
        {Array.from({ length: buildingCount }).map((_, i) => {
          const height = 20 + Math.random() * 60; // 20% to 80% height
          const isNeon = Math.random() > 0.5 && level > 2; // More neon as level goes up
          const colorClass = isNeon 
            ? ['bg-cyan-400', 'bg-fuchsia-500', 'bg-violet-500'][Math.floor(Math.random() * 3)]
            : 'bg-slate-800';
          
          const neonShadow = isNeon ? `0 0 ${10 + (completionPercent / 5)}px var(--tw-shadow-color)` : 'none';

          return (
            <div 
              key={i} 
              className={`w-6 sm:w-10 rounded-t-sm transition-all duration-1000 ease-out border-t border-x border-white/10 ${colorClass}`}
              style={{ 
                height: `${height}%`, 
                opacity: isNeon ? glowOpacity : 0.8,
                boxShadow: neonShadow,
                // Apply the shadow color based on the background color class
                '--tw-shadow-color': isNeon ? (colorClass.includes('cyan') ? '#22d3ee' : colorClass.includes('fuchsia') ? '#d946ef' : '#8b5cf6') : 'transparent'
              } as React.CSSProperties}
            >
              {/* Windows */}
              {isNeon && height > 40 && (
                <div className="w-full h-full p-1 flex flex-wrap gap-1 content-start opacity-70">
                  {Array.from({ length: Math.floor(height / 10) }).map((_, j) => (
                    <div key={j} className="w-1.5 h-1.5 bg-white/80 rounded-sm animate-pulse" style={{ animationDelay: `${Math.random() * 2}s` }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid Floor */}
      <div className="absolute bottom-0 w-[200%] h-12 bg-[linear-gradient(transparent_0%,rgba(99,102,241,0.3)_100%)] border-t border-indigo-500/50" style={{ transform: 'rotateX(60deg) translateY(20px)' }}>
         <div className="w-full h-full bg-[linear-gradient(90deg,rgba(99,102,241,0.2)_1px,transparent_1px),linear-gradient(rgba(99,102,241,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>

      {/* City Status Overlay */}
      <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Sector {level} Active</span>
      </div>
    </div>
  );
}
