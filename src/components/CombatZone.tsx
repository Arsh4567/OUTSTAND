// components/CombatZone.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Crosshair, 
  X, 
  Shield, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Define our types
interface Question {
  id: string;
  dpp_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
}

interface CombatZoneProps {
  dppId: string;
  onClose: () => void;
  onComplete: () => Promise<void>;
}

export function CombatZone({ dppId, onClose, onComplete }: CombatZoneProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  
  const [currentQuestionIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoadingQuiz(true);
      try {
        const { data, error } = await supabase
          .from('dpp_questions')
          .select('*')
          .eq('dpp_id', dppId);
          
        if (error) throw error;
        setQuestions(data || []);
      } catch (error) {
        console.error("Failed to fetch target data:", error);
      } finally {
        setIsLoadingQuiz(false);
      }
    };

    fetchQuestions();
  }, [dppId]);

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) newSet.delete(questionId);
      else newSet.add(questionId);
      return newSet;
    });
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // In the future, you can calculate the exact score here before calling onComplete
    await onComplete();
    setIsSubmitting(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl max-h-[90vh] bg-[#0a0f1a] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-800 bg-[#050810]">
          <div className="flex items-center gap-3">
            <Crosshair className="h-5 w-5 text-red-500" />
            <h2 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase">Combat Zone</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quiz Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8 flex flex-col">
          {isLoadingQuiz ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Crosshair className="h-10 w-10 text-red-500 animate-spin mb-4" />
              <p className="text-slate-400 font-mono">Loading targets...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <Shield className="h-12 w-12 text-slate-600" />
              <div>
                <h3 className="text-xl font-bold text-white mb-2">No Intel Found</h3>
                <p className="text-slate-400">Command hasn't loaded any questions for this sector yet.</p>
              </div>
              <button onClick={handleSubmit} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">
                Force Complete Sector
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Progress Bar & Review Markers */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-400">Target {currentQuestionIndex + 1} of {questions.length}</span>
                  {markedForReview.has(questions[currentQuestionIndex].id) && (
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded">
                      <Flag className="h-3 w-3" /> Marked for Review
                    </span>
                  )}
                </div>
                <div className="flex gap-1 h-2">
                  {questions.map((q, idx) => {
                    const isAnswered = !!selectedAnswers[q.id];
                    const isMarked = markedForReview.has(q.id);
                    const isCurrent = idx === currentQuestionIndex;
                    
                    return (
                      <div 
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                          "flex-1 rounded-full cursor-pointer transition-colors",
                          isCurrent ? "bg-white" :
                          isMarked ? "bg-amber-500" :
                          isAnswered ? "bg-blue-500" : "bg-slate-800"
                        )}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Question Display */}
              <div className="flex-1 space-y-8">
                <h3 className="text-xl lg:text-2xl font-bold text-white leading-relaxed">
                  {questions[currentQuestionIndex].question_text}
                </h3>
                
                <div className="space-y-3">
                  {questions[currentQuestionIndex].options.map((option, idx) => {
                    const isSelected = selectedAnswers[questions[currentQuestionIndex].id] === option;
                    const labels = ['A', 'B', 'C', 'D'];
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectAnswer(questions[currentQuestionIndex].id, option)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200",
                          isSelected 
                            ? "bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        <span className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold shrink-0",
                          isSelected ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"
                        )}>
                          {labels[idx]}
                        </span>
                        <span className={cn("text-base font-medium", isSelected ? "text-white" : "text-slate-300")}>
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        {questions.length > 0 && !isLoadingQuiz && (
          <div className="p-4 lg:p-6 border-t border-slate-800 bg-[#050810] flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2.5 rounded-lg border border-white/10 text-slate-300 font-semibold hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
              </button>
              <button
                onClick={() => toggleMarkForReview(questions[currentQuestionIndex].id)}
                className={cn(
                  "px-4 py-2.5 rounded-lg border font-semibold flex items-center gap-2 transition-colors",
                  markedForReview.has(questions[currentQuestionIndex].id)
                    ? "border-amber-500/50 text-amber-500 bg-amber-500/10"
                    : "border-white/10 text-slate-300 hover:bg-white/5"
                )}
              >
                <Flag className="h-4 w-4" /> <span className="hidden sm:inline">Mark</span>
              </button>
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <CheckCircle2 className="h-5 w-5 animate-pulse" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Submit Sector
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2 transition-all"
              >
                <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
        }
                
