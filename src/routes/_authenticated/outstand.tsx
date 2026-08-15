import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FocusEngine } from "@/components/outstand/FocusEngine";
import { EnvironmentEffects } from "@/components/outstand/EnvironmentEffects";
import { OfflineBanner } from "@/components/outstand/OfflineBanner";
import { useOutstand } from "@/hooks/use-outstand";

type OutstandSearch = { challengeId?: string };

export const Route = createFileRoute("/_authenticated/outstand")({
  validateSearch: (search: Record<string, unknown>): OutstandSearch => ({
    challengeId: typeof search.challengeId === "string" ? search.challengeId : undefined,
  }),
  component: OutstandPage,
});

export function OutstandPage() {
  const searchParams = useSearch({ strict: false }) as OutstandSearch;
  const challengeId = searchParams?.challengeId;
  const {
    challenge, running, setRunning, setRemaining, isShuffling,
    shuffleDisplay, completionStage, generate, complete, mins, secs, loadChallenge,
  } = useOutstand();
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    if (!challengeId) return;
    const timer = window.setTimeout(() => loadChallenge(challengeId), 150);
    return () => window.clearTimeout(timer);
  }, [challengeId, loadChallenge]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden bg-[#02040a] p-4 font-sans text-slate-100 selection:bg-cyan-500/30 sm:p-8">
      <EnvironmentEffects completionStage={completionStage} isShuffling={isShuffling} />
      <OfflineBanner isOnline={isOnline} />
      <main className="relative z-20 flex w-full max-w-4xl flex-grow flex-col items-center justify-center [perspective:1200px]">
        <FocusEngine
          challenge={challenge}
          isShuffling={isShuffling}
          shuffleDisplay={shuffleDisplay}
          completionStage={completionStage}
          running={running}
          mins={mins}
          secs={secs}
          setRunning={setRunning}
          setRemaining={setRemaining}
          generate={generate}
          complete={complete}
        />
      </main>
    </div>
  );
}
