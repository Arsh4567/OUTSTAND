import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
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

function ProfilePage() {
  // CRASH FIX 1: Provide default empty arrays so the math doesn't crash before data loads
  const { habits = [], sessions = [], outstand = [], xp = 0, bestStreak = 0, streaks = [] } = useAppState() || {};
  const { user, profile } = useAuth();
  
  // CRASH FIX 2: Default logs to an empty array
  const { logs = [] } = useWeeklyLogs(7);
  const { logs: monthLogs = [] } = useWeeklyLogs(30);
  
  const navigate = useNavigate();

  // Profile Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { level, into, need } = levelFromXP(xp);
  const pct = Math.min(100, Math.round((into / need) * 100));
  const name = displayNameOf(user, profile);

  // Stats Calculations
  const days = useMemo(() => lastNDays(30), []);
  const dayStats = days.map((d) => {
    const done = habits.filter((h) => h.history?.includes(d)).length;
    const total = habits.length;
    return { d, done, total, ratio: total ? done / total : 0 };
  });

  const totalCompletions = habits.reduce((s, h) => s + (h.history?.length || 0), 0);
  const focusCompleted = sessions.filter((s) => s.completed).length;
  const focusMinutes = sessions.filter((s) => s.completed).reduce((s, x) => s + (x.durationMin || 0), 0);

  const avg = logs.length ? Math.round(logs.reduce((a, b) => a + (b.score || 0), 0) / logs.length) : 0;
  const best = logs.length ? logs.reduce((a, b) => (b.score > a.score ? b : a), logs[0]) : { log_date: "-", score: 0 };
  const worst = logs.length ? logs.reduce((a, b) => (b.score < a.score ? b : a), logs[0]) : { log_date: "-", score: 100 };

  let streak = 0;
  let longest = 0;
  for (const l of monthLogs) {
    if (l.score >= 70) {
      streak++;
      longest = Math.max(longest, streak);
    } else streak = 0;
  }

  const today = todayISO();
  const focusMinToday = sessions
    .filter((s) => s.completed && s.startedAt?.slice(0, 10) === today)
    .reduce((a, s) => a + (s.durationMin || 0), 0);
    
  const habitPct = habits.length
    ? Math.round((habits.filter((h) => h.history?.includes(today)).length / habits.length) * 100)
    : 0;
    
  const focusHoursWeek =
    sessions
      .filter((s) => s.completed && new Date(s.startedAt) >= new Date(Date.now() - 7 * 86400000))
      .reduce((a, s) => a + (s.durationMin || 0), 0) / 60;
      
  const productivity = Math.min(
    100,
    Math.round(habitPct * 0.4 + Math.min(100, focusHoursWeek * 10) * 0.6),
  );

  // --- ACTIONS ---
  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user?.id || "");
    setCopiedId(true);
    toast.success("User ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName === name) {
      setIsEditingName(false);
      return;
    }
    try {
      const { error } = await supabase.from("profiles").update({ full_name: newName }).eq("id", user?.id);
      if (error) throw error;
      toast.success("Name updated successfully! (Refresh to see changes)");
      setIsEditingName(false);
    } catch (err) {
      toast.error("Failed to update name");
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user?.id);
      if (updateError) throw updateError;

      toast.success('Profile picture updated! (Refresh to see changes)');
    } catch (error: any) {
      toast.error(error.message || "Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  // Stagger animation setup
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20"
    >
      {/* HEADER SECTION */}
      <motion.header 
        variants={itemVariants}
        className="relative overflow-hidden p-6 md:p-8 rounded-[2rem] border border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-xl group"
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500 opacity-20 blur-[100px] transition-opacity duration-700 group-hover:opacity-40" />
        
        <div className="relative flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          
          {/* AVATAR UPLOAD */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-indigo-500/30 bg-slate-800 text-3xl font-bold shadow-[0_0_30px_rgba(99,102,241,0.2)] overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-400 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.6)]">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-white">{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition-colors hover:bg-white/10 hover:text-white cursor-default"
            >
              <User className="h-3.5 w-3.5" /> ID: {(user?.id || "unknown").split('-')[0]}...
              <button onClick={handleCopyId} className="ml-1 hover:text-indigo-400 transition-colors">
                {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </motion.div>
            
            {/* NAME EDITING */}
            <div className="flex items-center justify-center sm:justify-start gap-3">
              {isEditingName ? (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-black/40 border border-indigo-500/50 rounded-lg px-3 py-1 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveName} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all">
                    <Check className="h-5 w-5" />
                  </Button>
                </motion.div>
              ) : (
                <div className="flex items-center gap-3 group/name cursor-pointer" onClick={() => { setNewName(name); setIsEditingName(true); }}>
                  <h1 className="font-display text-3xl font-black text-white md:text-4xl tracking-tight transition-colors group-hover/name:text-indigo-100">
                    {name}
                  </h1>
                  <button className="opacity-0 group-hover/name:opacity-100 transition-opacity text-slate-400 hover:text-indigo-400">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="truncate text-sm text-slate-400">{user?.email}</div>
          </div>

          <Button 
            variant="outline" 
            className="gap-2 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95" 
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </motion.header>

      {/* XP PROGRESS BAR */}
      <motion.section 
        variants={itemVariants}
        className="p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 shadow-xl backdrop-blur-md relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400">Current Rank</div>
            <div className="font-display text-2xl font-bold text-white">Level {level}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Progress</div>
            <div className="font-display text-xl font-semibold text-white">{into} / {need} XP</div>
          </div>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-black/50 border border-white/10 p-0.5 relative z-10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(99,102,241,0.8)] relative"
          >
            {/* Shimmer effect inside the bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </motion.div>
        </div>
      </motion.section>

      {/* TOP STATS */}
      <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat icon={<Zap />} label="Total XP" value={String(xp)} color="text-yellow-400" bg="bg-yellow-500/10" border="border-yellow-500/20" glowColor="rgba(234,179,8,0.3)" />
        <BigStat icon={<Trophy />} label="Level" value={String(level)} color="text-indigo-400" bg="bg-indigo-500/10" border="border-indigo-500/20" glowColor="rgba(99,102,241,0.3)" />
        <BigStat icon={<Flame />} label="Best streak" value={`${bestStreak}d`} color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20" glowColor="rgba(249,115,22,0.3)" />
        <BigStat icon={<Target />} label="Completions" value={String(totalCompletions)} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" glowColor="rgba(16,185,129,0.3)" />
      </motion.section>

      {/* TRENDING STATS */}
      <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniCard icon={<Activity />} label="Avg dopamine" value={String(avg)} sub="last 7 days" />
        <MiniCard icon={<TrendingUp />} label="Best day" value={String(best?.score ?? 0)} sub={best?.log_date ?? "—"} />
        <MiniCard icon={<TrendingUp className="rotate-180 text-rose-400" />} label="Worst day" value={String(worst?.score ?? 0)} sub={worst?.log_date ?? "—"} />
        <MiniCard icon={<Flame className="text-orange-400" />} label="Recovery Run" value={`${longest}d`} sub="Consecutive ≥ 70" />
      </motion.section>

      {/* CHART */}
      <motion.section variants={itemVariants} className="p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-colors backdrop-blur-md">
        <h2 className="font-display text-xl font-bold text-white">Dopamine trend</h2>
        <p className="text-xs font-medium text-slate-400">Last 7 days momentum</p>
        <div className="mt-8 h-56">
          <TrendChart logs={logs} />
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        <MiniCard label="Productivity" value={`${productivity}%`} sub="weighted metric" />
        <MiniCard label="Focus this week" value={`${focusHoursWeek.toFixed(1)}h`} sub={`${focusMinToday}m today`} />
        <MiniCard label="Habits today" value={`${habitPct}%`} sub={`${habits.length} total`} />
      </motion.section>

      {/* HABIT MAP */}
      <motion.section variants={itemVariants} className="p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-colors backdrop-blur-md">
        <h2 className="font-display text-xl font-bold text-white">Consistency Map</h2>
        <p className="text-xs font-medium text-slate-400">Last 30 days completion rate</p>
        <div className="mt-8 flex items-end gap-1.5 h-24">
          {dayStats.map((s, i) => (
            <motion.div 
              key={s.d} 
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ delay: i * 0.02, duration: 0.5 }}
              className="group relative flex-1 flex flex-col justify-end"
            >
              <div
                className={cn(
                  "w-full rounded-md transition-all duration-300 hover:opacity-100 hover:scale-110 cursor-crosshair",
                  s.ratio === 0 ? "bg-white/5 opacity-50" : s.ratio < 0.5 ? "bg-indigo-500/40" : s.ratio < 1 ? "bg-indigo-400/70 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10",
                )}
                style={{ height: `${Math.max(15, s.ratio * 100)}%` }}
              />
              <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg bg-black/90 border border-white/10 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-2xl transition-all group-hover:opacity-100 group-hover:-translate-y-1 whitespace-nowrap z-50">
                {s.d} <span className="text-slate-500 mx-1">•</span> {s.done}/{s.total}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* BOTTOM LISTS */}
      <motion.section variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
        <div className="p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-md">
          <h2 className="font-display text-xl font-bold text-white">Active Streaks</h2>
          <ul className="mt-6 space-y-3">
            {habits.length === 0 && <li className="text-sm text-slate-400 italic">No habits yet.</li>}
            {habits.map((h) => {
              const streakVal = streaks.find((s) => s.id === h.id)?.streak ?? 0;
              return (
                <motion.li 
                  whileHover={{ scale: 1.02, x: 5 }}
                  key={h.id} 
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-default shadow-sm hover:shadow-lg"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="text-2xl drop-shadow-md">{h.emoji}</span>
                    <span className="truncate font-semibold text-slate-200">{h.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 px-3 py-1 text-xs font-bold text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                    <Flame className="h-3.5 w-3.5" />
                    {streakVal}d
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="p-6 md:p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-md">
          <h2 className="font-display text-xl font-bold text-white">Lifetime Metrics</h2>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <SmallStat icon={<Timer className="text-indigo-400" />} label="Focus Sessions" value={String(focusCompleted)} />
            <SmallStat icon={<Activity className="text-emerald-400" />} label="Focus Minutes" value={String(focusMinutes)} />
            <SmallStat icon={<Zap className="text-yellow-400" />} label="Challenges Won" value={String(outstand.length)} />
            <SmallStat icon={<Trophy className="text-purple-400" />} label="Habits Built" value={String(habits.length)} />
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
            }
   // --- POLISHED COMPONENTS ---

function BigStat({ icon, label, value, color, bg, border, glowColor }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      style={{ boxShadow: `0 0 0 ${glowColor}00` }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "p-6 rounded-3xl border backdrop-blur-xl relative overflow-hidden group transition-all duration-300", 
        bg, border
      )}
    >
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
      )} style={{ background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)` }} />
      
      <div className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-widest relative z-10", color)}>
        <span className="p-1.5 rounded-lg bg-black/30 backdrop-blur-sm group-hover:scale-110 transition-transform">{icon}</span>
        {label}
      </div>
      <div className="mt-4 font-display text-4xl font-black text-white relative z-10 drop-shadow-md">{value}</div>
    </motion.div>
  );
}

function MiniCard({ icon, label, value, sub }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.05)" }}
      className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl transition-all duration-300 cursor-default"
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {icon && <span className="text-slate-300">{icon}</span>}
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{sub}</div>
    </motion.div>
  );
}

function SmallStat({ icon, label, value }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.6)" }}
      className="rounded-2xl border border-white/5 bg-black/20 p-4 transition-all duration-300 cursor-default"
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-white drop-shadow-sm">{value}</div>
    </motion.div>
  );
}

// CRASH FIX 3: Fully completed the SVG code block that was cut off
function TrendChart({ logs }: { logs: { log_date: string; score: number }[] }) {
  if (!logs || logs.length === 0) return <div className="text-sm text-slate-500 italic flex h-full items-center justify-center bg-black/20 rounded-xl border border-white/5">No data yet. Complete daily logs to see trends.</div>;
  
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
      
      {/* Grid Lines */}
      {[0, 40, 70, 100].map((v) => (
        <line
          key={v}
          x1={0}
          x2={w}
          y1={h - (v / 100) * h}
          y2={h - (v / 100) * h}
          stroke="rgba(255,255,255,0.05)"
          strokeDasharray="4 6"
        />
      ))}
      
      <motion.path 
        initial={{ opacity: 0, d: `M0,${h} L${w},${h} Z` }}
        animate={{ opacity: 1, d: area }}
        transition={{ duration: 1, ease: "easeOut" }}
        fill="url(#trendFill)" 
      />
      
      {/* Glow Line */}
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        d={path} 
        fill="none" 
        stroke="rgba(99,102,241,1)" 
        strokeWidth={4} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.6))' }} 
      />
      
      {/* Data Points */}
      {points.map((p, i) => {
        // Safe color extraction
        const c = scoreColor(logs[i]?.score || 0);
        const hex = (c as any)?.hex || c || "#818cf8";
        
        return (
          <motion.circle
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1 + (i * 0.1), type: "spring" }}
            cx={p[0]}
            cy={p[1]}
            r={6}
            fill={hex}
            stroke="#0f172a"
            strokeWidth={3}
            className="hover:r-[8px] transition-all cursor-pointer"
            style={{ filter: `drop-shadow(0 0 8px ${hex})` }}
          />
        );
      })}
    </svg>
  );
      }
