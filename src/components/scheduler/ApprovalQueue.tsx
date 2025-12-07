import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlatformBadge } from "@/components/PlatformBadge";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  MessageSquare,
  Calendar,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";
type DisplayPlatform = "X" | "Instagram" | "Facebook" | "OnlyFans";
type ApprovalStatus = "pending" | "approved" | "rejected" | "not_required";

const platformDisplayMap: Record<Platform, DisplayPlatform> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

interface PendingPost {
  id: string;
  platform: Platform;
  content: string;
  scheduled_at: string;
  approval_status: ApprovalStatus;
  rejection_reason: string | null;
  created_at: string;
}

export function ApprovalQueue() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rejectingPost, setRejectingPost] = useState<PendingPost | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending posts
  const { data: pendingPosts = [], isLoading } = useQuery({
    queryKey: ["pending-approvals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("approval_status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as PendingPost[];
    },
    enabled: !!user?.id,
  });

  // Approve post mutation
  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .update({
          approval_status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post approved!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve post");
    },
  });

  // Reject post mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .update({
          approval_status: "rejected",
          rejection_reason: reason,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post rejected");
      setRejectingPost(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject post");
    },
  });

  const handleReject = () => {
    if (!rejectingPost) return;
    rejectMutation.mutate({
      postId: rejectingPost.id,
      reason: rejectionReason || "No reason provided",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (pendingPosts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
        <p className="text-sm text-muted-foreground">No posts pending approval</p>
        <p className="text-xs text-muted-foreground mt-1">
          All caught up!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">
            {pendingPosts.length} post{pendingPosts.length !== 1 ? "s" : ""} pending
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {pendingPosts.map((post) => (
          <div
            key={post.id}
            className="p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={platformDisplayMap[post.platform]} size="sm" />
                <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                  Pending Review
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(post.scheduled_at), "MMM d, h:mm a")}
              </span>
            </div>

            <p className="text-sm text-foreground mb-4 whitespace-pre-wrap">
              {post.content}
            </p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(post.id)}
                disabled={approveMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setRejectingPost(post)}
                disabled={rejectMutation.isPending}
                className="flex-1"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingPost} onOpenChange={() => setRejectingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Reject Post
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide a reason for rejecting this post (optional):
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingPost(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reject Post"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
