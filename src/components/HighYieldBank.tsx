import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calculator, ChevronRight, ChevronLeft, Search, 
  CheckCircle2, Circle, Award, Zap, BrainCircuit, Sparkles, Check
} from 'lucide-react';
import { scienceQuestions, Question } from '../data/scienceQuestions';
// import { mathsQuestions } from '../data/mathsQuestions'; // Uncomment when ready

const HighYieldBank: React.FC = () => {
  const [activeSubject, setActiveSubject] = useState<'Science' | 'Mathematics'>('Science');
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  
  // LocalStorage state for completed questions
  const [completedQs, setCompletedQs] = useState<string[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('outstand-completed-qs');
    if (saved) setCompletedQs(JSON.parse(saved));
  }, []);

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

  const getAbbreviation = (title: string) => {
    const words = title.replace(/and|&/gi, '').split(' ').filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return title.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative w-full min-h-[85vh] bg-[#02040a] text-slate-200 py-6 sm:py-8 px-4 sm:px-6 rounded-[2rem] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        
        <AnimatePresence mode="wait">
          
          {/* ========================================= */}
          {/* LIST VIEW (The Outstand Chapter Menu)     */}
          {/* ========================================= */}
          {!activeChapter ? (
            <motion.div 
              key="list-view"
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    <Zap className="w-7 h-7 text-blue-400 fill-blue-500/20" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Question Bank</h1>
                    <p className="text-sm text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> High-Yield Targets
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0f1a] rounded-xl border border-white/10 shadow-inner">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total XP</span>
                    <span className="text-base font-black text-white">{completedQs.length * 10}</span>
                  </div>
                </div>
              </div>

              {/* Subject Tabs */}
              <div className="flex space-x-2 p-1.5 bg-[#0a0f1a] rounded-2xl border border-white/5 shadow-inner w-full sm:w-fit">
                <button
                  onClick={() => setActiveSubject('Science')}
                  className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeSubject === 'Science' 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {activeSubject === 'Science' && (
                    <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.1)]" />
                  )}
                  <BrainCircuit className={`w-4 h-4 relative z-10 ${activeSubject === 'Science' ? 'text-blue-400' : ''}`} /> 
                  <span className="relative z-10">Science</span>
                </button>
                
                <button
                  onClick={() => setActiveSubject('Mathematics')}
                  className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeSubject === 'Mathematics' 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {activeSubject === 'Mathematics' && (
                    <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.1)]" />
                  )}
                  <Calculator className={`w-4 h-4 relative z-10 ${activeSubject === 'Mathematics' ? 'text-blue-400' : ''}`} /> 
                  <span className="relative z-10">Mathematics</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl blur-md" />
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder={`Search topics in ${activeSubject}...`} 
                    className="w-full bg-[#0a0f1a] text-white rounded-2xl py-4 pl-12 pr-4 outline-none border border-white/10 focus:border-blue-500/50 transition-all placeholder:text-slate-600 font-medium shadow-inner"
                  />
                </div>
              </div>

              {/* Chapter Cards List */}
              <div className="grid gap-3">
                {Object.entries(groupedQuestions).map(([chapter, questions]) => {
                  const chapterCompletedCount = questions.filter(q => completedQs.includes(q.id)).length;
                  const progressPercentage = Math.round((chapterCompletedCount / questions.length) * 100);
                  const isFullyMastered = progressPercentage === 100;
                  
                  return (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      key={chapter}
                      onClick={() => setActiveChapter(chapter)}
                      className="w-full flex items-center p-4 bg-[#0a0f1a] hover:bg-[#0d1326] border border-white/5 hover:border-blue-500/30 rounded-[1.25rem] transition-all group text-left gap-5 relative overflow-hidden"
                    >
                      {/* Left Icon Block */}
                      <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black text-lg shadow-inner relative z-10 ${
                        isFullyMastered 
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20 border border-emerald-400/30' 
                          : 'bg-gradient-to-br from-blue-600 to-indigo-800 shadow-blue-500/20 border border-blue-400/30'
                      }`}>
                        {getAbbreviation(chapter)}
                      </div>
                      
                      {/* Title & Subtitle */}
                      <div className="flex-1 min-w-0 z-10">
                        <h3 className="text-white font-bold text-[15px] sm:text-[17px] truncate tracking-wide group-hover:text-blue-100 transition-colors">
                          {chapter}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          {questions.length} Questions • {chapterCompletedCount} Mastered
                        </p>
                      </div>

                      {/* Right Progress */}
                      <div className="flex items-center gap-4 z-10">
                        <div className="flex flex-col items-end gap-2 w-16">
                          <span className={`text-[11px] font-black tracking-wider leading-none ${isFullyMastered ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {progressPercentage}%
                          </span>
                          <div className="w-full h-1.5 bg-[#1a1f2e] rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercentage}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full rounded-full ${isFullyMastered ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-gradient-to-r from-blue-500 to-indigo-400'}`} 
                            />
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (

          /* ========================================= */
          /* DETAIL VIEW (Inside a specific Chapter)   */
          /* ========================================= */
            <motion.div 
              key="detail-view"
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Top Navigation Ribbon */}
              <div className="sticky top-0 z-30 bg-[#02040a]/80 backdrop-blur-xl pt-2 pb-4 border-b border-white/5 flex items-center gap-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
                <button 
                  onClick={() => setActiveChapter(null)}
                  className="p-2.5 bg-[#0a0f1a] hover:bg-white/10 rounded-xl transition-colors border border-white/10 group"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                    {activeChapter}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                    <p className="text-xs text-slate-400 font-semibold tracking-wide">
                      {groupedQuestions[activeChapter].filter(q => completedQs.includes(q.id)).length} / {groupedQuestions[activeChapter].length} COMPLETED
                    </p>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="grid gap-6 pb-12">
                {groupedQuestions[activeChapter].map((q, index) => (
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
          )}

        </AnimatePresence>
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
  const isSubjective = question.options.length === 0;

  return (
    <motion.div 
      layout
      className={`relative p-5 sm:p-7 rounded-[1.5rem] border transition-all duration-300 ${
        isCompleted 
          ? 'bg-[#060a14] border-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.03)]' 
          : 'bg-[#0a0f1a] border-white/5 shadow-xl'
      }`}
    >
      
      {/* Card Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center justify-center h-9 w-9 rounded-xl font-black text-sm shadow-inner ${
            isCompleted 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
          }`}>
            Q{index}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {question.target_year}
          </span>
        </div>

        {/* Premium Checkbox */}
        <button 
          onClick={onToggle} 
          className="relative group p-1"
        >
          <div className={`absolute inset-0 rounded-full transition-transform duration-300 ${isCompleted ? 'scale-100 bg-emerald-500/20 blur-md' : 'scale-0'}`} />
          {isCompleted ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400 relative z-10 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          ) : (
            <Circle className="w-8 h-8 text-slate-600 group-hover:text-slate-400 relative z-10 transition-colors" />
          )}
        </button>
      </div>

      {/* Question Text */}
      <h3 className={`text-base sm:text-lg font-medium mb-6 whitespace-pre-line leading-relaxed transition-colors ${
        isCompleted ? 'text-slate-300' : 'text-slate-100'
      }`}>
        {question.question_text}
      </h3>

      {/* Interaction Area (Subjective only based on provided data) */}
      {isSubjective && (
        <div className="mb-2">
          {!isRevealed && (
            <button 
              onClick={() => setIsRevealed(true)} 
              className="flex items-center gap-2.5 py-2.5 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/20 hover:text-blue-300 transition-all group"
            >
              <Check className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
              Reveal Official Solution
            </button>
          )}
        </div>
      )}

      {/* Explanation Area */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }} 
            animate={{ opacity: 1, height: 'auto', y: 0 }} 
            exit={{ opacity: 0, height: 0, y: -10 }} 
            className="overflow-hidden"
          >
            <div className="mt-6 p-5 rounded-2xl bg-[#050810] border border-white/5 relative">
              {/* Decorative accent line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full" />
              
              <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold text-sm tracking-wide uppercase ml-2">
                <BookOpen className="w-4 h-4" /> 
                Official Solution & Analysis
              </div>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line text-[15px] ml-2">
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
                      
