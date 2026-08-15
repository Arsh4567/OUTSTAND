import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Target, TrendingUp, Sparkles, Brain, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  // Comprehensive SEO Architecture
  head: () => ({
    meta: [
      { title: "Outstand | Rebuild Your Dopamine Baseline & Master Focus" },
      { name: "description", content: "The premium AI-powered habit and focus accelerator. Outstand helps you manage distractions, track streaks, and master daily performance." },
      { property: "og:title", content: "Outstand | Build Momentum" },
      { property: "og:description", content: "The ultimate platform for reclaiming attention and building unbreakable momentum." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/outstand-logo.png" }, // FIXED TO LOWERCASE
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/outstand-logo.png" }, // FIXED TO LOWERCASE
    ],
  }),
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LandingPage,
});

function LandingPage() {
  // Animation configuration presets
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-blue-500/30 font-sans overflow-x-hidden relative">
      
      {/* Dynamic Background Aura Systems */}
      <div className="absolute top-[-10%] left-[-10%] w-[50dvw] h-[50dvh] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[60dvw] h-[60dvh] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40dvw] h-[40dvh] rounded-full bg-cyan-600/5 blur-[100px] pointer-events-none" />

      {/* Glassmorphism Navigation Sticky Bar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4 md:px-8">
          <Link to="/" className="flex items-center gap-3 active:scale-98 transition-transform group">
            {/* FIXED LOGO PATH */}
            <img 
              src="/outstand-logo.png" 
              alt="Outstand Logo" 
              className="h-9 w-9 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all duration-300"
            />
            <span className="font-display text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Outstand
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/auth" className="hidden md:inline-block text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Features
            </Link>
            <Button asChild variant="secondary" className="rounded-full px-6 border border-white/10 bg-white/5 hover:bg-white/10 text-white shadow-inner transition-all">
              <Link to="/auth">Sign In</Link> 
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Accent Grid Display */}
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-40 text-center relative z-10">
        
        {/* Main Header Matrix */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col items-center"
        >
          {/* Tagline Badge */}
          <motion.div 
            variants={fadeInUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-400 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Introducing Outstand 1.0
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            className="text-5xl font-black tracking-tight sm:text-7xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400 leading-[1.05]"
          >
            Build your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]">momentum.</span>
            <br />Master focus.
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            className="mx-auto mt-8 max-w-2xl text-base text-slate-400 sm:text-lg md:text-xl leading-relaxed"
          >
            Outstand is the premier system engineered to restore your dopamine baseline. Track high-leverage habits, launch tactical deep work blocks, and stack metrics effortlessly.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row w-full sm:w-auto"
          >
            <Button asChild size="lg" className="h-14 w-full sm:w-auto rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-base font-bold text-white hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_30px_rgba(59,130,246,0.45)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0">
              <Link to="/auth">
                Deploy Assistant <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Cinematic Preview Wrapper */}
        <motion.div 
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 1, ease: "easeOut" as const }}
          className="mt-28 relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-2 md:p-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-sm group"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-500/10 via-transparent to-indigo-500/10 opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
          <div className="overflow-hidden rounded-2xl bg-[#090d16] border border-white/5 aspect-[16/9] flex items-center justify-center relative">
            
            {/* FIXED LOGO PATH */}
            <motion.img 
              src="/outstand-logo.png" 
              alt="Outstand Premium Core" 
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="h-28 w-28 md:h-40 md:w-40 rounded-[2.5rem] shadow-[0_0_60px_rgba(59,130,246,0.5)] border border-blue-400/20"
            />
            
            <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[10px] tracking-widest font-mono text-slate-600 uppercase">
              <span>SYSTEM STATE: OPTIMAL</span>
              <span>DOPAMINE TRACKING KERNEL PRODUCING VALUE</span>
            </div>
          </div>
        </motion.div>

        {/* Feature Matrix Showcase */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="mt-40 grid gap-6 md:grid-cols-3 text-left"
        >
          <FeatureCard 
            icon={<Target className="h-6 w-6 text-emerald-400" />}
            title="Focus Architect"
            desc="Construct customized countdown vectors and deep isolation frameworks to log intensive tracking periods."
          />
          <FeatureCard 
            icon={<TrendingUp className="h-6 w-6 text-blue-400" />}
            title="Baseline Vectors"
            desc="Map out active friction indices alongside immediate accelerators for definitive performance scoring."
          />
          <FeatureCard 
            icon={<Brain className="h-6 w-6 text-purple-400" />}
            title="Cognitive Audit"
            desc="Engage directly with the onboard Intelligence matrix to dynamically spin up new operational routines."
          />
        </motion.div>

        {/* Bottom CTA Terminal Block */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-40 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/60 to-slate-950/90 p-8 md:p-16 text-center shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl font-black md:text-5xl tracking-tight text-white mb-4">
            Ready to upgrade your workflow?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8 text-sm md:text-base">
            Join the collective of high-performance operators reclaiming their focus capacity daily. Free access active immediately.
          </p>
          <Button asChild size="lg" className="rounded-full bg-white text-slate-950 hover:bg-slate-200 font-bold px-8 shadow-lg transition-all transform hover:-translate-y-0.5">
            <Link to="/auth">Initialize Free Account</Link>
          </Button>
        </motion.div>
      </main>

      {/* Structural Minimalist Footer */}
      <footer className="border-t border-white/5 bg-[#030712] py-8 text-center text-xs text-slate-600 font-mono tracking-wider relative z-10">
        &copy; {new Date().getFullYear()} OUTSTAND LABS INC. ALL VECTOR SYSTEMS RESERVED.
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-8 shadow-2xl backdrop-blur-md relative group transition-all hover:border-blue-500/20"
    >
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/80 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
}
