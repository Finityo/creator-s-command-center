import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, TrendingUp, TrendingDown, Minus, Lightbulb, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Emotion {
  emotion: string;
  confidence: number;
}

interface SentimentResult {
  overall_sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number;
  emotions: Emotion[];
  tone: string;
  impact_prediction: "high" | "medium" | "low";
  suggestions: string[];
}

interface SentimentAnalysisProps {
  content: string;
}

export function SentimentAnalysis({ content }: SentimentAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SentimentResult | null>(null);

  const analyzeSentiment = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to analyze");
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
        body: { content },
      });

      if (error) throw error;
      setResult(data);
    } catch (error: any) {
      console.error("Sentiment analysis error:", error);
      toast.error(error.message || "Failed to analyze sentiment");
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentIcon = () => {
    if (!result) return null;
    switch (result.overall_sentiment) {
      case "positive":
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case "negative":
        return <TrendingDown className="h-5 w-5 text-rose-500" />;
      default:
        return <Minus className="h-5 w-5 text-amber-500" />;
    }
  };

  const getSentimentColor = () => {
    if (!result) return "bg-muted";
    switch (result.overall_sentiment) {
      case "positive":
        return "bg-emerald-500/20 border-emerald-500/30";
      case "negative":
        return "bg-rose-500/20 border-rose-500/30";
      default:
        return "bg-amber-500/20 border-amber-500/30";
    }
  };

  const getImpactColor = () => {
    if (!result) return "text-muted-foreground";
    switch (result.impact_prediction) {
      case "high":
        return "text-emerald-500";
      case "low":
        return "text-rose-500";
      default:
        return "text-amber-500";
    }
  };

  const getScoreBarColor = () => {
    if (!result) return "bg-muted";
    if (result.sentiment_score > 0.3) return "bg-emerald-500";
    if (result.sentiment_score < -0.3) return "bg-rose-500";
    return "bg-amber-500";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5" />
          Sentiment Analysis
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={analyzeSentiment}
          disabled={analyzing || !content.trim()}
          className="h-7 text-xs"
        >
          {analyzing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : result ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-analyze
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-3 animate-in fade-in-50 duration-300">
          {/* Overall Sentiment */}
          <div className={`rounded-xl border p-3 ${getSentimentColor()}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getSentimentIcon()}
                <span className="text-sm font-medium capitalize">
                  {result.overall_sentiment} Sentiment
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Tone: {result.tone}
              </span>
            </div>

            {/* Sentiment Score Bar */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute h-full transition-all ${getScoreBarColor()}`}
                style={{
                  left: "50%",
                  width: `${Math.abs(result.sentiment_score) * 50}%`,
                  transform: result.sentiment_score < 0 ? "translateX(-100%)" : "translateX(0)",
                }}
              />
              <div className="absolute left-1/2 top-0 h-full w-0.5 bg-foreground/30" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Negative</span>
              <span>Neutral</span>
              <span>Positive</span>
            </div>
          </div>

          {/* Emotions */}
          {result.emotions.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Detected Emotions</p>
              <div className="flex flex-wrap gap-1.5">
                {result.emotions.slice(0, 5).map((emotion, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize"
                  >
                    {emotion.emotion} ({Math.round(emotion.confidence * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Impact Prediction */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Predicted Engagement:</span>
            <span className={`font-medium capitalize ${getImpactColor()}`}>
              {result.impact_prediction}
            </span>
          </div>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="border-t border-border pt-2.5">
              <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Suggestions
              </p>
              <ul className="space-y-1">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-[11px] text-foreground/80 pl-2 border-l-2 border-primary/30">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!result && !analyzing && content.trim() && (
        <p className="text-[10px] text-muted-foreground text-center py-2">
          Click "Analyze" to check the emotional impact of your content
        </p>
      )}
    </div>
  );
}
