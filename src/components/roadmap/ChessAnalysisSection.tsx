import { BarChart3, ChessKnight, Sparkles } from "lucide-react";
import { useState } from "react";
import { ChessAnalysisDashboard } from "./ChessAnalysisDashboard";
import { ChessComRoadmapPanel } from "./ChessComRoadmapPanel";

type Props = { username?: string | null };

export function ChessAnalysisSection({ username }: Props) {
  const [connectedUsername, setConnectedUsername] = useState<string | null>(username || null);

  return (
    <section className="space-y-4">
      {!connectedUsername ? (
        <>
          <div className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.035] p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06]">
                <BarChart3 className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/75">
                  <Sparkles className="h-3.5 w-3.5" /> Advanced Game Analysis
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Turn your games into training.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Connect your Chess.com username to unlock your last-30-days performance, game analysis, mistake trainer, and brilliant-move highlights.</p>
              </div>
            </div>
          </div>
          <ChessComRoadmapPanel onLoaded={(data) => setConnectedUsername(data.profile.username)} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/70">
            <ChessKnight className="h-4 w-4" /> Advanced Game Analysis
          </div>
          <ChessAnalysisDashboard username={connectedUsername} />
        </>
      )}
    </section>
  );
}
