import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/hooks/combat-zone/useCombatZoneQuiz";

interface CombatZoneQuestionAreaProps {
  questions: Question[];
  currentQuestion: Question;
  currentQuestionIndex: number;
  markedForReview: Set<string>;
  selectedAnswers: Record<string, string>;
  setCurrentIndex: (index: number) => void;
  handleSelectAnswer: (questionId: string, answer: string) => void;
  labels: string[];
}

export function CombatZoneQuestionArea({
  questions,
  currentQuestion,
  currentQuestionIndex,
  markedForReview,
  selectedAnswers,
  setCurrentIndex,
  handleSelectAnswer,
  labels,
}: CombatZoneQuestionAreaProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-400">
            Target {currentQuestionIndex + 1} of {questions.length}
          </span>
          {markedForReview.has(currentQuestion.id) && (
            <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-500">
              <Flag className="h-3 w-3" /> Marked for Review
            </span>
          )}
        </div>
        <div className="flex h-2 gap-1">
          {questions.map((question, idx) => {
            const isAnswered = Boolean(selectedAnswers[question.id]);
            const isMarked = markedForReview.has(question.id);
            const isCurrent = idx === currentQuestionIndex;
            return (
              <button
                type="button"
                key={question.id}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to question ${idx + 1}`}
                className={cn(
                  "flex-1 rounded-full transition-colors",
                  isCurrent
                    ? "bg-white"
                    : isMarked
                      ? "bg-amber-500"
                      : isAnswered
                        ? "bg-blue-500"
                        : "bg-slate-800",
                )}
              />
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <h3 className="text-xl font-bold leading-relaxed text-white lg:text-2xl">
          {currentQuestion.question_text}
        </h3>
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswers[currentQuestion.id] === option;
            return (
              <button
                type="button"
                key={`${currentQuestion.id}-${option}`}
                onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                  isSelected
                    ? "border-blue-500 bg-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                    isSelected ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400",
                  )}
                >
                  {labels[idx] ?? String(idx + 1)}
                </span>
                <span
                  className={cn(
                    "text-base font-medium",
                    isSelected ? "text-white" : "text-slate-300",
                  )}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
