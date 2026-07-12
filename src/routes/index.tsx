import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Zap, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6">
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <Zap className="h-6 w-6 text-indigo-500" />
          Outstand
        </div>
        <Button asChild variant="secondary" className="rounded-full px-6">
          {/* Change "/auth" to wherever your login page actually is */}
          <Link to="/auth">Sign In</Link> 
        </Button>
      </nav>

      {/* Hero Section (SEO Optimized) */}
      <main className="mx-auto max-w-5xl px-6 pt-20 pb-32 text-center lg:pt-32">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
          <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">
            Build your <span className="text-indigo-400">momentum.</span>
            <br /> Master your focus.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
            Outstand is the premium focus tracking app designed to help you log your daily habits, manage distractions, and rebuild your baseline momentum.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-14 rounded-full bg-indigo-600 px-8 text-base hover:bg-indigo-500">
              <Link to="/auth">
                Start for free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Grid (Great for SEO Keywords) */}
        <div className="mt-32 grid gap-8 md:grid-cols-3 text-left animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
          <FeatureCard 
            icon={<Target className="h-6 w-6 text-emerald-400" />}
            title="Focus Tracking"
            desc="Use our built-in Pomodoro timers and deep work tracking to stay locked in on what matters."
          />
          <FeatureCard 
            icon={<TrendingUp className="h-6 w-6 text-indigo-400" />}
            title="Daily Momentum"
            desc="Log your accelerators and friction points to get a real-time score of your daily performance."
          />
          <FeatureCard 
            icon={<Zap className="h-6 w-6 text-rose-400" />}
            title="Habit Analytics"
            desc="Visualize your 7-day trends and build unbreakable streaks with beautifully designed charts."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-8 shadow-xl backdrop-blur-sm">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/50">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
