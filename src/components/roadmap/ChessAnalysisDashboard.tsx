import { useEffect, useMemo, useState } from "react";
import { BarChart3, Brain, CheckCircle2, ChevronLeft, ChevronRight, Crown, Loader2, RefreshCw, Target, TrendingUp } from "lucide-react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/roadmap/ChessBoard";
import { analyzePosition, type EngineLine } from "@/lib/chess-engine-worker";
import { aggregateChessComGames, type ChessComGame, type ChessGameAnalysis, parseAnnotatedMoves } from "@/lib/chess-game-analysis";

type Props = { username: string };
type TrainerPosition = { fen: string; san: string; moveNumber: number; side: "w" | "b"; uci: string };

action function pct(value: number) { return `${value}%`; }
