import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Edit3,
  Search,
} from "lucide-react";
import { PlatformBadge } from "@/components/PlatformBadge";
import { useProfile } from "@/hooks/useProfile";

type PostStatus = "DRAFT" | "SCHEDULED" | "SENT" | "FAILED";
type Platform = "X" | "Instagram" | "Facebook" | "OnlyFans";

const platformMap: Record<string, Platform> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

const STATUS_ICON: Record<PostStatus, any> = {
  DRAFT: Clock,
  SCHEDULED: Calendar,
  SENT: CheckCircle,
  FAILED: XCircle,
};

export default function ContentLibrary() {
  const { profile } = useProfile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "ALL">("ALL");

  const { data: posts = [] } = useQuery({
    queryKey: ["content-library", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", profile!.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filtered = posts.filter((post) => {
    const matchesStatus =
      statusFilter === "ALL" || post.status === statusFilter;
    const matchesSearch =
      post.content?.toLowerCase().includes(search.toLowerCase()) ?? true;
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Content Library</h1>
        <Button>Create Content</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {["ALL", "DRAFT", "SCHEDULED", "SENT", "FAILED"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s as PostStatus | "ALL")}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No content found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((post) => {
            const StatusIcon = STATUS_ICON[post.status as PostStatus];

            return (
              <div
                key={post.id}
                className="border border-border rounded-lg p-4 space-y-3 hover:shadow-sm transition bg-card"
              >
                {/* Top Row */}
                <div className="flex justify-between items-start gap-2">
                  <PlatformBadge platform={platformMap[post.platform] || "X"} />
                  <Badge variant="secondary" className="flex gap-1 items-center">
                    <StatusIcon className="h-3 w-3" />
                    {post.status}
                  </Badge>
                </div>

                {/* Content Preview */}
                <div className="text-sm line-clamp-4 whitespace-pre-wrap text-foreground">
                  {post.content || (
                    <span className="italic text-muted-foreground">
                      No content
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="text-xs text-muted-foreground">
                  {post.external_post_id && (
                    <span>
                      External ID: <code className="bg-muted px-1 rounded">{post.external_post_id}</code>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-2">
                  <Button size="sm" variant="ghost" className="gap-1">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1">
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
