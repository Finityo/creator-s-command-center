/* ============================================================
   MANUAL "SENT" STATUS SIMULATION (NO WORKERS)
   ============================================================
   PURPOSE:
   - Allow developers (and later admins) to manually mark a
     scheduled post as SENT.
   - This simulates delivery without automation.
   - Used for UI flow validation and analytics readiness.

   RULES:
   - Only SCHEDULED posts can be marked SENT
   - Ownership enforced via profile.id
   - Dashboard metrics update instantly
------------------------------------------------------------ */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

type Post = {
  id: string;
  status: "DRAFT" | "SCHEDULED" | "SENT" | "FAILED";
};

export function MarkSentAction({ post }: { post: Post }) {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const markSent = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile");
      if (post.status !== "SCHEDULED") return;

      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status: "SENT" })
        .eq("id", post.id)
        .eq("user_id", profile.id)
        .eq("status", "SCHEDULED");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts", profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["post-history", profile?.id] });
      toast.success("Post marked as sent");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to mark sent");
    },
  });

  if (post.status !== "SCHEDULED") return null;

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => markSent.mutate()}
      disabled={markSent.isPending}
      className="gap-1.5"
    >
      {markSent.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      Mark Sent
    </Button>
  );
}
