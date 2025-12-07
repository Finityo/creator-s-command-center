import { useState, useMemo } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
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
  X,
  CalendarIcon,
  Download,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [resendingId, setResendingId] = useState<string | null>(null);

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

      // Date range filter
      const notificationDate = new Date(notification.created_at);
      const matchesDateRange = 
        (!dateRange?.from || !isBefore(notificationDate, startOfDay(dateRange.from))) &&
        (!dateRange?.to || !isAfter(notificationDate, endOfDay(dateRange.to)));

      return matchesSearch && matchesType && matchesStatus && matchesDateRange;
    });
  }, [notifications, searchQuery, typeFilter, statusFilter, dateRange]);

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    skipped: notifications.filter(n => n.status === 'skipped').length,
  };

  const hasActiveFilters = searchQuery !== "" || typeFilter !== "all" || statusFilter !== "all" || dateRange?.from !== undefined;

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateRange(undefined);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select dates";
    if (!dateRange.to) return format(dateRange.from, "MMM d, yyyy");
    return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`;
  };

  const exportToCSV = () => {
    const headers = ["Date", "Subject", "Type", "Recipient", "Status", "Error"];
    const rows = filteredNotifications.map(n => [
      format(new Date(n.created_at), "yyyy-MM-dd HH:mm:ss"),
      `"${n.subject.replace(/"/g, '""')}"`,
      n.type,
      n.recipient_email,
      n.status,
      n.error_message ? `"${n.error_message.replace(/"/g, '""')}"` : ""
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notifications-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResend = async (notification: NotificationHistory) => {
    setResendingId(notification.id);
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: notification.type,
          recipientEmail: notification.recipient_email,
          recipientName: notification.metadata?.recipientName,
          userId: user?.id,
          postId: notification.metadata?.postId,
          data: notification.metadata || {},
        },
      });

      if (error) throw error;
      
      toast.success("Notification resent successfully");
      queryClient.invalidateQueries({ queryKey: ["notification-history"] });
    } catch (error: any) {
      toast.error(`Failed to resend: ${error.message}`);
    } finally {
      setResendingId(null);
    }
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
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredNotifications.length === 0}
                className="shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal bg-secondary/50 border-border/50",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
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
                      <div className="flex items-start gap-3 shrink-0">
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
                        {(notification.status === 'failed' || notification.status === 'skipped') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(notification)}
                            disabled={resendingId === notification.id}
                            className="border-primary/50 text-primary hover:bg-primary/10"
                          >
                            {resendingId === notification.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
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
