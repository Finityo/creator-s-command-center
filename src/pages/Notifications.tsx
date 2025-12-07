import { useState, useMemo } from "react";
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
  SkipForward,
  Search,
  Filter,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'post_sent', label: 'Post Sent' },
  { value: 'post_failed', label: 'Post Failed' },
  { value: 'approval_needed', label: 'Approval Needed' },
  { value: 'post_approved', label: 'Post Approved' },
  { value: 'post_rejected', label: 'Post Rejected' },
  { value: 'team_invitation', label: 'Team Invite' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
  { value: 'skipped', label: 'Skipped' },
];

export default function Notifications() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notification-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_history")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as NotificationHistory[];
    },
    enabled: !!user?.id,
  });

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        notification.subject.toLowerCase().includes(searchLower) ||
        notification.recipient_email.toLowerCase().includes(searchLower) ||
        notification.type.toLowerCase().includes(searchLower);

      // Type filter
      const matchesType = typeFilter === "all" || notification.type === typeFilter;

      // Status filter
      const matchesStatus = statusFilter === "all" || notification.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchQuery, typeFilter, statusFilter]);

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    skipped: notifications.filter(n => n.status === 'skipped').length,
  };

  const hasActiveFilters = searchQuery !== "" || typeFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Recent Notifications
                </CardTitle>
                <CardDescription>Email notifications sent from your account</CardDescription>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by subject or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/50 border-border/50"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-secondary/50 border-border/50">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={clearFilters}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Results count */}
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground pt-2">
                Showing {filteredNotifications.length} of {notifications.length} notifications
              </p>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                {hasActiveFilters ? (
                  <>
                    <p className="text-muted-foreground">No notifications match your filters</p>
                    <Button variant="link" onClick={clearFilters} className="mt-2">
                      Clear filters
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">No notifications sent yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Notifications will appear here when posts are published or fail
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
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
                          <div className="flex items-center gap-2 flex-wrap">
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
                      <div className="text-right shrink-0">
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
