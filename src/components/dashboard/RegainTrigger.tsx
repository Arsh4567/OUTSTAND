import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';

export default function RegainTrigger() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative group cursor-pointer mb-8"
    >
      {/* Cinematic Glow Effect */}
      <div className="absolute inset-0 bg-blue-600/20 blur-xl group-hover:bg-blue-500/30 transition-all duration-500 rounded-2xl" />
      
      {/* The Button */}
      <Link to="/regain" className="relative flex items-center justify-between w-full p-1 bg-black border border-blue-900/50 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="text-xl font-bold tracking-widest text-white uppercase font-mono">
            Regain
          </h2>
        </div>
        
        <div className="px-6 py-4 bg-gradient-to-r from-transparent to-blue-900/40 border-l border-blue-900/30">
          <span className="text-blue-400 text-sm font-semibold tracking-wider uppercase">
            Initialize Protocol
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
