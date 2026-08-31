import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

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

const checklist = [
  ["study", "Focused study completed"],
  ["chess", "Chess training completed"],
  ["move", "Moved / exercised today"],
  ["phone", "Phone stayed under today's target"],
  ["sleep", "Protected sleep"],
  ["tomorrow", "Prepared tomorrow's books and first task"],
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
  const [notes, setNotes] = useState("");
  const [day, setDay] = useState(1);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("outstand-comeback") || "{}");
      setChecks(saved.checks || {});
      setNotes(saved.notes || "");
      setDay(saved.day || 1);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("outstand-comeback", JSON.stringify({ checks, notes, day }));
  }, [checks, notes, day]);

  const completed = useMemo(() => Object.values(checks).filter(Boolean).length, [checks]);
  const progress = Math.round((completed / checklist.length) * 100);
  const phase = day <= 3 ? phases[0] : day <= 7 ? phases[1] : day <= 14 ? phases[2] : phases[3];
  const toggle = (id: string) => setChecks((current) => ({ ...current, [id]: !current[id] }));
  const resetToday = () => setChecks({});

  return (
    <main className="min-h-screen overflow-hidden bg-[#050812] px-4 pb-24 pt-6 text-slate-100 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050812]">
        <div className="absolute left-[3%] top-[4%] h-80 w-80 rounded-full bg-cyan-300/[.05] blur-3xl" />
        <div className="absolute right-[4%] top-[18%] h-96 w-96 rounded-full bg-violet-400/[.045] blur-3xl" />
        <div className="absolute bottom-[5%] left-[35%] h-72 w-72 rounded-full bg-sky-400/[.025] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-5 sm:space-y-7">
        <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-[#0a1a2a] via-[#07101d] to-[#0b0b19] p-6 shadow-[0_30px_100px_-60px_rgba(34,211,238,.35)] sm:p-10">
          <div className="absolute right-[-5%] top-[-35%] h-72 w-72 rounded-full border border-cyan-300/10" />
          <div className="absolute right-[5%] top-[-20%] h-52 w-52 rounded-full border border-violet-300/10" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-cyan-100">OUTSTAND / COMEBACK</div>
              <div className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Direct route · /comeback</div>
            </div>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-200/60">DAY {day} / 21</p>
                <h1 className="mt-3 text-4xl font-black tracking-[-.06em] sm:text-6xl">THE COMEBACK<br /><span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">STARTS NOW.</span></h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Exams. Chess. Health. Mental strength. You don't need to fix your whole life tonight — you need to win the next block.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5 backdrop-blur">
                <div className="flex items-end justify-between"><span className="text-xs font-black uppercase tracking-[.14em] text-slate-500">Today's score</span><span className="text-3xl font-black text-cyan-100">{completed}/6</span></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-300 transition-all" style={{ width: `${progress}%` }} /></div>
                <p className="mt-3 text-xs font-bold text-slate-500">{progress === 100 ? "DAY COMPLETE. 🔥" : `${6 - completed} actions left. Keep moving.`}</p>
              </div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[["01", "No zero days"], ["02", "Never miss twice"], ["03", "Follow the schedule"]].map(([n, text]) => <div key={n} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><span className="text-[10px] font-black text-cyan-200/60">{n}</span><p className="mt-2 text-sm font-black">{text}</p></div>)}
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-cyan-300/10 bg-[#07101d]/90 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div><div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200/70">Today's load</div><h2 className="mt-2 text-2xl font-black">Day {day} of 21 · {phase.days}</h2><p className="mt-1 text-sm text-slate-500">{phase.focus}</p></div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3 text-center"><div className="text-lg font-black">{phase.study}</div><div className="text-[9px] font-black uppercase tracking-[.12em] text-slate-600">Study</div></div><div className="rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3 text-center"><div className="text-lg font-black">{phase.chess}</div><div className="text-[9px] font-black uppercase tracking-[.12em] text-slate-600">Chess</div></div><div className="rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3 text-center"><div className="text-lg font-black">{phase.exercise}</div><div className="text-[9px] font-black uppercase tracking-[.12em] text-slate-600">Health</div></div></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setDay((d) => Math.min(21, d + 1))} className="rounded-xl bg-gradient-to-r from-cyan-300 to-violet-300 px-4 py-2.5 text-xs font-black text-slate-950">Next day →</button>
            <button type="button" onClick={() => setDay((d) => Math.max(1, d - 1))} className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-xs font-black text-slate-300">← Previous</button>
            <button type="button" onClick={resetToday} className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-xs font-black text-slate-500">Reset checklist</button>
          </div>
        </section>

        <Section eyebrow="Start now" title="RIGHT NOW — FIRST 60 MINUTES">
          <div className="grid gap-3 sm:grid-cols-2">
            {[["0–5 min", "Reset", "Do Not Disturb. Write: DAY 0 — I START NOW. 21 days. Study. Chess. Health. Discipline. No zero days."], ["5–15 min", "Clean your battlefield", "Clear the study table, get water, keep books ready, and move the phone out of reach."], ["15–45 min", "First study sprint", "Pick one weak topic. Study for 25 minutes, then spend 5 minutes recalling what you remember."], ["45–60 min", "Chess", "5 min tactics + 10 min analysis of one recent game."]].map(([time, title, body]) => <div key={time} className="rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/20"><div className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-200/70">{time}</div><div className="mt-2 font-black">{title}</div><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></div>)}
          </div>
        </Section>

        <Section eyebrow="21-day system" title="The progression">
          <div className="grid gap-3 md:grid-cols-4">{phases.map((p, index) => <div key={p.days} className={`rounded-2xl border p-4 ${p.days === phase.days ? "border-cyan-300/25 bg-cyan-300/[.05]" : "border-white/10 bg-white/[.02]"}`}><div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Phase {index + 1}</div><div className="mt-2 font-black">{p.days}</div><div className="mt-3 text-xs leading-5 text-slate-400">Study {p.study}<br />Chess {p.chess}<br />Exercise {p.exercise}</div><p className="mt-3 text-xs text-slate-600">{p.focus}</p></div>)}</div>
          <button type="button" onClick={() => setShowPlan((v) => !v)} className="mt-4 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-xs font-black text-slate-400">{showPlan ? "Hide detailed table" : "Show detailed table"}</button>
          {showPlan && <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-white/[.03] text-[10px] uppercase tracking-[.14em] text-slate-500"><tr><th className="px-4 py-3">Days</th><th className="px-4 py-3">Study</th><th className="px-4 py-3">Chess</th><th className="px-4 py-3">Exercise</th><th className="px-4 py-3">Focus</th></tr></thead><tbody>{phases.map((p) => <tr key={p.days} className="border-t border-white/10"><td className="px-4 py-4 font-black">{p.days}</td><td className="px-4 py-4">{p.study}</td><td className="px-4 py-4">{p.chess}</td><td className="px-4 py-4">{p.exercise}</td><td className="px-4 py-4 text-slate-400">{p.focus}</td></tr>)}</tbody></table></div>}
        </Section>

        <Section eyebrow="Academics" title="Study like the exam is real">
          <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.035] p-4 text-sm leading-6 text-slate-400"><span className="font-black text-slate-200">Learn → Recall → Practice → Test.</span> Every chapter must pass through all four. Build a Mistake Book: question → my mistake → correct concept → correct answer.</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{studyBlocks.map(([name, focus, body]) => <div key={name} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-200/70">{name}</div><div className="mt-2 font-black">{focus}</div><p className="mt-2 text-sm text-slate-400">{body}</p></div>)}</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">{["Days 1–7: COVER", "Days 8–14: PRACTICE", "Days 15–21: TEST + REVISE"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-sm font-black">{item}</div>)}</div>
        </Section>

        <Section eyebrow="Chess" title="Chess comeback — ~60 minutes/day">
          <div className="grid gap-3 md:grid-cols-3">{chessRoutine.map(([time, title, body]) => <div key={time} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.14em] text-violet-200/70">{time}</div><div className="mt-2 font-black">{title}</div><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></div>)}</div>
          <p className="mt-5 text-sm leading-6 text-slate-500">Training goal: understand one game deeply. Add longer sessions 1–2 times a week for openings you actually play, basic endgames, calculation, and positional patterns.</p>
        </Section>

        <Section eyebrow="Health" title="Healthy-body reset">
          <div className="grid gap-3 sm:grid-cols-2">{healthRoutine.map((item, index) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm"><span className="mr-3 font-black text-cyan-200">{index + 1}</span>{item}</div>)}</div>
          <div className="mt-5 rounded-2xl border border-amber-200/10 bg-amber-200/[.03] p-4 text-sm leading-6 text-slate-400">No crash dieting or extreme training. The goal is health, energy, strength, and consistency. Stop an exercise that causes pain.</div>
        </Section>

        <Section eyebrow="Attention" title="Take back the phone">
          <div className="grid gap-3 sm:grid-cols-4">{[["Days 1–3", "≤ 8 h"], ["Days 4–7", "≤ 6 h"], ["Days 8–14", "≤ 4.5–5 h"], ["Days 15–21", "~3–4 h"]].map(([days, target]) => <div key={days} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">{days}</div><div className="mt-2 text-xl font-black">{target}</div></div>)}</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">{["No phone during study blocks.", "No phone in bed.", "Entertainment after important work, not before."].map((rule) => <div key={rule} className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-sm font-bold text-slate-300">{rule}</div>)}</div>
        </Section>

        <Section eyebrow="Mental strength" title="Nightly reset">
          <div className="grid gap-3 sm:grid-cols-3">{["What did I accomplish?", "Where did I fail?", "What will I change tomorrow?"].map((question, index) => <div key={question} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.12em] text-cyan-200/70">{index + 1}</div><div className="mt-2 font-black">{question}</div></div>)}</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Write your 3-line nightly review here…" className="mt-4 min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/25" />
          <p className="mt-3 text-xs text-slate-600">Saved locally in this browser.</p>
        </Section>

        <Section eyebrow="Daily command center" title="No zero days">
          <div className="grid gap-3 sm:grid-cols-2">{checklist.map(([id, label]) => <label key={id} className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-cyan-300/20"><input type="checkbox" checked={Boolean(checks[id])} onChange={() => toggle(id)} className="h-5 w-5 rounded border-white/20 bg-black/20" /><span className={`text-sm font-bold ${checks[id] ? "text-cyan-100 line-through opacity-70" : "text-slate-300"}`}>{label}</span></label>)}</div>
          <div className="mt-5 rounded-2xl border border-cyan-300/10 bg-cyan-300/[.04] p-4"><div className="flex items-center justify-between gap-4"><span className="text-sm font-black">Today's execution</span><span className="text-sm font-black text-cyan-100">{completed}/6</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-300 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-3 text-xs text-slate-500">{progress === 100 ? "You kept the promise today. Now protect tomorrow." : "One completed action is better than another hour of planning."}</p></div>
        </Section>

        <footer className="rounded-[2rem] border border-cyan-300/15 bg-gradient-to-r from-cyan-300/[.08] via-sky-300/[.05] to-violet-300/[.08] p-6 text-center sm:p-10">
          <p className="text-2xl font-black tracking-tight sm:text-3xl">The comeback starts with the next block.</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">Don't rebuild your whole life tonight. Complete Day 0. Then make tomorrow Day 1. Your job is not perfection — it's returning to the plan.</p>
        </footer>
      </div>
    </main>
  );
}
