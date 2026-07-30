import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Target, TrendingUp, Sparkles, Brain } from "lucide-react";
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
      { property: "og:image", content: "/outstand-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/outstand-logo.png" },
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-100 selection:bg-indigo-500/30 font-sans overflow-x-hidden relative">
      
      {/* Dynamic Background Aura Systems (Refined for a darker, richer feel) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50dvw] h-[50dvh] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[60dvw] h-[60dvh] rounded-full bg-blue-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40dvw] h-[40dvh] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      {/* FLOATING GLASSMORPHIC DOCK (Matches the AppShell aesthetic) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-6xl">
        <header className="w-full flex items-center justify-between rounded-full border border-white/10 bg-zinc-900/60 px-6 py-3 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
          <Link to="/" className="group flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]">
              <img src="/outstand-logo.png" alt="Outstand Logo" className="h-full w-full object-cover" />
            </div>
            <div className="font-display text-lg font-bold tracking-tight text-white">Outstand</div>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/auth" className="hidden md:inline-block text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Features
            </Link>
            <Button asChild className="rounded-full px-6 h-10 bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Link to="/auth">Sign In</Link> 
            </Button>
          </div>
        </header>
      </div>

      {/* Hero Accent Grid Display */}
      <main className="mx-auto max-w-6xl px-4 pt-32 pb-40 text-center relative z-10">
        
        {/* Main Header Matrix */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col items-center mt-12"
        >
          {/* Tagline Badge */}
          <motion.div 
            variants={fadeInUp}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold tracking-wide text-zinc-300 backdrop-blur-md shadow-2xl"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            Introducing Outstand 1.0
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            className="text-5xl font-black tracking-tight sm:text-7xl md:text-8xl text-white leading-[1.05]"
          >
            Build your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.2)]">momentum.</span>
            <br />Master focus.
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            className="mx-auto mt-8 max-w-2xl text-base text-zinc-400 sm:text-lg md:text-xl font-medium leading-relaxed"
          >
            Outstand is the premier system engineered to restore your dopamine baseline. Track high-leverage habits, launch tactical deep work blocks, and stack metrics effortlessly.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row w-full sm:w-auto"
          >
            {/* High Contrast Premium CTA */}
            <Button asChild size="lg" className="h-14 w-full sm:w-auto rounded-full bg-white px-8 text-base font-bold text-black hover:bg-zinc-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0">
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
          transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
          className="mt-28 relative rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-2 md:p-4 shadow-[0_40px_80px_rgba(0,0,0,0.8)] backdrop-blur-xl group"
        >
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500/10 via-transparent to-blue-500/10 opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
          <div className="overflow-hidden rounded-[2rem] bg-zinc-950 border border-white/5 aspect-[16/9] flex items-center justify-center relative shadow-inner">
            
            <motion.img 
              src="/outstand-logo.png" 
              alt="Outstand Premium Core" 
              animate={{ scale: [1, 1.05, 1], filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="h-28 w-28 md:h-40 md:w-40 rounded-full shadow-[0_0_80px_rgba(99,102,241,0.3)] border border-white/10"
            />
            
            <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[10px] tracking-widest font-mono text-zinc-600 uppercase">
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
            icon={<Target className="h-6 w-6 text-white" />}
            title="Focus Architect"
            desc="Construct customized countdown vectors and deep isolation frameworks to log intensive tracking periods."
          />
          <FeatureCard 
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            title="Baseline Vectors"
            desc="Map out active friction indices alongside immediate accelerators for definitive performance scoring."
          />
          <FeatureCard 
            icon={<Brain className="h-6 w-6 text-white" />}
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
          className="mt-40 rounded-[3rem] border border-white/10 bg-zinc-900/40 p-10 md:p-20 text-center shadow-2xl relative overflow-hidden group backdrop-blur-2xl"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="relative z-10">
            <h2 className="text-4xl font-black md:text-6xl tracking-tight text-white mb-6">
              Ready to upgrade your workflow?
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto mb-10 text-sm md:text-lg font-medium">
              Join the collective of high-performance operators reclaiming their focus capacity daily. Free access active immediately.
            </p>
            <Button asChild size="lg" className="rounded-full h-14 bg-white text-black hover:bg-zinc-200 font-bold px-10 shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all transform hover:-translate-y-0.5 tracking-wide">
              <Link to="/auth">Initialize Free Account</Link>
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Structural Minimalist Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-10 text-center text-xs text-zinc-600 font-mono tracking-widest relative z-10 uppercase">
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
      className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl relative group transition-all hover:border-white/10 hover:bg-white/[0.04]"
    >
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500 ease-out">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-white tracking-tight">
        {title}
      </h3>
      <p className="text-zinc-400 text-sm font-medium leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
}
