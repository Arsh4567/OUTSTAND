import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, Sparkles, X, Zap } from "lucide-react";
import { tryLocalRoadmapEdit } from "@/lib/roadmap-local-edit";

export type RoadmapEditPatch = { title: string; goal: string };

export function RoadmapEditDialog({ open, initial, roadmapId, onClose, onSave, onLocalEditApplied, saving, askingAI, onAskAI }: { open: boolean; initial: RoadmapEditPatch; roadmapId: string; onClose: () => void; onSave: (patch: RoadmapEditPatch) => void; onAskAI?: (request: string) => void; onLocalEditApplied?: () => Promise<void> | void; saving?: boolean; askingAI?: boolean }) {
  const [title, setTitle] = useState(initial.title);
  const [goal, setGoal] = useState(initial.goal);
  const [request, setRequest] = useState("");
  const [localEditing, setLocalEditing] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initial.title);
    setGoal(initial.goal);
    setRequest("");
    setLocalEditing(false);
    const timer = window.setTimeout(() => titleRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open, initial.title, initial.goal]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving && !askingAI && !localEditing) onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, saving, askingAI, localEditing]);

  const cleanTitle = title.trim();
  const cleanGoal = goal.trim();
  const canSave = cleanTitle.length >= 2 && cleanGoal.length >= 5 && !saving && !askingAI && !localEditing;
  const busy = Boolean(saving || askingAI || localEditing);

  const applySmartChange = async () => {
    const next = request.trim();
    if (next.length < 5 || busy) return;
    setLocalEditing(true);
    try {
      const local = await tryLocalRoadmapEdit(roadmapId, next);
      if (local.handled) {
        await onLocalEditApplied?.();
        setRequest("");
        return;
      }
      if (!onAskAI) throw new Error("This smart change is not available right now.");
      onAskAI(next);
    } catch (error) {
      // Keep the editor open so the user can correct the request or save normally.
      console.error(error);
    } finally {
      setLocalEditing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-end justify-center bg-[#080706]/85 p-0 backdrop-blur-md sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="roadmap-edit-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
          <motion.div initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .985 }} transition={{ duration: .2, ease: [0.22, 1, .36, 1] }} className="relative w-full max-w-xl overflow-hidden rounded-t-[2rem] border border-stone-500/25 bg-[#1b1510] shadow-[0_40px_120px_-50px_rgba(234,179,8,.45)] sm:rounded-[2rem]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,.14),transparent_65%)]" />
            <div className="relative p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[9px] font-black uppercase tracking-[.18em] text-amber-100"><Pencil className="h-3 w-3" /> Edit roadmap</div><h2 id="roadmap-edit-title" className="mt-3 text-2xl font-black tracking-[-.03em] text-stone-50">Tune the destination.</h2><p className="mt-1 text-sm leading-6 text-stone-400">Save direct edits or describe a smart change for the planner.</p></div><button type="button" onClick={onClose} disabled={busy} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-stone-500/20 bg-white/[0.03] text-stone-500 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-40" aria-label="Close editor"><X className="h-4 w-4" /></button></div>

              <div className="mt-6 space-y-4">
                <label className="block"><span className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-stone-400"><span>Roadmap title</span><span className="text-stone-600">{title.length}/120</span></span><input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoComplete="off" className="mt-2 w-full rounded-2xl border border-stone-500/20 bg-[#0f0c09] px-4 py-3.5 text-base font-black tracking-tight text-stone-50 outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/[0.07]" /></label>
                <label className="block"><span className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-stone-400"><span>Goal</span><span className="text-stone-600">{goal.length}/2000</span></span><textarea value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={2000} rows={5} className="mt-2 w-full resize-none rounded-2xl border border-stone-500/20 bg-[#0f0c09] px-4 py-3.5 text-sm font-semibold leading-6 text-stone-50 outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/[0.07]" /></label>
              </div>

              <div className="mt-5 rounded-2xl border border-rose-300/10 bg-rose-300/[0.035] p-4"><div className="flex items-center gap-2 text-rose-100"><Sparkles className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-[.16em]">Smart changes</span></div><p className="mt-2 text-[11px] leading-5 text-stone-400">Try “make it 30 days”, “rename to Math Mastery”, or “move study sessions after 7 pm”. Simple requests are handled locally; more complex requests go to the roadmap planner.</p><textarea value={request} onChange={(e) => setRequest(e.target.value)} maxLength={500} rows={3} placeholder="Describe the change…" className="mt-3 w-full resize-none rounded-xl border border-stone-500/20 bg-[#0f0c09] p-3 text-sm text-stone-50 outline-none placeholder:text-stone-600 focus:border-rose-300/35 focus:ring-4 focus:ring-rose-300/[0.06]" /><button type="button" disabled={busy || request.trim().length < 5} onClick={() => void applySmartChange()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300/15 bg-rose-300/[0.08] px-4 py-3 text-xs font-black text-rose-100 transition hover:bg-rose-300/[0.13] disabled:opacity-40"><Zap className="h-4 w-4" />{localEditing ? "Applying…" : askingAI ? "Planner is applying…" : "Apply smart change"}</button></div>

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200/10 bg-amber-200/[0.025] px-3 py-2.5 text-[11px] leading-5 text-stone-400"><Check className="h-3.5 w-3.5 shrink-0 text-amber-300" /> Direct edits change only the saved title and goal. Smart changes may update the schedule when the request requires it.</div>

              <div className="mt-6 flex gap-2 sm:justify-end"><button type="button" onClick={onClose} disabled={busy} className="flex-1 rounded-xl border border-stone-500/20 bg-white/[0.02] px-4 py-3 text-sm font-bold text-stone-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-40 sm:flex-none">Cancel</button><button type="button" disabled={!canSave} onClick={() => onSave({ title: cleanTitle, goal: cleanGoal })} className="flex-1 rounded-xl bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 px-5 py-3 text-sm font-black text-stone-950 shadow-[0_10px_30px_-16px_rgba(234,179,8,.8)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none">{saving ? "Saving…" : "Save changes"}</button></div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
