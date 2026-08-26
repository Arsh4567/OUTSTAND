import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

type Props = {
  fen: string;
  orientation?: "white" | "black";
  onMove?: (from: string, to: string, afterFen: string) => boolean | void | Promise<boolean | void>;
  disabled?: boolean;
};

const BOARD_ID = "outstand-chess-analysis";

function squareStyle(square: string, selected: string | null, legalTargets: string[]) {
  if (selected === square) return { background: "rgba(34, 211, 238, .38)" };
  if (legalTargets.includes(square)) return { background: "radial-gradient(circle, rgba(34, 211, 238, .58) 0 16%, rgba(34, 211, 238, 0) 18%)" };
  return undefined;
}

export function ChessBoard({ fen, orientation = "white", onMove, disabled = false }: Props) {
  const [position, setPosition] = useState(fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPosition(fen);
    setSelected(null);
    setLastMove(null);
  }, [fen]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  const legalTargets = useMemo(() => {
    if (!selected) return [];
    try {
      const game = new Chess(position);
      return game.moves({ square: selected as any, verbose: true }).map((move) => move.to);
    } catch {
      return [];
    }
  }, [position, selected]);

  const commitMove = async (source: string, target: string) => {
    if (disabled || busy) return false;
    const game = new Chess(position);

    let move;
    try {
      move = game.move({ from: source, to: target, promotion: "q" });
    } catch {
      return false;
    }
    if (!move) return false;

    const previousPosition = position;
    const nextPosition = game.fen();
    setBusy(true);
    setPosition(nextPosition);
    setSelected(null);
    setLastMove({ from: source, to: target });

    if (!onMove) {
      setBusy(false);
      return true;
    }

    try {
      const accepted = await onMove(source, target, nextPosition);
      if (accepted === false) {
        setPosition(previousPosition);
        setLastMove(null);
        return false;
      }
      return true;
    } catch {
      setPosition(previousPosition);
      setLastMove(null);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = async (source: string, target: string) => commitMove(source, target);

  const handleSquareClick = async (square: string) => {
    if (disabled || busy) return;

    if (selected && legalTargets.includes(square)) {
      await commitMove(selected, square);
      return;
    }

    try {
      const game = new Chess(position);
      const piece = game.get(square as any);
      const ownedByTurn = piece?.color === game.turn();
      setSelected(piece && ownedByTurn ? square : null);
    } catch {
      setSelected(null);
    }
  };

  const board = (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-slate-950/95 shadow-[0_30px_90px_-65px_rgba(34,211,238,.65)]">
      <Chessboard
        id={BOARD_ID}
        position={position}
        boardOrientation={orientation}
        arePiecesDraggable={!disabled && !busy}
        onPieceDrop={(source, target) => handleDrop(source, target)}
        onSquareClick={(square) => void handleSquareClick(square)}
        customSquareStyles={{
          ...(lastMove ? {
            [lastMove.from]: { backgroundColor: "rgba(250, 204, 21, .16)" },
            [lastMove.to]: { backgroundColor: "rgba(250, 204, 21, .25)" },
          } : {}),
          ...(selected ? { [selected]: { backgroundColor: "rgba(34, 211, 238, .34)" } } : {}),
          ...Object.fromEntries(legalTargets.map((square) => [square, squareStyle(square, selected, legalTargets)])),
        }}
        customBoardStyle={{ borderRadius: 20 }}
        customLightSquareStyle={{ backgroundColor: "#d8dee7" }}
        customDarkSquareStyle={{ backgroundColor: "#5d7892" }}
      />
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        {busy ? <span className="rounded-full border border-cyan-200/15 bg-slate-950/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] text-cyan-100/80 backdrop-blur">Checking move…</span> : <span />}
        <button
          type="button"
          onClick={() => setFullscreen((value) => !value)}
          aria-label={fullscreen ? "Exit fullscreen board" : "Open fullscreen board"}
          className="pointer-events-auto grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-950/80 text-slate-300 shadow-lg backdrop-blur transition hover:border-cyan-200/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );

  if (!fullscreen) return <div className="w-full max-w-[680px]">{board}</div>;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/96 p-3 backdrop-blur-xl sm:p-6">
      <div className="flex w-full max-w-4xl flex-col items-center gap-4">
        <div className="flex w-full items-center justify-between px-1 text-[10px] font-black uppercase tracking-[.18em] text-slate-500">
          <span>Fullscreen board</span>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-black text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            <Minimize2 className="h-3.5 w-3.5" /> Exit
          </button>
        </div>
        <div className="w-full max-w-[min(88vh,88vw)]">{board}</div>
      </div>
    </div>
  );
}
