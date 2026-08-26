import { createFileRoute } from "@tanstack/react-router";
import { ChessKnight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { ChessAnalysisSection } from "@/components/roadmap/ChessAnalysisSection";

export const Route = createFileRoute("/chess")({ component: ChessPage });

function ChessPage() {
  const [username, setUsername] = useState<string | null>(null);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] px-4 pb-24 pt-5 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.10),transparent_58%)]" />
      <div className="relative z-10 mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-white/[0.025] shadow-[0_50px_140px_-90px_rgba(34,211,238,.45)]">
          <div className="pointer-events-none absolute -right-32 -top-36 h-96 w-96 rounded-full bg-cyan-300/[0.06] blur-3xl" />
          <div className="relative p-6 sm:p-8 lg:p-10">
            <a href="/roadmap" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">
              <ArrowLeft className="h-4 w-4" /> Back to roadmap
            </a>
            <div className="mt-8 flex max-w-4xl items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06]">
                <ChessKnight className="h-6 w-6 text-cyan-200" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300/75">OUTSTAND / CHESS</div>
                <h1 className="mt-2 text-4xl font-black tracking-[-.05em] text-white sm:text-5xl lg:text-6xl">Turn your games into training.</h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">Chess analysis lives here now: connect Chess.com, review recent games, train mistakes, and use engine-backed feedback without cluttering your main roadmap.</p>
              </div>
            </div>
          </div>
        </header>

        <ChessAnalysisSection username={username} onUsernameChange={setUsername} />
      </div>
    </main>
  );
}
