import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, Circle, Eye, Calculator, Award, Sparkles } from 'lucide-react';
import { scienceQuestions, Question } from '../data/scienceQuestions';
// import { mathsQuestions } from '../data/mathsQuestions'; // Uncomment when ready

// --- ANIMATED CRYSTAL BACKGROUND ---
const CrystalBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-3xl">
    {/* Ambient Glows */}
    <motion.div animate={{ y: [0, -30, 0], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
    <motion.div animate={{ y: [0, 40, 0], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
    
    {/* Moving Crystals */}
    <motion.div 
      animate={{ y: [0, -50, 0], x: [0, 30, 0], rotate: [0, 180, 360] }} 
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }} 
      className="absolute top-20 right-[10%] w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-400/5 backdrop-blur-md border border-white/5 shadow-[0_0_30px_rgba(56,189,248,0.15)]" 
      style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} 
    />
    <motion.div 
      animate={{ y: [0, 60, 0], x: [0, -40, 0], rotate: [360, 180, 0] }} 
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }} 
      className="absolute bottom-40 left-[5%] w-24 h-48 bg-gradient-to-br from-purple-500/10 to-fuchsia-400/5 backdrop-blur-md border border-white/5 shadow-[0_0_30px_rgba(192,132,252,0.15)]" 
      style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} 
    />
  </div>
);

const HighYieldBank: React.FC = () => {
  const [activeSubject, setActiveSubject] = useState<'Science' | 'Mathematics'>('Science');
  
  // LocalStorage state for completed questions
  const [completedQs, setCompletedQs] = useState<string[]>([]);
  
  // Load progress on mount
  useEffect(() => {
    const saved = localStorage.getItem('outstand-completed-qs');
    if (saved) setCompletedQs(JSON.parse(saved));
  }, []);

  // Save progress on change
  const toggleCompletion = (id: string) => {
    setCompletedQs((prev) => {
      const next = prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id];
      localStorage.setItem('outstand-completed-qs', JSON.stringify(next));
      return next;
    });
  };

  const allQuestions = useMemo(() => {
    const mathsQuestions: Question[] = []; 
    return [...scienceQuestions, ...mathsQuestions];
  }, []);

  const groupedQuestions = useMemo(() => {
    const filtered = allQuestions.filter((q) => q.subject === activeSubject);
    return filtered.reduce((acc, question) => {
      if (!acc[question.chapter]) acc[question.chapter] = [];
      acc[question.chapter].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [allQuestions, activeSubject]);

  return (
    <div className="relative w-full min-h-[80vh] text-slate-200 py-8 px-2 sm:px-6 z-10 overflow-hidden bg-[#050810]/50 rounded-3xl border border-white/5 shadow-2xl">
      <CrystalBackground />
      
      <div className="relative z-10 w-full mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center gap-4 tracking-tight mb-4"
          >
            <Award className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
            High-Yield Bank
          </motion.h1>
          <p className="text-base sm:text-lg text-slate-400 font-medium">
            Master the most frequently asked CBSE Class 10 Board questions.
          </p>
        </div>

        {/* Subject Toggle */}
        <div className="flex justify-center mb-12">
          <div className="flex p-1.5 space-x-2 bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <button
              onClick={() => setActiveSubject('Science')}
              className={`relative flex items-center gap-2.5 px-6 py-3 text-sm sm:text-base font-bold transition-all duration-300 rounded-xl ${
                activeSubject === 'Science' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {activeSubject === 'Science' && (
                <motion.div layoutId="hybSubjectTab" className="absolute inset-0 bg-blue-600/20 border border-blue-500/50 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
              )}
              <BookOpen className="relative z-10 w-5 h-5" /> 
              <span className="relative z-10">Science</span>
            </button>
            
            <button
              onClick={() => setActiveSubject('Mathematics')}
              className={`relative flex items-center gap-2.5 px-6 py-3 text-sm sm:text-base font-bold transition-all duration-300 rounded-xl ${
                activeSubject === 'Mathematics' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {activeSubject === 'Mathematics' && (
                <motion.div layoutId="hybSubjectTab" className="absolute inset-0 bg-purple-600/20 border border-purple-500/50 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.2)]" />
              )}
              <Calculator className="relative z-10 w-5 h-5" /> 
              <span className="relative z-10">Mathematics</span>
            </button>
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-16">
          {Object.entries(groupedQuestions).map(([chapter, questions]) => {
            const chapterCompletedCount = questions.filter(q => completedQs.includes(q.id)).length;
            const progressPercentage = Math.round((chapterCompletedCount / questions.length) * 100);
            const isFullyCompleted = progressPercentage === 100;

            return (
              <motion.div 
                key={chapter} 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
                className="space-y-6"
              >
                {/* Chapter Header with Progress */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
                      {chapter}
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-32 sm:w-48 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${isFullyCompleted ? 'bg-emerald-400' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]'}`}
                        />
                      </div>
                      <span className={`text-sm font-bold ${isFullyCompleted ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {progressPercentage}% Mastered
                      </span>
                    </div>
                  </div>
                  
                  {isFullyCompleted && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-bold animate-pulse">
                      <Sparkles className="w-4 h-4" /> Sector Cleared
                    </div>
                  )}
                </div>

                {/* Question Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {questions.map((q, index) => (
                    <QuestionCard 
                      key={q.id} 
                      question={q} 
                      index={index + 1} 
                      isCompleted={completedQs.includes(q.id)}
                      onToggle={() => toggleCompletion(q.id)}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
          
          {Object.keys(groupedQuestions).length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Circle className="w-12 h-12 mb-4 text-slate-700 animate-pulse" />
              <p className="text-lg font-medium">Archival data for {activeSubject} is compiling. Check back soon.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- QUESTION CARD COMPONENT ---
interface QuestionCardProps {
  question: Question;
  index: number;
  isCompleted: boolean;
  onToggle: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, isCompleted, onToggle }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isSubjective = question.options.length === 0;

  const handleOptionClick = (option: string) => {
    if (isRevealed) return; 
    setSelectedOption(option);
    setIsRevealed(true);
    
    // Auto-mark complete if objective is answered correctly (Optional behavior, currently user must manually toggle for full control)
    // if (option === question.correct_answer && !isCompleted) onToggle();
  };

  return (
    <motion.div 
      layout
      className={`relative p-6 rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
        isCompleted 
          ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
          : 'bg-[#0a0f1a]/80 backdrop-blur-md border-white/10 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
      }`}
    >
      <div>
        {/* Card Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-950 border border-blue-800 text-blue-400 font-black text-sm shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              Q{index}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
              {question.target_year}
            </span>
          </div>

          {/* Completion Toggle */}
          <button 
            onClick={onToggle}
            className="group flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            title="Mark as completed"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            ) : (
              <Circle className="w-7 h-7 text-slate-600 group-hover:text-blue-400 transition-colors" />
            )}
          </button>
        </div>

        {/* Question Text */}
        <h3 className="text-lg lg:text-xl font-semibold text-slate-200 mb-6 whitespace-pre-line leading-relaxed">
          {question.question_text}
        </h3>

        {/* Interaction Area (Objective vs Subjective) */}
        {!isSubjective ? (
          <div className="space-y-3 mb-6">
            {question.options.map((option, i) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === question.correct_answer;
              
              let buttonStyle = "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300";
              
              if (isRevealed) {
                if (isCorrect) buttonStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
                else if (isSelected && !isCorrect) buttonStyle = "bg-red-500/20 border-red-500/50 text-red-400";
                else buttonStyle = "bg-white/5 border-white/5 text-slate-500 opacity-50";
              } else if (isSelected) {
                buttonStyle = "bg-blue-500/20 border-blue-500/50 text-blue-400";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleOptionClick(option)}
                  disabled={isRevealed}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all font-medium ${buttonStyle}`}
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
                className="flex items-center justify-center w-full gap-2 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold rounded-xl transition-all"
              >
                <Eye className="w-5 h-5" /> Decrypt Solution
              </button>
            )}
          </div>
        )}
      </div>

      {/* Explanation Area (Animated) */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-5 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold tracking-wide">
                <CheckCircle2 className="w-5 h-5" /> 
                {isSubjective ? "Official Solution & Analysis" : "Detailed Explanation"}
              </div>
              <p className="text-slate-400 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {question.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HighYieldBank;
                                                
