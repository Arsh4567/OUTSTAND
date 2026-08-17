import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export function OutstandRobotAvatar({
  size = "md",
  className,
  pulse = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  pulse?: boolean;
}) {
  const sizes = {
    sm: "h-7 w-7",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-28 w-28",
  } as const;

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  } as const;

  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-cyan-300/25 bg-[radial-gradient(circle_at_35%_30%,rgba(103,232,249,.22),transparent_38%),linear-gradient(145deg,#0b1930,#07101f)] text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,.22)]",
        pulse && "animate-pulse",
        sizes[size],
        className,
      )}
      aria-label="Outstand Intelligence"
    >
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(37,149,255,0.18),transparent_68%)]" />
      <span className="relative grid place-items-center rounded-xl border border-cyan-200/15 bg-cyan-300/[0.06] p-1.5 shadow-[inset_0_0_18px_rgba(34,211,238,.08)]">
        <Bot className={iconSizes[size]} strokeWidth={1.8} />
      </span>
      <span className="absolute bottom-[13%] right-[16%] h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)]" />
    </span>
  );
}
