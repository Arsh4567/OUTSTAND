export type EngineLine = {
  score: number | null;
  mate: number | null;
  bestMove: string | null;
};

type Pending = {
  resolve: (value: EngineLine) => void;
  reject: (error: Error) => void;
};

const ENGINE_JS = "/stockfish/stockfish-18-lite-single.js";
const ENGINE_WASM = "/stockfish/stockfish-18-lite-single.wasm";
const INIT_TIMEOUT_MS = 15_000;

let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let sequence = 0;
const pending = new Map<number, Pending>();
let activeRequestId: number | null = null;
let latestScore: number | null = null;
let latestMate: number | null = null;

function resetWorker(error: Error) {
  for (const request of pending.values()) request.reject(error);
  pending.clear();
  activeRequestId = null;

  const current = worker;
  worker = null;
  ready = null;
  current?.terminate();
}

function createWorker(): Worker {
  const scriptUrl = new URL(ENGINE_JS, window.location.origin).href;
  const wasmUrl = new URL(ENGINE_WASM, window.location.origin).href;

  // Stockfish.js is an Emscripten UCI runtime. Configure Module before the
  // runtime is evaluated, and resolve the WASM explicitly because the worker
  // itself is created from a blob URL.
  const bootstrap = `
    self.Module = {
      locateFile: function(file) {
        return file === "stockfish.wasm" ? ${JSON.stringify(wasmUrl)} : file;
      }
    };
    importScripts(${JSON.stringify(scriptUrl)});
  `;

  const blobUrl = URL.createObjectURL(
    new Blob([bootstrap], { type: "application/javascript" }),
  );

  try {
    return new Worker(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function getWorker(): { worker: Worker; ready: Promise<void> } {
  if (worker && ready) return { worker, ready };

  const nextWorker = createWorker();
  worker = nextWorker;

  let resolveReady!: () => void;
  let rejectReady!: (error: Error) => void;
  ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  let settled = false;
  const timeout = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    const error = new Error(
      `Stockfish engine did not initialize within ${INIT_TIMEOUT_MS / 1000} seconds. ` +
      `Check ${ENGINE_JS} and ${ENGINE_WASM} are reachable in production.`,
    );
    rejectReady(error);
    resetWorker(error);
  }, INIT_TIMEOUT_MS);

  const finishReady = (error?: Error) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timeout);
    if (error) rejectReady(error);
    else resolveReady();
  };

  nextWorker.addEventListener("message", (event: MessageEvent) => {
    const line = typeof event.data === "string" ? event.data.trim() : "";
    if (line === "uciok") finishReady();

    if (!line) return;

    if (line.startsWith("info ")) {
      const cp = line.match(/\bscore cp (-?\d+)/);
      const mate = line.match(/\bscore mate (-?\d+)/);
      if (cp) latestScore = Number(cp[1]);
      if (mate) latestMate = Number(mate[1]);
      return;
    }

    if (!line.startsWith("bestmove ") || activeRequestId === null) return;

    const id = activeRequestId;
    const request = pending.get(id);
    activeRequestId = null;
    if (!request) return;

    pending.delete(id);
    request.resolve({
      score: latestScore,
      mate: latestMate,
      bestMove: line.split(/\s+/)[1] || null,
    });
  });

  nextWorker.addEventListener("error", (event) => {
    const error = new Error(event.message || "Stockfish worker failed to load.");
    finishReady(error);
    resetWorker(error);
  });

  // UCI negotiation must start after the message/error listeners are attached.
  nextWorker.postMessage("uci");

  return { worker: nextWorker, ready };
}

export async function analyzePosition(
  fen: string,
  depth = 14,
): Promise<EngineLine> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    throw new Error("Stockfish analysis is only available in a browser.");
  }

  const { worker: sf, ready: engineReady } = getWorker();
  await engineReady;

  if (!worker || worker !== sf) {
    throw new Error("Stockfish worker was reset before analysis could start.");
  }

  // Stockfish is a single UCI engine, so serialize analysis requests.
  if (activeRequestId !== null) sf.postMessage("stop");

  const id = ++sequence;
  latestScore = null;
  latestMate = null;
  activeRequestId = id;

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    sf.postMessage("ucinewgame");
    sf.postMessage(`position fen ${fen}`);
    sf.postMessage(`go depth ${Math.max(8, Math.min(22, depth))}`);
  });
}
