import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, Eye, Calculator, Award } from 'lucide-react';
import { scienceQuestions, Question } from '../data/scienceQuestions';
// import { mathsQuestions } from '../data/mathsQuestions'; // Uncomment when ready

const HighYieldBank: React.FC = () => {
  const [activeSubject, setActiveSubject] = useState<'Science' | 'Mathematics'>('Science');

  // Combine both banks (fallback to empty array for maths until it's ready)
  const allQuestions = useMemo(() => {
    const mathsQuestions: Question[] = []; // Replace with actual import later
    return [...scienceQuestions, ...mathsQuestions];
  }, []);

  // Filter and group questions by chapter
  const groupedQuestions = useMemo(() => {
    const filtered = allQuestions.filter((q) => q.subject === activeSubject);
    
    return filtered.reduce((acc, question) => {
      if (!acc[question.chapter]) {
        acc[question.chapter] = [];
      }
      acc[question.chapter].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [allQuestions, activeSubject]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
            <Award className="w-10 h-10 text-indigo-600" />
            High-Yield Bank
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Master the most frequently asked CBSE Class 10 Board questions.
          </p>
        </div>

        {/* Subject Toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex p-1 space-x-1 bg-slate-200 rounded-xl shadow-sm">
            <button
              onClick={() => setActiveSubject('Science')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeSubject === 'Science'
                  ? 'bg-white text-indigo-700 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Science
            </button>
            <button
              onClick={() => setActiveSubject('Mathematics')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeSubject === 'Mathematics'
                  ? 'bg-white text-indigo-700 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4" /> Mathematics
            </button>
          </div>
        </div>

        {/* Questions List Grouped by Chapter */}
        <div className="space-y-12">
          {Object.entries(groupedQuestions).map(([chapter, questions]) => (
            <div key={chapter} className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 border-b-2 border-indigo-100 pb-2">
                {chapter}
              </h2>
              <div className="grid gap-6">
                {questions.map((q, index) => (
                  <QuestionCard key={q.id} question={q} index={index + 1} />
                ))}
              </div>
            </div>
          ))}
          
          {Object.keys(groupedQuestions).length === 0 && (
            <div className="text-center py-20 text-slate-500">
              <p>Question bank for {activeSubject} is currently being updated. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual questions
const QuestionCard: React.FC<{ question: Question; index: number }> = ({ question, index }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isSubjective = question.options.length === 0;

  const handleOptionClick = (option: string) => {
    if (isRevealed) return; // Prevent changing answer after reveal
    setSelectedOption(option);
    setIsRevealed(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
    >
      <div className="p-6">
        {/* Card Header */}
        <div className="flex justify-between items-start mb-4">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
            Q{index}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            {question.target_year}
          </span>
        </div>

        {/* Question Text */}
        <h3 className="text-lg font-medium text-slate-900 mb-6 whitespace-pre-line">
          {question.question_text}
        </h3>

        {/* Interaction Area (Smart Logic for Subjective vs Objective) */}
        {!isSubjective ? (
          <div className="space-y-3 mb-6">
            {question.options.map((option, i) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === question.correct_answer;
              
              let buttonStyle = "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700";
              
              if (isRevealed) {
                if (isCorrect) buttonStyle = "bg-green-50 border-green-500 text-green-700";
                else if (isSelected && !isCorrect) buttonStyle = "bg-red-50 border-red-500 text-red-700";
                else buttonStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
              } else if (isSelected) {
                buttonStyle = "bg-indigo-50 border-indigo-500 text-indigo-700";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleOptionClick(option)}
                  disabled={isRevealed}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${buttonStyle}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-4">
            {!isRevealed && (
              <button
                onClick={() => setIsRevealed(true)}
                className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
              >
                <Eye className="w-4 h-4" /> Reveal Solution
              </button>
            )}
          </div>
        )}

        {/* Explanation Area (Animated) */}
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-green-600 font-semibold">
                  <CheckCircle className="w-5 h-5" /> 
                  {isSubjective ? "Solution & Explanation" : "Explanation"}
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {question.explanation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};

export default HighYieldBank;
            
