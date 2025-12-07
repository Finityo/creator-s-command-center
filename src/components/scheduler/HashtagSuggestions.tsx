import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Hash, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Hashtag {
  tag: string;
  category: "trending" | "niche" | "branded" | "community";
  reach: "high" | "medium" | "low";
}

interface HashtagSuggestionsProps {
  content: string;
  platform: string;
  onInsertHashtags: (hashtags: string) => void;
}

const categoryColors: Record<string, string> = {
  trending: "bg-orange-500/20 text-orange-400",
  niche: "bg-purple-500/20 text-purple-400",
  branded: "bg-blue-500/20 text-blue-400",
  community: "bg-green-500/20 text-green-400",
};

const reachIcons: Record<string, string> = {
  high: "🔥",
  medium: "📈",
  low: "🎯",
};

export function HashtagSuggestions({ content, platform, onInsertHashtags }: HashtagSuggestionsProps) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const fetchSuggestions = async () => {
    if (!content.trim() || !platform) {
      toast.error("Add content and select a platform first");
      return;
    }

    setIsLoading(true);
    setHashtags([]);
    setSelectedTags(new Set());

    try {
      const { data, error } = await supabase.functions.invoke("content-suggestions", {
        body: { type: "hashtags", content, platform },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setHashtags(data.hashtags || []);
    } catch (error: any) {
      console.error("Hashtag suggestion error:", error);
      toast.error(error.message || "Failed to get hashtag suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTags(newSelected);
  };

  const insertSelected = () => {
    if (selectedTags.size === 0) {
      toast.error("Select at least one hashtag");
      return;
    }
    const hashtagString = Array.from(selectedTags)
      .map((t) => `#${t}`)
      .join(" ");
    onInsertHashtags(hashtagString);
    toast.success("Hashtags added to content");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Hash className="h-3 w-3" />
          AI Hashtags
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSuggestions}
          disabled={isLoading || !content.trim() || !platform}
          className="h-6 text-xs"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          Suggest
        </Button>
      </div>

      {hashtags.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((h) => (
              <button
                key={h.tag}
                onClick={() => toggleTag(h.tag)}
                className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                  selectedTags.has(h.tag)
                    ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    : ""
                } ${categoryColors[h.category]}`}
              >
                {reachIcons[h.reach]} #{h.tag}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{selectedTags.size} selected</span>
            <Button
              variant="outline"
              size="sm"
              onClick={insertSelected}
              disabled={selectedTags.size === 0}
              className="h-6 text-xs"
            >
              Add to post
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
            <span className={`px-1.5 py-0.5 rounded ${categoryColors.trending}`}>trending</span>
            <span className={`px-1.5 py-0.5 rounded ${categoryColors.niche}`}>niche</span>
            <span className={`px-1.5 py-0.5 rounded ${categoryColors.branded}`}>branded</span>
            <span className={`px-1.5 py-0.5 rounded ${categoryColors.community}`}>community</span>
          </div>
        </>
      )}
    </div>
  );
}
