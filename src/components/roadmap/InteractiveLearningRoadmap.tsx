import { ExternalLink } from "lucide-react";

type QuizQuestion = { question: string; options: string[]; correct_answer: string };
export type LearningMilestone = { milestone_title: string; video_url: string; mind_map_url: string; revision_notes: string; quiz: QuizQuestion[] };

function youtubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
      if (parsed.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${parsed.pathname.split("/")[2]}`;
    }
  } catch { /* keep the original URL for unsupported formats */ }
  return url;
}

export function InteractiveLearningRoadmap({ milestones }: { milestones: LearningMilestone[] }) {
  if (!milestones.length) return null;

  return <section className="space-y-5" aria-labelledby="learning-roadmap-title">
    <div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-cyan-300/80">Supplementary resources</div>
      <h2 id="learning-roadmap-title" className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Optional study material.</h2>
      <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">These resources are attached to the generated learning plan. They are references, not verified proof of mastery.</p>
    </div>
    <div className="space-y-4">
      {milestones.map((milestone, index) => <article key={`${milestone.milestone_title}-${index}`} className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.025]">
        <div className="p-5 sm:p-7">
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-500">Resource set {index + 1}</p>
          <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">{milestone.milestone_title}</h3>
          {milestone.video_url && <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.06] bg-black/30"><div className="aspect-video w-full"><iframe className="h-full w-full" src={youtubeEmbed(milestone.video_url)} title={milestone.milestone_title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></div>}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {milestone.mind_map_url && <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-500">Reference</p><h4 className="mt-1 text-sm font-black text-white">Mind map</h4></div><ExternalLink className="h-4 w-4 text-slate-500" /></div><a href={milestone.mind_map_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-bold text-cyan-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Open resource ↗</a></div>}
            {milestone.revision_notes && <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-5"><p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-500">Reference</p><h4 className="mt-1 text-sm font-black text-white">Revision notes</h4><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-400">{milestone.revision_notes}</p></div>}
          </div>
        </div>
      </article>)}
    </div>
  </section>;
}
