import { useState, useRef, ChangeEvent, useMemo } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformBadge } from "@/components/PlatformBadge";
import { ChevronLeft, ChevronRight, Loader2, Trash2, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
}

export default function Scheduler() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "">("");
  const [content, setContent] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [view, setView] = useState<"week" | "month">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  // Calendar helpers
  const currentMonth = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const getPostsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return posts.filter(post => new Date(post.scheduled_at).toDateString() === dateStr);
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();

  return (
    <LayoutShell>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1 glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Content Calendar</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="pill" 
                size="pill" 
                className={view === "week" ? "bg-primary/20 text-primary" : ""} 
                onClick={() => setView("week")}
              >
                Week
              </Button>
              <Button 
                variant="pill" 
                size="pill" 
                className={view === "month" ? "bg-primary/20 text-primary" : ""} 
                onClick={() => setView("month")}
              >
                Month
              </Button>
            </div>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground">{currentMonth}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: startOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="min-h-[80px] rounded-xl bg-transparent" />
              ))}
              
              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayPosts = getPostsForDay(dayNum);
                const isToday = 
                  dayNum === today.getDate() && 
                  currentDate.getMonth() === today.getMonth() && 
                  currentDate.getFullYear() === today.getFullYear();

                return (
                  <div
                    key={dayNum}
                    className={`min-h-[80px] rounded-xl border p-2 transition-colors cursor-pointer hover:border-primary/50 bg-secondary/20 border-border/50 ${
                      isToday ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs ${isToday ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {dayNum}
                      </span>
                      {dayPosts.length > 0 && (
                        <span className="text-[10px] text-primary font-medium">{dayPosts.length}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 2).map((post) => (
                        <div key={post.id} className="flex items-center gap-1 group">
                          <PlatformBadge platform={post.platform as any} size="sm" showLabel={false} />
                          <span className="text-[10px] text-muted-foreground truncate flex-1">
                            {new Date(post.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePost.mutate(post.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      ))}
                      {dayPosts.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{dayPosts.length - 2} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Compose Panel */}
        <div className="w-full lg:w-80 glass-panel rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Compose</h2>

          <div className="space-y-4">
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
    </LayoutShell>
  );
}
