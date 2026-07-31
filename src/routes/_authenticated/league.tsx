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
  { name: "Bronze", icon: <Shield className="h-6 w-6 lg:h-8 lg:w-8 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" />, minXp: 0, color: "from-orange-900/40 to-[#0a0505]", border: "border-orange-800/40", glow: "shadow-[0_0_30px_rgba(153,27,27,0.15)]" },
  { name: "Silver", icon: <Medal className="h-6 w-6 lg:h-8 lg:w-8 text-zinc-300 drop-shadow-[0_0_10px_rgba(212,212,216,0.8)]" />, minXp: 5000, color: "from-zinc-800/40 to-[#0a0a0c]", border: "border-zinc-500/40", glow: "shadow-[0_0_30px_rgba(113,113,122,0.15)]" },
  { name: "Gold", icon: <Trophy className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />, minXp: 15000, color: "from-yellow-900/40 to-[#0a0a05]", border: "border-yellow-600/40", glow: "shadow-[0_0_30px_rgba(202,138,4,0.15)]" },
  { name: "Diamond", icon: <Crown className="h-6 w-6 lg:h-8 lg:w-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />, minXp: 50000, color: "from-cyan-900/40 to-[#050a0f]", border: "border-cyan-500/40", glow: "shadow-[0_0_30px_rgba(8,145,178,0.15)]" },
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
    // Replaced max-w-4xl with a full width structure scaling up to max-w-7xl on desktop
    <div className="min-h-[calc(100vh-4rem)] w-full py-8 px-4 sm:px-6 lg:py-12 lg:px-8 font-sans flex flex-col items-center">
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-7xl space-y-8 lg:space-y-12 relative z-10 pb-20"
      >
        
        {/* Header Info - Scaled up for large screens */}
        <motion.div variants={itemVariants} className="text-center space-y-3 lg:space-y-4">
          <div className="flex items-center justify-center gap-3 lg:gap-4">
            <Swords className="h-10 w-10 lg:h-14 lg:w-14 text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
            <h1 className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-blue-500 tracking-tight">
              Arena
            </h1>
          </div>
          <p className="text-zinc-400 text-sm lg:text-lg font-medium tracking-wide">
            Compete, climb the ranks, and forge discipline.
          </p>
        </motion.div>

        {/* LEAGUE STATUS CARD - Spans full width dynamically */}
        <motion.div 
          variants={itemVariants}
          className={cn(
            "rounded-[2rem] p-6 lg:p-10 border backdrop-blur-2xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden", 
            currentLeague.border,
            currentLeague.glow
          )}
        >
          {/* Background Gradient */}
          <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none opacity-80", currentLeague.color)} />

          <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center text-center sm:text-left gap-6 lg:gap-8 relative z-10 w-full lg:w-auto">
            <div className={cn(
              "flex h-20 w-20 lg:h-24 lg:w-24 shrink-0 place-items-center justify-center rounded-3xl border bg-black/40 backdrop-blur-sm shadow-2xl", 
              currentLeague.border
            )}>
              {currentLeague.icon}
            </div>
            <div>
              <div className="text-xs lg:text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1 lg:mb-2">Current Division</div>
              <div className="text-3xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">{currentLeague.name} League</div>
              <div className="text-blue-400 text-sm lg:text-base font-bold mt-2 flex items-center justify-center sm:justify-start gap-2">
                Level {level} <span className="text-zinc-600">•</span> {safeXp.toLocaleString()} Total XP
              </div>
            </div>
          </div>

          {/* Progress to Next League - Wider on desktop */}
          {nextLeague && (
            <div className="w-full sm:w-80 lg:w-[450px] relative z-10 bg-black/40 backdrop-blur-md border border-white/10 p-5 lg:p-6 rounded-3xl shadow-xl">
              <div className="flex justify-between text-xs lg:text-sm font-bold mb-4">
                <span className="text-zinc-400 uppercase tracking-wider">Next: {nextLeague.name}</span>
                <span className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                  {Math.max(0, nextLeague.minXp - safeXp).toLocaleString()} XP left
                </span>
              </div>
              <div className="h-3 lg:h-4 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, (safeXp - currentLeague.minXp) / (nextLeague.minXp - currentLeague.minXp) * 100))}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn("absolute top-0 left-0 bottom-0 bg-gradient-to-r shadow-[0_0_15px_currentColor]", 
                    currentLeague.name === "Bronze" ? "from-orange-600 to-amber-500 text-orange-500" :
                    currentLeague.name === "Silver" ? "from-zinc-500 to-zinc-300 text-zinc-400" :
                    currentLeague.name === "Gold" ? "from-yellow-600 to-yellow-400 text-yellow-500" :
                    "from-cyan-600 to-cyan-400 text-cyan-400"
                  )}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* 2-Column Desktop Grid for Leaderboard & Tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* LEADERBOARD SECTION - Takes up 2/3 of space on large screens */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-2 bg-[#050810]/80 backdrop-blur-2xl border border-blue-900/30 rounded-[2rem] p-6 lg:p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] min-h-[400px] lg:min-h-[500px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3 drop-shadow-sm">
                <TrendingUp className="text-blue-500 h-6 w-6 lg:h-7 lg:w-7 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]" /> 
                Top Performers
              </h2>
              <div className="text-xs lg:text-sm font-bold uppercase tracking-[0.2em] text-blue-400 bg-blue-950/40 px-4 py-1.5 rounded-full border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                Global
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-zinc-500 gap-4">
                <Loader2 className="animate-spin text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" size={36} />
                <span className="text-xs lg:text-sm font-bold uppercase tracking-widest animate-pulse">Querying Arena Rankings...</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-zinc-500 gap-4 opacity-60">
                <Trophy className="h-16 w-16 text-zinc-700" />
                <div className="text-sm lg:text-base max-w-sm">
                  No rankings recorded yet. Complete habits to claim rank #1!
                </div>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                {leaderboard.map((entry, idx) => {
                  const isMe = user?.id ? entry.id === user.id : entry.name === safeName;

                  return (
                    <motion.div 
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "flex items-center justify-between p-4 lg:p-5 rounded-2xl border transition-all duration-300 group",
                        isMe 
                          ? "bg-blue-900/20 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.15)]" 
                          : "bg-[#0a0f1a] border-white/5 hover:border-white/10 hover:bg-[#0c121e]"
                      )}
                    >
                      <div className="flex items-center gap-4 lg:gap-6">
                        <div className={cn(
                          "font-mono font-black text-lg lg:text-xl w-6 lg:w-8 text-center drop-shadow-md",
                          idx === 0 ? "text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] text-2xl" : 
                          idx === 1 ? "text-zinc-300 drop-shadow-[0_0_10px_rgba(212,212,216,0.5)]" : 
                          idx === 2 ? "text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" : "text-zinc-600"
                        )}>
                          {entry.rank}
                        </div>
                        <div className={cn(
                          "h-10 w-10 lg:h-12 lg:w-12 rounded-full flex items-center justify-center font-bold text-sm lg:text-base overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-110",
                          isMe ? "border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-zinc-900 border border-white/10"
                        )}>
                          {entry.avatar ? (
                            <img src={entry.avatar} alt={entry.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-zinc-400">{entry.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="font-bold text-white lg:text-lg truncate max-w-[140px] sm:max-w-[200px] lg:max-w-xs group-hover:text-blue-100 transition-colors">
                          {entry.name}
                          {isMe && <span className="ml-3 text-[10px] lg:text-xs uppercase tracking-widest font-black text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]">You</span>}
                        </div>
                      </div>
                      <div className={cn(
                        "font-mono font-bold shrink-0 text-base lg:text-xl tracking-tight flex items-baseline gap-1",
                        isMe ? "text-blue-300 drop-shadow-[0_0_5px_rgba(147,197,253,0.8)]" : "text-zinc-300"
                      )}>
                        {entry.xp.toLocaleString()} <span className="text-zinc-500 text-xs lg:text-sm font-sans tracking-wide">XP</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* TIERS EXPLANATION - Shifted to the right column on desktop */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-1 bg-[#030508]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-2xl h-fit lg:sticky lg:top-24"
          >
            <h3 className="text-xs lg:text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6 lg:mb-8 text-center flex items-center justify-center gap-3">
              <span className="w-8 h-px bg-gradient-to-r from-transparent to-zinc-700" />
              Division Tiers
              <span className="w-8 h-px bg-gradient-to-l from-transparent to-zinc-700" />
            </h3>
            
            <div className="space-y-4 lg:space-y-6">
              {[...LEAGUES].reverse().map((league) => (
                <div 
                  key={league.name} 
                  className={cn(
                    "flex items-center gap-4 lg:gap-5 p-3 lg:p-4 rounded-2xl transition-all duration-300",
                    currentLeague.name === league.name 
                      ? "bg-white/[0.03] border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" 
                      : "border border-transparent opacity-70 hover:opacity-100 hover:bg-white/[0.01]"
                  )}
                >
                  <div className={cn(
                    "grid h-12 w-12 lg:h-14 lg:w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br shadow-lg border border-white/10 transition-transform duration-300 hover:scale-110", 
                    league.color
                  )}>
                    {league.icon}
                  </div>
                  <div>
                    <div className={cn(
                      "font-bold text-base lg:text-lg tracking-wide",
                      currentLeague.name === league.name ? "text-white drop-shadow-sm" : "text-zinc-300"
                    )}>
                      {league.name}
                    </div>
                    <div className="text-xs lg:text-sm text-zinc-500 font-mono font-medium mt-0.5">
                      {league.minXp.toLocaleString()} XP +
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
          }
                
