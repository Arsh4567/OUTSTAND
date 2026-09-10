import { Flag, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CombatZoneFooterProps {
  questionsLength: number;
  currentQuestionIndex: number;
  currentQuestionId: string;
  setCurrentIndex: (value: number | ((prev: number) => number)) => void;
  toggleMarkForReview: (id: string) => void;
  markedForReview: Set<string>;
  handleSubmit: () => void;
  isSubmitting: boolean;
}

export function CombatZoneFooter({
  questionsLength,
  currentQuestionIndex,
  currentQuestionId,
  setCurrentIndex,
  toggleMarkForReview,
  markedForReview,
  handleSubmit,
  isSubmitting,
}: CombatZoneFooterProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-800 bg-[#050810] p-4 lg:p-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 font-semibold text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          type="button"
          onClick={() => toggleMarkForReview(currentQuestionId)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-2.5 font-semibold transition-colors",
            markedForReview.has(currentQuestionId)
              ? "border-amber-500/50 bg-amber-500/10 text-amber-500"
              : "border-white/10 text-slate-300 hover:bg-white/5",
          )}
        >
          <Flag className="h-4 w-4" /> <span className="hidden sm:inline">Mark</span>
        </button>
      </div>

      {currentQuestionIndex === questionsLength - 1 ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-8 py-2.5 font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500 disabled:opacity-50"
        >
          <CheckCircle2 className="h-5 w-5" /> Submit Sector
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.min(questionsLength - 1, prev + 1))}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:bg-blue-500"
        >
          <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
