function MomentumPage() {
  const { log, loading, togglePositive, toggleNegative } = useDailyLog();
  
  const score = log?.score ?? 50;
  const color = scoreColor(score);
  const positives = log?.positives ?? [];
  const negatives = log?.negatives ?? [];
  
  const insights = useMemo(
    () => generateInsights(positives, negatives, score),
    [positives, negatives, score],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050508]">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <span className="font-bold tracking-widest uppercase text-xs text-indigo-400">Calibrating Matrix...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20 overflow-hidden bg-[#050508] font-sans selection:bg-indigo-500/30">
      {/* BACKGROUND PHYSICS */}
      <motion.div 
        className="fixed inset-0 -z-20 opacity-30 pointer-events-none blur-[150px]"
        animate={{ 
          background: `radial-gradient(circle at 50% 0%, ${color.hex}40, transparent 60%)` 
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
      />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-[-10]" />

      {/* PEAK STATE BADGE */}
      <AnimatePresence>
        {score >= 85 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-3xl border border-emerald-500/50 px-6 py-2 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center gap-3"
          >
            <Sparkles className="text-emerald-400 h-4 w-4 animate-pulse" />
            <span className="text-emerald-50 font-bold tracking-[0.2em] uppercase text-[10px]">
              Peak Flow State Active
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto p-4 pt-12 relative z-10">
        
        {/* HEADER */}
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-300 shadow-inner mb-4">
              <Activity className="h-3.5 w-3.5 text-indigo-400" />
              Neural Uplink
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white md:text-6xl font-display">
              Momentum <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Matrix.</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ShareBaselineDialog score={score} color={color.hex} />
            <Button asChild variant="outline" className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 h-12 px-6">
              <Link to="/profile">
                Timeline <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.header>

        {/* BENTO BOX GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* TOP LEFT: THE CORE REACTOR (Score) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-4 rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group min-h-[400px]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <ScoreRing score={score} color={color.hex} />
            <motion.div
              animate={{ borderColor: `${color.hex}40`, color: color.hex, backgroundColor: `${color.hex}10` }}
              className="mt-8 flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-black uppercase tracking-[0.2em] backdrop-blur-md z-10"
            >
              <motion.span animate={{ backgroundColor: color.hex, boxShadow: `0 0 15px ${color.hex}` }} className="h-2 w-2 rounded-full" />
              {color.label}
            </motion.div>
          </motion.div>

          {/* TOP RIGHT: DATA & AI HUB */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-black text-white font-display tracking-tight">Trajectory & Tactics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* AI Insight Feed */}
              <div className="flex flex-col justify-center space-y-4 bg-black/20 p-6 rounded-3xl border border-white/5">
                {insights.length === 0 ? (
                  <p className="text-sm text-slate-500 font-medium italic text-center">Awaiting matrix input...</p>
                ) : (
                  insights.map((insight, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (idx * 0.1) }} className="flex gap-3 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                      <span className="text-sm text-slate-300 font-medium leading-relaxed">{insight}</span>
                    </motion.div>
                  ))
                )}
              </div>
              {/* Weekly Chart */}
              <div className="h-full min-h-[200px]">
                <WeeklySection />
              </div>
            </div>
          </motion.div>

          {/* BOTTOM LEFT: ACCELERATORS (Removed Tabs) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-6 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-950/10 backdrop-blur-2xl p-8 shadow-2xl">
            <h3 className="text-emerald-400 font-black tracking-widest uppercase text-sm mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Accelerators
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {POSITIVES.map((item, i) => (
                <ActionCard key={item.key} active={positives.includes(item.key as PositiveKey)} emoji={item.emoji} label={item.label} description={item.description} points={item.points} tone="good" onClick={() => togglePositive(item.key as PositiveKey)} />
              ))}
            </div>
          </motion.div>

          {/* BOTTOM RIGHT: FRICTION (Removed Tabs) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-6 rounded-[2.5rem] border border-rose-500/20 bg-rose-950/10 backdrop-blur-2xl p-8 shadow-2xl">
            <h3 className="text-rose-400 font-black tracking-widest uppercase text-sm mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Friction
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {NEGATIVES.map((item, i) => (
                <ActionCard key={item.key} active={negatives.includes(item.key as NegativeKey)} emoji={item.emoji} label={item.label} description={item.description} points={item.points} tone="bad" onClick={() => toggleNegative(item.key as NegativeKey)} />
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
