import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "glass-panel rounded-2xl p-5 animate-scale-in",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
        {Icon && (
          <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
      <div className="text-3xl font-semibold text-foreground tracking-tight">
        {value}
      </div>
      {hint && (
        <div className={cn(
          "text-xs mt-2",
          trend === "up" && "text-emerald-400",
          trend === "down" && "text-rose-400",
          !trend && "text-muted-foreground"
        )}>
          {hint}
        </div>
      )}
    </div>
  );
}
