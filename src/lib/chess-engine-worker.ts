export type EngineLine = {
  score: number | null;
  mate: number | null;
  bestMove: string | null;
};

type Pending = {
  resolve: (value: EngineLine) => void;
  reject: (error: Error) => void;
};

let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let sequence = 0;
const pending = new Map<number, Pending>();
let activeRequestId: number | null = null;
let latestScore: number | null = null;
let latestMate: number | null = null;

function createWorker() {
  const scriptUrl = new URL('/stockfish/stockfish-18-lite-single.js', window.location.href).href;
  const wasmUrl = new URL('/stockfish/stockfish-18-lite-single.wasm', window.location.href).href;

  // Stockfish.js 18 is already a Worker-capable UCI runtime. It does NOT
  // expose a `self.Stockfish` global when loaded with importScripts(); in a
  // worker context it initializes itself and communicates through postMessage.
  // The worker-mode hash tells Stockfish exactly where its WASM binary lives.
  const workerUrl = `${scriptUrl}#${encodeURIComponent(wasmUrl)},worker`;
  return new Worker(workerUrl);
}

function getWorker() {
  if (worker) return worker;
  worker = createWorker();

  ready = new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const line = typeof event.data === 'string' ? event.data.trim() : '';
      if (line === 'uciok') {
        worker?.removeEventListener('message', listener);
        resolve();
      }
    };
    worker!.addEventListener('message', listener);
    const timeout = window.setTimeout(() => {
      worker?.removeEventListener('message', listener);
      reject(new Error('Stockfish engine did not initialize within 15 seconds. Check that both Stockfish JS and WASM files are deployed under /stockfish/.'));
    }, 15000);
    const originalResolve = resolve;
    resolve = ((value?: void | PromiseLike<void>) => {
      window.clearTimeout(timeout);
      originalResolve(value);
    }) as typeof resolve;
  });

  worker.addEventListener('message', (event: MessageEvent) => {
    const line = typeof event.data === 'string' ? event.data.trim() : '';
    if (!line) return;

    if (line.startsWith('info ')) {
      const cp = line.match(/\bscore cp (-?\d+)/);
      const mate = line.match(/\bscore mate (-?\d+)/);
      if (cp) latestScore = Number(cp[1]);
      if (mate) latestMate = Number(mate[1]);
      return;
    }

    if (!line.startsWith('bestmove ')) return;
    if (activeRequestId === null) return;

    const bestMove = line.split(/\s+/)[1] || null;
    const request = pending.get(activeRequestId);
    const id = activeRequestId;
    activeRequestId = null;
    if (!request) return;
    pending.delete(id);
    request.resolve({ score: latestScore, mate: latestMate, bestMove });
  });

  worker.addEventListener('error', (event) => {
    const error = new Error(event.message || 'Stockfish worker failed to load.');
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  });

  worker.postMessage('uci');
  return worker;
}

export async function analyzePosition(fen: string, depth = 14): Promise<EngineLine> {
  const sf = getWorker();
  await ready;

  // Stockfish is a single UCI engine, so serialize analysis requests. This
  // prevents a later request from stealing the earlier request's bestmove.
  if (activeRequestId !== null) {
    sf.postMessage('stop');
  }

  const id = ++sequence;
  latestScore = null;
  latestMate = null;
  activeRequestId = id;

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    sf.postMessage('ucinewgame');
    sf.postMessage(`position fen ${fen}`);
    sf.postMessage(`go depth ${Math.max(8, Math.min(22, depth))}`);
  });
}
