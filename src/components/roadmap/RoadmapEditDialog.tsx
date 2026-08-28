import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Pencil, Sparkles, Trash2, X, Zap } from "lucide-react";
import { toast } from "sonner";
import type { RoadmapSummary } from "@/hooks/use-roadmap";

export type RoadmapEditPatch = { title: string; goal: string };

type Props = {
  open: boolean;
  roadmap: RoadmapSummary | null;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: RoadmapEditPatch) => Promise<void> | void;
  onSmartChange?: (request: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  saving?: boolean;
  askingAI?: boolean;
  deleting?: boolean;
};

export function RoadmapEditDialog({ open, roadmap, onOpenChange, onSave, onSmartChange, onDelete, saving, askingAI, deleting }: Props) {
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [request, setRequest] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const busy = Boolean(saving || askingAI || deleting);

  useEffect(() => {
    if (!open) return;
    setTitle(roadmap?.title || "");
    setGoal(roadmap?.goal || "");
    setRequest("");
    setConfirmDelete(false);
    const timer = window.setTimeout(() => titleRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open, roadmap?.id, roadmap?.title, roadmap?.goal]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onOpenChange]);

  if (!roadmap) return null;

  const cleanTitle = title.trim();
  const cleanGoal = goal.trim();
  const canSave = cleanTitle.length >= 2 && cleanGoal.length >= 5 && !busy;

  const applySmartChange = async () => {
    const next = request.trim();
    if (next.length < 5 || busy || !onSmartChange) return;
    try {
      await onSmartChange(next);
      setRequest("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply smart change.");
    }
  };

  const handleDelete = async () => {
    if (!onDelete || busy) return;
    try {
      await onDelete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete roadmap.");
    }
  };

  return <AnimatePresence>
    {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-end justify-center bg-[#020617]/85 p-0 backdrop-blur-md sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="roadmap-edit-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onOpenChange(false); }}>
      <motion.div initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .985 }} className="relative w-full max-w-xl overflow-hidden rounded-t-[2rem] border border-cyan-300/10 bg-[#07101d] shadow-[0_40px_120px_-50px_rgba(34,211,238,.45)] sm:rounded-[2rem]" onMouseDown={(event) => event.stopPropagation()}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.10),transparent_65%)]" />
        <div className="relative p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-[9px] font-black uppercase tracking-[.18em] text-cyan-100"><Pencil className="h-3 w-3" /> Edit roadmap</div><h2 id="roadmap-edit-title" className="mt-3 text-2xl font-black tracking-[-.03em] text-white">Tune the destination.</h2><p className="mt-1 text-sm leading-6 text-slate-400">Keep the public name simple while AI retains the detailed goal context.</p></div><button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-slate-500 hover:bg-white/[.07] hover:text-white disabled:opacity-40" aria-label="Close editor"><X className="h-4 w-4" /></button></div>

          <label className="mt-6 block"><span className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-slate-400"><span>Roadmap name</span><span className="text-slate-600">{title.length}/60</span></span><input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} autoComplete="off" placeholder="e.g. Road to 1500" className="mt-2 w-full rounded-2xl border border-white/10 bg-[#050d18] px-4 py-3.5 text-base font-black tracking-tight text-white outline-none focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/[.07]" /><p className="mt-1.5 text-[10px] text-slate-600">Aim for a short, recognizable name.</p></label>

          <div className="mt-5 rounded-2xl border border-cyan-200/10 bg-cyan-200/[.025] p-4"><div className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" /><div><div className="text-xs font-black uppercase tracking-[.16em] text-cyan-100">AI goal context</div><p className="mt-1.5 text-[11px] leading-5 text-slate-500">The detailed outcome stays out of the roadmap switcher and remains available for AI planning.</p></div></div></div>

          <div className="mt-5 rounded-2xl border border-violet-300/15 bg-violet-300/[.035] p-4"><div className="flex items-center gap-2 text-violet-100"><Sparkles className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-[.16em]">Smart changes</span></div><textarea value={request} onChange={(e) => setRequest(e.target.value)} maxLength={500} rows={3} placeholder="Move my study sessions to evenings and reduce weekends…" disabled={busy} className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-[#050d18] p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-300/45 disabled:opacity-50" /><button type="button" disabled={busy || request.trim().length < 5} onClick={() => void applySmartChange()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/[.09] px-4 py-3 text-xs font-black text-violet-100 hover:bg-violet-300/[.14] disabled:opacity-40"><Zap className="h-4 w-4" />{askingAI ? "AI is updating your plan…" : "Apply smart change"}</button></div>

          {confirmDelete ? <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[.045] p-4"><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-400/10 text-red-300"><AlertTriangle className="h-4 w-4" /></div><div className="min-w-0"><div className="text-sm font-black text-white">Delete this roadmap?</div><p className="mt-1 text-[11px] leading-5 text-slate-400">This removes the roadmap and its planning data. This action cannot be undone.</p></div></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => setConfirmDelete(false)} disabled={busy} className="flex-1 rounded-xl border border-white/10 bg-white/[.02] px-4 py-3 text-sm font-bold text-slate-300 disabled:opacity-40">Cancel</button><button type="button" onClick={() => void handleDelete()} disabled={busy} className="flex-1 rounded-xl bg-red-400/15 px-4 py-3 text-sm font-black text-red-200 ring-1 ring-inset ring-red-300/20 disabled:opacity-40">{deleting ? "Deleting…" : "Delete roadmap"}</button></div></div> : <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-xl px-1 py-2 text-xs font-black text-red-300/80 hover:text-red-200 disabled:opacity-40"><Trash2 className="h-4 w-4" /> Delete roadmap</button>}

          <div className="mt-6 flex gap-2 sm:justify-end"><button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="flex-1 rounded-xl border border-white/10 bg-white/[.02] px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/[.06] disabled:opacity-40 sm:flex-none">Cancel</button><button type="button" disabled={!canSave} onClick={() => void onSave({ title: cleanTitle, goal: cleanGoal })} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 px-5 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">{saving ? "Saving…" : "Save changes"}</button></div>
        </div>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
