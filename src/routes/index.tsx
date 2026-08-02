import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Flame, Gamepad2, BrainCircuit, Shield, Sparkles, Trophy, Zap, Code2, Target } from "lucide-react";
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      // Primary SEO
      { title: "Outstand | Conquer Class 10 & Gamify Your Life" },
      { name: "description", content: "The ultimate gamified study and self-improvement ecosystem for Class 10 CBSE students. Break phone addiction and rank up in real life." },
      { name: "keywords", content: "CBSE Class 10, study app, phone addiction, gamified learning, habit tracker, high school productivity, outstand, focus timer" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "Outstand" },
      // Open Graph (For Discord, WhatsApp, LinkedIn shares)
      { property: "og:title", content: "Outstand | Gamify Your Life" },
      { property: "og:description", content: "Quit phone addiction and master Class 10 CBSE Boards with Outstand's gamified ecosystem." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Outstand" },
      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Outstand | Conquer Class 10" },
      { name: "twitter:description", content: "Break your phone addiction and master Class 10 Boards." },
    ],
  }),
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) throw redirect({ to: "/study" });
  },
  component: LandingPage,
});

// --- PERFORMANCE OPTIMIZED MICRO-INTERACTION COMPONENTS ---

function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0f1a]/80 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl transform-gpu will-change-transform ${className}`}
      onMouseMove={handleMouseMove}
      whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.2)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100 will-change-[background]"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(34, 211, 238, 0.25),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </motion.div>
  );
}

function MagneticButton({ children, onClick, className }: any) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * 0.2);
    y.set(middleY * 0.2);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className="inline-block transform-gpu will-change-transform"
    >
      <Button asChild size="lg" className={className} onClick={onClick}>
        {children}
      </Button>
    </motion.div>
  );
}


// --- MAIN PAGE COMPONENT ---
function LandingPage() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const heroY = useTransform(scrollYProgress, [0, 0.2], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const scaleBackground = useTransform(scrollYProgress, [0, 1], [1, 1.5]);
  const progressHeight = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const wordAnimation = {
    hidden: { opacity: 0, y: 50, rotateX: -40 },
    visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  const heroTitle = "Conquer Class 10. Gamify Your Life.";
  const words = heroTitle.split(" ");

  return (
    <div ref={containerRef} className="min-h-screen bg-[#02040a] text-slate-100 font-sans overflow-x-hidden relative selection:bg-cyan-500/30">
      
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-300 via-blue-500 to-purple-500 z-[100] origin-left transform-gpu will-change-transform drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
        style={{ scaleX: progressHeight }} 
      />

      {/* --- ENHANCED NEON BACKGROUND GLOWS --- */}
      <motion.div style={{ scale: scaleBackground }} className="fixed inset-0 z-0 pointer-events-none overflow-hidden transform-gpu will-change-transform">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          // Added mix-blend-screen and saturated the color for a true "glow" effect
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/40 blur-[180px] mix-blend-screen transform-gpu will-change-transform" 
        />
        <motion.div 
          animate={{ x: [0, -60, 0], y: [0, 40, 0], scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2 }}
          // Saturated purple to indigo
          className="absolute top-[30%] right-[-20%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/30 blur-[150px] mix-blend-screen transform-gpu will-change-transform" 
        />
      </motion.div>

      {/* --- GLASS NAV --- */}
      <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl transform-gpu">
        <header className="w-full flex items-center justify-between rounded-2xl border border-white/20 bg-[#0a0f1a]/60 px-4 py-3 sm:px-6 shadow-[0_8px_32px_rgba(34,211,238,0.15)] backdrop-blur-2xl">
          <Link to="/" aria-label="Outstand Home" className="group flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 shadow-[0_0_20px_rgba(34,211,238,0.5)] group-hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] transition-all duration-300 group-hover:rotate-12">
              <Gamepad2 className="w-6 h-6 text-[#02040a]" />
            </div>
            <div className="font-black text-xl tracking-tight text-white drop-shadow-md">OUTSTAND</div>
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild className="rounded-xl px-6 h-10 bg-white/10 text-white hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white/20 font-bold transition-all duration-300 backdrop-blur-md">
              <Link to="/auth">Initialize</Link> 
            </Button>
          </div>
        </header>
      </motion.div>

      <main className="relative z-10">
        
        {/* --- HERO SECTION --- */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="mx-auto max-w-6xl px-4 pt-48 pb-32 text-center flex flex-col items-center justify-center min-h-[95vh] perspective-[1000px] transform-gpu will-change-transform">
          
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: "easeOut" }} className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-xs sm:text-sm font-bold tracking-wide text-cyan-300 backdrop-blur-md shadow-[0_0_40px_rgba(34,211,238,0.3)] transform-gpu">
            <Flame className="h-4 w-4 text-orange-400 animate-pulse drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]" /> Welcome to Protocol V1.0
          </motion.div>

          <motion.h1 variants={staggerContainer} initial="hidden" animate="visible" className="text-6xl sm:text-7xl md:text-8xl lg:text-[6rem] font-black tracking-tighter text-white leading-[1.05] max-w-5xl flex flex-wrap justify-center gap-x-4">
            {words.map((word, i) => (
              <motion.span key={i} variants={wordAnimation} className={`transform-gpu backface-hidden ${word === "Life." || word === "10." ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]" : ""}`}>
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }} className="mx-auto mt-8 max-w-2xl text-base sm:text-lg md:text-xl text-slate-300 font-medium leading-relaxed transform-gpu">
            Outstand is the ultimate self-improvement universe. Break your phone addiction, execute daily CBSE missions, and earn XP to rank up in real life.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.8 }} className="mt-12 transform-gpu">
            {/* Brighter gradient and massive shadow for the main CTA */}
            <MagneticButton className="h-16 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-10 text-lg font-black text-[#02040a] hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_60px_rgba(34,211,238,0.6)] transition-all border border-cyan-200/50">
              <Link to="/auth" className="flex items-center">
                Enter The Arena <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </MagneticButton>
          </motion.div>

          {/* ABSTRACT FLOATING UI DASHBOARD */}
          <motion.div 
            initial={{ opacity: 0, y: 150, rotateX: 40 }} 
            animate={{ opacity: 1, y: 0, rotateX: 0 }} 
            transition={{ delay: 1.4, duration: 1.5, type: "spring", stiffness: 50, damping: 20 }}
            className="mt-28 relative w-full max-w-4xl mx-auto h-[400px] perspective-[2000px] pointer-events-none transform-gpu will-change-transform"
          >
            <motion.div 
              animate={{ y: [-10, 10, -10], rotateZ: [-1, 1, -1] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 top-0 -translate-x-1/2 w-full max-w-2xl bg-[#0a0f1a]/90 backdrop-blur-2xl border border-blue-400/30 rounded-[2rem] p-6 shadow-[0_0_100px_rgba(59,130,246,0.25)] z-20 transform-gpu will-change-transform backface-hidden"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                  <div className="text-left"><div className="font-bold text-white text-lg">Daily Directives</div><div className="text-xs text-slate-400">Science & Math Missions</div></div>
                </div>
                <div className="bg-blue-500/20 border border-blue-400/50 px-4 py-2 rounded-xl text-blue-300 font-black text-lg flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" /> +450 XP
                </div>
              </div>
              
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white/[0.03] border border-white/10 rounded-xl flex items-center px-4 gap-4 relative overflow-hidden transform-gpu">
                     <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "linear" }} className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent skew-x-12 transform-gpu will-change-transform" />
                     <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center"><Target className="w-5 h-5 text-blue-300"/></div>
                     <div className="flex-1"><div className={`h-3 bg-cyan-500/50 rounded-full w-${i === 1 ? '3/4' : i === 2 ? '1/2' : '2/3'} mb-2 shadow-[0_0_10px_rgba(34,211,238,0.4)]`} /><div className="h-2 bg-white/20 rounded-full w-1/3" /></div>
                     <div className="w-20 h-8 rounded-lg bg-white/10 border border-white/20" />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [10, -15, 10], rotateY: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 1 }}
              className="absolute left-[5%] top-20 w-64 bg-gradient-to-br from-[#0a0f1a] to-[#050810] border border-purple-400/40 rounded-2xl p-5 shadow-[0_0_60px_rgba(168,85,247,0.2)] z-10 backdrop-blur-xl transform-gpu will-change-transform backface-hidden"
            >
              <div className="flex items-center gap-3 mb-4"><Shield className="w-6 h-6 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" /><span className="font-bold text-white">Detox Protocol</span></div>
              <div className="w-32 h-32 mx-auto rounded-full border-[8px] border-purple-500/30 flex items-center justify-center relative transform-gpu shadow-[inset_0_0_20px_rgba(168,85,247,0.3)]">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-[-8px] rounded-full border-t-[8px] border-purple-400 transform-gpu will-change-transform drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                <span className="text-2xl font-black text-white drop-shadow-md">4h</span>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [-15, 15, -15], rotateY: [0, -10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 2 }}
              className="absolute right-[5%] top-10 w-72 bg-gradient-to-br from-[#0a0f1a] to-[#050810] border border-orange-400/40 rounded-2xl p-5 shadow-[0_0_60px_rgba(249,115,22,0.15)] z-30 backdrop-blur-xl transform-gpu will-change-transform backface-hidden"
            >
              <div className="flex items-center gap-3 mb-4"><Flame className="w-6 h-6 text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" /><span className="font-bold text-white">Global Arena</span></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-orange-500/20 border border-orange-400/40 p-2 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.2)]"><span className="text-orange-300 font-bold">#1 Arsh</span><span className="text-white font-mono drop-shadow-md">12,400 XP</span></div>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-lg"><span className="text-slate-300 font-bold">#2 Player77</span><span className="text-slate-400 font-mono">11,200 XP</span></div>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-lg"><span className="text-slate-300 font-bold">#3 Delta</span><span className="text-slate-400 font-mono">9,850 XP</span></div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* --- GAMIFIED BENTO GRID --- */}
        <div className="max-w-6xl mx-auto px-4 py-32 relative z-20">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="text-center mb-20 transform-gpu">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">Not just another study app.</h2>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto font-medium">A complete ecosystem to hijack your dopamine system and redirect it toward academic mastery and real-world growth.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Study Hub */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="md:col-span-2 transform-gpu">
              <SpotlightCard className="p-10 h-full flex flex-col justify-between group/card">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] transition-all duration-500 group-hover/card:bg-cyan-400/30 mix-blend-screen" />
                <div className="relative z-10 w-full md:w-2/3">
                  <div className="w-16 h-16 bg-cyan-500/20 border border-cyan-400/50 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,211,238,0.4)] transform-gpu">
                    <Code2 className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-white mb-4">Class 10 Study Hub</h3>
                  <p className="text-slate-300 text-lg leading-relaxed">Access the High-Yield Bank. Complete edge-to-edge interactive quizzes for CBSE Math and Science. Gain XP for every right answer and track your chapter mastery dynamically.</p>
                </div>
                <div className="absolute -bottom-12 -right-12 w-80 h-64 bg-[#050810] border border-cyan-400/30 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.2)] rotate-[-5deg] group-hover/card:rotate-[-2deg] group-hover/card:translate-y-[-10px] transition-all duration-500 p-4 transform-gpu will-change-transform">
                  <div className="w-full h-8 bg-cyan-500/20 rounded-lg mb-3 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]" />
                  <div className="w-3/4 h-4 bg-white/10 rounded mt-4" />
                  <div className="w-1/2 h-4 bg-white/10 rounded mt-2" />
                </div>
              </SpotlightCard>
            </motion.div>

          {/* Bento Card 2: Detox */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="transform-gpu">
              <SpotlightCard className="p-10 h-full">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] transition-all duration-500 group-hover:bg-purple-400/30 mix-blend-screen" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-purple-500/20 border border-purple-400/50 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(168,85,247,0.4)] transform-gpu">
                    <Shield className="w-8 h-8 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Phone Detox</h3>
                  <p className="text-slate-300 text-base leading-relaxed">Break the scrolling loop. Track your clean streaks, initialize deep focus protocols, and watch your dopamine baseline rebuild.</p>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Bento Card 3: Outstand Challenges */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="md:col-span-3 transform-gpu">
              <SpotlightCard className="p-10 md:p-14 flex flex-col md:flex-row items-center gap-10">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none mix-blend-screen" />
                
                <div className="relative z-10 md:w-1/2">
                  <div className="flex-shrink-0 w-20 h-20 bg-orange-500/20 border border-orange-400/50 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(249,115,22,0.4)] transform-gpu">
                    <Zap className="w-10 h-10 text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                  </div>
                  <h3 className="text-3xl md:text-5xl font-black text-white mb-4">Outstand Challenges</h3>
                  <p className="text-slate-300 text-lg md:text-xl mb-8 leading-relaxed">Participate in daily real-world missions. Trade screen time for physical activity, climb the global ranks, and dominate the Bronze, Silver, and Gold leagues.</p>
                  <Button className="bg-orange-500 hover:bg-orange-400 text-black font-black px-8 py-6 rounded-2xl text-lg shadow-[0_0_40px_rgba(249,115,22,0.6)] transition-all transform hover:scale-105 border border-orange-300/50">
                    View Leaderboard
                  </Button>
                </div>

                 <div className="relative w-full md:w-1/2 h-64 mt-10 md:mt-0 perspective-[1000px] transform-gpu">
                    <motion.div 
                      animate={{ rotateY: [-5, 5, -5], rotateX: [5, -5, 5] }} 
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-[#050810] border border-orange-400/40 rounded-[2rem] p-6 shadow-[0_0_80px_rgba(249,115,22,0.2)] flex flex-col justify-center items-center transform-gpu will-change-transform backface-hidden"
                    >
                      <Trophy className="w-16 h-16 text-yellow-400 mb-4 opacity-80 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
                      <div className="w-1/2 h-6 bg-orange-500/40 rounded-full mb-4 shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
                      <div className="w-3/4 h-3 bg-white/10 rounded-full mb-2" />
                      <div className="w-2/3 h-3 bg-white/10 rounded-full" />
                    </motion.div>
                 </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>

        {/* --- BOTTOM CTA --- */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-200px" }} transition={{ type: "spring", stiffness: 50 }} className="max-w-5xl mx-auto px-4 py-40 text-center relative z-20 transform-gpu">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[500px] bg-gradient-to-r from-blue-500/30 via-cyan-400/20 to-purple-500/30 rounded-full blur-[150px] mix-blend-screen pointer-events-none transform-gpu will-change-transform" />
          
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="inline-block mb-8 transform-gpu will-change-transform">
            <Sparkles className="w-16 h-16 text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
          </motion.div>
          
          <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-10 leading-tight drop-shadow-xl">
            Ready to <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">Rank Up?</span>
          </h2>
          
          <MagneticButton className="h-20 rounded-3xl bg-white text-[#02040a] hover:bg-slate-100 font-black px-16 text-2xl shadow-[0_0_80px_rgba(255,255,255,0.5)] transition-all border border-white/50">
            <Link to="/auth">Create Player Profile</Link>
          </MagneticButton>
        </motion.div>

      </main>

      <footer className="border-t border-white/20 bg-[#02040a] py-12 text-center text-sm text-slate-400 font-bold tracking-widest relative z-30 uppercase flex flex-col items-center gap-4">
        <Gamepad2 className="w-6 h-6 text-slate-500" />
        <p>&copy; {new Date().getFullYear()} OUTSTAND. MASTER YOUR BOARDS. MASTER YOUR LIFE.</p>
      </footer>
    </div>
  );
}   
