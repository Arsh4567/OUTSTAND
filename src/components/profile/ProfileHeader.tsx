import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, User, Camera, Copy, Check, Edit2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProfileHeader({ state, itemVariants }: { state: any, itemVariants: any }) {
  const { 
    user, profile, name, level, stats, 
    isEditingName, setIsEditingName, newName, setNewName, 
    isUploading, copiedId, fileInputRef, 
    getAuraColor, getRankTitle, signOut, handleCopyId, handleSaveName, handleAvatarUpload 
  } = state;

  return (
    <motion.header variants={itemVariants} className="relative overflow-hidden rounded-[2.5rem] border-t border-l border-white/10 border-b border-r border-black/50 bg-zinc-950/60 shadow-2xl backdrop-blur-3xl transition-all duration-700">
      <div className={cn("absolute inset-0 opacity-20 blur-[120px] bg-gradient-to-br", getAuraColor(stats.productivity))} />
      <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12 text-center md:text-left z-10">
        
        <div className="relative group/avatar cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -inset-2 rounded-full border border-dashed border-white/20 opacity-50 group-hover/avatar:border-indigo-400 group-hover/avatar:opacity-100 transition-all duration-500" />
          <div className="grid h-32 w-32 place-items-center rounded-full border border-white/10 bg-black text-4xl font-black shadow-2xl overflow-hidden relative z-10 transition-transform duration-500 group-hover/avatar:scale-105">
            {isUploading ? (
              <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" />
            ) : (
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-white">{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="absolute inset-0 z-20 bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <AnimatePresence mode="wait">
              {isEditingName ? (
                <motion.div key="editing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-3">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-black/60 border border-indigo-500/50 rounded-2xl px-6 py-2 text-3xl font-black text-white focus:outline-none focus:border-indigo-400 transition-all shadow-[0_0_30px_rgba(99,102,241,0.2)] w-full max-w-[280px]" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} />
                  <Button size="icon" variant="ghost" onClick={handleSaveName} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-2xl h-12 w-12 border border-emerald-500/20">
                    <Check className="h-6 w-6" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4 group/name cursor-pointer" onClick={() => { setNewName(name); setIsEditingName(true); }}>
                  <h1 className="font-display text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">{name}</h1>
                  <button className="opacity-0 -translate-x-4 group-hover/name:opacity-100 group-hover/name:translate-x-0 transition-all duration-300 text-zinc-500 hover:text-white bg-white/5 p-2 rounded-full border border-white/10">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs font-bold tracking-widest text-zinc-300">
              <User className="h-3.5 w-3.5 text-indigo-400" /> ID: {(user?.id || "unknown").split('-')[0]}
              <button onClick={handleCopyId} className="ml-2 text-zinc-500 hover:text-white transition-colors">
                {copiedId ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs font-bold tracking-widest text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> {getRankTitle(level)}
            </div>
          </div>
        </div>
        <Button variant="outline" className="shrink-0 gap-2 border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/20 hover:text-white rounded-2xl px-6 h-12 font-bold tracking-wide transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]" onClick={signOut}>
          <LogOut className="h-4 w-4" /> SIGN OUT
        </Button>
      </div>
    </motion.header>
  );
}
