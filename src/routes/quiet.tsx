import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUOTES, quoteOfTheDay } from "@/lib/quotes";

export const Route = createFileRoute("/quiet")({
  head: () => ({
    meta: [
      { title: "Quiet — Calm motivation for students" },
      { name: "description", content: "A quiet, calm space of motivating quotes to steady your day." },
      { property: "og:title", content: "Quiet — Calm motivation" },
      { property: "og:description", content: "Steady motivation for students." },
    ],
  }),
  component: QuietPage,
});

function QuietPage() {
  const daily = quoteOfTheDay();
  const [i, setI] = useState(0);
  const q = QUOTES[i % QUOTES.length];

  return (
    <div className="space-y-10">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Quiet</div>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">A calm space to remember why.</h1>
      </div>

      <section className="glass-card relative overflow-hidden p-8 md:p-14">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative text-center">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Quote of the day</div>
          <blockquote className="mx-auto mt-4 max-w-3xl font-display text-2xl font-medium leading-snug md:text-4xl">
            "{daily.text}"
          </blockquote>
          <div className="mt-4 text-sm text-muted-foreground">— {daily.author}</div>
        </div>
      </section>

      <section className="glass-card p-8 md:p-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Another one</div>
            <p className="mt-3 font-display text-xl leading-snug md:text-2xl">"{q.text}"</p>
            <p className="mt-2 text-sm text-muted-foreground">— {q.author}</p>
          </div>
          <Button
            variant="secondary"
            className="shrink-0 gap-2"
            onClick={() => setI((n) => (n + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length)}
          >
            <RefreshCcw className="h-4 w-4" /> New
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {QUOTES.slice(0, 6).map((quote, idx) => (
          <div key={idx} className="glass-card p-6">
            <p className="text-sm leading-relaxed">"{quote.text}"</p>
            <p className="mt-3 text-xs text-muted-foreground">— {quote.author}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
