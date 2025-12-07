import { LayoutShell } from "@/components/layout/LayoutShell";
import { StatCard } from "@/components/StatCard";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Button } from "@/components/ui/button";
import { Users, Eye, MousePointer, Clock, ArrowRight, CheckCircle, AlertCircle, Circle } from "lucide-react";
import { Link } from "react-router-dom";

const upcomingPosts = [
  { platform: "X" as const, time: "Today · 3:00 PM", content: "@handle – 1 image", status: "scheduled" },
  { platform: "Instagram" as const, time: "Today · 6:30 PM", content: "Reel – launch teaser", status: "scheduled" },
  { platform: "OnlyFans" as const, time: "Tomorrow · 9:00 AM", content: "Subscriber post", status: "scheduled" },
];

const connectedPlatforms = [
  { platform: "X" as const, status: "connected" as const },
  { platform: "Instagram" as const, status: "connected" as const },
  { platform: "Facebook" as const, status: "pending" as const },
  { platform: "OnlyFans" as const, status: "disconnected" as const },
];

export default function Dashboard() {
  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Total Followers" 
            value="12,345" 
            hint="+324 last 7 days" 
            icon={Users}
            trend="up"
          />
          <StatCard 
            label="30d Impressions" 
            value="67,890" 
            hint="+12% vs prior" 
            icon={Eye}
            trend="up"
          />
          <StatCard 
            label="Link Clicks" 
            value="2,345" 
            hint="Link-in-bio traffic" 
            icon={MousePointer}
          />
          <StatCard 
            label="Scheduled Posts" 
            value="4" 
            hint="Next 24 hours" 
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

            <div className="space-y-3">
              {upcomingPosts.map((post, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={post.platform} size="sm" showLabel={false} />
                    <div>
                      <p className="text-sm text-foreground">{post.time}</p>
                      <p className="text-xs text-muted-foreground">{post.content}</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary capitalize">{post.status}</span>
                </div>
              ))}
            </div>

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

            <div className="space-y-3">
              {connectedPlatforms.map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50"
                >
                  <PlatformBadge platform={item.platform} />
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
          </div>
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
                  <p className="text-xs text-muted-foreground">Monitor activity</p>
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
