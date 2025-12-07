import { useState, useRef, ChangeEvent, useMemo } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Loader2, Image as ImageIcon, X, Eye, EyeOff, Upload, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import { PostPreview } from "@/components/scheduler/PostPreview";
import { BulkUpload } from "@/components/scheduler/BulkUpload";
import { TemplateManager } from "@/components/scheduler/TemplateManager";
import { HashtagSuggestions } from "@/components/scheduler/HashtagSuggestions";
import { BestTimeRecommendations } from "@/components/scheduler/BestTimeRecommendations";
import { ContentRepurposer } from "@/components/scheduler/ContentRepurposer";
import { SentimentAnalysis } from "@/components/scheduler/SentimentAnalysis";
import { PostQueue } from "@/components/scheduler/PostQueue";

// Platform-specific character limits
const PLATFORM_LIMITS: Record<string, { max: number; name: string }> = {
  X: { max: 280, name: "X (Twitter)" },
  INSTAGRAM: { max: 2200, name: "Instagram" },
  FACEBOOK: { max: 63206, name: "Facebook" },
  ONLYFANS: { max: 5000, name: "OnlyFans" },
};

type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";
type PostStatus = "DRAFT" | "SCHEDULED" | "SENT" | "FAILED";

interface ScheduledPost {
  id: string;
  platform: Platform;
  content: string;
  media_url: string | null;
  scheduled_at: string;
  status: PostStatus;
  created_at: string;
  queue_order?: number;
}

export default function Scheduler() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "">("");
  const [content, setContent] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);

  // Fetch scheduled posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["scheduled-posts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user?.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return data as ScheduledPost[];
    },
    enabled: !!user?.id,
  });

  // Create post mutation
  const createPost = useMutation({
    mutationFn: async (postData: {
      platform: Platform;
      content: string;
      scheduled_at: string;
      media_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: user?.id,
          platform: postData.platform,
          content: postData.content,
          scheduled_at: postData.scheduled_at,
          media_url: postData.media_url || null,
          status: "SCHEDULED" as PostStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post scheduled successfully!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to schedule post");
    },
  });

  // Delete post mutation
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete post");
    },
  });

  // Reschedule post mutation
  const reschedulePost = useMutation({
    mutationFn: async ({ postId, newDate }: { postId: string; newDate: Date }) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .update({ scheduled_at: newDate.toISOString() })
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post rescheduled!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reschedule post");
    },
  });

  // Reorder posts mutation
  const reorderPosts = useMutation({
    mutationFn: async (reorderedPosts: { id: string; queue_order: number }[]) => {
      for (const post of reorderedPosts) {
        const { error } = await supabase
          .from("scheduled_posts")
          .update({ queue_order: post.queue_order })
          .eq("id", post.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Queue order updated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reorder posts");
    },
  });

  const handleAutoSchedule = async () => {
    setIsAutoScheduling(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-schedule");
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success(data.message || "Posts auto-scheduled!");
    } catch (error: any) {
      toast.error(error.message || "Failed to auto-schedule posts");
    } finally {
      setIsAutoScheduling(false);
    }
  };

  const handleReorderPosts = (reorderedPosts: ScheduledPost[]) => {
    reorderPosts.mutate(
      reorderedPosts.map((p, idx) => ({ id: p.id, queue_order: idx }))
    );
  };

  const resetForm = () => {
    setContent("");
    setScheduleDate("");
    setSelectedPlatform("");
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile || !user) return null;

    const fileExt = mediaFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("post-media")
      .upload(fileName, mediaFile);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("post-media")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const currentLimit = useMemo(() => 
    PLATFORM_LIMITS[selectedPlatform] || { max: 5000, name: "Post" }, 
    [selectedPlatform]
  );
  const isOverLimit = content.length > currentLimit.max;
  const remainingChars = currentLimit.max - content.length;

  const handleSchedule = async () => {
    if (!selectedPlatform || !content || !scheduleDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (isOverLimit) {
      toast.error(`Content exceeds ${currentLimit.name} limit of ${currentLimit.max} characters`);
      return;
    }

    setUploading(true);
    try {
      let mediaUrl: string | null = null;
      if (mediaFile) {
        mediaUrl = await uploadMedia();
      }

      await createPost.mutateAsync({
        platform: selectedPlatform as Platform,
        content,
        scheduled_at: new Date(scheduleDate).toISOString(),
        media_url: mediaUrl || undefined,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule post");
    } finally {
      setUploading(false);
    }
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleReschedule = (postId: string, newDate: Date) => {
    reschedulePost.mutate({ postId, newDate });
  };

  return (
    <LayoutShell>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar with drag-to-reschedule */}
        <ContentCalendar
          currentDate={currentDate}
          posts={posts}
          isLoading={isLoading}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onReschedule={handleReschedule}
          onDelete={(id) => deletePost.mutate(id)}
        />

        {/* Compose Panel */}
        <div className="w-full lg:w-96 space-y-4">
          {/* Preview Toggle & Preview Panel */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Preview</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs"
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showPreview ? "Hide" : "Show"}
              </Button>
            </div>
            {showPreview && (
              <div className="min-h-[200px]">
                <PostPreview
                  platform={selectedPlatform}
                  content={content}
                  mediaPreview={mediaPreview}
                />
              </div>
            )}
          </div>

          {/* Content Repurposer */}
          {content.trim() && selectedPlatform && (
            <div className="glass-panel rounded-2xl p-5">
              <ContentRepurposer
                content={content}
                sourcePlatform={selectedPlatform}
                onApplyContent={(newContent, platform) => {
                  setContent(newContent);
                  setSelectedPlatform(platform);
                }}
              />
            </div>
          )}

          {/* Bulk Upload Panel */}
          {showBulkUpload && (
            <div className="glass-panel rounded-2xl p-5">
              <BulkUpload onClose={() => setShowBulkUpload(false)} />
            </div>
          )}

          {/* Post Queue Panel */}
          {showQueue && (
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground">Post Queue</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQueue(false)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <PostQueue
                posts={posts}
                onReorder={handleReorderPosts}
                onDelete={(id) => deletePost.mutate(id)}
                onAutoSchedule={handleAutoSchedule}
                isAutoScheduling={isAutoScheduling}
              />
            </div>
          )}

          {/* Compose Form */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Compose</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQueue(!showQueue)}
                  className="text-xs"
                >
                  <ListOrdered className="h-3 w-3 mr-1" />
                  Queue
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkUpload(!showBulkUpload)}
                  className="text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  CSV
                </Button>
              </div>
            </div>

          <div className="space-y-4">
            {/* Templates */}
            <TemplateManager
              currentContent={content}
              currentPlatform={selectedPlatform}
              onSelectTemplate={(templateContent, platform) => {
                setContent(templateContent);
                if (platform) setSelectedPlatform(platform as Platform);
              }}
            />

            {/* Platform selector */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as Platform | "")}
                className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select platform</option>
                <option value="ONLYFANS">OnlyFans</option>
                <option value="X">X (Twitter)</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className={`w-full px-3 py-2 rounded-xl bg-background border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring ${
                  isOverLimit ? "border-destructive focus:ring-destructive" : "border-border"
                }`}
                placeholder="Write your caption and content here..."
              />
              <p className={`text-[10px] mt-1 ${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                {selectedPlatform ? (
                  remainingChars >= 0 
                    ? `${remainingChars} characters remaining (${currentLimit.name}: ${currentLimit.max} max)`
                    : `${Math.abs(remainingChars)} characters over limit (${currentLimit.name}: ${currentLimit.max} max)`
                ) : (
                  `${content.length} characters`
                )}
              </p>
            </div>

            {/* AI Hashtag Suggestions */}
            <HashtagSuggestions
              content={content}
              platform={selectedPlatform}
              onInsertHashtags={(hashtags) => setContent((prev) => prev + "\n\n" + hashtags)}
            />

            {/* Sentiment Analysis */}
            {content.trim() && (
              <SentimentAnalysis content={content} />
            )}

            {/* Best Time Recommendations */}
            <BestTimeRecommendations
              content={content}
              platform={selectedPlatform}
              onSelectTime={(day, time) => {
                // Calculate next occurrence of this day/time
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const targetDayIndex = days.indexOf(day);
                const today = new Date();
                const todayIndex = today.getDay();
                
                let daysUntilTarget = targetDayIndex - todayIndex;
                if (daysUntilTarget <= 0) daysUntilTarget += 7;
                
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + daysUntilTarget);
                
                const [hours, minutes] = time.split(":");
                targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                
                // Format for datetime-local input
                const formatted = targetDate.toISOString().slice(0, 16);
                setScheduleDate(formatted);
              }}
            />

            {/* Date/Time */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Schedule for</label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="text-sm"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Media upload */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Media (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {mediaPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={mediaPreview} alt="Preview" className="w-full h-32 object-cover" />
                  <button
                    onClick={removeMedia}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors"
                >
                  <ImageIcon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add media</span>
                </button>
              )}
            </div>

            <Button 
              variant="brand" 
              className="w-full" 
              onClick={handleSchedule}
              disabled={uploading || createPost.isPending}
            >
              {(uploading || createPost.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Schedule post"
              )}
            </Button>
          </div>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
