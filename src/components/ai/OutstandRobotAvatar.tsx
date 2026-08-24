import { CircleDot } from "lucide-react";
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
        "relative inline-grid shrink-0 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-sm",
        pulse && "animate-pulse",
        sizes[size],
        className,
      )}
      aria-label="OUTSTAND"
    >
      <CircleDot className={iconSizes[size]} strokeWidth={1.7} />
    </span>
  );
}
