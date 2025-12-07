import { LayoutShell } from "@/components/layout/LayoutShell";
import { StatCard } from "@/components/StatCard";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, MousePointer, FileText, Calendar } from "lucide-react";

const platformStats = [
  { platform: "OnlyFans" as const, followers: 845, impressions: 12890, engagement: 6.3 },
  { platform: "X" as const, followers: 3000, impressions: 15000, engagement: 3.1 },
  { platform: "Instagram" as const, followers: 5000, impressions: 25000, engagement: 5.4 },
  { platform: "Facebook" as const, followers: 2500, impressions: 15000, engagement: 2.7 },
];

const engagementData = [
  { label: "Mon", value: 65 },
  { label: "Tue", value: 78 },
  { label: "Wed", value: 82 },
  { label: "Thu", value: 70 },
  { label: "Fri", value: 95 },
  { label: "Sat", value: 88 },
  { label: "Sun", value: 72 },
];

export default function Analytics() {
  const maxValue = Math.max(...engagementData.map((d) => d.value));

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Followers"
            value="12,345"
            hint="All platforms"
            icon={Users}
            trend="up"
          />
          <StatCard
            label="Engagement Rate"
            value="4.2%"
            hint="+0.8% from last month"
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            label="Link Clicks"
            value="2,345"
            hint="Link-in-bio traffic"
            icon={MousePointer}
          />
          <StatCard
            label="Posts (30d)"
            value="88"
            hint="Across all networks"
            icon={FileText}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Followers by Platform */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Followers by Platform</h2>
              <Button variant="pill" size="pill">
                <Calendar className="h-3 w-3" />
                30 days
              </Button>
            </div>

            <div className="space-y-4">
              {platformStats.map((stat) => {
                const percentage = (stat.followers / 12345) * 100;
                return (
                  <div key={stat.platform}>
                    <div className="flex items-center justify-between mb-2">
                      <PlatformBadge platform={stat.platform} />
                      <span className="text-sm font-medium text-foreground">
                        {stat.followers.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-brand rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Engagement Chart */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Weekly Engagement</h2>
              <Button variant="pill" size="pill">
                This week
              </Button>
            </div>

            <div className="flex items-end justify-between gap-2 h-40">
              {engagementData.map((day) => (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className="w-full gradient-brand rounded-t-lg transition-all duration-500 hover:opacity-80"
                      style={{ height: `${(day.value / maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Performance Table */}
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Platform Performance</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Platform</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Followers</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Impressions</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {platformStats.map((stat) => (
                  <tr key={stat.platform} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-2">
                      <PlatformBadge platform={stat.platform} />
                    </td>
                    <td className="text-right py-3 px-2 text-foreground">{stat.followers.toLocaleString()}</td>
                    <td className="text-right py-3 px-2 text-foreground">{stat.impressions.toLocaleString()}</td>
                    <td className="text-right py-3 px-2">
                      <span className="text-emerald-400">{stat.engagement}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
