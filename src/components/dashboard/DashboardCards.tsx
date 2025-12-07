import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Loader2 } from "lucide-react";

export function DashboardCards() {
  const { data, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard label="Total Posts" value={data.total} />
      <MetricCard label="Drafts" value={data.drafts} />
      <MetricCard label="Scheduled" value={data.scheduled} />
      <MetricCard label="Sent" value={data.sent} />
      <div className="col-span-2 md:col-span-4 text-sm text-muted-foreground">
        Next post: {data.nextScheduledAt ? new Date(data.nextScheduledAt).toLocaleString() : "—"}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary/30 border border-border/50 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
