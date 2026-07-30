import { createFileRoute, Link } from '@tanstack/react-router';
import KineticForge from '../components/regain/KineticForge';

export const Route = createFileRoute('/regain')({
  component: RegainPage,
});

function RegainPage() {
  const handleForgeSuccess = () => {
    // This fires when the supernova flashes
    console.log("Kinetic Forge Complete! Granting Focus Core...");
    // Trigger Supabase logic here to update the user's profile
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold text-blue-500 tracking-widest uppercase font-mono">
          Regain
        </h1>
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
          Abort
        </Link>
      </div>

      {/* The Forge Component */}
      <div className="w-full max-w-md">
        <KineticForge onForgeComplete={handleForgeSuccess} />
      </div>
      
    </div>
  );
}
