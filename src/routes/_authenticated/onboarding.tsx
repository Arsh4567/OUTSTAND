import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";

const PRESET_HABITS = [
  { id: "h_read", name: "Read 20 pages", emoji: "📚", color: "primary" },
  { id: "h_deepwork", name: "Deep work", emoji: "🧠", color: "accent" },
  { id: "h_workout", name: "Exercise", emoji: "🏃", color: "success" },
  { id: "h_meditate", name: "Mindfulness", emoji: "🧘", color: "warning" },
  { id: "h_nophone", name: "No phone first hour", emoji: "📵", color: "primary" },
  { id: "h_coldshower", name: "Cold shower", emoji: "⚡", color: "accent" },
];

export const Route = createFileRoute("/_authenticated/onboarding")({ component: Onboarding });

function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [screenTime, setScreenTime] = useState(6);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const { updateProfile } = useAuth();
  const { setInitialHabits } = useAppState();
  const navigate = useNavigate();

  const next = () => setStep((current) => Math.min(4, current + 1));
  const back = () => setStep((current) => Math.max(1, current - 1));

  const toggleHabit = (id: string) => {
    setSelectedHabitIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  };

  const completeOnboarding = async () => {
    if (!name.trim()) {
      setStep(1);
      return;
    }
    setIsCompleting(true);
    try {
      await updateProfile({ display_name: name.trim(), full_name: name.trim(), screen_time: screenTime, has_completed_onboarding: true });
      const chosenHabits = PRESET_HABITS.filter((habit) => selectedHabitIds.includes(habit.id)).map((habit) => ({ name: habit.name, emoji: habit.emoji, color: habit.color }));
      setInitialHabits(chosenHabits);
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      console.error("Failed to store onboarding setup", error);
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-blue-500/[0.08] blur-[130px]" />
        <div className="absolute bottom-[-18rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-violet-500/[0.05] blur-[120px]" />
      </div>
      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          {step > 1 ? <button type="button" onClick={back} className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold text-slate-500 transition hover:bg-white/[0.04] hover:text-white"><ChevronLeft className="h-4 w-4" /> Back</button> : <div />}
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600"><Sparkles className="h-3.5 w-3.5 text-blue-400" /> OUTSTAND</div>
          <span className="text-[10px] font-bold text-slate-600">{step}/4</span>
        </header>

        <div className="my-auto py-12">
          {step === 1 && <section className="space-y-8 text-center"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Quick setup</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">Let’s make this yours.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">A few details, then you can get straight to your day.</p></div><div className="mx-auto max-w-md text-left"><label htmlFor="onboarding-name" className="text-xs font-bold text-slate-400">What should we call you?</label><input id="onboarding-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && name.trim() && next()} placeholder="Your name" className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-lg font-bold text-white outline-none transition focus:border-blue-400/50 focus:bg-white/[0.06] placeholder:text-slate-700" /></div><PrimaryButton disabled={!name.trim()} onClick={next}>Continue</PrimaryButton></section>}

          {step === 2 && <section className="space-y-8 text-center"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Baseline</p><h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">What’s your usual screen time?</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">No judgment. This is only a starting point for your progress.</p></div><div className="mx-auto max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.035] p-6"><p className="text-5xl font-black text-blue-300">{screenTime}<span className="ml-2 text-base font-bold text-slate-500">hrs/day</span></p><input type="range" min={1} max={14} value={screenTime} onChange={(event) => setScreenTime(Number(event.target.value))} aria-label="Daily screen time hours" className="mt-8 w-full accent-blue-500" /><div className="mt-2 flex justify-between text-[10px] font-bold text-slate-700"><span>1h</span><span>14h</span></div></div><PrimaryButton onClick={next}>Continue</PrimaryButton></section>}

          {step === 3 && <section className="space-y-7 text-center"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Optional</p><h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Pick up to 3 habits.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Choose what actually fits your life. You can change these later.</p></div><div className="grid gap-2.5 text-left sm:grid-cols-2">{PRESET_HABITS.map((habit) => { const selected = selectedHabitIds.includes(habit.id); return <button key={habit.id} type="button" onClick={() => toggleHabit(habit.id)} aria-pressed={selected} className={`flex items-center justify-between rounded-2xl border p-3.5 transition ${selected ? "border-blue-400/50 bg-blue-500/10 text-white" : "border-white/[0.08] bg-white/[0.025] text-slate-400 hover:bg-white/[0.05]"}`}><span className="flex items-center gap-3"><span className="text-xl">{habit.emoji}</span><span className="text-sm font-bold">{habit.name}</span></span><span className={`grid h-5 w-5 place-items-center rounded-full border ${selected ? "border-blue-400 bg-blue-500" : "border-slate-700"}`}>{selected && <Check className="h-3 w-3" />}</span></button>; })}</div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">{selectedHabitIds.length}/3 selected</p><PrimaryButton onClick={next}>Finish setup</PrimaryButton><button type="button" onClick={next} className="mx-auto block text-xs font-bold text-slate-600 hover:text-white">Skip for now</button></section>}

          {step === 4 && <section className="space-y-7 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-300"><Check className="h-7 w-7" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">You’re ready</p><h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Welcome, {name.trim() || "there"}.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Your dashboard will keep the focus on what to do today—not a giant setup checklist.</p></div><PrimaryButton disabled={isCompleting} onClick={() => void completeOnboarding()}>{isCompleting ? "Setting things up…" : "Enter dashboard"}</PrimaryButton></section>}
        </div>

        <div className="mx-auto flex w-full max-w-xs gap-1.5" aria-label={`Step ${step} of 4`}>{[1, 2, 3, 4].map((item) => <div key={item} className={`h-1 flex-1 rounded-full transition ${item <= step ? "bg-blue-400" : "bg-white/10"}`} />)}</div>
      </main>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="mx-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-500 px-7 py-3 text-sm font-black text-white shadow-[0_12px_40px_-16px_rgba(59,130,246,.9)] transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40">{children}<ArrowRight className="h-4 w-4" /></button>;
}
