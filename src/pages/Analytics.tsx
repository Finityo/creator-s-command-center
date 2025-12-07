import { LayoutShell } from "@/components/layout/LayoutShell";
import { StatCard } from "@/components/StatCard";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, MousePointer, FileText, Calendar, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EngagementChart } from "@/components/analytics/EngagementChart";
import { FollowerGrowthChart } from "@/components/analytics/FollowerGrowthChart";
import { CompetitorAnalysis } from "@/components/analytics/CompetitorAnalysis";
import { ABTesting } from "@/components/analytics/ABTesting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";

const platformDisplayMap: Record<Platform, "X" | "Instagram" | "Facebook" | "OnlyFans"> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

export default function Analytics() {
  const { user } = useAuth();

  // Fetch analytics data
  const { data: analyticsData = [], isLoading } = useQuery({
    queryKey: ["analytics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_snapshots")
        .select("*")
        .eq("user_id", user?.id)
        .order("taken_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch social accounts for platform breakdown
  const { data: socialAccounts = [] } = useQuery({
    queryKey: ["social-accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch post count
  const { data: postCount = 0 } = useQuery({
    queryKey: ["post-count", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count, error } = await supabase
        .from("scheduled_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .gte("created_at", thirtyDaysAgo.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Calculate stats from real data or use mock if no data
  const hasData = analyticsData.length > 0;
  
  // Group analytics by platform
  const platformStats = hasData 
    ? Object.values(
        analyticsData.reduce((acc, item) => {
          if (!acc[item.platform]) {
            acc[item.platform] = {
              platform: item.platform,
              followers: 0,
              impressions: 0,
              engagement: 0,
              count: 0,
            };
          }
          acc[item.platform].followers = Math.max(acc[item.platform].followers, item.followers || 0);
          acc[item.platform].impressions += item.impressions || 0;
          acc[item.platform].engagement += item.engagement || 0;
          acc[item.platform].count += 1;
          return acc;
        }, {} as Record<string, any>)
      ).map((stat: any) => ({
        ...stat,
        engagement: stat.count > 0 ? +(stat.engagement / stat.count).toFixed(1) : 0,
      }))
    : [
        { platform: "ONLYFANS", followers: 845, impressions: 12890, engagement: 6.3 },
        { platform: "X", followers: 3000, impressions: 15000, engagement: 3.1 },
        { platform: "INSTAGRAM", followers: 5000, impressions: 25000, engagement: 5.4 },
        { platform: "FACEBOOK", followers: 2500, impressions: 15000, engagement: 2.7 },
      ];

  const totalFollowers = platformStats.reduce((sum, s) => sum + s.followers, 0);
  const avgEngagement = platformStats.length > 0 
    ? +(platformStats.reduce((sum, s) => sum + s.engagement, 0) / platformStats.length).toFixed(1)
    : 0;
  const totalClicks = analyticsData.reduce((sum, item) => sum + (item.clicks || 0), 0);

  // Prepare chart data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split("T")[0];
  });

  const engagementChartData = last30Days.map((date) => {
    const dayData = analyticsData.filter(
      (item) => item.taken_at.split("T")[0] === date
    );
    return {
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      engagement: dayData.length > 0 
        ? +(dayData.reduce((sum, d) => sum + (d.engagement || 0), 0) / dayData.length).toFixed(1)
        : Math.random() * 5 + 2, // Mock data
      impressions: dayData.reduce((sum, d) => sum + (d.impressions || 0), 0) || Math.floor(Math.random() * 1000 + 500),
      clicks: dayData.reduce((sum, d) => sum + (d.clicks || 0), 0) || Math.floor(Math.random() * 100 + 20),
    };
  });

  const followerGrowthData = last30Days.map((date, i) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    followers: hasData 
      ? analyticsData
          .filter((item) => item.taken_at.split("T")[0] <= date)
          .reduce((sum, d) => sum + (d.followers || 0), 0) / (platformStats.length || 1)
      : 10000 + i * 50 + Math.floor(Math.random() * 100), // Mock growth
  }));

  const engagementData = [
    { label: "Mon", value: 65 },
    { label: "Tue", value: 78 },
    { label: "Wed", value: 82 },
    { label: "Thu", value: 70 },
    { label: "Fri", value: 95 },
    { label: "Sat", value: 88 },
    { label: "Sun", value: 72 },
  ];

  const maxValue = Math.max(...engagementData.map((d) => d.value));

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">Track your growth across all platforms</p>
          </div>
          <Button variant="pill" size="pill">
            <Calendar className="h-3 w-3" />
            Last 30 days
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Followers"
            value={totalFollowers.toLocaleString()}
            hint="All platforms"
            icon={Users}
            trend="up"
          />
          <StatCard
            label="Engagement Rate"
            value={`${avgEngagement}%`}
            hint="+0.8% from last month"
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            label="Link Clicks"
            value={totalClicks > 0 ? totalClicks.toLocaleString() : "2,345"}
            hint="Link-in-bio traffic"
            icon={MousePointer}
          />
          <StatCard
            label="Posts (30d)"
            value={postCount.toString()}
            hint="Across all networks"
            icon={FileText}
          />
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="engagement" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="abtesting">A/B Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="engagement">
            <div className="glass-panel rounded-2xl p-5">
              <h2 className="font-semibold text-foreground mb-4">Engagement Over Time</h2>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <EngagementChart data={engagementChartData} />
              )}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Engagement %</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <span className="text-xs text-muted-foreground">Impressions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Clicks</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="followers">
            <div className="glass-panel rounded-2xl p-5">
              <h2 className="font-semibold text-foreground mb-4">Follower Growth</h2>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <FollowerGrowthChart data={followerGrowthData} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="competitors">
            <div className="glass-panel rounded-2xl p-5">
              <CompetitorAnalysis />
            </div>
          </TabsContent>

          <TabsContent value="abtesting">
            <div className="glass-panel rounded-2xl p-5">
              <ABTesting />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Followers by Platform */}
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Followers by Platform</h2>

            <div className="space-y-4">
              {platformStats.map((stat) => {
                const percentage = totalFollowers > 0 ? (stat.followers / totalFollowers) * 100 : 0;
                return (
                  <div key={stat.platform}>
                    <div className="flex items-center justify-between mb-2">
                      <PlatformBadge platform={platformDisplayMap[stat.platform as Platform] || stat.platform} />
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

          {/* Weekly Engagement Bar Chart */}
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
                      <PlatformBadge platform={platformDisplayMap[stat.platform as Platform] || stat.platform} />
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
