import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, CalendarOff } from "lucide-react";
import { toast } from "sonner";

type ScheduledPost = {
  id: string;
  status: "DRAFT" | "SCHEDULED" | "SENT" | "FAILED" | string;
  scheduled_at: string | null;
};

export function PostStatusActions({ post }: { post: ScheduledPost }) {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const schedulePost = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile");
      if (post.status !== "DRAFT") return;
      if (!post.scheduled_at) {
        throw new Error("Scheduled time required");
      }

      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status: "SCHEDULED" })
        .eq("id", post.id)
        .eq("user_id", profile.id)
        .eq("status", "DRAFT");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["scheduled-posts", profile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-metrics", profile?.id],
      });
      toast.success("Post scheduled");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to schedule post");
    },
  });

  const unschedulePost = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile");
      if (post.status !== "SCHEDULED") return;

      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status: "DRAFT" })
        .eq("id", post.id)
        .eq("user_id", profile.id)
        .eq("status", "SCHEDULED");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["scheduled-posts", profile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-metrics", profile?.id],
      });
      toast.success("Post moved to drafts");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to unschedule post");
    },
  });

  if (post.status === "DRAFT") {
    return (
      <Button
        variant="brand"
        size="sm"
        onClick={() => schedulePost.mutate()}
        disabled={schedulePost.isPending || !post.scheduled_at}
      >
        {schedulePost.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Calendar className="h-4 w-4 mr-1" />
            Schedule
          </>
        )}
      </Button>
    );
  }

  if (post.status === "SCHEDULED") {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => unschedulePost.mutate()}
        disabled={unschedulePost.isPending}
      >
        {unschedulePost.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CalendarOff className="h-4 w-4 mr-1" />
            Unschedule
          </>
        )}
      </Button>
    );
  }

  return null;
}
