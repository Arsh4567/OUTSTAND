import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import BlackHole from '@/components/regain/BlackHole';

export const Route = createFileRoute('/regain')({
  component: RegainPage,
});

function RegainPage() {
  const handlePurgeComplete = () => {
    // This fires when the black hole finishes its animation
    console.log("Distraction eradicated.");
  };

  return (
    <div className="min-h-screen bg-[#030712] p-6 pt-12 text-slate-100 font-sans flex flex-col items-center relative overflow-hidden">
      
      {/* Emergency Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50dvw] h-[50dvh] rounded-full bg-red-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50dvw] h-[50dvh] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
        
        {/* Escape Hatch Back to Dashboard */}
        <div className="w-full flex justify-start mb-12">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors font-mono text-xs uppercase tracking-[0.2em]">
            <ArrowLeft className="w-4 h-4" /> Abort Protocol
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-white mb-3 uppercase">
            Regain Protocol
          </h1>
          <p className="text-slate-400 font-mono text-xs tracking-[0.2em] uppercase">
            System override initialized. Purge guilt to proceed.
          </p>
        </div>

        {/* The Black Hole Component */}
        <div className="w-full w-full max-w-lg">
          <BlackHole onDestructionComplete={handlePurgeComplete} />
        </div>
        
      </div>
    </div>
  );
}
