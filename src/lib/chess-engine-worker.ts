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

function createWorker(): Worker {
  const scriptUrl = new URL('/stockfish/stockfish-18-lite-single.js', window.location.href).href;
  const wasmUrl = new URL('/stockfish/stockfish-18-lite-single.wasm', window.location.href).href;

  // Stockfish.js 18 is an Emscripten UCI runtime. It expects its Emscripten
  // Module configuration to exist BEFORE importScripts() evaluates the JS.
  // A blob worker lets us provide locateFile() without changing the user's
  // exact WASM filename and without relying on fragile URL fragments.
  const bootstrap = `
    self.Module = {
      locateFile: function(file) {
        if (file === 'stockfish.wasm') return ${JSON.stringify(wasmUrl)};
        return file;
      }
    };
    importScripts(${JSON.stringify(scriptUrl)});
  `;

  const blob = new Blob([bootstrap], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  const engineWorker = new Worker(blobUrl);
  URL.revokeObjectURL(blobUrl);
  return engineWorker;
}

function getWorker(): Worker {
  if (worker) return worker;
  worker = createWorker();

  ready = new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      worker?.removeEventListener('message', listener);
      window.clearTimeout(timeout);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const listener = (event: MessageEvent) => {
      const line = typeof event.data === 'string' ? event.data.trim() : '';
      if (line === 'uciok') finish();
    };
    const timeout = window.setTimeout(() => {
      finish(new Error('Stockfish engine did not initialize within 15 seconds. Check that both Stockfish JS and WASM files are deployed under /stockfish/.'));
    }, 15000);

    worker!.addEventListener('message', listener);
    worker!.addEventListener('error', (event) => {
      finish(new Error(event.message || 'Stockfish worker failed to load.'));
    }, { once: true });
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

    if (!line.startsWith('bestmove ') || activeRequestId === null) return;

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

  worker.addEventListener('error', (event) => {
    const error = new Error(event.message || 'Stockfish worker failed to load.');
    for (const request of pending.values()) request.reject(error);
    pending.clear();
    activeRequestId = null;
    ready = null;
  });

  worker.postMessage('uci');
  return worker;
}

export async function analyzePosition(fen: string, depth = 14): Promise<EngineLine> {
  const sf = getWorker();
  await ready;

  // Stockfish is a single UCI engine, so serialize analysis requests.
  if (activeRequestId !== null) sf.postMessage('stop');

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
