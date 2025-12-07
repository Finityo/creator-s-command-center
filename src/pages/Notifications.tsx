import { LayoutShell } from "@/components/layout/LayoutShell";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  Bell,
  SkipForward
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationHistory {
  id: string;
  type: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
  metadata: Record<string, any>;
}

const typeDisplayMap: Record<string, { label: string; color: string }> = {
  'post_sent': { label: 'Post Sent', color: 'bg-emerald-500/20 text-emerald-400' },
  'post_failed': { label: 'Post Failed', color: 'bg-red-500/20 text-red-400' },
  'approval_needed': { label: 'Approval Needed', color: 'bg-amber-500/20 text-amber-400' },
  'post_approved': { label: 'Post Approved', color: 'bg-emerald-500/20 text-emerald-400' },
  'post_rejected': { label: 'Post Rejected', color: 'bg-red-500/20 text-red-400' },
  'team_invitation': { label: 'Team Invite', color: 'bg-primary/20 text-primary' },
};

const statusIconMap: Record<string, React.ReactNode> = {
  'sent': <CheckCircle className="h-4 w-4 text-emerald-400" />,
  'failed': <XCircle className="h-4 w-4 text-red-400" />,
  'pending': <Clock className="h-4 w-4 text-amber-400" />,
  'skipped': <SkipForward className="h-4 w-4 text-muted-foreground" />,
};

export default function Notifications() {
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notification-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_history")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as NotificationHistory[];
    },
    enabled: !!user?.id,
  });

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    skipped: notifications.filter(n => n.status === 'skipped').length,
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notification History</h1>
          <p className="text-muted-foreground">View all sent email notifications and their delivery status</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-panel border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.sent}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                  <SkipForward className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.skipped}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification List */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Recent Notifications
            </CardTitle>
            <CardDescription>Email notifications sent from your account</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No notifications sent yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Notifications will appear here when posts are published or fail
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const typeInfo = typeDisplayMap[notification.type] || { label: notification.type, color: 'bg-muted text-muted-foreground' };
                  
                  return (
                    <div 
                      key={notification.id}
                      className="flex items-start justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {statusIconMap[notification.status] || <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{notification.subject}</p>
                            <Badge variant="secondary" className={typeInfo.color}>
                              {typeInfo.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            To: {notification.recipient_email}
                          </p>
                          {notification.error_message && (
                            <p className="text-xs text-red-400">
                              {notification.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={
                            notification.status === 'sent' ? 'border-emerald-500/50 text-emerald-400' :
                            notification.status === 'failed' ? 'border-red-500/50 text-red-400' :
                            notification.status === 'skipped' ? 'border-muted text-muted-foreground' :
                            'border-amber-500/50 text-amber-400'
                          }
                        >
                          {notification.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
