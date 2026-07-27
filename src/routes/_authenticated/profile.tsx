import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { Component, useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  Flame, Target, Timer, Trophy, Zap, Activity, TrendingUp, 
  LogOut, User, Camera, Copy, Check, Edit2, Loader2, Sparkles, Hexagon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useWeeklyLogs } from "@/hooks/use-dopamine";
import { lastNDays, levelFromXP, todayISO } from "@/lib/habits";
import { scoreColor } from "@/lib/dopamine";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 🔥 THE SELF-DIAGNOSING ERROR BOUNDARY 🔥
class ProfileErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, errorInfo: any) { this.setState({ errorInfo }); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 mt-24 border-2 border-rose-500 bg-rose-500/10 rounded-2xl text-white backdrop-blur-xl shadow-2xl">
          <h2 className="text-2xl font-black text-rose-500 mb-4">CRASH DETECTED!</h2>
          <p className="mb-4 text-sm text-slate-300 font-medium">Please screenshot this red box and send it to me so we can see exactly what is missing:</p>
          <div className="bg-black/80 p-4 rounded-xl text-xs font-mono text-rose-300 overflow-auto whitespace-pre-wrap border border-rose-500/30">
            {this.state.error && this.state.error.toString()}
          </div>
          <div className="bg-black/80 p-4 rounded-xl text-[10px] font-mono text-rose-400 mt-3 overflow-auto h-48 whitespace-pre-wrap border border-rose-500/30">
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Outstand" },
      { name: "description", content: "Your XP, level, streaks, focus, challenges, and progress." },
    ],
  }),
  component: () => (
    <ProfileErrorBoundary>
      <ProfilePage />
    </ProfileErrorBoundary>
  ),
});

const smoothEase = [0.22, 1, 0.36, 1];

// --- PREMIUM SPOTLIGHT CARD COMPONENT ---
function SpotlightCard({ children, className, glowColor = "rgba(99,102,241,0.15)" }: any) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-950/40 backdrop-blur-3xl transition-all duration-500 shadow-2xl",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

function ProfilePage() {
  const appState = useAppState() || {};
  const habits = appState.habits || [];
  const sessions = appState.sessions || [];
  const outstand = appState.outstand || [];
  const xp = appState.xp || 0;
  const bestStreak = appState.bestStreak || 0;
  const streaks = appState.streaks || [];

  const authContext = useAuth() || {};
  const user = authContext.user || null;
  const profile = authContext.profile || null;
  
  const weeklyData = useWeeklyLogs(7) || {};
  const logs = weeklyData.logs || [];
  const monthlyData = useWeeklyLogs(30) || {};
  const monthLogs = monthlyData.logs || [];
  
  const navigate = useNavigate();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { level = 1, into = 0, need = 100 } = levelFromXP(xp) || {};
  const pct = need > 0 ? Math.min(100, Math.round((into / need) * 100)) : 0;
  const name = user ? displayNameOf(user, profile) : "Loading...";

  const stats = useMemo(() => {
    const today = todayISO();
    const days = lastNDays(30);
    
    const dayStats = days.map((d) => {
      const done = habits.filter((h) => h?.history?.includes(d)).length;
      const total = habits.length;
      return { d, done, total, ratio: total ? done / total : 0 };
    });

    const totalCompletions = habits.reduce((s, h) => s + (h?.history?.length || 0), 0);
    const focusCompleted = sessions.filter((s) => s?.completed).length;
    const focusMinutes = sessions.filter((s) => s?.completed).reduce((s, x) => s + (x?.durationMin || 0), 0);

    const avg = logs.length ? Math.round(logs.reduce((a, b) => a + (b?.score || 0), 0) / logs.length) : 0;
    const best = logs.length ? logs.reduce((a, b) => ((b?.score || 0) > (a?.score || 0) ? b : a), logs[0]) : null;
    const worst = logs.length ? logs.reduce((a, b) => ((b?.score || 0) < (a?.score || 0) ? b : a), logs[0]) : null;

    let currentStreak = 0;
    let longest = 0;
    for (const l of monthLogs) {
      if ((l?.score || 0) >= 70) {
        currentStreak++;
        longest = Math.max(longest, currentStreak);
      } else currentStreak = 0;
    }

    const focusMinToday = sessions
      .filter((s) => s?.completed && s?.startedAt?.slice(0, 10) === today)
      .reduce((a, s) => a + (s?.durationMin || 0), 0);
      
    const habitPct = habits.length
      ? Math.round((habits.filter((h) => h?.history?.includes(today)).length / habits.length) * 100)
      : 0;
      
    const focusHoursWeek = sessions
      .filter((s) => s?.completed && s?.startedAt && new Date(s.startedAt) >= new Date(Date.now() - 7 * 86400000))
      .reduce((a, s) => a + (s?.durationMin || 0), 0) / 60;
        
    const productivity = Math.min(100, Math.round(habitPct * 0.4 + Math.min(100, focusHoursWeek * 10) * 0.6));

    return { dayStats, totalCompletions, focusCompleted, focusMinutes, avg, best, worst, longest, focusMinToday, habitPct, focusHoursWeek, productivity };
  }, [habits, sessions, logs, monthLogs]);

  // Determine Aura Color based on Productivity
  const getAuraColor = (prod: number) => {
    if (prod >= 90) return "from-violet-500 via-fuchsia-500 to-cyan-500";
    if (prod >= 70) return "from-emerald-400 via-cyan-500 to-blue-500";
    if (prod >= 40) return "from-amber-400 via-orange-500 to-rose-500";
    return "from-slate-500 via-slate-600 to-zinc-700";
  };

  const getRankTitle = (lvl: number) => {
    if (lvl >= 50) return "Grandmaster";
    if (lvl >= 30) return "Ascended";
    if (lvl >= 15) return "Disciplined";
    if (lvl >= 5) return "Initiate";
    return "Novice";
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    toast.success("User ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName === name || !user?.id) {
      setIsEditingName(false);
      return;
    }
    try {
      const { error } = await supabase.from("profiles").update({ full_name: newName }).eq("id", user.id);
      if (error) throw error;
      toast.success("Name updated successfully!");
      setIsEditingName(false);
    } catch (err) {
      toast.error("Failed to update name");
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      if (!event.target.files || event.target.files.length === 0 || !user?.id) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      toast.success('Profile picture updated!');
    } catch (error: any) {
      toast.error(error.message || "Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, ease: smoothEase } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: smoothEase } }
  };

  // 3D Parallax logic for Level Badge
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleBadgeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* FEATURE 1: Cinematic Profile Header */}
      <motion.header variants={itemVariants} className="relative overflow-hidden rounded-[2.5rem] border-t border-l border-white/10 border-b border-r border-black/50 bg-zinc-950/60 shadow-2xl backdrop-blur-3xl transition-all duration-700">
        
        {/* Dynamic Background Mesh based on Aura */}
        <div className={cn("absolute inset-0 opacity-20 blur-[120px] bg-gradient-to-br", getAuraColor(stats.productivity))} />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12 text-center md:text-left z-10">
          {/* Avatar with Animated Glow Rings */}
          <div className="relative group/avatar cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            
            {/* Spinning Outer Ring */}
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 rounded-full border border-dashed border-white/20 opacity-50 group-hover/avatar:border-indigo-400 group-hover/avatar:opacity-100 transition-all duration-500" 
            />

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

          {/* User Details */}
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

      {/* FEATURE 2: Bento Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Holographic Level Badge (Spans 1 col, 2 rows on XL) */}
        <motion.div 
          variants={itemVariants}
          className="xl:col-span-1 xl:row-span-2 perspective-[1000px]"
          onMouseMove={handleBadgeMouseMove}
          onMouseLeave={() => { x.set(0); y.set(0); }}
        >
          <motion.div 
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="h-full relative p-8 rounded-[2rem] border border-white/10 bg-gradient-to-b from-indigo-900/40 to-black/60 shadow-[0_20px_50px_-15px_rgba(99,102,241,0.3)] backdrop-blur-3xl flex flex-col items-center justify-center group"
          >
            {/* 3D Inner Float */}
            <motion.div style={{ transform: "translateZ(60px)" }} className="text-center w-full relative z-10">
              <Hexagon className="h-32 w-32 mx-auto text-indigo-500/20 absolute left-1/2 -translate-x-1/2 -top-4 -z-10" strokeWidth={1} />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Current Rank</div>
              <div className="font-mono text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                {level}
              </div>
              
              <div className="mt-12 w-full text-left">
                <div className="flex justify-between text-xs font-bold text-zinc-400 mb-3 tracking-wider">
                  <span>PROGRESS</span>
                  <span className="text-white"><span className="text-indigo-400">{into}</span> / {need}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-black/60 border border-white/10 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${pct}%` }} 
                    transition={{ duration: 1.5, ease: smoothEase, delay: 0.2 }} 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-400 shadow-[0_0_20px_rgba(99,102,241,0.8)] relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Hero Stats */}
        <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <BigStat icon={<Zap />} label="Total XP" value={String(xp)} color="text-yellow-400" glowColor="rgba(234,179,8,0.2)" />
          <BigStat icon={<Activity />} label="Productivity" value={`${stats.productivity}%`} color="text-emerald-400" glowColor="rgba(52,211,153,0.2)" />
          <BigStat icon={<Flame />} label="Best Streak" value={`${bestStreak}d`} color="text-orange-400" glowColor="rgba(249,115,22,0.2)" />
          <BigStat icon={<Target />} label="Habits" value={String(stats.totalCompletions)} color="text-cyan-400" glowColor="rgba(6,182,212,0.2)" />
        </motion.div>
{/* Trend Chart (Wide) */}
        <SpotlightCard className="md:col-span-3 xl:col-span-3 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 relative z-10">
            <div>
              <h2 className="font-display text-2xl font-black text-white tracking-tight">Dopamine Velocity</h2>
              <p className="text-sm font-medium text-zinc-500 mt-1">7-day performance momentum mapping</p>
            </div>
            <div className="text-right mt-4 sm:mt-0">
              <div className="text-3xl font-black text-white">{stats.avg}<span className="text-sm text-zinc-500 ml-1">avg</span></div>
            </div>
          </div>
          <div className="h-64 w-full">
            <TrendChart logs={logs} />
          </div>
        </SpotlightCard>

      </div>

      {/* FEATURE 3: Deep Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Streaks Masonry */}
        <SpotlightCard className="lg:col-span-1 p-8 flex flex-col max-h-[500px]">
          <h2 className="font-display text-xl font-black text-white flex items-center gap-2 mb-6">
            <Flame className="text-orange-500" /> Active Fire
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar mask-image-bottom">
            {habits.length === 0 && <div className="text-sm text-zinc-500 italic p-4 border border-dashed border-white/10 rounded-2xl text-center">Awaiting your first habit completion.</div>}
            {habits.map((h, i) => {
              const streakVal = streaks.find((s) => s?.id === h?.id)?.streak ?? 0;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.1 }}
                  key={h.id} 
                  className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group"
                >
                  <span className="flex items-center gap-4 min-w-0">
                    <span className="text-3xl drop-shadow-lg group-hover:scale-110 transition-transform">{h.emoji}</span>
                    <span className="truncate font-bold text-zinc-300 group-hover:text-white transition-colors">{h.name}</span>
                  </span>
                  <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-sm font-black text-orange-400 group-hover:bg-orange-500/20 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
                    {streakVal}d
                  </span>
                </motion.div>
              );
            })}
          </div>
        </SpotlightCard>

        {/* Consistency Heatmap */}
        <SpotlightCard className="lg:col-span-2 p-8">
          <h2 className="font-display text-xl font-black text-white flex items-center gap-2 mb-2">
            <TrendingUp className="text-emerald-400" /> Consistency Matrix
          </h2>
          <p className="text-sm font-medium text-zinc-500 mb-8">30-day habit completion density</p>
          
          <div className="flex items-end gap-1 sm:gap-2 h-40 w-full">
            {stats.dayStats.map((s, i) => (
              <motion.div 
                key={s.d} 
                initial={{ height: 0 }} 
                animate={{ height: "100%" }} 
                transition={{ delay: i * 0.01, duration: 0.8, ease: smoothEase }} 
                className="group/bar relative flex-1 flex flex-col justify-end"
              >
                <div
                  className={cn(
                    "w-full rounded-md transition-all duration-300",
                    s.ratio === 0 ? "bg-white/5 hover:bg-white/20" 
                    : s.ratio < 0.5 ? "bg-indigo-900 hover:bg-indigo-700" 
                    : s.ratio < 1 ? "bg-indigo-500 hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                    : "bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.6)] z-10",
                    "group-hover/bar:scale-y-110 group-hover/bar:brightness-125 origin-bottom cursor-crosshair"
                  )}
                  style={{ height: `${Math.max(15, s.ratio * 100)}%` }}
                />
                
                {/* Tactical Tooltip */}
                <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 px-4 py-2.5 text-xs font-bold text-white opacity-0 shadow-2xl transition-all duration-300 group-hover/bar:opacity-100 group-hover/bar:-translate-y-2 whitespace-nowrap z-50">
                  <div className="text-zinc-400 mb-1">{new Date(s.d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                  <span className={s.done === s.total && s.total > 0 ? "text-emerald-400" : "text-white"}>{s.done} / {s.total} Habits</span>
                </div>
              </motion.div>
            ))}
          </div>
        </SpotlightCard>

      </div>

      {/* Extra Lifetime Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniCard icon={<Timer className="text-indigo-400" />} label="Focus Sessions" value={String(stats.focusCompleted)} />
        <MiniCard icon={<Activity className="text-emerald-400" />} label="Focus Minutes" value={String(stats.focusMinutes)} />
        <MiniCard icon={<Zap className="text-yellow-400" />} label="Challenges" value={String(outstand.length)} />
        <MiniCard icon={<Trophy className="text-purple-400" />} label="Total Built" value={String(habits.length)} />
      </div>

    </motion.div>
  );
}

// --- POLISHED UI SUB-COMPONENTS ---

function BigStat({ icon, label, value, color, glowColor }: any) {
  return (
    <SpotlightCard glowColor={glowColor} className="p-6">
      <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] relative z-10 mb-4", color)}>
        <span className="p-2 rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">{icon}</span>
        {label}
      </div>
      <div className="font-mono text-4xl lg:text-5xl font-black text-white relative z-10 tracking-tighter drop-shadow-lg">{value}</div>
    </SpotlightCard>
  );
}

function MiniCard({ icon, label, value }: any) {
  return (
    <SpotlightCard className="p-5 text-center flex flex-col items-center justify-center min-h-[140px]">
      <div className="text-zinc-500 mb-3 bg-white/5 p-2 rounded-xl border border-white/5">{icon}</div>
      <div className="font-mono text-3xl font-black text-white tracking-tighter mb-1">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">{label}</div>
    </SpotlightCard>
  );
}

function TrendChart({ logs }: { logs: { log_date: string; score: number }[] }) {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-center text-sm font-medium text-zinc-500">
        Awaiting daily log data.
      </div>
    );
  }
  const w = 800; const h = 240; // Increased resolution
  const step = w / Math.max(1, logs.length - 1);
  const points = logs.map((l, i) => [i * step, h - ((l?.score || 0) / 100) * h]);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${(logs.length - 1) * step},${h} L0,${h} Z`;
  
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible preserve-3d">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.5)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0.0)" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Grid Lines */}
      {[0, 25, 50, 75, 100].map((v) => (
        <line key={v} x1={0} x2={w} y1={h - (v / 100) * h} y2={h - (v / 100) * h} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 6" />
      ))}
      
      {/* Area Fill */}
      <motion.path 
        initial={{ opacity: 0, d: `M0,${h} L${w},${h} Z` }} 
        animate={{ opacity: 1, d: area }} 
        transition={{ duration: 1.5, ease: smoothEase }} 
        fill="url(#trendFill)" 
      />
      {/* Main Line */}
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: 1 }} 
        transition={{ duration: 2, ease: "easeInOut" }} 
        d={path} 
        fill="none" 
        stroke="#818cf8" 
        strokeWidth={5} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        filter="url(#glow)"
      />
      
      {/* Interactive Data Points */}
      {points.map((p, i) => {
        let hex = "#818cf8";
        try {
          const l = logs[i];
          const c = scoreColor(l?.score || 0);
          hex = (c as any)?.hex || c || "#818cf8";
        } catch (e) {}
        
        return (
          <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + (i * 0.1), type: "spring" }}>
            <circle cx={p[0]} cy={p[1]} r={14} fill="transparent" className="cursor-crosshair" />
            <circle 
              cx={p[0]} 
              cy={p[1]} 
              r={6} 
              fill={hex as string} 
              stroke="#09090b" 
              strokeWidth={4} 
              style={{ filter: `drop-shadow(0 0 12px ${hex})` }} 
            />
          </motion.g>
        );
      })}
    </svg>
  );
}
        
