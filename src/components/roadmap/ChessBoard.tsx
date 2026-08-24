import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

type Props = {
  fen: string;
  orientation?: "white" | "black";
  onMove?: (from: string, to: string, afterFen: string) => boolean | void | Promise<boolean | void>;
  disabled?: boolean;
};

export function ChessBoard({ fen, orientation = "white", onMove, disabled = false }: Props) {
  const [position, setPosition] = useState(fen);

  useEffect(() => {
    setPosition(fen);
  }, [fen]);

  const handleDrop = async (source: string, target: string) => {
    if (disabled) return false;

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
    setPosition(nextPosition);

    if (!onMove) return true;

    try {
      const accepted = await onMove(source, target, nextPosition);
      if (accepted === false) {
        setPosition(previousPosition);
        return false;
      }
      return true;
    } catch {
      setPosition(previousPosition);
      return false;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900">
      <Chessboard
        id="outstand-chess-analysis"
        position={position}
        boardOrientation={orientation}
        arePiecesDraggable={!disabled}
        onPieceDrop={(source, target) => handleDrop(source, target)}
        customBoardStyle={{ borderRadius: 16 }}
      />
    </div>
  );
}
