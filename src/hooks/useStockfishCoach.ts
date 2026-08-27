import { useCallback, useEffect, useRef, useState } from "react";

export type CoachEvaluation = { score: number | null; mate: number | null; bestMove: string | null; pv: string[] };
export type MoveClassification = "book" | "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
export type CoachAnalysis = { before: CoachEvaluation; after: CoachEvaluation; classification: MoveClassification; delta: number | null; bestMove: string | null; pv: string[] };
type Request = { id: number; resolve: (value: CoachEvaluation) => void; reject: (error: Error) => void };
const JS = "/stockfish/stockfish-18-lite-single.js";
const WASM = "/stockfish/stockfish-18-lite-single.wasm";
const INIT_TIMEOUT = 15000;
const MIN_DEPTH = 12;
const MAX_DEPTH = 18;
function makeError(message: string) { return new Error(`Stockfish: ${message}`); }
function perspective(score: number | null, side: "w" | "b") { return score == null ? null : side === "w" ? score : -score; }
function perspectiveMate(mate: number | null, side: "w" | "b") { return mate == null ? null : side === "w" ? mate : -mate; }
export function classifyMove(delta: number | null, matchedBest: boolean, missedMate = false, deliveredMate = false): MoveClassification { if (deliveredMate) return "best"; if (missedMate) return "blunder"; if (matchedBest) return "best"; if (delta == null) return "good"; if (delta <= 10) return "excellent"; if (delta <= 30) return "good"; if (delta <= 80) return "inaccuracy"; if (delta <= 200) return "mistake"; return "blunder"; }
function createWorker() { const scriptUrl = new URL(JS, window.location.origin).href; const wasmUrl = new URL(WASM, window.location.origin).href; const source = `self.Module={locateFile:function(file){return file==='stockfish.wasm'?${JSON.stringify(wasmUrl)}:file;}};importScripts(${JSON.stringify(scriptUrl)});`; const url = URL.createObjectURL(new Blob([source], { type: "application/javascript" })); try { return new Worker(url); } finally { URL.revokeObjectURL(url); } }
export function useStockfishCoach() {
  const workerRef = useRef<Worker | null>(null); const readyRef = useRef<Promise<void> | null>(null); const requestRef = useRef<Request | null>(null); const sequenceRef = useRef(0); const timerRef = useRef<number | null>(null); const scoreRef = useRef<number | null>(null); const mateRef = useRef<number | null>(null); const pvRef = useRef<string[]>([]);
  const [status, setStatus] = useState<"idle" | "initializing" | "ready" | "thinking" | "error">("idle"); const [error, setError] = useState<string | null>(null);
  const destroy = useCallback((reason?: Error) => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); timerRef.current = null; requestRef.current?.reject(reason || makeError("worker stopped.")); requestRef.current = null; workerRef.current?.terminate(); workerRef.current = null; readyRef.current = null; }, []);
  const ensureReady = useCallback(async () => {
    if (workerRef.current && readyRef.current) { await readyRef.current; return; }
    setStatus("initializing"); setError(null);
    try {
      const [js, wasm] = await Promise.all([fetch(JS, { method: "HEAD", cache: "no-store" }), fetch(WASM, { method: "HEAD", cache: "no-store" })]); if (!js.ok || !wasm.ok) throw makeError("engine assets are unavailable.");
      const worker = createWorker(); workerRef.current = worker;
      let resolveReady!: () => void; let rejectReady!: (e: Error) => void; const ready = new Promise<void>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; }); readyRef.current = ready;
      await new Promise<void>((resolve, reject) => { const timeout = window.setTimeout(() => { const e = makeError(`did not initialize within ${INIT_TIMEOUT / 1000}s.`); rejectReady(e); reject(e); }, INIT_TIMEOUT); const onMessage = (event: MessageEvent) => { if (String(event.data || "").trim() === "uciok") { window.clearTimeout(timeout); worker.removeEventListener("message", onMessage); resolveReady(); resolve(); } }; worker.addEventListener("message", onMessage); worker.addEventListener("error", () => { const e = makeError("worker initialization failed."); window.clearTimeout(timeout); rejectReady(e); reject(e); }, { once: true }); worker.postMessage("uci"); });
      setStatus("ready");
    } catch (cause) { const e = cause instanceof Error ? cause : makeError("initialization failed."); setStatus("error"); setError(e.message); destroy(e); throw e; }
  }, [destroy]);
  const analyze = useCallback(async (fen: string, depth = 14): Promise<CoachEvaluation> => {
    await ensureReady(); const worker = workerRef.current; if (!worker) throw makeError("worker unavailable."); requestRef.current?.reject(makeError("analysis superseded.")); worker.postMessage("stop"); const id = ++sequenceRef.current; scoreRef.current = null; mateRef.current = null; pvRef.current = []; setStatus("thinking");
    return new Promise<CoachEvaluation>((resolve, reject) => {
      requestRef.current = { id, resolve, reject };
      const onMessage = (event: MessageEvent) => { const line = String(event.data || "").trim(); if (line.startsWith("info ")) { const cp = line.match(/\bscore cp (-?\d+)/); const mate = line.match(/\bscore mate (-?\d+)/); const pv = line.match(/\bpv\s+(.+)$/); if (cp) { scoreRef.current = Number(cp[1]); mateRef.current = null; } if (mate) { mateRef.current = Number(mate[1]); scoreRef.current = null; } if (pv) pvRef.current = pv[1].trim().split(/\s+/); } if (!line.startsWith("bestmove ")) return; const current = requestRef.current; if (!current || current.id !== id) return; requestRef.current = null; worker.removeEventListener("message", onMessage); setStatus("ready"); resolve({ score: scoreRef.current, mate: mateRef.current, bestMove: line.split(/\s+/)[1] || null, pv: pvRef.current }); };
      worker.addEventListener("message", onMessage); worker.postMessage("isready"); worker.postMessage("ucinewgame"); worker.postMessage(`position fen ${fen}`); worker.postMessage(`go depth ${Math.max(MIN_DEPTH, Math.min(MAX_DEPTH, Math.round(depth)))}`);
    });
  }, [ensureReady]);
  const analyzeMove = useCallback(async (beforeFen: string, afterFen: string, side: "w" | "b", playedMove: string, depth = 14): Promise<CoachAnalysis> => {
    const before = await analyze(beforeFen, depth); const after = await analyze(afterFen, depth);
    const bestPerspective = perspective(before.score, side); const afterPerspective = perspective(after.score, side);
    const bestMate = perspectiveMate(before.mate, side); const afterMate = perspectiveMate(after.mate, side);
    const delta = bestPerspective != null && afterPerspective != null ? Math.max(0, bestPerspective - afterPerspective) : null;
    const matchedBest = !!before.bestMove && before.bestMove.toLowerCase() === playedMove.toLowerCase();
    const missedMate = bestMate != null && bestMate > 0 && (afterMate == null || afterMate < 0);
    const deliveredMate = afterMate != null && afterMate > 0;
    return { before, after, classification: classifyMove(delta, matchedBest, missedMate, deliveredMate), delta, bestMove: before.bestMove, pv: before.pv };
  }, [analyze]);
  useEffect(() => () => destroy(), [destroy]);
  const debouncedAnalyze = useCallback((fen: string, depth = 14, delay = 120) => new Promise<CoachEvaluation>((resolve, reject) => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); timerRef.current = window.setTimeout(() => { timerRef.current = null; void analyze(fen, depth).then(resolve, reject); }, delay); }), [analyze]);
  return { analyze, debouncedAnalyze, analyzeMove, classifyMove, status, error };
}
