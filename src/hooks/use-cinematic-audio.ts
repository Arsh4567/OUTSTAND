import { useCallback, useEffect, useRef, useState } from "react";

type Cue = "bass" | "swell" | "tick" | "resolve";

/**
 * Tiny WebAudio sound-design helper. No external assets, no copyright risk.
 * Audio is opt-in: nothing plays until `enable()` is called from a user
 * gesture, and blocked/unsupported contexts fail silently.
 */
export function useCinematicAudio() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return null;
    if (!ctxRef.current) {
      try {
        ctxRef.current = new AC();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }, []);

  const enable = useCallback(async () => {
    const ctx = ensureCtx();
    if (!ctx) return false;
    try {
      await ctx.resume();
      setEnabled(true);
      return true;
    } catch {
      setEnabled(false);
      return false;
    }
  }, [ensureCtx]);

  const disable = useCallback(() => {
    setEnabled(false);
    ctxRef.current?.suspend().catch(() => {});
  }, []);

  const play = useCallback(
    (cue: Cue) => {
      if (!enabled) return;
      const ctx = ctxRef.current;
      if (!ctx || ctx.state !== "running") return;

      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.connect(gain);

      switch (cue) {
        case "bass": {
          osc.type = "sine";
          osc.frequency.setValueAtTime(62, now);
          osc.frequency.exponentialRampToValueAtTime(34, now + 1.6);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.28, now + 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
          osc.start(now);
          osc.stop(now + 1.9);
          break;
        }
        case "tick": {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case "swell": {
          osc.type = "sawtooth";
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(180, now);
          filter.frequency.linearRampToValueAtTime(1400, now + 2.4);
          osc.disconnect();
          osc.connect(filter);
          filter.connect(gain);
          osc.frequency.setValueAtTime(110, now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.1, now + 1.4);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
          osc.start(now);
          osc.stop(now + 2.9);
          break;
        }
        case "resolve": {
          [196, 293.66, 440].forEach((f, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.setValueAtTime(f, now);
            g.gain.setValueAtTime(0.0001, now);
            g.gain.linearRampToValueAtTime(0.09, now + 0.12 + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(now);
            o.stop(now + 3.3);
          });
          osc.disconnect();
          gain.disconnect();
          return;
        }
      }
    },
    [enabled],
  );

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  return { enabled, enable, disable, play };
}
