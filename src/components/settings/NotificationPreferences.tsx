import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Bell, CheckCircle, XCircle, Send, AlertTriangle, Clock } from "lucide-react";

interface NotificationPreference {
  id: string;
  user_id: string;
  approval_needed: boolean;
  post_approved: boolean;
  post_rejected: boolean;
  post_sent: boolean;
  post_failed: boolean;
}

const NOTIFICATION_OPTIONS = [
  {
    key: "approval_needed" as const,
    label: "Approval Needed",
    description: "When a post needs your approval",
    icon: Clock,
  },
  {
    key: "post_approved" as const,
    label: "Post Approved",
    description: "When your post gets approved",
    icon: CheckCircle,
  },
  {
    key: "post_rejected" as const,
    label: "Post Rejected",
    description: "When your post gets rejected",
    icon: XCircle,
  },
  {
    key: "post_sent" as const,
    label: "Post Sent",
    description: "When your scheduled post is published",
    icon: Send,
  },
  {
    key: "post_failed" as const,
    label: "Post Failed",
    description: "When a post fails to publish",
    icon: AlertTriangle,
  },
];

export function NotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as NotificationPreference | null;
    },
    enabled: !!user?.id,
  });

  const upsertPreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreference>) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
          ...updates,
        }, {
          onConflict: "user_id",
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Notification preferences updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  const handleToggle = (key: keyof NotificationPreference, value: boolean) => {
    upsertPreferences.mutate({ [key]: value });
  };

  const getValue = (key: keyof NotificationPreference): boolean => {
    if (!preferences) return true; // Default to enabled
    return preferences[key] as boolean;
  };

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">Email Notifications</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Choose which email notifications you'd like to receive.
      </p>

      <div className="space-y-3">
        {NOTIFICATION_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <div
              key={option.key}
              className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
              <Switch
                checked={getValue(option.key)}
                onCheckedChange={(checked) => handleToggle(option.key, checked)}
                disabled={upsertPreferences.isPending}
              />
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Note: Email notifications require RESEND_API_KEY to be configured.
      </p>
    </div>
  );
}