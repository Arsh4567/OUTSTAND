import { createFileRoute } from "@tanstack/react-router";
import { RoadmapCinematic } from "@/components/roadmap/RoadmapCinematic";

export const Route = createFileRoute("/roadmap")({ component: RoadmapPage });

function RoadmapPage() {
  return <RoadmapCinematic />;
}
