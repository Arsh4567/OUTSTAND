import { useState } from "react";
import { Moon, Sparkles } from "lucide-react";

export function NightlyReviewModal({ open, onClose, onSubmit, submitting }: { open: boolean; onClose: () => void; onSubmit: (reflection: string, energy: number, difficulty: number) => Promise<void>; submitting?: boolean }) {
  const [reflection, setReflection] = useState("");
  const [energy, setEnergy] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-violet-300/80"><Moon className="h-4 w-4" />Nightly review</div><h2 className="mt-2 text-2xl font-black text-white">Close the loop.</h2><p className="mt-2 text-sm leading-6 text-slate-500">Two minutes of reflection helps tomorrow’s plan adapt to what actually happened today.</p></div><Sparkles className="h-5 w-5 text-cyan-300" /></div>
      <label className="mt-7 block text-xs font-black uppercase tracking-[.15em] text-slate-500">What helped or got in the way?</label>
      <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} rows={5} placeholder="What felt easy, hard, surprising, or incomplete?" className="mt-3 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/30" />
      <div className="mt-5 grid grid-cols-2 gap-3"><label className="rounded-2xl border border-white/[0.07] p-4 text-xs font-bold text-slate-400">Energy<select value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 text-white"><option value={1}>1 · Low</option><option value={2}>2</option><option value={3}>3 · Normal</option><option value={4}>4</option><option value={5}>5 · High</option></select></label><label className="rounded-2xl border border-white/[0.07] p-4 text-xs font-bold text-slate-400">Difficulty<select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 text-white"><option value={1}>1 · Easy</option><option value={2}>2</option><option value={3}>3 · Right level</option><option value={4}>4</option><option value={5}>5 · Hard</option></select></label></div>
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-slate-400">Later</button><button type="button" disabled={submitting} onClick={() => void onSubmit(reflection, energy, difficulty)} className="rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-50">{submitting ? "Analyzing…" : "Analyze my day"}</button></div>
    </div>
  </div>;
}
