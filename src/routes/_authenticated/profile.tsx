import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, Target, Timer, Trophy, Zap, Activity, TrendingUp, 
  LogOut, User, Camera, Copy, Check, Edit2, Loader2 
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

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Outstand" },
      { name: "description", content: "Your XP, level, streaks, focus, challenges, and progress." },
    ],
  }),
  component: ProfilePage,
});

// Premium Apple-like easing curve for ultra-smooth animations
const smoothEase = [0.22, 1, 0.36, 1];

function ProfilePage() {
  // 1. STRICT FALLBACKS (Zero-Crash Guarantee)
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

  // 2. UI STATE
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. BASIC MATH
  const { level = 1, into = 0, need = 100 } = levelFromXP(xp) || {};
  const pct = need > 0 ? Math.min(100, Math.round((into / need) * 100)) : 0;
  const name = user ? displayNameOf(user, profile) : "Loading...";

  // 4. PERFORMANCE OPTIMIZATION: Memoize all heavy array calculations!
  // This prevents the app from lagging when typing your name or hovering buttons.
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

  // --- ACTIONS ---
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

  // 5. ANIMATION VARIANTS
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, ease: smoothEase } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: smoothEase } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8 pb-24"
    >
      {/* HEADER SECTION */}
      <motion.header 
        variants={itemVariants}
        className="relative overflow-hidden p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-2xl group transition-all duration-500 hover:border-white/10 hover:bg-slate-900/60"
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500 opacity-10 blur-[100px] transition-opacity duration-700 group-hover:opacity-30" />
        
        <div className="relative flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          
          <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-indigo-500/20 bg-slate-950 text-3xl font-bold shadow-[0_0_30px_rgba(99,102,241,0.1)] overflow-hidden transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:border-indigo-400 group-hover/avatar:shadow-[0_0_40px_rgba(99,102,241,0.5)]">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover transition-transform duration-500 group-hover/avatar:scale-110" />
              ) : (
                <span className="text-white bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-[11px] font-medium tracking-wide text-slate-300 transition-colors hover:bg-white/10 hover:text-white cursor-default"
            >
              <User className="h-3.5 w-3.5 text-indigo-400" /> ID: {(user?.id || "unknown").split('-')[0]}...
              <button onClick={handleCopyId} className="ml-1 hover:text-indigo-400 transition-colors">
                {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </motion.div>
            
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <AnimatePresence mode="wait">
                {isEditingName ? (
                  <motion.div key="editing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-black/40 border border-indigo-500/50 rounded-xl px-4 py-1.5 text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] w-full max-w-[200px]"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveName} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-xl transition-all h-10 w-10">
                      <Check className="h-5 w-5" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 group/name cursor-pointer" onClick={() => { setNewName(name); setIsEditingName(true); }}>
                    <h1 className="font-display text-3xl font-black text-white md:text-4xl tracking-tight transition-colors group-hover/name:text-indigo-200">
                      {name}
                    </h1>
                    <button className="opacity-0 -translate-x-2 group-hover/name:opacity-100 group-hover/name:translate-x-0 transition-all duration-300 text-slate-400 hover:text-indigo-400">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="truncate text-sm font-medium text-slate-500">{user?.email || ""}</div>
          </div>

          <Button 
            variant="outline" 
            className="gap-2 border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-95" 
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </motion.header>

      {/* XP PROGRESS BAR */}
      <motion.section 
        variants={itemVariants}
        className="p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 shadow-xl backdrop-blur-xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1">Current Rank</div>
            <div className="font-display text-3xl font-black text-white drop-shadow-sm">Level {level}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Progress</div>
            <div className="font-display text-xl font-bold text-white"><span className="text-indigo-400">{into}</span> / {need} XP</div>
          </div>
        </div>
        <div className="h-5 overflow-hidden rounded-full bg-slate-950 border border-white/10 p-1 relative z-10 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.5, ease: smoothEase, delay: 0.2 }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 shadow-[0_0_20px_rgba(99,102,241,0.6)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </motion.div>
        </div>
      </motion.section>

      {/* TOP STATS */}
      <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat icon={<Zap />} label="Total XP" value={String(xp)} color="text-yellow-400" bg="bg-yellow-500/5" border="border-yellow-500/10" glowColor="rgba(234,179,8,0.4)" />
        <BigStat icon={<Trophy />} label="Level" value={String(level)} color="text-indigo-400" bg="bg-indigo-500/5" border="border-indigo-500/10" glowColor="rgba(99,102,241,0.4)" />
        <BigStat icon={<Flame />} label="Best streak" value={`${bestStreak}d`} color="text-orange-400" bg="bg-orange-500/5" border="border-orange-500/10" glowColor="rgba(249,115,22,0.4)" />
        <BigStat icon={<Target />} label="Completions" value={String(stats.totalCompletions)} color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/10" glowColor="rgba(16,185,129,0.4)" />
      </motion.section>
              {/* TRENDING STATS */}
      <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniCard icon={<Activity />} label="Avg dopamine" value={String(stats.avg)} sub="last 7 days" />
        <MiniCard icon={<TrendingUp />} label="Best day" value={String(stats.best?.score ?? 0)} sub={stats.best?.log_date ?? "—"} />
        <MiniCard icon={<TrendingUp className="rotate-180 text-rose-400" />} label="Worst day" value={String(stats.worst?.score ?? 0)} sub={stats.worst?.log_date ?? "—"} />
        <MiniCard icon={<Flame className="text-orange-400" />} label="Recovery Run" value={`${stats.longest}d`} sub="Consecutive ≥ 70" />
      </motion.section>

      {/* CHART */}
      <motion.section variants={itemVariants} className="p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-500 backdrop-blur-xl group">
        <h2 className="font-display text-xl font-bold text-white group-hover:text-indigo-100 transition-colors">Dopamine trend</h2>
        <p className="text-xs font-medium text-slate-500">Last 7 days momentum</p>
        <div className="mt-8 h-56">
          <TrendChart logs={logs} />
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        <MiniCard label="Productivity" value={`${stats.productivity}%`} sub="weighted metric" />
        <MiniCard label="Focus this week" value={`${stats.focusHoursWeek.toFixed(1)}h`} sub={`${stats.focusMinToday}m today`} />
        <MiniCard label="Habits today" value={`${stats.habitPct}%`} sub={`${habits.length} total`} />
      </motion.section>

      {/* HABIT MAP */}
      <motion.section variants={itemVariants} className="p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-500 backdrop-blur-xl group">
        <h2 className="font-display text-xl font-bold text-white group-hover:text-indigo-100 transition-colors">Consistency Map</h2>
        <p className="text-xs font-medium text-slate-500">Last 30 days completion rate</p>
        <div className="mt-8 flex items-end gap-1.5 h-24">
          {stats.dayStats.map((s, i) => (
            <motion.div 
              key={s.d} 
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ delay: i * 0.015, duration: 0.8, ease: smoothEase }}
              className="group/bar relative flex-1 flex flex-col justify-end"
            >
              <div
                className={cn(
                  "w-full rounded-md transition-all duration-300 cursor-crosshair",
                  s.ratio === 0 ? "bg-white/5 opacity-50 hover:opacity-100" 
                  : s.ratio < 0.5 ? "bg-indigo-500/40 hover:bg-indigo-400" 
                  : s.ratio < 1 ? "bg-indigo-400/80 shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:bg-indigo-300" 
                  : "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] hover:bg-emerald-300 hover:shadow-[0_0_20px_rgba(52,211,153,0.8)] z-10",
                  "group-hover/bar:scale-y-110 origin-bottom"
                )}
                style={{ height: `${Math.max(12, s.ratio * 100)}%` }}
              />
              <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-2xl transition-all duration-300 group-hover/bar:opacity-100 group-hover/bar:-translate-y-2 whitespace-nowrap z-50">
                {s.d} <span className="text-slate-600 mx-1">|</span> <span className={s.done === s.total && s.total > 0 ? "text-emerald-400" : "text-white"}>{s.done}/{s.total}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* BOTTOM LISTS */}
      <motion.section variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
        <div className="p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <h2 className="font-display text-xl font-bold text-white">Active Streaks</h2>
          <ul className="mt-6 space-y-3">
            {habits.length === 0 && <li className="text-sm text-slate-500 italic">No habits yet.</li>}
            {habits.map((h, i) => {
              const streakVal = streaks.find((s) => s?.id === h?.id)?.streak ?? 0;
              return (
                <motion.li 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: smoothEase }}
                  whileHover={{ scale: 1.02, x: 5, backgroundColor: "rgba(255,255,255,0.06)" }}
                  key={h.id} 
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-all cursor-default group"
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="text-3xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">{h.emoji}</span>
                    <span className="truncate font-semibold text-slate-200 group-hover:text-white transition-colors">{h.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 text-xs font-bold text-orange-400 group-hover:bg-orange-500/20 group-hover:border-orange-500/40 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all">
                    <Flame className="h-3.5 w-3.5" />
                    {streakVal}d
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <h2 className="font-display text-xl font-bold text-white">Lifetime Metrics</h2>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <SmallStat icon={<Timer className="text-indigo-400" />} label="Focus Sessions" value={String(stats.focusCompleted)} />
            <SmallStat icon={<Activity className="text-emerald-400" />} label="Focus Minutes" value={String(stats.focusMinutes)} />
            <SmallStat icon={<Zap className="text-yellow-400" />} label="Challenges Won" value={String(outstand.length)} />
            <SmallStat icon={<Trophy className="text-purple-400" />} label="Habits Built" value={String(habits.length)} />
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

// --- POLISHED UI COMPONENTS ---

function BigStat({ icon, label, value, color, bg, border, glowColor }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "p-6 rounded-[1.5rem] border backdrop-blur-xl relative overflow-hidden group transition-all duration-500", 
        bg, border
      )}
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
        style={{ background: `radial-gradient(circle 150px at center, ${glowColor}, transparent)` }} 
      />
      <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] relative z-10", color)}>
        <span className="p-1.5 rounded-xl bg-black/40 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">{icon}</span>
        {label}
      </div>
      <div className="mt-5 font-display text-4xl font-black text-white relative z-10 tracking-tight">{value}</div>
    </motion.div>
  );
}

function MiniCard({ icon, label, value, sub }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.04)", y: -2 }}
      className="p-5 rounded-[1.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl transition-all duration-300 cursor-default"
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
        {icon && <span className="text-slate-300">{icon}</span>}
        {label}
      </div>
      <div className="mt-3 font-display text-2xl font-bold text-white tracking-tight">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{sub}</div>
    </motion.div>
  );
}

function SmallStat({ icon, label, value }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.03, backgroundColor: "rgba(0,0,0,0.4)" }}
      className="rounded-[1.5rem] border border-white/5 bg-black/20 p-5 transition-all duration-300 cursor-default"
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-3 font-display text-2xl font-bold text-white tracking-tight">{value}</div>
    </motion.div>
  );
}

// CRASH-PROOF & OPTIMIZED TREND CHART
function TrendChart({ logs }: { logs: { log_date: string; score: number }[] }) {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center text-sm font-medium text-slate-500">
        No data yet. Complete daily logs to see trends.
      </div>
    );
  }
  
  const w = 700;
  const h = 200;
  const step = w / Math.max(1, logs.length - 1);
  
  const points = logs.map((l, i) => [i * step, h - ((l?.score || 0) / 100) * h]);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${(logs.length - 1) * step},${h} L0,${h} Z`;
  
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
        </linearGradient>
      </defs>
      
      {[0, 40, 70, 100].map((v) => (
        <line
          key={v}
          x1={0}
          x2={w}
          y1={h - (v / 100) * h}
          y2={h - (v / 100) * h}
          stroke="rgba(255,255,255,0.06)"
          strokeDasharray="4 6"
        />
      ))}
      
      <motion.path 
        initial={{ opacity: 0, d: `M0,${h} L${w},${h} Z` }}
        animate={{ opacity: 1, d: area }}
        transition={{ duration: 1.2, ease: smoothEase }}
        fill="url(#trendFill)" 
      />
      
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        d={path} 
        fill="none" 
        stroke="rgba(99,102,241,1)" 
        strokeWidth={4} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ filter: 'drop-shadow(0 0 12px rgba(99,102,241,0.6))' }} 
      />
      
      {points.map((p, i) => {
        let hex = "#818cf8";
        try {
          const l = logs[i];
          const c = scoreColor(l?.score || 0);
          hex = (c as any)?.hex || c || "#818cf8";
        } catch (e) {
          // Fallback if scoreColor fails
        }
        
        return (
          <motion.circle
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1 + (i * 0.05), type: "spring", stiffness: 300 }}
            cx={p[0]}
            cy={p[1]}
            r={6}
            fill={hex as string}
            stroke="#0f172a"
            strokeWidth={3}
            className="hover:r-[9px] transition-all duration-300 cursor-pointer"
            style={{ filter: `drop-shadow(0 0 10px ${hex})` }}
          />
        );
      })}
    </svg>
  );
      }
      
