import { motion } from "framer-motion";
import { useCombatZoneQuiz } from "@/hooks/combat-zone/useCombatZoneQuiz";
import { CombatZoneHeader } from "./combat-zone/CombatZoneHeader";
import { CombatZoneEmptyState } from "./combat-zone/CombatZoneEmptyState";
import { CombatZoneLoadingState } from "./combat-zone/CombatZoneLoadingState";
import { CombatZoneQuestionArea } from "./combat-zone/CombatZoneQuestionArea";
import { CombatZoneFooter } from "./combat-zone/CombatZoneFooter";

interface CombatZoneProps {
  dppId: string;
  onClose: () => void;
  onComplete: () => Promise<void>;
}

export function CombatZone({ dppId, onClose, onComplete }: CombatZoneProps) {
  const {
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
  } = useCombatZoneQuiz({ dppId, onComplete });

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
        <CombatZoneHeader onClose={onClose} isSubmitting={isSubmitting} />

        <div className="flex flex-1 flex-col overflow-y-auto p-6 lg:p-8">
          {isLoadingQuiz ? (
            <CombatZoneLoadingState />
          ) : questions.length === 0 ? (
            <CombatZoneEmptyState handleSubmit={handleSubmit} isSubmitting={isSubmitting} />
          ) : currentQuestion ? (
            <CombatZoneQuestionArea
              questions={questions}
              currentQuestion={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              markedForReview={markedForReview}
              selectedAnswers={selectedAnswers}
              setCurrentIndex={setCurrentIndex}
              handleSelectAnswer={handleSelectAnswer}
              labels={labels}
            />
          ) : null}
        </div>

        {questions.length > 0 && !isLoadingQuiz && currentQuestion && (
          <CombatZoneFooter
            questionsLength={questions.length}
            currentQuestionIndex={currentQuestionIndex}
            currentQuestionId={currentQuestion.id}
            setCurrentIndex={setCurrentIndex}
            toggleMarkForReview={toggleMarkForReview}
            markedForReview={markedForReview}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
