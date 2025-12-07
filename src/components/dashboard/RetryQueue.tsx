import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  Trash2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/PlatformBadge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";

const platformDisplayMap: Record<Platform, "X" | "Instagram" | "Facebook" | "OnlyFans"> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

interface FailedPost {
  id: string;
  platform: Platform;
  content: string;
  scheduled_at: string;
  error_message: string | null;
  updated_at: string;
}

export function RetryQueue() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { data: failedPosts = [], isLoading } = useQuery({
    queryKey: ["failed-posts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "FAILED")
        .order("updated_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as FailedPost[];
    },
    enabled: !!user?.id,
  });

  const retryMutation = useMutation({
    mutationFn: async (postId: string) => {
      // Reset the post to SCHEDULED status so it will be picked up again
      const { error } = await supabase
        .from("scheduled_posts")
        .update({ 
          status: "SCHEDULED", 
          error_message: null,
          scheduled_at: new Date().toISOString(), // Schedule for now
          updated_at: new Date().toISOString()
        })
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["failed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-posts"] });
      toast.success("Post queued for retry");
    },
    onError: (error: any) => {
      toast.error(`Failed to retry: ${error.message}`);
    },
    onSettled: () => {
      setRetryingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["failed-posts"] });
      toast.success("Failed post deleted");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleRetry = (postId: string) => {
    setRetryingId(postId);
    retryMutation.mutate(postId);
  };

  const handleRetryAll = () => {
    failedPosts.forEach(post => {
      retryMutation.mutate(post.id);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (failedPosts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <RefreshCw className="h-6 w-6 text-emerald-400" />
        </div>
        <p className="text-sm text-muted-foreground">No failed posts</p>
        <p className="text-xs text-muted-foreground/60 mt-1">All your posts are publishing successfully</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-sm text-muted-foreground">
            {failedPosts.length} failed post{failedPosts.length !== 1 ? 's' : ''}
          </span>
        </div>
        {failedPosts.length > 1 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRetryAll}
            disabled={retryMutation.isPending}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry All
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {failedPosts.map((post) => (
          <div 
            key={post.id}
            className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <PlatformBadge 
                  platform={platformDisplayMap[post.platform]} 
                  size="sm" 
                  showLabel={false} 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{post.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-red-400 truncate">
                      {post.error_message || 'Unknown error'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRetry(post.id)}
                  disabled={retryingId === post.id}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  {retryingId === post.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Failed Post?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this failed post. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate(post.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
