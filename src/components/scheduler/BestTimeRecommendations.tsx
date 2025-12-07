import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TimeRecommendation {
  day: string;
  time: string;
  engagement_level: "peak" | "high" | "moderate";
  reason: string;
}

interface BestTimeRecommendationsProps {
  content: string;
  platform: string;
  onSelectTime: (day: string, time: string) => void;
}

const engagementColors: Record<string, string> = {
  peak: "bg-green-500/20 text-green-400 border-green-500/30",
  high: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  moderate: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const engagementLabels: Record<string, string> = {
  peak: "🔥 Peak",
  high: "📈 High",
  moderate: "✨ Good",
};

export function BestTimeRecommendations({ content, platform, onSelectTime }: BestTimeRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<TimeRecommendation[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecommendations = async () => {
    if (!platform) {
      toast.error("Select a platform first");
      return;
    }

    setIsLoading(true);
    setRecommendations([]);
    setTips([]);

    try {
      const { data, error } = await supabase.functions.invoke("content-suggestions", {
        body: { type: "best_time", content: content || "General content", platform },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRecommendations(data.recommendations || []);
      setTips(data.general_tips || []);
    } catch (error: any) {
      console.error("Best time recommendation error:", error);
      toast.error(error.message || "Failed to get recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTime = (rec: TimeRecommendation) => {
    // Find next occurrence of this day
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDayIndex = days.indexOf(rec.day);
    const today = new Date();
    const todayIndex = today.getDay();
    
    let daysUntilTarget = targetDayIndex - todayIndex;
    if (daysUntilTarget <= 0) daysUntilTarget += 7;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    onSelectTime(rec.day, rec.time);
    toast.success(`Selected ${rec.day} at ${rec.time}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Best Time to Post
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRecommendations}
          disabled={isLoading || !platform}
          className="h-6 text-xs"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          Analyze
        </Button>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-2">
          {recommendations.slice(0, 4).map((rec, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectTime(rec)}
              className={`w-full text-left p-2 rounded-lg border transition-all hover:scale-[1.02] ${engagementColors[rec.engagement_level]}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">
                  {rec.day} • {rec.time}
                </span>
                <span className="text-[10px]">{engagementLabels[rec.engagement_level]}</span>
              </div>
              <p className="text-[10px] opacity-80">{rec.reason}</p>
            </button>
          ))}
        </div>
      )}

      {tips.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">💡 Tips</p>
          <ul className="text-[10px] text-muted-foreground space-y-0.5">
            {tips.slice(0, 3).map((tip, idx) => (
              <li key={idx}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
