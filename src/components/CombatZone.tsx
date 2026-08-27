import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crosshair, X, Shield, Flag, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Question = {
  id: string;
  dpp_id: string | null;
  question_text: string;
  options: string[];
  correct_answer: string;
};

interface CombatZoneProps {
  dppId: string;
  onClose: () => void;
  onComplete: () => Promise<void>;
}

function parseOptions(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

export function CombatZone({ dppId, onClose, onComplete }: CombatZoneProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [currentQuestionIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchQuestions = async () => {
      setIsLoadingQuiz(true);
      try {
        const { data, error } = await supabase
          .from("dpp_questions")
          .select("id, dpp_id, question_text, options, correct_answer")
          .eq("dpp_id", dppId);
        if (error) throw error;
        if (!cancelled) {
          setQuestions(
            (data ?? []).map((question) => ({
              id: question.id,
              dpp_id: question.dpp_id,
              question_text: question.question_text,
              options: parseOptions(question.options),
              correct_answer: question.correct_answer,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to fetch target data:", error);
        if (!cancelled) setQuestions([]);
      } finally {
        if (!cancelled) setIsLoadingQuiz(false);
      }
    };

    void fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [dppId]);

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const labels = ["A", "B", "C", "D"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#0a0f1a] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#050810] p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <Crosshair className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white lg:text-xl">Combat Zone</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full bg-white/5 p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close combat zone"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-6 lg:p-8">
          {isLoadingQuiz ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              <Crosshair className="mb-4 h-10 w-10 animate-spin text-red-500" />
              <p className="font-mono text-slate-400">Loading targets...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
              <Shield className="h-12 w-12 text-slate-600" />
              <div>
                <h3 className="mb-2 text-xl font-bold text-white">No Intel Found</h3>
                <p className="text-slate-400">Command hasn't loaded any questions for this sector yet.</p>
              </div>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-500 disabled:opacity-50">
                Force Complete Sector
              </button>
            </div>
          ) : currentQuestion ? (
            <div className="flex h-full flex-col">
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">Target {currentQuestionIndex + 1} of {questions.length}</span>
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
                          isCurrent ? "bg-white" : isMarked ? "bg-amber-500" : isAnswered ? "bg-blue-500" : "bg-slate-800",
                        )}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 space-y-8">
                <h3 className="text-xl font-bold leading-relaxed text-white lg:text-2xl">{currentQuestion.question_text}</h3>
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
                          isSelected ? "border-blue-500 bg-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                        )}
                      >
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold", isSelected ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400")}>
                          {labels[idx] ?? String(idx + 1)}
                        </span>
                        <span className={cn("text-base font-medium", isSelected ? "text-white" : "text-slate-300")}>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {questions.length > 0 && !isLoadingQuiz && currentQuestion && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-800 bg-[#050810] p-4 lg:p-6">
            <div className="flex gap-2">
              <button type="button" onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 font-semibold text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
              </button>
              <button type="button" onClick={() => toggleMarkForReview(currentQuestion.id)} className={cn("flex items-center gap-2 rounded-lg border px-4 py-2.5 font-semibold transition-colors", markedForReview.has(currentQuestion.id) ? "border-amber-500/50 bg-amber-500/10 text-amber-500" : "border-white/10 text-slate-300 hover:bg-white/5")}>
                <Flag className="h-4 w-4" /> <span className="hidden sm:inline">Mark</span>
              </button>
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-8 py-2.5 font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500 disabled:opacity-50">
                <CheckCircle2 className="h-5 w-5" /> Submit Sector
              </button>
            ) : (
              <button type="button" onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:bg-blue-500">
                <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
