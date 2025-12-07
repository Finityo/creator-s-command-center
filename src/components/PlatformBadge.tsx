import { cn } from "@/lib/utils";

type Platform = "X" | "Instagram" | "Facebook" | "OnlyFans";

interface PlatformBadgeProps {
  platform: Platform;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const platformConfig: Record<Platform, { icon: string; label: string; color: string }> = {
  X: { icon: "𝕏", label: "X", color: "bg-foreground/10 text-foreground" },
  Instagram: { icon: "📸", label: "Instagram", color: "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-400" },
  Facebook: { icon: "📘", label: "Facebook", color: "bg-blue-500/20 text-blue-400" },
  OnlyFans: { icon: "⭐", label: "OnlyFans", color: "bg-sky-500/20 text-sky-400" },
};

export function PlatformBadge({ platform, size = "md", showLabel = true }: PlatformBadgeProps) {
  const config = platformConfig[platform];
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      config.color,
      size === "sm" && "px-2 py-0.5 text-[10px]",
      size === "md" && "px-2.5 py-1 text-xs",
      size === "lg" && "px-3 py-1.5 text-sm"
    )}>
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
