import { useEffect, useState } from "react";
import { Pencil, Sparkles, X, Zap } from "lucide-react";
import { tryLocalRoadmapEdit } from "@/lib/roadmap-local-edit";
import { toast } from "sonner";

export type RoadmapEditPatch = { title: string; goal: string };

export function RoadmapEditDialog({ open, initial, roadmapId, onClose, onSave, onAskAI, onLocalEditApplied, saving, askingAI }: { open: boolean; initial: RoadmapEditPatch; roadmapId: string; onClose: () => void; onSave: (patch: RoadmapEditPatch) => void; onAskAI: (request: string) => void; onLocalEditApplied: () => Promise<void> | void; saving?: boolean; askingAI?: boolean }) {
  const [title, setTitle] = useState(initial.title);
  const [goal, setGoal] = useState(initial.goal);
  const [request, setRequest] = useState("");
  const [localEditing, setLocalEditing] = useState(false);
  useEffect(() => { if (!open) return; setTitle(initial.title); setGoal(initial.goal); setRequest(""); setLocalEditing(false); }, [open, initial.title, initial.goal]);
  if (!open) return null;

  const applyRequest = async () => {
    const next = request.trim();
    if (next.length < 5) return;
    setLocalEditing(true);
    try {
      const local = await tryLocalRoadmapEdit(roadmapId, next);
      if (local.handled) {
        await onLocalEditApplied();
        toast.success(local.message || "Roadmap updated without using AI.");
        onClose();
        return;
      }
      onAskAI(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply roadmap change.");
    } finally {
      setLocalEditing(false);
    }
  };

  const busy = Boolean(saving || askingAI || localEditing);
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="roadmap-edit-title">
    <div className="w-full max-w-xl rounded-t-[2rem] border border-white/10 bg-[#07101f] p-5 shadow-2xl sm:rounded-[2rem] sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1 text-[9px] font-black uppercase tracking-[.2em] text-cyan-200"><Pencil className="h-3 w-3" /> Edit roadmap</div><h2 id="roadmap-edit-title" className="mt-3 text-2xl font-black text-white">Make it fit you.</h2><p className="mt-1 text-sm leading-6 text-slate-500">Direct edits save instantly. AI only handles changes that actually require reasoning.</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button></div>
      <div className="mt-6 space-y-4">
        <label className="block"><span className="text-[10px] font-black uppercase tracking-[.18em] text-slate-600">Roadmap title</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/30" /></label>
        <label className="block"><span className="text-[10px] font-black uppercase tracking-[.18em] text-slate-600">Goal</span><textarea value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={2000} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold leading-6 text-white outline-none focus:border-cyan-300/30" /></label>
        <div className="rounded-2xl border border-violet-300/15 bg-violet-300/[0.045] p-4"><div className="flex items-center gap-2 text-violet-200"><Sparkles className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-[.16em]">Smart roadmap changes</span></div><p className="mt-2 text-[11px] leading-5 text-slate-500">Try <span className="text-slate-300">“make it 30 days”</span>, <span className="text-slate-300">“rename to Math Mastery”</span>, or <span className="text-slate-300">“move study sessions after 7 pm”</span>. Common changes are applied locally with zero AI tokens.</p><textarea value={request} onChange={(e) => setRequest(e.target.value)} maxLength={500} rows={3} placeholder="Describe a more complex change…" className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-violet-300/30" /><button type="button" disabled={busy || request.trim().length < 5} onClick={() => void applyRequest()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/[0.08] px-4 py-3 text-xs font-black text-violet-100 disabled:opacity-40"><Zap className="h-4 w-4" />{localEditing ? "Applying locally…" : askingAI ? "AI is applying a focused change…" : "Apply change"}</button></div>
      </div>
      <div className="mt-6 flex gap-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white">Cancel</button><button type="button" disabled={busy || title.trim().length < 2 || goal.trim().length < 5} onClick={() => onSave({ title: title.trim(), goal: goal.trim() })} className="flex-1 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200 disabled:opacity-40">{saving ? "Saving…" : "Save changes"}</button></div>
    </div>
  </div>;
}
