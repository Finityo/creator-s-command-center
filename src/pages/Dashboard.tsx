import { LayoutShell } from "@/components/layout/LayoutShell";
import { StatCard } from "@/components/StatCard";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Button } from "@/components/ui/button";
import { Users, Eye, MousePointer, Clock, ArrowRight, CheckCircle, AlertCircle, Circle, Loader2, History, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostHistory } from "@/components/dashboard/PostHistory";
import { RetryQueue } from "@/components/dashboard/RetryQueue";
import { DashboardCards } from "@/components/dashboard/DashboardCards";

type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";

const platformDisplayMap: Record<Platform, "X" | "Instagram" | "Facebook" | "OnlyFans"> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

export default function Dashboard() {
  const { profile, isLoading: profileLoading } = useProfile();

  // Fetch user's scheduled posts
  const { data: scheduledPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["upcoming-posts", profile?.id],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", profile!.id)
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch user's social accounts
  const { data: socialAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["social-accounts", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("user_id", profile!.id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Calculate stats
  const next24hPosts = scheduledPosts.filter(post => {
    const postDate = new Date(post.scheduled_at);
    const in24h = new Date();
    in24h.setHours(in24h.getHours() + 24);
    return postDate <= in24h;
  }).length;

  const getAccountStatus = (platform: Platform): "connected" | "pending" | "disconnected" => {
    const account = socialAccounts.find(acc => acc.platform === platform);
    if (!account) return "disconnected";
    return account.is_connected ? "connected" : "pending";
  };

  const connectedPlatforms: { platform: Platform; status: "connected" | "pending" | "disconnected" }[] = [
    { platform: "X", status: getAccountStatus("X") },
    { platform: "INSTAGRAM", status: getAccountStatus("INSTAGRAM") },
    { platform: "FACEBOOK", status: getAccountStatus("FACEBOOK") },
    { platform: "ONLYFANS", status: getAccountStatus("ONLYFANS") },
  ];

  const formatPostTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (date.toDateString() === today.toDateString()) {
      return `Today · ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow · ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} · ${timeStr}`;
    }
  };

  if (profileLoading) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Dashboard Metrics Cards */}
        <DashboardCards />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Connected Accounts" 
            value={socialAccounts.filter(a => a.is_connected).length} 
            hint="Platforms linked" 
            icon={Users}
          />
          <StatCard 
            label="Scheduled Posts" 
            value={scheduledPosts.length} 
            hint="Upcoming content" 
            icon={Eye}
          />
          <StatCard 
            label="Link Clicks" 
            value="—" 
            hint="Connect analytics" 
            icon={MousePointer}
          />
          <StatCard 
            label="Next 24h Posts" 
            value={next24hPosts} 
            hint="Scheduled across all platforms" 
            icon={Clock}
          />
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Upcoming Posts */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Upcoming Posts</h2>
              <Link to="/scheduler">
                <Button variant="ghost" size="sm" className="text-primary">
                  View scheduler
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {postsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : scheduledPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">No scheduled posts yet</p>
                <Link to="/scheduler">
                  <Button variant="brand" size="sm">Schedule your first post</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledPosts.slice(0, 4).map((post) => (
                  <div 
                    key={post.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <PlatformBadge platform={platformDisplayMap[post.platform as Platform]} size="sm" showLabel={false} />
                      <div>
                        <p className="text-sm text-foreground">{formatPostTime(post.scheduled_at)}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{post.content}</p>
                      </div>
                    </div>
                    <span className="text-xs text-primary capitalize">{post.status.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            )}

            <Link to="/scheduler" className="block mt-4">
              <Button variant="glass" className="w-full">
                + Schedule new post
              </Button>
            </Link>
          </div>

          {/* Connected Platforms */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Platforms</h2>
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Manage
                </Button>
              </Link>
            </div>

            {accountsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {connectedPlatforms.map((item, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50"
                  >
                    <PlatformBadge platform={platformDisplayMap[item.platform]} />
                    <div className="flex items-center gap-2">
                      {item.status === "connected" && (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs text-emerald-400">Connected</span>
                        </>
                      )}
                      {item.status === "pending" && (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs text-amber-400">Pending</span>
                        </>
                      )}
                      {item.status === "disconnected" && (
                        <>
                          <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Connect</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Retry Queue Section */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-red-400" />
              <h2 className="font-semibold text-foreground">Failed Posts</h2>
            </div>
            <span className="text-xs text-muted-foreground">Retry queue</span>
          </div>
          <RetryQueue />
        </div>

        {/* Post History Section */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Post History</h2>
            </div>
            <span className="text-xs text-muted-foreground">Recent activity</span>
          </div>
          <PostHistory />
        </div>

        {/* Quick Actions */}
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link to="/scheduler">
              <Button variant="glass" className="w-full justify-start gap-3 h-auto py-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  📅
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Schedule Post</p>
                  <p className="text-xs text-muted-foreground">Plan your content</p>
                </div>
              </Button>
            </Link>
            <Link to="/streams">
              <Button variant="glass" className="w-full justify-start gap-3 h-auto py-4">
                <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  📶
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">View Streams</p>
                  <p className="text-xs text-muted-foreground">Discover trends</p>
                </div>
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="glass" className="w-full justify-start gap-3 h-auto py-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-400/20 flex items-center justify-center">
                  📊
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Analytics</p>
                  <p className="text-xs text-muted-foreground">Track growth</p>
                </div>
              </Button>
            </Link>
            <Link to="/link-page">
              <Button variant="glass" className="w-full justify-start gap-3 h-auto py-4">
                <div className="h-10 w-10 rounded-xl bg-pink-400/20 flex items-center justify-center">
                  🔗
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Link Page</p>
                  <p className="text-xs text-muted-foreground">Edit your bio</p>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
