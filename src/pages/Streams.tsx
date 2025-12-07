import { LayoutShell } from "@/components/layout/LayoutShell";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Button } from "@/components/ui/button";
import { Filter, RefreshCw } from "lucide-react";

const platforms = ["OnlyFans", "X", "Instagram", "Facebook"] as const;

const mockStreamData: Record<string, { time: string; content: string; type: string }[]> = {
  OnlyFans: [
    { time: "Just now", content: "New subscriber joined! 🎉", type: "notification" },
    { time: "5 min ago", content: "Tip received: $25", type: "tip" },
    { time: "15 min ago", content: "Message from @user123: 'Love your content!'", type: "message" },
    { time: "1 hour ago", content: "Post liked by 47 subscribers", type: "engagement" },
  ],
  X: [
    { time: "2 min ago", content: "@user mentioned you in a tweet", type: "mention" },
    { time: "10 min ago", content: "Your post got 156 likes", type: "engagement" },
    { time: "30 min ago", content: "New follower: @creator_fan", type: "follower" },
    { time: "1 hour ago", content: "Retweet from @influencer", type: "engagement" },
  ],
  Instagram: [
    { time: "3 min ago", content: "New comment on your Reel", type: "comment" },
    { time: "12 min ago", content: "Story viewed by 234 people", type: "view" },
    { time: "25 min ago", content: "@brand wants to collaborate", type: "dm" },
    { time: "45 min ago", content: "Post saved 89 times", type: "engagement" },
  ],
  Facebook: [
    { time: "8 min ago", content: "Page like from new fan", type: "like" },
    { time: "20 min ago", content: "Comment on your video", type: "comment" },
    { time: "1 hour ago", content: "Event reminder: Live stream", type: "event" },
    { time: "2 hours ago", content: "Post shared 12 times", type: "share" },
  ],
};

export default function Streams() {
  return (
    <LayoutShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Activity Streams</h1>
        <Button variant="glass" size="sm">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {platforms.map((platform) => (
          <div
            key={platform}
            className="min-w-[280px] max-w-[320px] flex-shrink-0 glass-panel rounded-2xl p-4 flex flex-col"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <PlatformBadge platform={platform} size="md" />
              <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Stream Items */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {mockStreamData[platform].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-background border border-border/50 p-3 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground">{item.time}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>

            {/* Load more */}
            <Button variant="ghost" size="sm" className="mt-4 w-full text-muted-foreground">
              Load more
            </Button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 glass-panel rounded-2xl p-5 text-center">
        <p className="text-sm text-muted-foreground">
          Streams show real-time activity from your connected platforms. 
          <span className="text-primary cursor-pointer hover:underline ml-1">
            Connect platforms →
          </span>
        </p>
      </div>
    </LayoutShell>
  );
}
