import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Download, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: string;
  platform: string;
  content: string;
  scheduled_at: string;
  status: string;
}

interface CalendarExportProps {
  posts: Post[];
}

export function CalendarExport({ posts }: CalendarExportProps) {
  const [exporting, setExporting] = useState(false);

  const scheduledPosts = posts.filter(p => p.status === "SCHEDULED" || p.status === "DRAFT");

  const generateICalEvent = (post: Post) => {
    const startDate = new Date(post.scheduled_at);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min duration

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const escapeText = (text: string) => {
      return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
    };

    return [
      "BEGIN:VEVENT",
      `UID:${post.id}@contentcalendar`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:📱 ${post.platform} Post`,
      `DESCRIPTION:${escapeText(post.content.substring(0, 500))}`,
      `CATEGORIES:Social Media,${post.platform}`,
      `STATUS:${post.status === "SCHEDULED" ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT",
    ].join("\r\n");
  };

  const generateICalFile = () => {
    const events = scheduledPosts.map(generateICalEvent).join("\r\n");
    
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Content Calendar//Social Media Posts//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Content Calendar",
      "X-WR-TIMEZONE:UTC",
      events,
      "END:VCALENDAR",
    ].join("\r\n");
  };

  const downloadICalFile = () => {
    if (scheduledPosts.length === 0) {
      toast.error("No scheduled posts to export");
      return;
    }

    setExporting(true);
    try {
      const icalContent = generateICalFile();
      const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `content-calendar-${new Date().toISOString().split("T")[0]}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${scheduledPosts.length} events to iCal file`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export calendar");
    } finally {
      setExporting(false);
    }
  };

  const openGoogleCalendar = (post: Post) => {
    const startDate = new Date(post.scheduled_at);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `📱 ${post.platform} Post`,
      details: post.content.substring(0, 500),
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank");
  };

  const addAllToGoogleCalendar = () => {
    if (scheduledPosts.length === 0) {
      toast.error("No scheduled posts to add");
      return;
    }

    if (scheduledPosts.length > 5) {
      toast.info("Opening first 5 events. Use iCal export for bulk import.");
    }

    scheduledPosts.slice(0, 5).forEach((post, idx) => {
      setTimeout(() => openGoogleCalendar(post), idx * 500);
    });
  };

  const subscribeUrl = () => {
    // In a real app, this would be a server-hosted .ics URL
    toast.info("Calendar subscription requires a hosted calendar URL. Use the export options instead.");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
          )}
          Sync
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {scheduledPosts.length} scheduled post{scheduledPosts.length !== 1 ? "s" : ""}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={downloadICalFile} className="cursor-pointer">
          <Download className="h-4 w-4 mr-2" />
          <div>
            <p className="text-sm">Export to iCal</p>
            <p className="text-[10px] text-muted-foreground">Download .ics file</p>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={addAllToGoogleCalendar} className="cursor-pointer">
          <ExternalLink className="h-4 w-4 mr-2" />
          <div>
            <p className="text-sm">Add to Google Calendar</p>
            <p className="text-[10px] text-muted-foreground">Open in new tabs</p>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={subscribeUrl} className="cursor-pointer opacity-60">
          <Calendar className="h-4 w-4 mr-2" />
          <div>
            <p className="text-sm">Subscribe (coming soon)</p>
            <p className="text-[10px] text-muted-foreground">Auto-sync calendar</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
