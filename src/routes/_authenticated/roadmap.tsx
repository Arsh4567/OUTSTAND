import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CompletionCinematic } from "@/components/roadmap/CompletionCinematic";
import { RoadmapOutline } from "@/components/roadmap/RoadmapOutline";
import { ROADMAP_MODULES } from "@/lib/roadmap";
import { useAuth, displayNameOf } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — Outstand" },
      {
        name: "description",
        content:
          "The Outstand Roadmap: a cinematic completion moment and the structured path through energy, focus, sleep, strength and study.",
      },
      { property: "og:title", content: "Roadmap — Outstand" },
      {
        property: "og:description",
        content:
          "A cinematic completion moment and the structured path through energy, focus, sleep, strength and study.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const { user, profile } = useAuth();
  const [sceneDone, setSceneDone] = useState(false);
  const outlineRef = useRef<HTMLDivElement>(null);

  const firstName = (displayNameOf(user, profile) || "").split(" ")[0] || undefined;

  // Cinematic adapts to real progress; modules are scaffolded for now.
  const completedModules = 0;
  const totalModules = ROADMAP_MODULES.length;

  return (
    <div className="bg-[#03060d]">
      <CompletionCinematic
        progress={{
          ratio: completedModules / totalModules || 1,
          completedModules: totalModules,
          totalModules,
          name: firstName,
        }}
        onFinish={() => setSceneDone(true)}
        onContinue={() =>
          outlineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      />
      <div ref={outlineRef}>
        <RoadmapOutline revealed={sceneDone} />
      </div>
    </div>
  );
}
