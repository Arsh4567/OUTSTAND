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
const INIT_TIMEOUT_MS = 20_000;

let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let sequence = 0;
const pending = new Map<number, Pending>();
let activeRequestId: number | null = null;
let latestScore: number | null = null;
let latestMate: number | null = null;

function engineError(message: string) {
  return new Error(`Stockfish: ${message}`);
}

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

  // Stockfish.js is an Emscripten UCI runtime. The engine JS looks up
  // `stockfish.wasm` relative to its runtime context, but this worker is
  // created from a blob URL. Configure Module before importScripts() so the
  // WASM request always resolves to our deployed /stockfish asset.
  const bootstrap = [
    "self.Module = {",
    `  locateFile: function(file) { return file === 'stockfish.wasm' ? ${JSON.stringify(wasmUrl)} : file; },`,
    "};",
    `importScripts(${JSON.stringify(scriptUrl)});`,
  ].join("\n");

  const blob = new Blob([bootstrap], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    return new Worker(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function verifyAsset(url: string) {
  const response = await fetch(url, { method: "HEAD", cache: "no-store" });
  if (!response.ok) {
    throw engineError(`engine asset is not reachable (${response.status}): ${url}`);
  }
}

async function getWorker(): Promise<{ worker: Worker; ready: Promise<void> }> {
  if (worker && ready) return { worker, ready };

  await Promise.all([verifyAsset(ENGINE_JS), verifyAsset(ENGINE_WASM)]);

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
    const error = engineError(
      `did not initialize within ${INIT_TIMEOUT_MS / 1000}s. ` +
        `The JS/WASM files may be blocked, mis-served, or incompatible.`,
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
    const error = engineError(event.message || "worker failed to load.");
    finishReady(error);
    resetWorker(error);
  });

  nextWorker.postMessage("uci");
  return { worker: nextWorker, ready };
}

export async function analyzePosition(fen: string, depth = 14): Promise<EngineLine> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    throw engineError("analysis is only available in a browser.");
  }

  const { worker: sf, ready: engineReady } = await getWorker();
  await engineReady;

  if (!worker || worker !== sf) {
    throw engineError("worker was reset before analysis could start.");
  }

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
