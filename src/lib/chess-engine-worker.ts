import type { Chess } from "chess.js";

export type EngineLine = { score: number | null; mate: number | null; bestMove: string | null };

type StockfishWorker = Worker & { __ready?: Promise<void> };

let worker: StockfishWorker | null = null;
let requestId = 0;

function getWorker() {
  if (worker) return worker;
  const source = `
    let ready = false;
    let queue = new Map();
    let id = 0;
    const emit = (payload) => self.postMessage(payload);
    const ask = (cmd) => { if (self.stockfish) self.stockfish.postMessage(cmd); };
    self.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'configure') { ask('uci'); return; }
      if (type === 'analyze') {
        const token = ++id;
        queue.set(token, event.data.requestId);
        ask('ucinewgame');
        ask('position fen ' + payload.fen);
        ask('go depth ' + (payload.depth || 14));
        self.__activeToken = token;
      }
    };
    if (typeof importScripts === 'function') {
      try {
        importScripts('/stockfish/stockfish.js');
        if (self.Stockfish) self.stockfish = self.Stockfish();
        if (self.stockfish) self.stockfish.onmessage = (line) => {
          if (line === 'uciok') { ready = true; emit({ type: 'ready' }); }
          if (typeof line === 'string' && line.startsWith('bestmove ')) {
            const bestMove = line.split(' ')[1] || null;
            emit({ type: 'result', requestId: queue.get(self.__activeToken), bestMove, line });
            queue.delete(self.__activeToken);
          }
        };
      } catch (error) { emit({ type: 'error', message: String(error) }); }
    }
  `;
  const blob = new Blob([source], { type: "application/javascript" });
  worker = new Worker(URL.createObjectURL(blob)) as StockfishWorker;
  worker.__ready = new Promise((resolve, reject) => {
    worker!.addEventListener("message", (event) => { if (event.data?.type === "ready") resolve(); if (event.data?.type === "error") reject(new Error(event.data.message)); });
  });
  worker.postMessage({ type: "configure" });
  return worker;
}

export async function analyzePosition(fen: string, depth = 14) {
  const sf = getWorker();
  await sf.__ready;
  const id = ++requestId;
  return new Promise<EngineLine>((resolve) => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "result" && event.data.requestId === id) {
        sf!.removeEventListener("message", handler);
        resolve({ score: null, mate: null, bestMove: event.data.bestMove });
      }
    };
    sf.addEventListener("message", handler);
    sf.postMessage({ type: "analyze", requestId: id, payload: { fen, depth } });
  });
}

export async function evaluateGame(game: Chess, userColor: "w" | "b") {
  return { moves: game.history({ verbose: true }), userColor };
}
