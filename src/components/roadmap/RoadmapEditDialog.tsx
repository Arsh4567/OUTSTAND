import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

export type RoadmapEditPatch = { title: string; goal: string };

export function RoadmapEditDialog({ open, initial, onClose, onSave, saving }: { open: boolean; initial: RoadmapEditPatch; roadmapId: string; onClose: () => void; onSave: (patch: RoadmapEditPatch) => void; onAskAI?: (request: string) => void; onLocalEditApplied?: () => Promise<void> | void; saving?: boolean; askingAI?: boolean }) {
  const [title, setTitle] = useState(initial.title);
  const [goal, setGoal] = useState(initial.goal);

  useEffect(() => {
    if (!open) return;
    setTitle(initial.title);
    setGoal(initial.goal);
  }, [open, initial.title, initial.goal]);

  if (!open) return null;

  const canSave = title.trim().length >= 2 && goal.trim().length >= 5 && !saving;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#020617]/80 p-0 backdrop-blur-md sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="roadmap-edit-title">
      <div className="w-full max-w-xl rounded-t-[2rem] border border-white/10 bg-[#0d1628] p-5 shadow-[0_30px_100px_-45px_rgba(34,211,238,.45)] sm:rounded-[2rem] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-[.18em] text-cyan-100"><Pencil className="h-3 w-3" /> Edit roadmap</div>
            <h2 id="roadmap-edit-title" className="mt-3 text-2xl font-black tracking-tight text-white">Make it yours.</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">These changes are saved directly to your roadmap.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-500 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200" aria-label="Close editor"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block"><span className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Roadmap title</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoFocus className="mt-2 w-full rounded-2xl border border-white/10 bg-[#091223] px-4 py-3.5 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10" /></label>
          <label className="block"><span className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Goal</span><textarea value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={2000} rows={5} className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-[#091223] px-4 py-3.5 text-sm font-semibold leading-6 text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10" /></label>
        </div>

        <div className="mt-6 flex gap-2 sm:justify-end">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:flex-none">Cancel</button>
          <button type="button" disabled={!canSave} onClick={() => onSave({ title: title.trim(), goal: goal.trim() })} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-300 to-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}
