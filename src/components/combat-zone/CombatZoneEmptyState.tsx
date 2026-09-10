import { Shield } from "lucide-react";

interface CombatZoneEmptyStateProps {
  handleSubmit: () => void;
  isSubmitting: boolean;
}

export function CombatZoneEmptyState({ handleSubmit, isSubmitting }: CombatZoneEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
      <Shield className="h-12 w-12 text-slate-600" />
      <div>
        <h3 className="mb-2 text-xl font-bold text-white">No Intel Found</h3>
        <p className="text-slate-400">Command hasn't loaded any questions for this sector yet.</p>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Force Complete Sector
      </button>
    </div>
  );
}
