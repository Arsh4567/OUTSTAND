import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function ErrorBoundary({ error, resetErrorBoundary }: { error: any, resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
      <AlertCircle className="w-12 h-12 text-rose-500" />
      <h2 className="text-xl font-bold text-white">Something went wrong</h2>
      <p className="text-slate-400 max-w-sm">
        Our security guard caught an error. Don't worry, your data is safe.
      </p>
      <Button onClick={resetErrorBoundary} variant="outline">
        Try again
      </Button>
    </div>
  );
}
