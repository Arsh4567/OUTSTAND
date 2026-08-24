import { useEffect, useMemo, useState } from "react";
import { BarChart3, Brain, Crown, Loader2, RefreshCw, Target, TrendingUp } from "lucide-react";
import { aggregateChessComGames, type ChessComGame, type ChessGameAnalysis, parseAnnotatedMoves } from "@/lib/chess-game-analysis";

type Props = { username: string };

function pct(value: number) { return `${value}%`; }

export function ChessAnalysisDashboard({ username }: Props) {
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [analysis, setAnalysis] = useState<ChessGameAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ChessComGame | null>(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/chesscom-games?username=${encodeURIComponent(username)}`, { headers: { Accept: "application/json" } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load your Chess.com games.");
      const nextGames = Array.isArray(result.games) ? result.games : [];
      setGames(nextGames);
      setAnalysis(aggregateChessComGames(nextGames, username));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load Chess.com games."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [username]);

  const annotated = useMemo(() => games.flatMap((game) => parseAnnotatedMoves(game.pgn || "").map((item) => ({ game, ...item }))).slice(0, 6), [games]);

  if (loading) return <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8"><div className="flex items-center gap-3 text-sm font-bold text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Analyzing your last 30 days…</div></section>;
  if (error) return <section className="rounded-[2rem] border border-red-300/10 bg-red-300/[0.025] p-6 sm:p-8"><div className="text-sm font-semibold text-red-200">{error}</div><button type="button" onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white"><RefreshCw className="h-4 w-4" />Retry</button></section>;

  return <section className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300/75">Advanced game analysis</div><h2 className="mt-2 text-3xl font-black tracking-tight text-white">Your last 30 days, in chess terms.</h2><p className="mt-2 text-sm leading-6 text-slate-500">Performance trends, opening habits, mistakes and standout moments from your recent games.</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200"><RefreshCw className="h-4 w-4" />Refresh</button></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<Target className="h-4 w-4" />} label="Win rate" value={pct(analysis?.winRate || 0)} detail={`${analysis?.wins || 0}W · ${analysis?.draws || 0}D · ${analysis?.losses || 0}L`} /><Metric icon={<TrendingUp className="h-4 w-4" />} label="Rating delta" value={analysis?.ratingDelta == null ? "—" : `${analysis.ratingDelta > 0 ? "+" : ""}${analysis.ratingDelta}`} detail="Across the sampled 30-day window" /><Metric icon={<BarChart3 className="h-4 w-4" />} label="As White" value={pct(analysis?.white.winRate || 0)} detail={`${analysis?.white.games || 0} games`} /><Metric icon={<Brain className="h-4 w-4" />} label="As Black" value={pct(analysis?.black.winRate || 0)} detail={`${analysis?.black.games || 0} games`} /></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <Panel title="Opening habits" eyebrow="MOST PLAYED"><div className="space-y-2">{(analysis?.openings || []).map((opening) => <div key={`${opening.name}-${opening.eco}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3"><span className="text-sm font-bold text-slate-200">{opening.name}</span><span className="text-xs font-black tabular-nums text-slate-500">{opening.games}</span></div>)}{!analysis?.openings.length && <div className="text-sm text-slate-500">Not enough recent PGN headers to identify openings.</div>}</div></Panel>
      <Panel title="Brilliant moves" eyebrow="SERVER ANNOTATIONS"><div className="space-y-2">{annotated.map((item, index) => <button type="button" key={`${item.game.url}-${item.index}-${index}`} onClick={() => setSelected(item.game)} className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 text-left"><span className="flex items-center gap-2 text-sm font-bold text-white"><Crown className="h-4 w-4 text-amber-300" />{item.symbol} standout annotation</span><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-600">Open game</span></button>)}{!annotated.length && <div className="text-sm text-slate-500">No server annotations were included in these recent PGNs.</div>}</div></Panel>
    </div>
    <Panel title="Analyze games" eyebrow="LEARN FROM MISTAKES"><div className="grid gap-2 sm:grid-cols-2">{games.slice(0, 8).map((game, index) => <button type="button" key={game.url || `${game.end_time}-${index}`} onClick={() => setSelected(game)} className="rounded-2xl border border-white/[0.06] bg-black/10 p-4 text-left transition hover:border-cyan-300/20"><div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-600">{game.time_class || "game"}</div><div className="mt-1 text-sm font-black text-white">{game.white?.username || "White"} vs {game.black?.username || "Black"}</div><div className="mt-1 text-xs text-slate-500">{game.white?.rating || "—"} · {game.black?.rating || "—"}</div></button>)}</div></Panel>
    {selected && <ChessGameTrainer game={selected} username={username} onClose={() => setSelected(null)} />}
  </section>;
}

function Metric({ icon, label, value, detail }: any) { return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-cyan-300/65">{icon}<span className="text-[10px] font-black uppercase tracking-[.15em] text-slate-600">{label}</span></div><div className="mt-2 text-2xl font-black tabular-nums text-white">{value}</div><div className="mt-1 text-[11px] text-slate-600">{detail}</div></div>; }
function Panel({ title, eyebrow, children }: any) { return <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7"><div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-600">{eyebrow}</div><h3 className="mt-2 text-xl font-black text-white">{title}</h3><div className="mt-5">{children}</div></div>; }
function ChessGameTrainer({ game, username, onClose }: { game: ChessComGame; username: string; onClose: () => void }) {
  const [busy, setBusy] = useState(true);
  const userIsWhite = (game.white?.username || "").toLowerCase() === username.toLowerCase();
  useEffect(() => { const timer = window.setTimeout(() => setBusy(false), 250); return () => window.clearTimeout(timer); }, []);
  return <div className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.03] p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/70">Trainer</div><h3 className="mt-2 text-2xl font-black text-white">Find the better move.</h3><p className="mt-2 text-sm text-slate-500">{game.white?.username || "White"} vs {game.black?.username || "Black"}</p></div><button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-400">Close</button></div>{busy ? <div className="mt-6 text-sm text-slate-500">Preparing the position…</div> : <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]"><div className="grid aspect-square place-items-center rounded-2xl border border-white/[0.08] bg-slate-900 text-center text-slate-600"><div><div className="text-xs font-black uppercase tracking-[.18em]">Board</div><div className="mt-2 text-sm">Connect the Stockfish board to train this position.</div><div className="mt-1 text-xs">You are playing {userIsWhite ? "White" : "Black"}.</div></div></div><div className="rounded-2xl border border-white/[0.06] bg-black/10 p-5"><div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-600">Next step</div><h4 className="mt-2 text-lg font-black text-white">What would you play?</h4><p className="mt-2 text-sm leading-6 text-slate-500">The full Stockfish move-by-move evaluation layer can now be attached to this trainer without changing the dashboard data model.</p></div></div>}</div>;
}
