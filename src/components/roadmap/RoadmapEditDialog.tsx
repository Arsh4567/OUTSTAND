import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, X } from "lucide-react";

export type RoadmapEditPatch = { title: string; goal: string };

export function RoadmapEditDialog({ open, initial, onClose, onSave, saving }: { open: boolean; initial: RoadmapEditPatch; roadmapId: string; onClose: () => void; onSave: (patch: RoadmapEditPatch) => void; onAskAI?: (request: string) => void; onLocalEditApplied?: () => Promise<void> | void; saving?: boolean; askingAI?: boolean }) {
  const [title, setTitle] = useState(initial.title);
  const [goal, setGoal] = useState(initial.goal);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initial.title);
    setGoal(initial.goal);
    const timer = window.setTimeout(() => titleRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open, initial.title, initial.goal]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, saving]);

  const cleanTitle = title.trim();
  const cleanGoal = goal.trim();
  const canSave = cleanTitle.length >= 2 && cleanGoal.length >= 5 && !saving;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-end justify-center bg-[#020617]/80 p-0 backdrop-blur-md sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="roadmap-edit-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
          <motion.div initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .985 }} transition={{ duration: .2, ease: [0.22, 1, .36, 1] }} className="relative w-full max-w-xl overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#0d1628] shadow-[0_40px_120px_-50px_rgba(34,211,238,.55)] sm:rounded-[2rem]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.16),transparent_65%)]" />
            <div className="relative p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-[.18em] text-cyan-100"><Pencil className="h-3 w-3" /> Edit roadmap</div>
                  <h2 id="roadmap-edit-title" className="mt-3 text-2xl font-black tracking-[-.03em] text-white">Tune the destination.</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">Your saved plan changes immediately after you save.</p>
                </div>
                <button type="button" onClick={onClose} disabled={saving} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-40" aria-label="Close editor"><X className="h-4 w-4" /></button>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block"><span className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-slate-400"><span>Roadmap title</span><span className="text-slate-600">{title.length}/120</span></span><input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoComplete="off" className="mt-2 w-full rounded-2xl border border-white/10 bg-[#091223] px-4 py-3.5 text-base font-black tracking-tight text-white outline-none transition-[border-color,box-shadow] placeholder:text-slate-600 focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-300/[0.08]" /></label>
                <label className="block"><span className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-slate-400"><span>Goal</span><span className="text-slate-600">{goal.length}/2000</span></span><textarea value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={2000} rows={5} className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-[#091223] px-4 py-3.5 text-sm font-semibold leading-6 text-white outline-none transition-[border-color,box-shadow] placeholder:text-slate-600 focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-300/[0.08]" /></label>
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-cyan-200/10 bg-cyan-200/[0.025] px-3 py-2.5 text-[11px] leading-5 text-slate-400"><Check className="h-3.5 w-3.5 shrink-0 text-cyan-300" /> Editing the title or goal does not invent new tasks or alter your saved progress.</div>

              <div className="mt-6 flex gap-2 sm:justify-end">
                <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-40 sm:flex-none">Cancel</button>
                <button type="button" disabled={!canSave} onClick={() => onSave({ title: cleanTitle, goal: cleanGoal })} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_10px_30px_-16px_rgba(34,211,238,.9)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_-16px_rgba(34,211,238,.95)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none">{saving ? "Saving…" : "Save changes"}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
