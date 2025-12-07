import { PlatformBadge } from "@/components/PlatformBadge";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";
type PostStatus = "DRAFT" | "SCHEDULED" | "SENT" | "FAILED";

const platformDisplayMap: Record<Platform, "X" | "Instagram" | "Facebook" | "OnlyFans"> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

const statusConfig: Record<PostStatus, { icon: typeof CheckCircle; label: string; className: string }> = {
  SENT: { icon: CheckCircle, label: "Sent", className: "text-emerald-400" },
  FAILED: { icon: XCircle, label: "Failed", className: "text-destructive" },
  SCHEDULED: { icon: Clock, label: "Scheduled", className: "text-amber-400" },
  DRAFT: { icon: Clock, label: "Draft", className: "text-muted-foreground" },
};

export function PostHistory() {
  const { profile, isLoading: profileLoading } = useProfile();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["post-history", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", profile!.id)
        .in("status", ["SENT", "FAILED"])
        .order("updated_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (profileLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No post history yet</p>
        <p className="text-xs text-muted-foreground mt-1">Posts will appear here after they're sent</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => {
        const status = statusConfig[post.status as PostStatus];
        const StatusIcon = status.icon;

        return (
          <div
            key={post.id}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <PlatformBadge 
                platform={platformDisplayMap[post.platform as Platform]} 
                size="sm" 
                showLabel={false} 
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate max-w-[180px]">{post.content}</p>
                <p className="text-xs text-muted-foreground">{formatTime(post.updated_at)}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 ${status.className}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              <span className="text-xs">{status.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
