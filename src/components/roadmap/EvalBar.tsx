export function EvalBar({ score, mate }: { score: number | null; mate: number | null }) {
  const normalized = score == null ? 50 : 50 + 50 * Math.tanh(score / 500);
  const white = Math.max(4, Math.min(96, normalized));
  const label = mate != null ? `M${Math.abs(mate)}` : score == null ? "—" : `${score > 0 ? "+" : ""}${(score / 100).toFixed(1)}`;
  return <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-black/20 p-2 text-[10px] font-black">
    <div className="hidden h-[min(520px,62vw)] w-4 overflow-hidden rounded-full border border-white/10 bg-slate-900 sm:block"><div className="h-full bg-white transition-[height] duration-300" style={{ height: `${100 - white}%` }} /><div className="bg-slate-800" style={{ height: `${white}%` }} /></div>
    <div className="relative h-3 flex-1 overflow-hidden rounded-full border border-white/10 bg-slate-900 sm:hidden"><div className="absolute inset-y-0 left-0 bg-white transition-[width] duration-300" style={{ width: `${white}%` }} /></div>
    <span className="w-12 text-right tabular-nums text-slate-300">{label}</span>
  </div>;
}
