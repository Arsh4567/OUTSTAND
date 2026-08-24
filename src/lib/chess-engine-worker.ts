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

function createWorker() {
  const source = `
    let engine = null;
    let activeRequestId = null;
    let latestScore = null;
    let latestMate = null;
    let latestPvMove = null;

    const send = (data) => self.postMessage(data);

    function resetAnalysis(requestId) {
      activeRequestId = requestId;
      latestScore = null;
      latestMate = null;
      latestPvMove = null;
    }

    function handleLine(line) {
      if (line === 'uciok') {
        send({ type: 'ready' });
        return;
      }
      if (typeof line !== 'string') return;

      if (line.startsWith('info ')) {
        const score = line.match(/score cp (-?\\d+)/);
        const mate = line.match(/score mate (-?\\d+)/);
        const pv = line.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (score) latestScore = Number(score[1]);
        if (mate) latestMate = Number(mate[1]);
        if (pv) latestPvMove = pv[1];
        return;
      }

      if (line.startsWith('bestmove ')) {
        const bestMove = line.split(/\\s+/)[1] || latestPvMove || null;
        send({
          type: 'result',
          requestId: activeRequestId,
          score: latestScore,
          mate: latestMate,
          bestMove,
        });
        activeRequestId = null;
      }
    }

    try {
      importScripts('/stockfish/stockfish-18-lite-single.js');
      if (!self.Stockfish) throw new Error('Stockfish runtime was not found.');
      engine = self.Stockfish({
        locateFile: (file) => file === 'stockfish.wasm'
          ? '/stockfish/stockfish-18-lite-single.wasm'
          : '/stockfish/' + file,
      });
      if (!engine) throw new Error('Stockfish runtime was not created.');
      if (engine.addMessageListener) engine.addMessageListener(handleLine);
      else engine.onmessage = handleLine;
      engine.postMessage('uci');
    } catch (error) {
      send({ type: 'error', message: String(error) });
    }

    self.onmessage = (event) => {
      const { type, requestId, payload } = event.data || {};
      if (!engine) return;
      if (type === 'analyze') {
        engine.postMessage('stop');
        resetAnalysis(requestId);
        engine.postMessage('ucinewgame');
        engine.postMessage('position fen ' + payload.fen);
        engine.postMessage('go depth ' + Math.max(8, Math.min(22, payload.depth || 14)));
      }
    };
  `;

  const blob = new Blob([source], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

function getWorker() {
  if (worker) return worker;
  worker = createWorker();
  ready = new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      if (event.data?.type === 'ready') {
        worker?.removeEventListener('message', listener);
        resolve();
      } else if (event.data?.type === 'error') {
        worker?.removeEventListener('message', listener);
        reject(new Error(event.data.message));
      }
    };
    worker!.addEventListener('message', listener);
  });

  worker.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type === 'error') {
      const error = new Error(String(event.data.message || 'Stockfish worker failed.'));
      for (const request of pending.values()) request.reject(error);
      pending.clear();
      return;
    }
    if (event.data?.type !== 'result') return;
    const id = Number(event.data.requestId);
    const request = pending.get(id);
    if (!request) return;
    pending.delete(id);
    request.resolve({
      score: typeof event.data.score === 'number' ? event.data.score : null,
      mate: typeof event.data.mate === 'number' ? event.data.mate : null,
      bestMove: typeof event.data.bestMove === 'string' ? event.data.bestMove : null,
    });
  });

  return worker;
}

export async function analyzePosition(fen: string, depth = 14): Promise<EngineLine> {
  const sf = getWorker();
  await ready;
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    sf.postMessage({ type: 'analyze', requestId: id, payload: { fen, depth } });
  });
}
