import { useEffect, useMemo, useState } from "react";
import { BarChart3, Brain, CheckCircle2, ChevronLeft, ChevronRight, Crown, Loader2, RefreshCw, Target, TrendingUp } from "lucide-react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/roadmap/ChessBoard";
import { analyzePosition, type EngineLine } from "@/lib/chess-engine-worker";
import { aggregateChessComGames, type ChessComGame, type ChessGameAnalysis, parseAnnotatedMoves } from "@/lib/chess-game-analysis";

type Props = { username: string };
type TrainerPosition = { fen: string; san: string; moveNumber: number; side: "w" | "b"; uci: string };
type TrainerState = { position: TrainerPosition; best: EngineLine | null; loading: boolean; feedback: string; solved: boolean };

function pct(value: number) { return `${value}%`; }
function readableError(value: unknown, fallback: string) { if (value instanceof Error && value.message) return value.message; if (typeof value === "string" && value.trim()) return value; if (value && typeof value === "object") { const obj = value as Record<string, unknown>; for (const key of ["message", "error", "detail"]) if (typeof obj[key] === "string" && obj[key].trim()) return obj[key] as string; try { return JSON.stringify(value); } catch { return fallback; } } return fallback; }
async function readJson(response: Response) { const text = await response.text(); if (!text.trim()) return {}; try { return JSON.parse(text) as Record<string, unknown>; } catch { return { error: text.slice(0, 240) }; } }

function buildPositions(game: ChessComGame, username: string): TrainerPosition[] {
  if (!game.pgn) return [];
  try {
    const replay = new Chess(); replay.loadPgn(game.pgn);
    const user = username.toLowerCase();
    const userIsWhite = (game.white?.username || "").toLowerCase() === user;
    const history = replay.history({ verbose: true });
    const board = new Chess(); const positions: TrainerPosition[] = [];
    history.forEach((move: any, index: number) => {
      if ((move.color === "w") === userIsWhite) positions.push({ fen: board.fen(), san: move.san, moveNumber: Math.floor(index / 2) + 1, side: move.color, uci: `${move.from}${move.to}${move.promotion || ""}` });
      board.move(move.san, { strict: false });
    });
    return positions;
  } catch { return []; }
}

export function ChessAnalysisDashboard({ username }: Props) {
  const [games, setGames] = useState<ChessComGame[]>([]); const [analysis, setAnalysis] = useState<ChessGameAnalysis | null>(null); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState(""); const [selected, setSelected] = useState<ChessComGame | null>(null);
  const load = async () => { setRefreshing(true); setError(""); try { const response = await fetch(`/api/chesscom-games?username=${encodeURIComponent(username)}`, { headers: { Accept: "application/json" } }); const result = await readJson(response); if (!response.ok) throw new Error(response.status === 429 ? "Chess.com is temporarily rate-limiting requests. Please retry shortly." : readableError(result.error, `Chess.com request failed (${response.status}).`)); const next = Array.isArray(result.games) ? result.games as ChessComGame[] : []; setGames(next); setAnalysis(aggregateChessComGames(next, username)); } catch (err) { setError(readableError(err, "Could not load Chess.com games.")); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { void load(); }, [username]);
  const annotated = useMemo(() => games.flatMap((game) => parseAnnotatedMoves(game.pgn || "").map((item) => ({ game, ...item }))).slice(0, 8), [games]);
  if (loading) return <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-6"><div className="flex items-center gap-3 text-sm font-bold text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Loading your recent games…</div></section>;
  if (error) return <section className="rounded-[2rem] border border-red-300/10 bg-red-300/[0.025] p-6"><h2 className="text-xl font-black text-white">We couldn't load your games.</h2><p className="mt-2 text-sm leading-6 text-red-200">{error}</p><button type="button" onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white"><RefreshCw className="h-4 w-4" />Try again</button></section>;
  return <section className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300/75">Advanced game analysis</div><h2 className="mt-2 text-3xl font-black tracking-tight text-white">Your last 30 days, in chess terms.</h2><p className="mt-2 text-sm leading-6 text-slate-500">Performance trends, opening habits, game review and training positions from your recent games.</p></div><button type="button" onClick={() => void load()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh games</button></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<Target className="h-4 w-4" />} label="Win rate" value={pct(analysis?.winRate || 0)} detail={`${analysis?.wins || 0}W · ${analysis?.draws || 0}D · ${analysis?.losses || 0}L`} /><Metric icon={<TrendingUp className="h-4 w-4" />} label="Rating delta" value={analysis?.ratingDelta == null ? "—" : `${analysis.ratingDelta > 0 ? "+" : ""}${analysis.ratingDelta}`} detail="Sampled 30-day window" /><Metric icon={<BarChart3 className="h-4 w-4" />} label="As White" value={pct(analysis?.white.winRate || 0)} detail={`${analysis?.white.games || 0} games`} /><Metric icon={<Brain className="h-4 w-4" />} label="As Black" value={pct(analysis?.black.winRate || 0)} detail={`${analysis?.black.games || 0} games`} /></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]"><Panel title="Opening habits" eyebrow="MOST PLAYED"><div className="space-y-2">{analysis?.openings.map((opening) => <div key={`${opening.name}-${opening.eco}`} className="rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3"><div className="flex items-start justify-between gap-3"><span className="min-w-0 break-words text-sm font-bold text-slate-200">{opening.name}</span><span className="shrink-0 text-xs font-black text-slate-500">{opening.games} games</span></div>{opening.eco && <div className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-slate-700">ECO {opening.eco}</div>}</div>)}{!analysis?.openings.length && <div className="text-sm text-slate-500">No opening data was available.</div>}</div></Panel><Panel title="Brilliant moves" eyebrow="SERVER ANNOTATIONS"><div className="space-y-2">{annotated.map((item, index) => <button type="button" key={`${item.game.url}-${item.index}-${index}`} onClick={() => setSelected(item.game)} className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 text-left"><span className="flex items-center gap-2 text-sm font-bold text-white"><Crown className="h-4 w-4 text-amber-300" />{item.symbol} standout annotation</span><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-600">Review game</span></button>)}{!annotated.length && <div className="text-sm text-slate-500">No server annotations were included in these recent PGNs.</div>}</div></Panel></div>
    <Panel title="Analyze games" eyebrow="LEARN FROM MISTAKES"><div className="grid gap-2 sm:grid-cols-2">{games.slice(0, 8).map((game, index) => <button type="button" key={game.url || `${game.end_time}-${index}`} onClick={() => setSelected(game)} className="group rounded-2xl border border-white/[0.06] bg-black/10 p-4 text-left transition hover:border-cyan-300/25"><div className="flex items-center justify-between"><div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-600">{game.time_class || "game"}</div><ChevronRight className="h-4 w-4 text-slate-700 transition group-hover:text-cyan-200" /></div><div className="mt-1 break-words text-sm font-black text-white">{game.white?.username || "White"} vs {game.black?.username || "Black"}</div><div className="mt-1 text-xs text-slate-500">{game.white?.rating || "—"} · {game.black?.rating || "—"}</div><div className="mt-2 text-[10px] font-bold text-cyan-300/60">Open game trainer</div></button>)}</div>{!games.length && <div className="text-sm text-slate-500">No games were played in the last 30 days.</div>}</Panel>
    {selected && <ChessGameTrainer game={selected} username={username} onClose={() => setSelected(null)} />}</section>;
}

function Metric({ icon, label, value, detail }: { icon: any; label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-cyan-300/65">{icon}<span className="text-[10px] font-black uppercase tracking-[.15em] text-slate-600">{label}</span></div><div className="mt-2 text-2xl font-black tabular-nums text-white">{value}</div><div className="mt-1 text-[11px] text-slate-600">{detail}</div></div>; }
function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) { return <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7"><div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-600">{eyebrow}</div><h3 className="mt-2 text-xl font-black text-white">{title}</h3><div className="mt-5">{children}</div></div>; }

function ChessGameTrainer({ game, username, onClose }: { game: ChessComGame; username: string; onClose: () => void }) {
  const [positions, setPositions] = useState<TrainerPosition[]>([]); const [index, setIndex] = useState(0); const [best, setBest] = useState<EngineLine | null>(null); const [userScore, setUserScore] = useState<number | null>(null); const [loading, setLoading] = useState(true); const [feedback, setFeedback] = useState(""); const [solved, setSolved] = useState(false);
  const userIsWhite = (game.white?.username || "").toLowerCase() === username.toLowerCase();

  useEffect(() => { setPositions(buildPositions(game, username)); setIndex(0); setSolved(false); }, [game, username]);
  const position = positions[index];

  useEffect(() => {
    let cancelled = false;
    if (!position) { setLoading(false); return; }
    setLoading(true); setBest(null); setUserScore(null); setFeedback(""); setSolved(false);
    void analyzePosition(position.fen, 16).then((result) => { if (!cancelled) setBest(result); }).catch((error) => { if (!cancelled) setFeedback(readableError(error, "Stockfish could not analyze this position.")); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [position]);

  const onTrainerMove = async (from: string, to: string) => {
    if (!position || loading || !best?.bestMove) return;
    try {
      const board = new Chess(position.fen); const move = board.move({ from, to, promotion: "q" }); const playedUci = `${from}${to}${move.promotion || ""}`.toLowerCase();
      const bestUci = best.bestMove.slice(0, 5).toLowerCase();
      const after = board.fen(); const afterEval = await analyzePosition(after, 12);
      const normalize = (score: number | null) => score == null ? null : (userIsWhite === (position.side === "w") ? score : -score);
      const bestPerspective = normalize(best.score); const playedPerspective = normalize(afterEval.score);
      setUserScore(playedPerspective);
      const drop = bestPerspective != null && playedPerspective != null ? bestPerspective - playedPerspective : null;
      if (playedUci === bestUci) { setFeedback("Correct — that matches Stockfish's top move."); setSolved(true); return; }
      if (drop != null && drop <= -200) setFeedback(`Blunder. Your move drops about ${(Math.abs(drop) / 100).toFixed(1)} pawns. Find a better move.`);
      else if (drop != null && drop <= -100) setFeedback(`Mistake. The position drops about ${(Math.abs(drop) / 100).toFixed(1)} pawns. Try again.`);
      else setFeedback("Legal move, but Stockfish prefers another move. Try again.");
    } catch { setFeedback("That move is not legal in this position."); }
  };

  if (!position) return <div className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.03] p-5 sm:p-7"><div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/70">Trainer</div><h3 className="mt-2 text-2xl font-black text-white">No training positions found</h3><p className="mt-2 text-sm text-slate-500">This game could not be replayed into user-to-move positions.</p></div><button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-400">Close</button></div></div>;

  return <div className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.03] p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/70">Trainer</div><h3 className="mt-2 text-2xl font-black text-white">Find the better move.</h3><p className="mt-2 text-sm text-slate-500">Play the position before your historical move. Stockfish checks your move locally.</p></div><button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-400">Close</button></div><div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,520px)_1fr]"><ChessBoard fen={position.fen} orientation={userIsWhite ? "white" : "black"} onMove={(from, to) => void onTrainerMove(from, to)} disabled={loading || solved} /><div className="rounded-2xl border border-white/[0.06] bg-black/10 p-5"><div className="flex items-center justify-between"><div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-600">Position {index + 1} / {positions.length}</div><div className="flex gap-1"><button type="button" disabled={index === 0} onClick={() => setIndex((v) => Math.max(0, v - 1))} className="rounded-lg border border-white/10 p-1.5 text-slate-500 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button type="button" disabled={index >= positions.length - 1} onClick={() => setIndex((v) => Math.min(positions.length - 1, v + 1))} className="rounded-lg border border-white/10 p-1.5 text-slate-500 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div><div className="mt-2 text-lg font-black text-white">Before {position.moveNumber}{position.side === "w" ? "." : "..."}{position.san}</div>{loading ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Stockfish is calculating…</div> : <div className="mt-4 space-y-3 text-sm text-slate-400"><div>Best move: <span className="font-black text-white">{best?.bestMove || "—"}</span></div><div>Position score: <span className="font-black text-white">{best?.mate != null ? `Mate ${best.mate}` : best?.score != null ? (best.score / 100).toFixed(2) : "—"}</span></div>{userScore != null && <div>Your move score: <span className="font-black text-white">{(userScore / 100).toFixed(2)}</span></div>}<p className="pt-2 text-xs leading-5 text-slate-600">Historical move: <span className="text-slate-400">{position.san}</span></p>{feedback && <div className={`rounded-xl border px-3 py-2 text-xs font-bold ${solved ? "border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-200" : "border-amber-300/15 bg-amber-300/[0.05] text-amber-200"}`}>{feedback}</div>}{solved && index < positions.length - 1 && <button type="button" onClick={() => setIndex((v) => Math.min(v + 1, positions.length - 1))} className="mt-1 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950"><CheckCircle2 className="h-4 w-4" />Next position</button>}<div className="pt-1 text-[10px] text-slate-700">Analysis runs locally in your browser with Stockfish.</div></div>}</div></div></div>;
}
