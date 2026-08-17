import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

 type ProgressRow = { roadmap_day: number; assigned_date: string; total_missions: number; completed_missions: number; completion_pct: number };

export function RoadmapProgressHistory() {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("ai_roadmap_progress")
        .select("roadmap_day, assigned_date, total_missions, completed_missions, completion_pct")
        .order("roadmap_day", { ascending: true });
      if (!cancelled) {
        if (!error) setRows((data ?? []) as ProgressRow[]);
        setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5"><div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading roadmap history…</div></section>;
  if (!rows.length) return null;

  return <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
    <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200"><CalendarDays className="h-4 w-4" /></span><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Roadmap history</p><h3 className="text-base font-black text-white">Your progress so far</h3></div></div>
    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{rows.map((row) => { const complete = row.total_missions > 0 && row.completed_missions >= row.total_missions; return <div key={row.roadmap_day} className={`min-w-[112px] rounded-2xl border p-3 ${complete ? "border-emerald-300/15 bg-emerald-300/[0.035]" : "border-white/[0.07] bg-black/10"}`}><div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">Day {row.roadmap_day}</span>{complete ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <Circle className="h-3.5 w-3.5 text-slate-700" />}</div><p className="mt-2 text-lg font-black text-white">{Math.round(Number(row.completion_pct) || 0)}%</p><p className="mt-1 text-[9px] font-bold text-slate-600">{row.completed_missions}/{row.total_missions} missions</p></div>; })}</div>
  </section>;
}
