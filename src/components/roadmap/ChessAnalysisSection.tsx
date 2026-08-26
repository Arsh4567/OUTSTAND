import { BarChart3, ChessKnight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ChessAnalysisDashboard } from "./ChessAnalysisDashboard";
import { ChessComRoadmapPanel, loadSavedChessRoadmap } from "./ChessComRoadmapPanel";

type Props = { username?: string | null; onUsernameChange?: (username: string | null) => void };

export function ChessAnalysisSection({ username, onUsernameChange }: Props) {
  const [connectedUsername, setConnectedUsername] = useState<string | null>(username || null);

  useEffect(() => {
    let cancelled = false;
    void loadSavedChessRoadmap().then((saved) => {
      if (cancelled || !saved?.profile?.username) return;
      setConnectedUsername(saved.profile.username);
      onUsernameChange?.(saved.profile.username);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [onUsernameChange]);

  const handleLoaded = (data: { profile: { username: string } }) => {
    setConnectedUsername(data.profile.username);
    onUsernameChange?.(data.profile.username);
  };

  return (
    <section className="space-y-5">
      {!connectedUsername ? (
        <>
          <div className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.035] p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06]">
                <BarChart3 className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/75">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Advanced Game Analysis
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Turn your games into training.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Connect your Chess.com username to unlock recent-game performance, analysis, mistake training, and engine-backed feedback.</p>
              </div>
            </div>
          </div>
          <ChessComRoadmapPanel onLoaded={handleLoaded} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/70">
            <ChessKnight className="h-4 w-4" aria-hidden="true" /> Advanced Game Analysis
          </div>
          <ChessAnalysisDashboard username={connectedUsername} />
        </>
      )}
    </section>
  );
}
