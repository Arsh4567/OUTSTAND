import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/comeback")({ component: ComebackPage });

const phases = [
  { days: "Days 1–3", study: "4 h", chess: "45–60 min", exercise: "20–25 min", focus: "Restart gently. Build consistency." },
  { days: "Days 4–7", study: "5 h", chess: "60 min", exercise: "25–30 min", focus: "Increase focused work." },
  { days: "Days 8–14", study: "6 h", chess: "60–75 min", exercise: "30 min", focus: "Practice and sharpen weak areas." },
  { days: "Days 15–21", study: "6–7 h", chess: "60–90 min", exercise: "30 min", focus: "Test, revise, and perform." },
];

const studyBlocks = [
  ["Block 1", "Hardest subject", "50 min study · 10 min break · 50 min study"],
  ["Block 2", "Second subject", "50 min study · 10 min break · 50 min study"],
  ["Block 3", "Practice", "50 min study · 10 min break · 50 min study"],
  ["Block 4", "Revision", "30–50 min active recall and mistake repair"],
];

const chessRoutine = [
  ["15 min", "Tactics", "Calculate before moving. Avoid instant guesses."],
  ["25 min", "One serious game", "Prefer a meaningful time control over endless bullet."],
  ["20 min", "Analysis", "Find the first turning point, missed candidates, and calculation errors."],
];

const healthRoutine = [
  "5 min warm-up",
  "Squats × 10–15",
  "Push-ups × 5–12 (use an easier variation if needed)",
  "Lunges × 8 each side",
  "Plank × 20–40 sec",
  "Backpack rows × 10–15 if you have a safe setup",
  "Finish with a few minutes of easy movement/stretching",
];

function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#07101d]/90 p-5 shadow-[0_24px_80px_-55px_rgba(34,211,238,.18)] sm:p-7">
      {eyebrow && <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200/70">{eyebrow}</div>}
      <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ComebackPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const completed = useMemo(() => Object.values(checks).filter(Boolean).length, [checks]);
  const toggle = (id: string) => setChecks((current) => ({ ...current, [id]: !current[id] }));

  return (
    <main className="min-h-screen overflow-hidden bg-[#050812] px-4 pb-24 pt-8 text-slate-100 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050812]">
        <div className="absolute left-[4%] top-[6%] h-80 w-80 rounded-full bg-cyan-300/[.045] blur-3xl" />
        <div className="absolute right-[5%] top-[20%] h-96 w-96 rounded-full bg-violet-400/[.04] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-5 sm:space-y-7">
        <header className="rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-[#081522] via-[#07101d] to-[#0a0b18] p-6 sm:p-9">
          <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-cyan-100">OUTSTAND / COMEBACK</div>
          <h1 className="mt-5 text-4xl font-black tracking-[-.055em] sm:text-6xl">ARSH — 21 DAY COMEBACK</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">
            Your Day 0 reset: exams, chess, health, and mental strength. This page is intentionally not linked in OUTSTAND navigation; it is reached directly at <span className="font-bold text-slate-200">/comeback</span>.
          </p>
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[.03] p-5">
            <p className="text-lg font-black">I don't need motivation. I follow the schedule.</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">No zero days. Never miss twice. Protect sleep. Do the next block.</p>
          </div>
        </header>

        <Section eyebrow="Start now" title="RIGHT NOW — FIRST 60 MINUTES">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["0–5 min", "Reset", "Do Not Disturb. Write: DAY 0 — I START NOW. 21 days. Study. Chess. Health. Discipline. No zero days."],
              ["5–15 min", "Clean your battlefield", "Clear the study table, get water, keep books ready, and move the phone out of reach."],
              ["15–45 min", "First study sprint", "Pick one weak topic. Study for 25 minutes, then spend 5 minutes recalling what you remember."],
              ["45–60 min", "Chess", "5 min tactics + 10 min analysis of one recent game."],
            ].map(([time, title, body]) => (
              <div key={time} className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <div className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-200/70">{time}</div>
                <div className="mt-2 font-black">{title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="21-day system" title="Your training load">
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-white/[.03] text-[10px] uppercase tracking-[.14em] text-slate-500"><tr><th className="px-4 py-3">Days</th><th className="px-4 py-3">Study</th><th className="px-4 py-3">Chess</th><th className="px-4 py-3">Exercise</th><th className="px-4 py-3">Focus</th></tr></thead>
              <tbody>{phases.map((phase) => <tr key={phase.days} className="border-t border-white/10"><td className="px-4 py-4 font-black">{phase.days}</td><td className="px-4 py-4">{phase.study}</td><td className="px-4 py-4">{phase.chess}</td><td className="px-4 py-4">{phase.exercise}</td><td className="px-4 py-4 text-slate-400">{phase.focus}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">These are focused hours, not time sitting with a book open. Adjust around school and protect sleep.</p>
        </Section>

        <Section eyebrow="Academics" title="Study system">
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-6 text-slate-400">
            Every chapter moves through <span className="font-black text-slate-200">Learn → Recall → Practice → Test</span>. Build a Mistake Book: question → my mistake → correct concept → correct answer.
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {studyBlocks.map(([name, focus, body]) => <div key={name} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-200/70">{name}</div><div className="mt-2 font-black">{focus}</div><p className="mt-2 text-sm text-slate-400">{body}</p></div>)}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Days 1–7: COVER", "Days 8–14: PRACTICE", "Days 15–21: TEST + REVISE"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-sm font-black">{item}</div>)}
          </div>
        </Section>

        <Section eyebrow="Chess" title="Chess comeback — ~60 minutes/day">
          <div className="grid gap-3 md:grid-cols-3">{chessRoutine.map(([time, title, body]) => <div key={time} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.14em] text-violet-200/70">{time}</div><div className="mt-2 font-black">{title}</div><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></div>)}</div>
          <p className="mt-5 text-sm leading-6 text-slate-500">Training goal: understand one game deeply. Add longer sessions 1–2 times a week for openings you actually play, basic endgames, calculation, and positional patterns.</p>
        </Section>

        <Section eyebrow="Health" title="Healthy-body reset">
          <div className="grid gap-3 sm:grid-cols-2">
            {healthRoutine.map((item, index) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm"><span className="mr-3 font-black text-cyan-200">{index + 1}</span>{item}</div>)}
          </div>
          <div className="mt-5 rounded-2xl border border-amber-200/10 bg-amber-200/[.03] p-4 text-sm leading-6 text-slate-400">No crash dieting or extreme training. The goal is health, energy, strength, and consistency. Stop an exercise that causes pain.</div>
        </Section>

        <Section eyebrow="Attention" title="Take back the phone">
          <div className="grid gap-3 sm:grid-cols-4">
            {[["Days 1–3", "≤ 8 h"], ["Days 4–7", "≤ 6 h"], ["Days 8–14", "≤ 4.5–5 h"], ["Days 15–21", "~3–4 h"]].map(([days, target]) => <div key={days} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">{days}</div><div className="mt-2 text-xl font-black">{target}</div></div>)}
+          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["No phone during study blocks.", "No phone in bed.", "Entertainment after important work, not before."].map((rule) => <div key={rule} className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-sm font-bold text-slate-300">{rule}</div>)}
          </div>
        </Section>

        <Section eyebrow="Mental strength" title="Nightly reset">
          <div className="grid gap-3 sm:grid-cols-3">
            {["What did I accomplish?", "Where did I fail?", "What will I change tomorrow?"].map((question, index) => <div key={question} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.12em] text-cyan-200/70">{index + 1}</div><div className="mt-2 font-black">{question}</div></div>)}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-500">A bad day becomes data, not a verdict. Analyze → adjust → continue. Never miss twice.</p>
        </Section>

        <Section eyebrow="Daily checklist" title="No zero days">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["study", "Focused study completed"],
              ["chess", "Chess training completed"],
              ["move", "Moved / exercised today"],
              ["phone", "Phone stayed under today's target"],
              ["sleep", "Protected sleep"],
              ["tomorrow", "Prepared tomorrow's books and first task"],
            ].map(([id, label]) => <label key={id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4"><input type="checkbox" checked={Boolean(checks[id])} onChange={() => toggle(id)} className="h-5 w-5 rounded border-white/20 bg-black/20" /><span className={`text-sm font-bold ${checks[id] ? "text-cyan-100 line-through opacity-70" : "text-slate-300"}`}>{label}</span></label>)}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-cyan-300/10 bg-cyan-300/[.04] p-4"><span className="text-sm font-black">Today's score</span><span className="text-lg font-black text-cyan-100">{completed}/6</span></div>
        </Section>

        <footer className="rounded-[2rem] border border-cyan-300/15 bg-gradient-to-r from-cyan-300/[.08] via-sky-300/[.05] to-violet-300/[.08] p-6 text-center sm:p-9">
          <p className="text-2xl font-black tracking-tight sm:text-3xl">The comeback starts with the next block.</p>
          <p className="mt-3 text-sm text-slate-400">Don't rebuild your whole life tonight. Complete Day 0. Then make tomorrow Day 1.</p>
        </footer>
      </div>
    </main>
  );
}
