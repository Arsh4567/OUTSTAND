import { Activity, ArrowRight, ShieldCheck, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoadmapMilestone, RoadmapTask } from "@/hooks/use-roadmap";
import { buildExecutionSnapshot, calculateRoadmapHealth, recommendNextAction } from "@/lib/roadmap-intelligence";

interface RoadmapIntelligencePanelProps {
  roadmap: { start_date: string; target_date: string };
  tasks: RoadmapTask[];
  milestones: RoadmapMilestone[];
  onFocusTask?: (task: RoadmapTask) => void;
}

export function RoadmapIntelligencePanel({ roadmap, tasks, milestones, onFocusTask }: RoadmapIntelligencePanelProps) {
  const snapshot = buildExecutionSnapshot(tasks, roadmap.start_date, roadmap.target_date);
  const health = calculateRoadmapHealth(snapshot, milestones.length);
  const recommendation = recommendNextAction(snapshot, health, tasks, milestones);
  const tone = health.trajectory === "on_track" ? "default" : health.trajectory === "watch" ? "secondary" : "destructive";

  const nextTask = tasks.find(
    (task) => task.day_number === snapshot.currentDay && task.progress !== "completed" && task.progress !== "skipped" && task.is_required,
  );

  return (
    <Card className="overflow-hidden border-border/70 bg-card/70 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Roadmap intelligence
            </div>
            <CardTitle className="text-xl">Your roadmap is learning from reality.</CardTitle>
          </div>
          <Badge variant={tone}>{health.score}/100 {health.trajectory.replace("_", " ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Required completion" value={`${snapshot.requiredCompletionRate}%`} />
          <Metric label="Behind schedule" value={String(snapshot.overdueTaskCount)} />
          <Metric label="Days remaining" value={String(snapshot.daysRemaining)} />
          <Metric label="Plan realism" value={health.workload} />
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            {health.trajectory === "at_risk" ? <TriangleAlert className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-primary" />}
            <span className="font-semibold">What OUTSTAND sees</span>
          </div>
          <p className="text-sm text-muted-foreground">{health.reasons[0]}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Next best move</div>
            <div className="mt-1 truncate text-base font-semibold">{recommendation.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{recommendation.description}</p>
          </div>
          {nextTask && onFocusTask ? (
            <Button className="shrink-0" onClick={() => onFocusTask(nextTask)}>
              Start focus <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
