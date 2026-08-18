import type { RefObject } from "react";
import { useEffect, useState } from "react";

export type PerformanceProfile = {
  dpr: number | [number, number];
  reducedMotion: boolean;
  isMobile: boolean;
};

export function getPerformanceProfile(reducedMotion: boolean): PerformanceProfile {
  if (typeof window === "undefined") {
    return { dpr: 1, reducedMotion, isMobile: false };
  }

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const lowPower = (navigator.hardwareConcurrency || 8) <= 4;

  if (reducedMotion || isMobile || lowPower) {
    return { dpr: 1, reducedMotion, isMobile };
  }

  return { dpr: [1, 1.25], reducedMotion, isMobile };
}

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return reducedMotion;
}

export function usePageVisibility(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden,
  );

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update, { passive: true });
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}

export function useElementVisibility<T extends HTMLElement>(
  ref: RefObject<T | null>,
): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px", threshold: 0 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
}
