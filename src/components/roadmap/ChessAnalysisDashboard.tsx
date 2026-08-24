import { useEffect, useMemo, useState } from "react";
import { BarChart3, Brain, Crown, Loader2, RefreshCw, Target, TrendingUp } from "lucide-react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/roadmap/ChessBoard";
import { analyzePosition } from "@/lib/chess-engine-worker";
import { aggregateChessComGames, type ChessComGame, type ChessGameAnalysis, parseAnnotatedMoves } from "@/lib/chess-game-analysis";

type Props = { username: string };
type TrainerPosition = { fen: string; san: string; moveNumber: number; side: "w" | "b" };

function pct(value: number) { return `${value}%`; }

function readableError(value: unknown, fallback: string) {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    for (const key of ["message", "error", "detail"]) {
      if (typeof candidate[key] === "string" && candidate[key].trim()) return candidate[key] as string;
    }
    try { return JSON.stringify(value); } catch { return fallback; }
  }
  return fallback;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text.trim()) return {} as Record<string, unknown>;
  try { return JSON.parse(text) as Record<string, unknown>; }
  catch { return { error: text.slice(0, 240) }; }
}

function buildPositions(game: ChessComGame, username: string): TrainerPosition[] {
  if (!game.pgn) return [];
  try {
    const replay = new Chess();
    replay.loadPgn(game.pgn);
    const isUserWhite = (game.white?.username || "").toLowerCase() === username.toLowerCase();
    const temp = new Chess();
    const positions: TrainerPosition[] = [];
    replay.history({ verbose: true }).forEach((move: any, index: number) => {
      if ((move.color === "w") === isUserWhite) positions.push({ fen: temp.fen(), san: move.san, moveNumber: Math.floor(index / 2) + 1, side: move.color });
      temp.move(move.san, { strict: false });
    });
    return positions;
  } catch { return []; }
}

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
      const result = await readJson(response);
      if (!response.ok) {
        const message = readableError(result.error, `Chess.com games request failed (${response.status}).`);
        throw new Error(response.status === 429 ? "Chess.com is temporarily rate-limiting game requests. Please wait a moment and retry." : message);
      }
      const nextGames = Array.isArray(result.games) ? result.games as ChessComGame[] : [];
      setGames(nextGames);
      setAnalysis(aggregateChessComGames(nextGames, username));
    } catch (err) {
      setError(readableError(err, "Could not load Chess.com games. Please try again."));
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [username]);
  const annotated = useMemo(() => games.flatMap((game) => parseAnnotatedMoves(game.pgn || "").map((item) => ({ game, ...item }))).slice(0, 6), [games]);

  if (loading) return <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8"><div className="flex items-center gap-3 text-sm font-bold text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Analyzing your last 30 days…</div></section>;
  if (error) return <section className="rounded-[2rem] border border-red-300/10 bg-red-300/[0.025] p-6 sm:p-8"><div className="text-[10px] font-black uppercase tracking-[.2em] text-red-300/60">Advanced game analysis</div><h2 className="mt-2 text-xl font-black text-white">We couldn't load your recent games.</h2><div className="mt-2 text-sm font-semibold leading-6 text-red-200">{error}</div><button type="button" onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white"><RefreshCw className="h-4 w-4" />Retry</button></section>;

  return <section className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300/75">Advanced game analysis</div><h2 className="mt-2 text-3xl font-black tracking-tight text-white">Your last 30 days, in chess terms.</h2><p className="mt-2 text-sm leading-6 text-slate-500">Performance trends, opening habits, mistakes and standout moments from your recent games.</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200"><RefreshCw className="h-4 w-4" />Refresh</button></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<Target className="h-4 w-4" />} label="Win rate" value={pct(analysis?.winRate || 0)} detail={`${analysis?.wins || 0}W · ${analysis?.draws || 0}D · ${analysis?.losses || 0}L`} /><Metric icon={<TrendingUp className="h-4 w-4" />} label="Rating delta" value={analysis?.ratingDelta == null ? "—" : `${analysis.ratingDelta > 0 ? "+" : ""}${analysis.ratingDelta}`} detail="Across the sampled 30-day window" /><Metric icon={<BarChart3 className="h-4 w-4" />} label="As White" value={pct(analysis?.white.winRate || 0)} detail={`${analysis?.white.games || 0} games`} /><Metric icon={<Brain className="h-4 w-4" />} label="As Black" value={pct(analysis?.black.winRate || 0)} detail={`${analysis?.black.games || 0} games`} /></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]"><Panel title="Opening habits" eyebrow="MOST PLAYED"><div className="space-y-2">{(analysis?.openings || []).map((opening) => <div key={`${opening.name}-${opening.eco}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3"><span className="text-sm font-bold text-slate-200">{opening.name}</span><span className="text-xs font-black tabular-nums text-slate-500">{opening.games}</span></div>)}{!analysis?.openings.length && <div className="text-sm text-slate-500">Not enough recent PGN headers to identify openings.</div>}</div></Panel><Panel title="Brilliant moves" eyebrow="SERVER ANNOTATIONS"><div className="space-y-2">{annotated.map((item, index) => <button type="button" key={`${item.game.url}-${item.index}-${index}`} onClick={() => setSelected(item.game)} className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 text-left"><span className="flex items-center gap-2 text-sm font-bold text-white"><Crown className="h-4 w-4 text-amber-300" />{item.symbol} standout annotation</span><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-600">Open game</span></button>)}{!annotated.length && <div className="text-sm text-slate-500">No server annotations were included in these recent PGNs.</div>}</div></Panel></div>
    <Panel title="Analyze games" eyebrow="LEARN FROM MISTAKES"><div className="grid gap-2 sm:grid-cols-2">{games.slice(0, 8).map((game, index) => <button type="button" key={game.url || `${game.end_time}-${index}`} onClick={() => setSelected(game)} className="rounded-2xl border border-white/[0.06] bg-black/10 p-4 text-left transition hover:border-cyan-300/20"><div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-600">{game.time_class || "game"}</div><div className="mt-1 text-sm font-black text-white">{game.white?.username || "White"} vs {game.black?.username || "Black"}</div><div className="mt-1 text-xs text-slate-500">{game.white?.rating || "—"} · {game.black?.rating || "—"}</div></button>)}</div>{!games.length && <p className="text-sm text-slate-500">No games were played in the last 30 days.</p>}</Panel>
    {selected && <ChessGameTrainer game={selected} username={username} onClose={() => setSelected(null)} />}
  </section>;
}

function Metric({ icon, label, value, detail }: any) { return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-cyan-300/65">{icon}<span className="text-[10px] font-black uppercase tracking-[.15em] text-slate-600">{label}</span></div><div className="mt-2 text-2xl font-black tabular-nums text-white">{value}</div><div className="mt-1 text-[11px] text-slate-600">{detail}</div></div>; }
function Panel({ title, eyebrow, children }: any) { return <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7"><div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-600">{eyebrow}</div><h3 className="mt-2 text-xl font-black text-white">{title}</h3><div className="mt-5">{children}</div></div>; }

function ChessGameTrainer({ game, username, onClose }: { game: ChessComGame; username: string; onClose: () => void }) {
  const [positions, setPositions] = useState<TrainerPosition[]>([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<{ bestMove: string | null; score: number | null; mate: number | null } | null>(null);
  const [busy, setBusy] = useState(true);
  const userIsWhite = (game.white?.username || "").toLowerCase() === username.toLowerCase();

  useEffect(() => { setPositions(buildPositions(game, username).slice(0, 30)); setIndex(0); }, [game, username]);
  const position = positions[index];

  useEffect(() => {
    let cancelled = false;
    if (!position) { setBusy(false); return; }
    setBusy(true); setResult(null);
    void analyzePosition(position.fen, 14).then((engine) => { if (!cancelled) setResult(engine); }).catch(() => { if (!cancelled) setResult(null); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [position]);

  const onTrainerMove = (from: string, to: string) => {
    if (!position || busy) return;
    try {
      const chess = new Chess(position.fen);
      chess.move({ from, to, promotion: "q" });
      if (result?.bestMove && result.bestMove.slice(0, 4).toLowerCase() === `${from}${to}`.toLowerCase()) setIndex((value) => Math.min(value + 1, Math.max(0, positions.length - 1)));
    } catch { /* invalid board move */ }
  };

  return <div className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.03] p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/70">Trainer</div><h3 className="mt-2 text-2xl font-black text-white">Find the better move.</h3><p className="mt-2 text-sm text-slate-500">You are playing {userIsWhite ? "White" : "Black"}. Play the engine move before seeing the next position.</p></div><button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-400">Close</button></div>{!position ? <div className="mt-6 text-sm text-slate-500">This PGN could not be replayed into user-to-move positions.</div> : <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,520px)_1fr]"><ChessBoard fen={position.fen} orientation={userIsWhite ? "white" : "black"} onMove={onTrainerMove} disabled={busy} /><div className="rounded-2xl border border-white/[0.06] bg-black/10 p-5"><div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-600">Position {index + 1} / {positions.length}</div><div className="mt-2 text-lg font-black text-white">Before {position.moveNumber}{position.side === "w" ? "." : "..."}{position.san}</div>{busy ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Stockfish is calculating…</div> : <div className="mt-4 space-y-2 text-sm text-slate-400"><div>Engine move: <span className="font-black text-white">{result?.bestMove || "—"}</span></div><div>Score: <span className="font-black text-white">{result?.mate != null ? `Mate ${result.mate}` : result?.score != null ? `${(result.score / 100).toFixed(2)}` : "—"}</span></div><p className="pt-2 text-xs leading-5 text-slate-600">The historical move was <span className="text-slate-400">{position.san}</span>. Try to find a stronger move from the same position.</p></div>}</div></div>}</div>;
}
