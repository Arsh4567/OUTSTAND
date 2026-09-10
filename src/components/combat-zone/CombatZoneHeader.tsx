import { Crosshair, X } from "lucide-react";

interface CombatZoneHeaderProps {
  onClose: () => void;
  isSubmitting: boolean;
}

export function CombatZoneHeader({ onClose, isSubmitting }: CombatZoneHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 bg-[#050810] p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Crosshair className="h-5 w-5 text-red-500" />
        <h2 className="text-lg font-black uppercase tracking-tight text-white lg:text-xl">
          Combat Zone
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="rounded-full bg-white/5 p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Close combat zone"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
