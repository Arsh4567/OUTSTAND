import { useEffect, useRef } from "react";

/**
 * One shared cursor light is cheaper than dozens of component-level mouse
 * listeners. Pointer coordinates are sampled once per animation frame and
 * only `transform`/`opacity` are animated, keeping the effect compositor-led.
 */
export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const point = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const element = ref.current;
    if (!element) return;

    const render = () => {
      frame.current = null;
      const { x, y } = point.current;
      element.style.transform = `translate3d(${x - 180}px, ${y - 180}px, 0)`;
    };

    const onPointerMove = (event: PointerEvent) => {
      point.current.x = event.clientX;
      point.current.y = event.clientY;
      element.style.opacity = "1";
      if (frame.current === null) frame.current = requestAnimationFrame(render);
    };

    const onPointerLeave = () => {
      element.style.opacity = "0";
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="outstand-cursor-spotlight pointer-events-none fixed left-0 top-0 z-[80] h-[360px] w-[360px] rounded-full opacity-0"
    />
  );
}
