import { ChessAnalysisDashboard } from "./ChessAnalysisDashboard";

export function ChessAnalysisSection({ username }: { username?: string | null }) {
  if (!username) return null;
  return <ChessAnalysisDashboard username={username} />;
}
