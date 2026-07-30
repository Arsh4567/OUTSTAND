import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Trophy, Shield, Crown, Medal, TrendingUp, Swords, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { levelFromXP } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/league")({
  component: LeaguePage,
});

interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  rank: number;
  avatar: string | null;
}

const LEAGUES = [
  { name: "Bronze", icon: <Shield size={24} className="text-orange-700" />, minXp: 0, color: "from-orange-800 to-orange-950", border: "border-orange-800/50" },
  { name: "Silver", icon: <Medal size={24} className="text-zinc-300" />, minXp: 5000, color: "from-zinc-400 to-zinc-600", border: "border-zinc-400/50" },
  { name: "Gold", icon: <Trophy size={24} className="text-yellow-400" />, minXp: 15000, color: "from-yellow-500 to-amber-700", border: "border-yellow-500/50" },
  { name: "Diamond", icon: <Crown size={24} className="text-cyan-400" />, minXp: 50000, color: "from-cyan-400 to-blue-600", border: "border-cyan-400/50" },
];

function LeaguePage() {
  const { xp } = useAppState();
  const { user, profile } = useAuth();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const safeXp = xp || 0;
  const { level } = levelFromXP(safeXp);
  const safeName = displayNameOf(user, profile) || "You";

  // Determine Current League
  const currentLeagueIndex = LEAGUES.findLastIndex(l => safeXp >= l.minXp) || 0;
  const currentLeague = LEAGUES[currentLeagueIndex];
  const nextLeague = LEAGUES[currentLeagueIndex + 1];

  // Fetch live global leaderboard from Supabase
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, xp")
          .order("xp", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Failed to load rankings:", error);
          return;
        }

        if (data) {
          let hasCurrentUser = false;

          const formatted: LeaderboardEntry[] = data.map((item, index) => {
            const isMe = user?.id && item.id === user.id;
            if (isMe) hasCurrentUser = true;

            return {
              id: item.id,
              name: isMe ? safeName : item.full_name || "Anonymous Challenger",
              xp: isMe ? Math.max(item.xp || 0, safeXp) : item.xp || 0,
              rank: index + 1,
              avatar: isMe ? (profile?.avatar_url || item.avatar_url) : item.avatar_url,
            };
          });

          // Inject user at bottom if they aren't in the top 50 yet
          if (!hasCurrentUser && user?.id) {
            formatted.push({
              id: user.id,
              name: safeName,
              xp: safeXp,
              rank: formatted.length + 1,
              avatar: profile?.avatar_url || null,
            });
          }

          // Re-sort to guarantee exact order after local state merges
          formatted.sort((a, b) => b.xp - a.xp);
          formatted.forEach((item, index) => {
            item.rank = index + 1;
          });

          setLeaderboard(formatted);
        }
      } catch (err) {
        console.error("Error connecting to Supabase Arena:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [user?.id, safeXp, safeName, profile?.avatar_url]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 relative z-10 pb-20">
      
      {/* Header Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-8">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-400 tracking-tight flex items-center justify-center gap-4">
          <Swords className="text-blue-500" size={36} /> Arena
        </h1>
        <p className="mt-2 text-zinc-400">Compete, climb the ranks, and forge discipline.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEAGUE STATUS CARD */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
          className={cn("col-span-1 md:col-span-3 rounded-[2rem] p-8 border backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden", currentLeague.border, "bg-black/40")}
        >
          {/* Background Gradient */}
          <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br pointer-events-none", currentLeague.color)} />

          <div className="flex items-center gap-6 relative z-10">
            <div className={cn("grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br shadow-2xl", currentLeague.color)}>
              {currentLeague.icon}
            </div>
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-zinc-400">Current Division</div>
              <div className="text-4xl font-black text-white tracking-tight">{currentLeague.name} League</div>
              <div className="text-blue-400 font-medium mt-1 flex items-center gap-2">
                Level {level} <span className="text-zinc-600">•</span> {safeXp.toLocaleString()} Total XP
              </div>
            </div>
          </div>

          {/* Progress to Next League */}
          {nextLeague && (
            <div className="w-full md:w-1/3 relative z-10 bg-white/5 border border-white/10 p-5 rounded-3xl">
              <div className="flex justify-between text-sm font-bold mb-3">
                <span className="text-zinc-400">Next: {nextLeague.name}</span>
                <span className="text-white">{Math.max(0, nextLeague.minXp - safeXp).toLocaleString()} XP left</span>
              </div>
              <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, (safeXp - currentLeague.minXp) / (nextLeague.minXp - currentLeague.minXp) * 100))}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn("h-full bg-gradient-to-r rounded-full", currentLeague.color)}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* LEADERBOARD SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="col-span-1 md:col-span-2 bg-[#0a0f1a]/80 backdrop-blur-xl border border-blue-500/20 rounded-[2rem] p-6 shadow-2xl min-h-[300px] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <TrendingUp className="text-blue-400" size={20} /> Top Performers
              </h2>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400/60 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                Global
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span className="text-xs font-bold uppercase tracking-widest">Querying Arena Rankings...</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No rankings recorded yet. Complete habits to claim rank #1!
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => {
                  const isMe = user?.id ? entry.id === user.id : entry.name === safeName;

                  return (
                    <div 
                      key={entry.id} 
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all",
                        isMe 
                          ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "font-mono font-black text-lg w-6 text-center",
                          idx === 0 ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : 
                          idx === 1 ? "text-zinc-300" : 
                          idx === 2 ? "text-orange-400" : "text-zinc-600"
                        )}>
                          {entry.rank}
                        </div>
                        <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                          {entry.avatar ? (
                            <img src={entry.avatar} alt={entry.name} className="h-full w-full object-cover" />
                          ) : (
                            entry.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="font-bold text-white truncate max-w-[140px] sm:max-w-xs">
                          {entry.name}
                          {isMe && <span className="ml-2 text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">You</span>}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-blue-300 shrink-0">
                        {entry.xp.toLocaleString()} <span className="text-blue-500/50 text-sm">XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* TIERS EXPLANATION */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.3 }}
          className="col-span-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-xl h-fit"
        >
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 text-center">Division Tiers</h3>
          <div className="space-y-6">
            {[...LEAGUES].reverse().map((league) => (
              <div key={league.name} className="flex items-center gap-4">
                <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br shadow-lg border border-white/10", league.color)}>
                  {league.icon}
                </div>
                <div>
                  <div className="font-bold text-white">{league.name}</div>
                  <div className="text-xs text-zinc-500 font-mono">{league.minXp.toLocaleString()} XP +</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
        }
                        
