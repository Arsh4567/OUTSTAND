import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Question = {
  id: string;
  dpp_id: string | null;
  question_text: string;
  options: string[];
  correct_answer: string;
  created_at: string | null;
};

export function parseOptions(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

export function useCombatZoneQuiz({
  dppId,
  onComplete,
}: {
  dppId: string;
  onComplete: () => Promise<void>;
}) {
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
              created_at: null,
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

  return {
    questions,
    isLoadingQuiz,
    currentQuestionIndex,
    setCurrentIndex,
    selectedAnswers,
    markedForReview,
    isSubmitting,
    toggleMarkForReview,
    handleSelectAnswer,
    handleSubmit,
  };
}
