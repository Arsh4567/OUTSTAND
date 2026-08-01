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

  return (
    // Removed all rounded corners, max-widths, and margins to force edge-to-edge
    <div className="relative w-full min-h-screen bg-[#02040a] text-slate-200 overflow-hidden">
      
      {/* ========================================= */}
      {/* GLOWING BLUE CRYSTALS BACKGROUND          */}
      {/* ========================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Crystal 1 - Top Left */}
        <div 
          className="absolute -left-16 top-10 w-72 h-[400px] bg-gradient-to-b from-blue-500/20 to-transparent rotate-45 backdrop-blur-3xl"
          style={{ 
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            boxShadow: '0 0 120px 20px rgba(59, 130, 246, 0.4)' 
          }} 
        />
        {/* Crystal 2 - Middle Right */}
        <div 
          className="absolute -right-20 top-1/3 w-80 h-[500px] bg-gradient-to-t from-indigo-500/20 to-blue-900/10 -rotate-12 backdrop-blur-2xl"
          style={{ 
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            boxShadow: '0 0 150px 30px rgba(79, 70, 229, 0.3)' 
          }} 
        />
        {/* Crystal 3 - Bottom Left Center */}
        <div 
          className="absolute left-1/4 bottom-[-10%] w-56 h-[300px] bg-gradient-to-tr from-cyan-500/10 to-transparent rotate-[60deg]"
          style={{ 
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            boxShadow: '0 0 90px 10px rgba(34, 211, 238, 0.2)' 
          }} 
        />
      </div>

      <div className="relative z-10 w-full">
        
        <AnimatePresence mode="wait">
          
          {/* ========================================= */}
          {/* LIST VIEW (The Outstand Chapter Menu)     */}
          {/* ========================================= */}
          {!activeChapter ? (
            <motion.div 
              key="list-view"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {/* Header Section (Padding added here just to keep text off screen edges) */}
              <div className="px-4 sm:px-8 py-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0f1a]/80 backdrop-blur-md rounded-xl border border-white/10 w-fit">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total XP</span>
                    <span className="text-base font-black text-white">{completedQs.length * 10}</span>
                  </div>
                </div>

                {/* Subject Tabs */}
                <div className="flex space-x-2 p-1.5 bg-[#0a0f1a]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-inner w-full sm:w-fit">
                  <button
                    onClick={() => setActiveSubject('Science')}
                    className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                      activeSubject === 'Science' 
                        ? 'text-white' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {activeSubject === 'Science' && (
                      <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/40 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
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
                      <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/40 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
                    )}
                    <Calculator className={`w-4 h-4 relative z-10 ${activeSubject === 'Mathematics' ? 'text-blue-400' : ''}`} /> 
                    <span className="relative z-10">Mathematics</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl blur-lg" />
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                      type="text" 
                      placeholder={`Search topics in ${activeSubject}...`} 
                      className="w-full bg-[#0a0f1a]/80 backdrop-blur-xl text-white rounded-2xl py-4 pl-12 pr-4 outline-none border border-white/10 focus:border-blue-500/50 transition-all placeholder:text-slate-600 font-medium shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Edge-to-Edge Chapter Cards List */}
              <div className="w-full border-t border-white/5">
                {Object.entries(groupedQuestions).map(([chapter, questions]) => {
                  const chapterCompletedCount = questions.filter(q => completedQs.includes(q.id)).length;
                  const progressPercentage = Math.round((chapterCompletedCount / questions.length) * 100);
                  const isFullyMastered = progressPercentage === 100;
                  
                  return (
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(13, 19, 38, 0.7)' }}
                      whileTap={{ scale: 0.99 }}
                      key={chapter}
                      onClick={() => setActiveChapter(chapter)}
                      // Removed margins, added bottom border for separation, fixed width to 100%
                      className="w-full flex items-center justify-between p-4 sm:p-6 bg-[#0a0f1a]/60 backdrop-blur-sm border-b border-white/5 transition-all group text-left gap-4"
                    >
                      {/* Title & Subtitle - FIXED WRAPPING */}
                      <div className="flex-1 pr-4">
                        <h3 className="text-white font-bold text-base sm:text-lg whitespace-normal break-words leading-snug group-hover:text-blue-300 transition-colors">
                          {chapter}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 font-medium">
                          {questions.length} Questions • {chapterCompletedCount} Mastered
                        </p>
                      </div>

                      {/* Right Progress */}
                      <div className="flex items-center gap-4 flex-shrink-0">
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
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
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
              className="w-full"
            >
              {/* Top Navigation Ribbon */}
              <div className="sticky top-0 z-30 bg-[#02040a]/90 backdrop-blur-xl px-4 sm:px-8 pt-4 pb-4 border-b border-white/10 flex items-center gap-4 shadow-lg">
                <button 
                  onClick={() => setActiveChapter(null)}
                  className="p-2.5 bg-[#0a0f1a] hover:bg-white/10 rounded-xl transition-colors border border-white/10 group flex-shrink-0"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-tight break-words">
                    {activeChapter}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                    <p className="text-xs text-blue-400 font-bold tracking-wider uppercase">
                      {groupedQuestions[activeChapter].filter(q => completedQs.includes(q.id)).length} / {groupedQuestions[activeChapter].length} COMPLETED
                    </p>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="px-4 sm:px-8 py-8 grid gap-6 pb-20">
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
      className={`relative p-5 sm:p-7 rounded-[1.5rem] border backdrop-blur-md transition-all duration-300 ${
        isCompleted 
          ? 'bg-[#060a14]/90 border-emerald-500/30 shadow-[0_0_40px_rgba(52,211,153,0.05)]' 
          : 'bg-[#0a0f1a]/80 border-white/10 shadow-2xl'
      }`}
    >
      
      {/* Card Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center justify-center h-9 w-9 rounded-xl font-black text-sm shadow-inner ${
            isCompleted 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
          }`}>
            Q{index}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-400">
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
            <CheckCircle2 className="w-8 h-8 text-emerald-400 relative z-10 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          ) : (
            <Circle className="w-8 h-8 text-slate-500 group-hover:text-blue-400 relative z-10 transition-colors" />
          )}
        </button>
      </div>

      {/* Question Text */}
      <h3 className={`text-base sm:text-lg font-medium mb-6 whitespace-pre-line leading-relaxed transition-colors ${
        isCompleted ? 'text-slate-300' : 'text-slate-50'
      }`}>
        {question.question_text}
      </h3>

      {/* Interaction Area (Subjective only based on provided data) */}
      {isSubjective && (
        <div className="mb-2">
          {!isRevealed && (
            <button 
              onClick={() => setIsRevealed(true)} 
              className="flex items-center gap-2.5 py-3 px-5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-bold hover:bg-blue-500/30 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all group"
            >
              <Check className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
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
            <div className="mt-6 p-5 rounded-2xl bg-[#050810]/90 border border-white/10 relative shadow-inner">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3/4 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              
              <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold text-sm tracking-wide uppercase ml-3">
                <BookOpen className="w-4 h-4" /> 
                Official Solution & Analysis
              </div>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line text-[15px] ml-3">
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
          
