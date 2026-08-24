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

    const send = (data) => self.postMessage(data);

    function handleLine(line) {
      if (line === 'uciok') {
        send({ type: 'ready' });
        return;
      }

      if (typeof line !== 'string') return;

      if (line.startsWith('bestmove ')) {
        const bestMove = line.split(/\\s+/)[1] || null;
        send({ type: 'bestmove', bestMove });
        return;
      }

      if (!line.startsWith('info ')) return;

      const score = line.match(/score cp (-?\\d+)/);
      const mate = line.match(/score mate (-?\\d+)/);
      const pv = line.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?)/);

      if (score || mate || pv) {
        send({
          type: 'info',
          score: score ? Number(score[1]) : null,
          mate: mate ? Number(mate[1]) : null,
          bestMove: pv ? pv[1] : null,
        });
      }
    }

    try {
      importScripts('/stockfish/stockfish-18-lite-single.js');

      if (!self.Stockfish) {
        throw new Error('Stockfish runtime was not found.');
      }

      // The downloaded Stockfish JS wrapper expects a file named
      // "stockfish.wasm" by default. OUTSTAND intentionally keeps the
      // original asset name, so redirect that lookup to the real file.
      engine = self.Stockfish({
        locateFile: (file) => {
          if (file === 'stockfish.wasm') {
            return '/stockfish/stockfish-18-lite-single.wasm';
          }
          return '/stockfish/' + file;
        },
      });

      if (!engine) throw new Error('Stockfish runtime was not created.');

      if (engine.addMessageListener) {
        engine.addMessageListener(handleLine);
      } else {
        engine.onmessage = handleLine;
      }

      engine.postMessage('uci');
    } catch (error) {
      send({ type: 'error', message: String(error) });
    }

    self.onmessage = (event) => {
      const { type, requestId, payload } = event.data || {};
      if (!engine) return;

      if (type === 'analyze') {
        engine.postMessage('stop');
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
      }

      if (event.data?.type === 'error') {
        worker?.removeEventListener('message', listener);
        reject(new Error(event.data.message));
      }
    };

    worker!.addEventListener('message', listener);
  });

  worker.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type !== 'bestmove') return;

    const [id] = pending.keys();
    if (!id) return;

    const request = pending.get(id);
    pending.delete(id);
    request?.resolve({
      score: null,
      mate: null,
      bestMove: event.data.bestMove || null,
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
    sf.postMessage({
      type: 'analyze',
      requestId: id,
      payload: { fen, depth },
    });
  });
}
