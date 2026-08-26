import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, Check, ChevronRight, Clock3, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HABIT_CATALOG, HABIT_COLORS, HABIT_ICON_SET, type HabitCatalogItem, type Habit } from "@/lib/habits";
import { useAppState } from "@/hooks/use-app-state";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/habits")({ component: HabitsPage });

type EditorState = { id?: string; name: string; emoji: string; color: string; notificationTime: string };

const colorStyles: Record<string, string> = {
  ink: "border-slate-900 bg-slate-900 text-white",
  slate: "border-slate-400 bg-slate-100 text-slate-900",
  stone: "border-stone-400 bg-stone-100 text-stone-900",
  blue: "border-blue-500 bg-blue-50 text-blue-700",
  emerald: "border-emerald-500 bg-emerald-50 text-emerald-700",
  amber: "border-amber-500 bg-amber-50 text-amber-700",
  violet: "border-violet-500 bg-violet-50 text-violet-700",
  rose: "border-rose-500 bg-rose-50 text-rose-700",
};

function HabitsPage() {
  const { habits, addHabit, updateHabit, deleteHabit, maxHabits } = useAppState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [editor, setEditor] = useState<EditorState | null>(null);

  const categories = useMemo(() => ["All", ...Array.from(new Set(HABIT_CATALOG.map((item) => item.category)))], []);
  const selectedNames = useMemo(() => new Set(habits.map((habit) => habit.name.trim().toLocaleLowerCase())), [habits]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return HABIT_CATALOG.filter((item) => (category === "All" || item.category === category) && (!needle || `${item.name} ${item.category}`.toLocaleLowerCase().includes(needle)));
  }, [category, query]);

  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setEditor(null); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editor]);

  const selectCatalogHabit = (item: HabitCatalogItem) => {
    if (selectedNames.has(item.name.toLocaleLowerCase())) return;
    if (habits.length >= maxHabits) return toast.error(`You can have up to ${maxHabits} habits.`);
    const added = addHabit({ name: item.name, emoji: item.emoji, color: item.color, notificationTime: null });
    if (added) toast.success(`${item.name} added.`);
  };

  const openNew = () => setEditor({ name: "", emoji: "✨", color: "ink", notificationTime: "" });
  const openEdit = (habit: Habit) => setEditor({ id: habit.id, name: habit.name, emoji: habit.emoji, color: habit.color, notificationTime: habit.notificationTime || "" });
  const saveEditor = () => {
    if (!editor?.name.trim()) return toast.error("Give your habit a name.");
    if (editor.id) {
      updateHabit(editor.id, { name: editor.name.trim(), emoji: editor.emoji, color: editor.color, notificationTime: editor.notificationTime || null });
      toast.success("Habit updated.");
    } else {
      if (habits.length >= maxHabits) return toast.error(`You can have up to ${maxHabits} habits.`);
      const added = addHabit({ name: editor.name.trim(), emoji: editor.emoji, color: editor.color, notificationTime: editor.notificationTime || null });
      if (!added) return toast.error("That habit already exists.");
      toast.success("Custom habit added.");
    }
    setEditor(null);
  };

  return <main className="min-h-[calc(100vh-72px)] bg-background px-3 py-5 text-foreground sm:px-6 sm:py-8">
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div><Link to="/dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="h-4 w-4" /> Dashboard</Link><p className="mt-5 text-[10px] font-black uppercase tracking-[.24em] text-muted-foreground">Your habit system</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Choose what matters.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Pick up to {maxHabits}. There is no minimum. Rename, recolor, change the icon, or create something completely yours.</p></div>
        <Button onClick={openNew} disabled={habits.length >= maxHabits} className="min-h-11 w-full rounded-xl bg-foreground px-4 text-xs font-black text-background hover:opacity-90 sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Create custom habit</Button>
      </header>

      <section className="mb-5 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 80+ habits…" className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label><div className="flex gap-2 overflow-x-auto pb-1 lg:max-w-[58%]">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`min-h-10 shrink-0 rounded-full border px-3.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === item ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{item}</button>)}</div></div>
      </section>

      <section className="mb-6 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-6">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Selected</p><h2 className="mt-1 text-xl font-black">Your habits</h2></div><span className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-black">{habits.length}/{maxHabits}</span></div>
        {habits.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center"><p className="text-sm font-bold text-muted-foreground">Nothing selected yet.</p><p className="mt-1 text-xs text-muted-foreground">That is completely fine. Add only what you actually want to track.</p></div> : <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{habits.map((habit) => <div key={habit.id} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border text-xl ${colorStyles[habit.color] || colorStyles.ink}`}>{habit.emoji}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{habit.name}</p><p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">{habit.notificationTime ? <><Bell className="h-3 w-3" /> {habit.notificationTime}</> : "No reminder"}</p></div><button type="button" onClick={() => openEdit(habit)} aria-label={`Edit ${habit.name}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Edit3 className="h-4 w-4" /></button></div>)}</div>}
      </section>

      <section><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Habit library</p><h2 className="mt-1 text-xl font-black">{filtered.length} habits to choose from</h2></div><p className="text-xs font-semibold text-muted-foreground">Tap to add</p></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((item) => { const selected = selectedNames.has(item.name.toLocaleLowerCase()); const disabled = !selected && habits.length >= maxHabits; return <button key={item.id} type="button" onClick={() => selectCatalogHabit(item)} disabled={disabled || selected} className={`group flex min-h-[72px] items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-foreground/20 bg-muted" : "border-border bg-card hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-soft"} disabled:cursor-not-allowed disabled:opacity-45`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border text-xl ${colorStyles[item.color] || colorStyles.ink}`}>{item.emoji}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.name}</span><span className="mt-1 block text-[9px] font-black uppercase tracking-[.16em] text-muted-foreground">{item.category}</span></span>{selected ? <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background"><Check className="h-4 w-4" /></span> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />}</button>; })}</div>{filtered.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center"><Search className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-bold">No habits found.</p><p className="mt-1 text-xs text-muted-foreground">Try another search or create your own.</p></div>}</section>
    </div>

    {editor && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={editor.id ? "Edit habit" : "Create habit"} onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null); }}><div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Customize habit</p><h2 className="mt-1 text-xl font-black">{editor.id ? "Edit habit" : "Create your own"}</h2></div><button type="button" onClick={() => setEditor(null)} className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close"><X className="h-5 w-5" /></button></div><label className="mt-5 block text-xs font-bold text-muted-foreground">Habit name<input value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} maxLength={80} autoFocus className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="e.g. Practice guitar" /></label><div className="mt-5"><p className="text-xs font-bold text-muted-foreground">Icon</p><div className="mt-2 grid grid-cols-8 gap-2 rounded-2xl border border-border bg-background p-3">{HABIT_ICON_SET.slice(0, 56).map((icon, index) => <button key={`${icon}-${index}`} type="button" onClick={() => setEditor({ ...editor, emoji: icon })} className={`grid aspect-square place-items-center rounded-lg text-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${editor.emoji === icon ? "bg-foreground text-background" : "hover:bg-muted"}`} aria-label={`Use ${icon} icon`}>{icon}</button>)}</div></div><div className="mt-5"><p className="text-xs font-bold text-muted-foreground">Outline colour</p><div className="mt-2 flex flex-wrap gap-2">{HABIT_COLORS.map((color) => <button key={color} type="button" onClick={() => setEditor({ ...editor, color })} className={`h-10 w-10 rounded-xl border-2 ${colorStyles[color]} ${editor.color === color ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""}`} aria-label={`Use ${color} colour`} />)}</div></div><label className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-3"><span><span className="flex items-center gap-2 text-xs font-bold"><Clock3 className="h-4 w-4" /> Optional reminder time</span><span className="mt-1 block text-[10px] text-muted-foreground">Leave empty if you do not want a habit reminder.</span></span><input type="time" value={editor.notificationTime} onChange={(event) => setEditor({ ...editor, notificationTime: event.target.value })} className="h-10 rounded-xl border border-input bg-card px-2 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label><div className="mt-6 flex gap-2">{editor.id && <Button type="button" variant="outline" onClick={() => { deleteHabit(editor.id!); setEditor(null); toast.success("Habit removed."); }} className="min-h-11 rounded-xl text-xs font-bold"><Trash2 className="mr-2 h-4 w-4" /> Remove</Button>}<Button type="button" onClick={saveEditor} className="min-h-11 flex-1 rounded-xl bg-foreground text-xs font-black text-background hover:opacity-90">Save habit</Button></div></div></div>}
  </main>;
}
