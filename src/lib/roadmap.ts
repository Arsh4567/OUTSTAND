/**
 * OUTSTAND Roadmap — content architecture.
 *
 * This file intentionally only defines the *structure* of the roadmap so the
 * cinematic layer can adapt to real user progress. Modules will later be filled
 * with evidence-informed, specific protocols. No scientific citations are
 * invented here — `evidence` is left empty until real sources are added.
 */

export type RoadmapDomain =
  | "energy"
  | "mood"
  | "self-care"
  | "fitness"
  | "study"
  | "sleep"
  | "focus"
  | "habits"
  | "social";

export interface RoadmapStep {
  id: string;
  title: string;
  /** Short, specific action. Kept deliberately terse for the cinematic. */
  summary: string;
}

export interface RoadmapModule {
  id: string;
  domain: RoadmapDomain;
  title: string;
  /** One-line promise, progress/identity focused. */
  tagline: string;
  steps: RoadmapStep[];
  /** Reserved for future evidence-informed references. Empty by design. */
  evidence: never[];
}

export const ROADMAP_DOMAIN_LABELS: Record<RoadmapDomain, string> = {
  energy: "Energy",
  mood: "Mood & Well-being",
  "self-care": "Self-care",
  fitness: "Strength",
  study: "Studying",
  sleep: "Sleep",
  focus: "Focus",
  habits: "Habits",
  social: "Social confidence",
};

/** Placeholder module scaffolding — one per domain, ready to be expanded. */
export const ROADMAP_MODULES: RoadmapModule[] = (
  Object.keys(ROADMAP_DOMAIN_LABELS) as RoadmapDomain[]
).map((domain) => ({
  id: `module-${domain}`,
  domain,
  title: ROADMAP_DOMAIN_LABELS[domain],
  tagline: "Coming soon — specific, evidence-informed steps.",
  steps: [],
  evidence: [] as never[],
}));

export interface RoadmapProgress {
  /** 0–1 completion of the whole roadmap. */
  ratio: number;
  completedModules: number;
  totalModules: number;
  /** Optional name for personalised microcopy. */
  name?: string;
}

/** Cinematic beats: tight, punchy, identity-focused. */
export interface CinematicBeat {
  id: string;
  /** Seconds from scene start. */
  at: number;
  kicker?: string;
  line: string;
  /** Visual intensity 0–1, drives light/motion. */
  intensity: number;
  /** Sound cue for the beat. */
  cue?: "bass" | "swell" | "tick" | "resolve";
}

export const CINEMATIC_BEATS: CinematicBeat[] = [
  { id: "b0", at: 0.4, line: "It started quiet.", intensity: 0.05, cue: "bass" },
  { id: "b1", at: 4.2, line: "No audience. No shortcut.", intensity: 0.1 },
  { id: "b2", at: 8.0, kicker: "Day 1", line: "One small thing, done.", intensity: 0.25, cue: "tick" },
  { id: "b3", at: 12.0, kicker: "Momentum", line: "Then again. And again.", intensity: 0.45, cue: "tick" },
  { id: "b4", at: 16.0, line: "Focus became familiar.", intensity: 0.6, cue: "swell" },
  { id: "b5", at: 20.0, line: "Sleep. Movement. Attention.", intensity: 0.72 },
  { id: "b6", at: 23.5, kicker: "Now", line: "This is who you are.", intensity: 0.88, cue: "swell" },
  { id: "b7", at: 27.0, line: "Roadmap complete.", intensity: 1, cue: "resolve" },
];

export const CINEMATIC_DURATION = 30;
