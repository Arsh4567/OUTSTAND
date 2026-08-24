import { Chessboard } from "react-chessboard";

type Props = { fen: string; orientation?: "white" | "black"; onMove?: (from: string, to: string) => void; disabled?: boolean };

export function ChessBoard({ fen, orientation = "white", onMove, disabled = false }: Props) {
  return <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900"><Chessboard position={fen} boardOrientation={orientation} arePiecesDraggable={!disabled} onPieceDrop={(source, target) => { onMove?.(source, target); return Boolean(onMove); }} customBoardStyle={{ borderRadius: 16 }} /></div>;
}
