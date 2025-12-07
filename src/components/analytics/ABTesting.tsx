import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlaskConical, Plus, Trash2, Loader2, Trophy, Clock, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ABTest {
  id: string;
  name: string;
  platform: string;
  status: "draft" | "active" | "completed";
  variant_a_content: string;
  variant_b_content: string;
  winner: "A" | "B" | null;
  created_at: string;
}

const PLATFORMS = ["X", "INSTAGRAM", "FACEBOOK", "ONLYFANS"];

const generateMockEngagement = () => ({
  impressions: Math.floor(Math.random() * 5000) + 500,
  likes: Math.floor(Math.random() * 200) + 10,
  comments: Math.floor(Math.random() * 50) + 1,
  shares: Math.floor(Math.random() * 30),
  engagement_rate: (Math.random() * 8 + 1).toFixed(2),
});

export function ABTesting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newTest, setNewTest] = useState({
    name: "",
    platform: "X",
    variant_a: "",
    variant_b: "",
  });

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["ab-tests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ab_tests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ABTest[];
    },
    enabled: !!user?.id,
  });

  const createTest = useMutation({
    mutationFn: async (data: typeof newTest) => {
      const { error } = await supabase.from("ab_tests").insert({
        user_id: user?.id,
        name: data.name,
        platform: data.platform,
        variant_a_content: data.variant_a,
        variant_b_content: data.variant_b,
        status: "draft",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ab-tests"] });
      toast.success("A/B test created!");
      setIsCreating(false);
      setNewTest({ name: "", platform: "X", variant_a: "", variant_b: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create test");
    },
  });

  const updateTestStatus = useMutation({
    mutationFn: async ({ id, status, winner }: { id: string; status: string; winner?: string }) => {
      const { error } = await supabase
        .from("ab_tests")
        .update({ status, winner })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ab-tests"] });
      toast.success("Test updated!");
    },
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ab_tests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ab-tests"] });
      toast.success("Test deleted");
    },
  });

  const handleCreate = () => {
    if (!newTest.name.trim() || !newTest.variant_a.trim() || !newTest.variant_b.trim()) {
      toast.error("Fill in all fields");
      return;
    }
    createTest.mutate(newTest);
  };

  const completeTest = (test: ABTest) => {
    // Simulate determining a winner based on mock engagement
    const engagementA = generateMockEngagement();
    const engagementB = generateMockEngagement();
    const winner = parseFloat(engagementA.engagement_rate) > parseFloat(engagementB.engagement_rate) ? "A" : "B";
    updateTestStatus.mutate({ id: test.id, status: "completed", winner });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          A/B Testing
        </h3>
        <Button variant="outline" size="sm" onClick={() => setIsCreating(!isCreating)}>
          <Plus className="h-4 w-4 mr-1" />
          New Test
        </Button>
      </div>

      {isCreating && (
        <div className="p-4 bg-muted/50 rounded-xl space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Test name"
              value={newTest.name}
              onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
              className="flex-1"
            />
            <select
              value={newTest.platform}
              onChange={(e) => setNewTest({ ...newTest, platform: e.target.value })}
              className="h-10 px-3 rounded-lg bg-background border border-border text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Variant A</label>
              <textarea
                value={newTest.variant_a}
                onChange={(e) => setNewTest({ ...newTest, variant_a: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none"
                placeholder="First version of your post..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Variant B</label>
              <textarea
                value={newTest.variant_b}
                onChange={(e) => setNewTest({ ...newTest, variant_b: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none"
                placeholder="Second version of your post..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={createTest.isPending}>
              {createTest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Test"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No A/B tests yet</p>
          <p className="text-xs">Create a test to compare post variations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const engagementA = generateMockEngagement();
            const engagementB = generateMockEngagement();
            
            return (
              <div
                key={test.id}
                className="p-4 rounded-xl bg-secondary/30 border border-border group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{test.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {test.platform}
                    </span>
                    <StatusBadge status={test.status} />
                  </div>
                  <div className="flex items-center gap-1">
                    {test.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateTestStatus.mutate({ id: test.id, status: "active" })}
                        className="h-7 text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}
                    {test.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => completeTest(test)}
                        className="h-7 text-xs"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        End Test
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTest.mutate(test.id)}
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <VariantCard
                    label="A"
                    content={test.variant_a_content}
                    engagement={engagementA}
                    isWinner={test.winner === "A"}
                    showStats={test.status !== "draft"}
                  />
                  <VariantCard
                    label="B"
                    content={test.variant_b_content}
                    engagement={engagementB}
                    isWinner={test.winner === "B"}
                    showStats={test.status !== "draft"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        * Engagement data is simulated. Connect social APIs for real metrics.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-yellow-500/20 text-yellow-400",
    completed: "bg-green-500/20 text-green-400",
  };
  const icons = {
    draft: null,
    active: <Clock className="h-3 w-3" />,
    completed: <Trophy className="h-3 w-3" />,
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${styles[status as keyof typeof styles]}`}>
      {icons[status as keyof typeof icons]}
      {status}
    </span>
  );
}

function VariantCard({
  label,
  content,
  engagement,
  isWinner,
  showStats,
}: {
  label: string;
  content: string;
  engagement: ReturnType<typeof generateMockEngagement>;
  isWinner: boolean;
  showStats: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        isWinner
          ? "bg-green-500/10 border-green-500/30"
          : "bg-background/50 border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">Variant {label}</span>
        {isWinner && (
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <Trophy className="h-3 w-3" /> Winner
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{content}</p>
      
      {showStats && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-bold">{engagement.impressions.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Impressions</p>
          </div>
          <div>
            <p className="text-sm font-bold">{engagement.likes}</p>
            <p className="text-[9px] text-muted-foreground">Likes</p>
          </div>
          <div>
            <p className="text-sm font-bold">{engagement.engagement_rate}%</p>
            <p className="text-[9px] text-muted-foreground">Engagement</p>
          </div>
        </div>
      )}
    </div>
  );
}

