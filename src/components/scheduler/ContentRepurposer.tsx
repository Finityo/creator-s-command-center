import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";

const PLATFORM_INFO: Record<Platform, { label: string; maxLength: number; tips: string }> = {
  X: { label: "X (Twitter)", maxLength: 280, tips: "Short, punchy, use hashtags sparingly" },
  INSTAGRAM: { label: "Instagram", maxLength: 2200, tips: "Storytelling, emojis, 20-30 hashtags" },
  FACEBOOK: { label: "Facebook", maxLength: 63206, tips: "Conversational, links, call-to-action" },
  ONLYFANS: { label: "OnlyFans", maxLength: 5000, tips: "Personal, teasing, exclusive content" },
};

interface ContentRepurposerProps {
  content: string;
  sourcePlatform: Platform | "";
  onApplyContent: (content: string, platform: Platform) => void;
}

export function ContentRepurposer({ content, sourcePlatform, onApplyContent }: ContentRepurposerProps) {
  const [repurposedContent, setRepurposedContent] = useState<Record<Platform, string>>({
    X: "",
    INSTAGRAM: "",
    FACEBOOK: "",
    ONLYFANS: "",
  });
  const [isLoading, setIsLoading] = useState<Platform | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null);

  const repurposeFor = async (targetPlatform: Platform) => {
    if (!content.trim()) {
      toast.error("Add content first");
      return;
    }

    if (!sourcePlatform) {
      toast.error("Select source platform first");
      return;
    }

    if (targetPlatform === sourcePlatform) {
      toast.error("Select a different platform");
      return;
    }

    setIsLoading(targetPlatform);

    try {
      const { data, error } = await supabase.functions.invoke("repurpose-content", {
        body: {
          content,
          sourcePlatform,
          targetPlatform,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRepurposedContent((prev) => ({
        ...prev,
        [targetPlatform]: data.repurposed_content,
      }));

      toast.success(`Content adapted for ${PLATFORM_INFO[targetPlatform].label}`);
    } catch (error: any) {
      console.error("Repurpose error:", error);
      toast.error(error.message || "Failed to repurpose content");
    } finally {
      setIsLoading(null);
    }
  };

  const copyToClipboard = async (platform: Platform) => {
    const text = repurposedContent[platform];
    if (!text) return;

    await navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const availablePlatforms = (Object.keys(PLATFORM_INFO) as Platform[]).filter(
    (p) => p !== sourcePlatform
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Repurpose Content</h3>
      </div>

      {!content.trim() ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Write some content above to repurpose it for other platforms
        </p>
      ) : !sourcePlatform ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Select a source platform first
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Adapt your {PLATFORM_INFO[sourcePlatform as Platform]?.label} content for:
          </p>

          {availablePlatforms.map((platform) => (
            <div
              key={platform}
              className="p-3 rounded-xl bg-muted/30 border border-border space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{PLATFORM_INFO[platform].label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    (max {PLATFORM_INFO[platform].maxLength} chars)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => repurposeFor(platform)}
                  disabled={isLoading !== null}
                  className="h-7 text-xs"
                >
                  {isLoading === platform ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  Adapt
                </Button>
              </div>

              {repurposedContent[platform] && (
                <>
                  <div className="bg-background rounded-lg p-2 text-xs max-h-32 overflow-y-auto">
                    {repurposedContent[platform]}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {repurposedContent[platform].length} / {PLATFORM_INFO[platform].maxLength} chars
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(platform)}
                        className="h-6 text-xs"
                      >
                        {copiedPlatform === platform ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onApplyContent(repurposedContent[platform], platform)}
                        className="h-6 text-xs"
                      >
                        Use This
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <p className="text-[10px] text-muted-foreground">
                💡 {PLATFORM_INFO[platform].tips}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
