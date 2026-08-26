import { Check, CircleAlert, CircleX, Sparkles, Target, TriangleAlert } from "lucide-react";
import type { MoveClassification } from "@/hooks/useStockfishCoach";

const meta: Record<MoveClassification, { label: string; className: string; icon: typeof Check }> = {
  book: { label: "Book", className: "border-sky-300/15 bg-sky-300/10 text-sky-200", icon: Sparkles },
  best: { label: "Best", className: "border-emerald-300/15 bg-emerald-300/10 text-emerald-200", icon: Target },
  excellent: { label: "Excellent", className: "border-emerald-300/15 bg-emerald-300/10 text-emerald-200", icon: Check },
  good: { label: "Good", className: "border-cyan-300/15 bg-cyan-300/10 text-cyan-200", icon: Check },
  inaccuracy: { label: "Inaccuracy", className: "border-amber-300/15 bg-amber-300/10 text-amber-200", icon: CircleAlert },
  mistake: { label: "Mistake", className: "border-orange-300/15 bg-orange-300/10 text-orange-200", icon: TriangleAlert },
  blunder: { label: "Blunder", className: "border-red-300/15 bg-red-300/10 text-red-200", icon: CircleX },
};

export function MoveAccuracyBadge({ classification }: { classification?: MoveClassification | null }) {
  if (!classification) return null;
  const item = meta[classification];
  const Icon = item.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[.1em] ${item.className}`}><Icon className="h-3 w-3" />{item.label}</span>;
}
