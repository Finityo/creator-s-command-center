import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformBadge } from "@/components/PlatformBadge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format } from "date-fns";
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  MousePointerClick,
  BarChart3,
  Loader2
} from "lucide-react";

type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";
type DisplayPlatform = "X" | "Instagram" | "Facebook" | "OnlyFans";

const platformDisplayMap: Record<Platform, DisplayPlatform> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

interface PostWithAnalytics {
  id: string;
  platform: Platform;
  content: string;
  scheduled_at: string;
  status: string;
  analytics: {
    impressions: number;
    engagements: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    reach: number;
  } | null;
}

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export function PostAnalyticsDashboard() {
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  // Fetch sent posts with their analytics
  const { data: postsWithAnalytics = [], isLoading } = useQuery({
    queryKey: ["post-analytics", user?.id],
    queryFn: async () => {
      // Get sent posts
      const { data: posts, error: postsError } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "SENT")
        .order("scheduled_at", { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // For demo purposes, generate mock analytics data
      // In production, this would come from the post_analytics table or API integrations
      const postsWithMockAnalytics: PostWithAnalytics[] = (posts || []).map((post) => ({
        ...post,
        analytics: generateMockAnalytics(post.platform),
      }));

      return postsWithMockAnalytics;
    },
    enabled: !!user?.id,
  });

  function generateMockAnalytics(platform: string) {
    const baseMultiplier = platform === "INSTAGRAM" ? 1.5 : platform === "FACEBOOK" ? 1.2 : 1;
    return {
      impressions: Math.floor(Math.random() * 5000 * baseMultiplier) + 500,
      engagements: Math.floor(Math.random() * 500 * baseMultiplier) + 50,
      likes: Math.floor(Math.random() * 300 * baseMultiplier) + 20,
      comments: Math.floor(Math.random() * 50 * baseMultiplier) + 5,
      shares: Math.floor(Math.random() * 30 * baseMultiplier) + 2,
      clicks: Math.floor(Math.random() * 100 * baseMultiplier) + 10,
      reach: Math.floor(Math.random() * 3000 * baseMultiplier) + 300,
    };
  }

  // Calculate aggregate stats
  const aggregateStats = postsWithAnalytics.reduce(
    (acc, post) => {
      if (post.analytics) {
        acc.totalImpressions += post.analytics.impressions;
        acc.totalEngagements += post.analytics.engagements;
        acc.totalLikes += post.analytics.likes;
        acc.totalComments += post.analytics.comments;
        acc.totalShares += post.analytics.shares;
        acc.totalClicks += post.analytics.clicks;
      }
      return acc;
    },
    { totalImpressions: 0, totalEngagements: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalClicks: 0 }
  );

  const avgEngagementRate = aggregateStats.totalImpressions > 0
    ? ((aggregateStats.totalEngagements / aggregateStats.totalImpressions) * 100).toFixed(2)
    : "0";

  // Platform distribution data
  const platformData = postsWithAnalytics.reduce((acc: { name: string; value: number }[], post) => {
    const existing = acc.find((p) => p.name === platformDisplayMap[post.platform]);
    if (existing) {
      existing.value += post.analytics?.engagements || 0;
    } else {
      acc.push({ name: platformDisplayMap[post.platform], value: post.analytics?.engagements || 0 });
    }
    return acc;
  }, []);

  // Performance over time data
  const timelineData = postsWithAnalytics
    .slice(0, 10)
    .reverse()
    .map((post) => ({
      date: format(new Date(post.scheduled_at), "MMM d"),
      impressions: post.analytics?.impressions || 0,
      engagements: post.analytics?.engagements || 0,
    }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedPostData = selectedPost 
    ? postsWithAnalytics.find((p) => p.id === selectedPost) 
    : null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-background/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xs">Impressions</span>
            </div>
            <p className="text-2xl font-bold">{aggregateStats.totalImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-background/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Engagement Rate</span>
            </div>
            <p className="text-2xl font-bold">{avgEngagementRate}%</p>
          </CardContent>
        </Card>

        <Card className="bg-background/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Heart className="h-4 w-4" />
              <span className="text-xs">Likes</span>
            </div>
            <p className="text-2xl font-bold">{aggregateStats.totalLikes.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-background/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Comments</span>
            </div>
            <p className="text-2xl font-bold">{aggregateStats.totalComments.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-background/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Shares</span>
            </div>
            <p className="text-2xl font-bold">{aggregateStats.totalShares.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-background/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-xs">Clicks</span>
            </div>
            <p className="text-2xl font-bold">{aggregateStats.totalClicks.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="engagements" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Engagement by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {platformData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {platformData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Post List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Individual Post Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postsWithAnalytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No published posts yet</p>
              <p className="text-xs mt-1">Analytics will appear here after posts are published</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {postsWithAnalytics.map((post) => (
                <div
                  key={post.id}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPost === post.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <PlatformBadge platform={platformDisplayMap[post.platform]} size="sm" />
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(post.scheduled_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-1">{post.content}</p>
                    </div>

                    {post.analytics && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.analytics.impressions.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.analytics.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.analytics.comments}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedPost === post.id && post.analytics && (
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-4 gap-3">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{post.analytics.reach.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Reach</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{post.analytics.clicks}</p>
                        <p className="text-[10px] text-muted-foreground">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{post.analytics.shares}</p>
                        <p className="text-[10px] text-muted-foreground">Shares</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {((post.analytics.engagements / post.analytics.impressions) * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">Eng. Rate</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
