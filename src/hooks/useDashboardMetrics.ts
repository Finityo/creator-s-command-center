import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface DashboardMetrics {
  total: number;
  drafts: number;
  scheduled: number;
  sent: number;
  failed: number;
  nextScheduledAt: string | null;
}

export function useDashboardMetrics() {
  const { profile } = useProfile();

  return useQuery({
    queryKey: ["dashboard-metrics", profile?.id],
    queryFn: async (): Promise<DashboardMetrics> => {
      const { data: posts, error } = await supabase
        .from("scheduled_posts")
        .select("id, status, scheduled_at")
        .eq("user_id", profile!.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      const now = new Date();
      const upcoming = posts?.filter(
        (p) => p.status === "SCHEDULED" && new Date(p.scheduled_at) > now
      );

      return {
        total: posts?.length || 0,
        drafts: posts?.filter((p) => p.status === "DRAFT").length || 0,
        scheduled: posts?.filter((p) => p.status === "SCHEDULED").length || 0,
        sent: posts?.filter((p) => p.status === "SENT").length || 0,
        failed: posts?.filter((p) => p.status === "FAILED").length || 0,
        nextScheduledAt: upcoming?.[0]?.scheduled_at || null,
      };
    },
    enabled: !!profile?.id,
  });
}
