import { Crosshair } from "lucide-react";

export function CombatZoneLoadingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <Crosshair className="mb-4 h-10 w-10 animate-spin text-red-500" />
      <p className="font-mono text-slate-400">Loading targets...</p>
    </div>
  );
}
