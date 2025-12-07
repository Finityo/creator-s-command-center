import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Trash2, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Competitor {
  id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  notes: string | null;
}

const PLATFORMS = ["X", "INSTAGRAM", "FACEBOOK", "ONLYFANS"];

// Mock performance data - in production this would come from real analytics
const mockPerformance = () => ({
  followers: Math.floor(Math.random() * 50000) + 1000,
  engagement: (Math.random() * 5 + 1).toFixed(2),
  posts_per_week: Math.floor(Math.random() * 10) + 1,
  growth: (Math.random() * 10 - 3).toFixed(1),
});

export function CompetitorAnalysis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [newPlatform, setNewPlatform] = useState("X");

  const { data: competitors = [], isLoading } = useQuery({
    queryKey: ["competitors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitor_accounts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Competitor[];
    },
    enabled: !!user?.id,
  });

  const addCompetitor = useMutation({
    mutationFn: async (data: { platform: string; handle: string }) => {
      const { error } = await supabase
        .from("competitor_accounts")
        .insert({
          user_id: user?.id,
          platform: data.platform,
          handle: data.handle,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      toast.success("Competitor added!");
      setIsAdding(false);
      setNewHandle("");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Competitor already exists");
      } else {
        toast.error(error.message || "Failed to add competitor");
      }
    },
  });

  const deleteCompetitor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("competitor_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      toast.success("Competitor removed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove competitor");
    },
  });

  const handleAdd = () => {
    if (!newHandle.trim()) {
      toast.error("Enter a handle");
      return;
    }
    addCompetitor.mutate({ platform: newPlatform, handle: newHandle.replace("@", "") });
  };

  // Generate mock data for each competitor
  const competitorData = competitors.map((c) => ({
    ...c,
    performance: mockPerformance(),
  }));

  // Your own mock performance
  const yourPerformance = mockPerformance();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Competitor Analysis
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {isAdding && (
        <div className="flex gap-2 p-3 bg-muted/50 rounded-xl">
          <select
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            className="h-9 px-3 rounded-lg bg-background border border-border text-sm"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <Input
            placeholder="@handle"
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            className="h-9 flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={addCompetitor.isPending}>
            {addCompetitor.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : competitors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No competitors tracked yet</p>
          <p className="text-xs">Add competitors to compare your performance</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Your Performance Card */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">Your Account</span>
              <span className="text-xs text-primary font-medium">YOU</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-lg font-bold">{yourPerformance.followers.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Followers</p>
              </div>
              <div>
                <p className="text-lg font-bold">{yourPerformance.engagement}%</p>
                <p className="text-[10px] text-muted-foreground">Engagement</p>
              </div>
              <div>
                <p className="text-lg font-bold">{yourPerformance.posts_per_week}</p>
                <p className="text-[10px] text-muted-foreground">Posts/Week</p>
              </div>
              <div className="flex flex-col items-center">
                <div className={`flex items-center text-lg font-bold ${
                  parseFloat(yourPerformance.growth) > 0 ? "text-green-500" : 
                  parseFloat(yourPerformance.growth) < 0 ? "text-red-500" : ""
                }`}>
                  {parseFloat(yourPerformance.growth) > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : 
                   parseFloat(yourPerformance.growth) < 0 ? <TrendingDown className="h-4 w-4 mr-1" /> : 
                   <Minus className="h-4 w-4 mr-1" />}
                  {yourPerformance.growth}%
                </div>
                <p className="text-[10px] text-muted-foreground">Growth</p>
              </div>
            </div>
          </div>

          {/* Competitor Cards */}
          {competitorData.map((competitor) => (
            <div
              key={competitor.id}
              className="p-4 rounded-xl bg-secondary/30 border border-border group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">@{competitor.handle}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {competitor.platform}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteCompetitor.mutate(competitor.id)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold">{competitor.performance.followers.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Followers</p>
                  <CompareIndicator 
                    yours={yourPerformance.followers} 
                    theirs={competitor.performance.followers} 
                  />
                </div>
                <div>
                  <p className="text-lg font-bold">{competitor.performance.engagement}%</p>
                  <p className="text-[10px] text-muted-foreground">Engagement</p>
                  <CompareIndicator 
                    yours={parseFloat(yourPerformance.engagement)} 
                    theirs={parseFloat(competitor.performance.engagement)} 
                  />
                </div>
                <div>
                  <p className="text-lg font-bold">{competitor.performance.posts_per_week}</p>
                  <p className="text-[10px] text-muted-foreground">Posts/Week</p>
                  <CompareIndicator 
                    yours={yourPerformance.posts_per_week} 
                    theirs={competitor.performance.posts_per_week} 
                  />
                </div>
                <div className="flex flex-col items-center">
                  <div className={`flex items-center text-lg font-bold ${
                    parseFloat(competitor.performance.growth) > 0 ? "text-green-500" : 
                    parseFloat(competitor.performance.growth) < 0 ? "text-red-500" : ""
                  }`}>
                    {parseFloat(competitor.performance.growth) > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : 
                     parseFloat(competitor.performance.growth) < 0 ? <TrendingDown className="h-4 w-4 mr-1" /> : 
                     <Minus className="h-4 w-4 mr-1" />}
                    {competitor.performance.growth}%
                  </div>
                  <p className="text-[10px] text-muted-foreground">Growth</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        * Performance data is simulated. Connect social APIs for real metrics.
      </p>
    </div>
  );
}

function CompareIndicator({ yours, theirs }: { yours: number; theirs: number }) {
  const diff = ((yours - theirs) / theirs * 100).toFixed(0);
  const isAhead = yours > theirs;
  
  return (
    <span className={`text-[10px] ${isAhead ? "text-green-500" : "text-red-500"}`}>
      {isAhead ? "+" : ""}{diff}% vs you
    </span>
  );
}
