import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ExperienceLayer({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, root.scrollTop / max)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <a href="#main-content" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-xl border border-cyan-300/25 bg-slate-950/95 px-4 py-2 text-xs font-bold text-cyan-100 shadow-2xl backdrop-blur-xl transition-transform focus:translate-y-0">
        Skip to main content
      </a>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-px bg-white/[0.04]">
        <div className="h-full origin-left bg-gradient-to-r from-cyan-300 via-blue-400 to-fuchsia-400 shadow-[0_0_12px_rgba(34,211,238,0.55)]" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute -left-48 top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-cyan-500/[0.045] blur-[120px]" />
        <div className="absolute -right-56 top-[35%] h-[42rem] w-[42rem] rounded-full bg-fuchsia-500/[0.035] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>
      <div id="main-content" className={cn("relative z-0 min-h-screen")}>{children}</div>
    </>
  );
}
