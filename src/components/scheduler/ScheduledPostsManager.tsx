import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { PostStatusActions } from "./PostStatusActions";
import { MarkSentAction } from "./MarkSentAction";

interface ScheduledPost {
  id: string;
  user_id: string;
  social_account_id: string | null;
  content: string;
  scheduled_at: string;
  status: "DRAFT" | "SCHEDULED" | "SENT" | "FAILED";
  platform: string;
}

export function ScheduledPostsManager() {
  const { profile, isLoading: profileLoading } = useProfile();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [socialAccountId, setSocialAccountId] = useState("");

  // READ
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["scheduled-posts", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", profile!.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return data as ScheduledPost[];
    },
    enabled: !!profile?.id,
  });

  // CREATE
  const createPost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: profile!.id,
        social_account_id: socialAccountId || null,
        content,
        scheduled_at: scheduledAt,
        status: "DRAFT",
        platform: "X", // Default platform
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["scheduled-posts", profile?.id],
      });
      setContent("");
      setScheduledAt("");
      setSocialAccountId("");
    },
  });

  // DELETE
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", profile!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["scheduled-posts", profile?.id],
      });
    },
  });

  if (profileLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Create Draft */}
      <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
        <textarea
          className="w-full rounded-xl bg-background border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder="Post content"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <input
          type="datetime-local"
          className="w-full rounded-xl bg-background border border-border p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
        <input
          className="w-full rounded-xl bg-background border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Social Account ID (optional)"
          value={socialAccountId}
          onChange={(e) => setSocialAccountId(e.target.value)}
        />
        <Button 
          variant="brand" 
          onClick={() => createPost.mutate()}
          disabled={!content || !scheduledAt || createPost.isPending}
        >
          {createPost.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save Draft"
          )}
        </Button>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No scheduled posts yet
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between rounded-xl bg-secondary/30 border border-border/50 p-4"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground line-clamp-2">{post.content}</span>
                <span className="text-xs text-muted-foreground">
                  {post.status.toLowerCase()} • {post.platform} • {new Date(post.scheduled_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PostStatusActions post={post} />
                <MarkSentAction post={post} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deletePost.mutate(post.id)}
                  disabled={deletePost.isPending}
                >
                  {deletePost.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
