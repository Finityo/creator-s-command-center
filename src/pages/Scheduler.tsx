import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformBadge } from "@/components/PlatformBadge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const mockScheduledPosts: Record<number, { platform: "X" | "Instagram" | "Facebook" | "OnlyFans"; time: string }[]> = {
  5: [{ platform: "X", time: "3:00 PM" }],
  8: [{ platform: "Instagram", time: "6:30 PM" }, { platform: "OnlyFans", time: "9:00 PM" }],
  12: [{ platform: "Facebook", time: "12:00 PM" }],
  15: [{ platform: "X", time: "10:00 AM" }],
  20: [{ platform: "OnlyFans", time: "8:00 PM" }],
  25: [{ platform: "Instagram", time: "7:00 PM" }],
};

export default function Scheduler() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [content, setContent] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [view, setView] = useState<"week" | "month">("month");

  const handleSchedule = () => {
    if (!selectedPlatform || !content || !scheduleDate) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Post scheduled successfully!");
    setContent("");
    setScheduleDate("");
    setSelectedPlatform("");
  };

  const today = new Date();
  const currentMonth = today.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <LayoutShell>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1 glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Content Calendar</h2>
            <div className="flex items-center gap-2">
              <Button variant="pill" size="pill" className={view === "week" ? "bg-primary/20 text-primary" : ""} onClick={() => setView("week")}>
                Week
              </Button>
              <Button variant="pill" size="pill" className={view === "month" ? "bg-primary/20 text-primary" : ""} onClick={() => setView("month")}>
                Month
              </Button>
            </div>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground">{currentMonth}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, idx) => {
              const dayNum = idx - 1; // Offset for starting day
              const isValidDay = dayNum >= 1 && dayNum <= 31;
              const posts = mockScheduledPosts[dayNum] || [];
              const isToday = dayNum === today.getDate();

              return (
                <div
                  key={idx}
                  className={`min-h-[80px] rounded-xl border p-2 transition-colors cursor-pointer hover:border-primary/50 ${
                    isValidDay 
                      ? "bg-secondary/20 border-border/50" 
                      : "bg-transparent border-transparent"
                  } ${isToday ? "border-primary bg-primary/5" : ""}`}
                >
                  {isValidDay && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs ${isToday ? "text-primary font-medium" : "text-muted-foreground"}`}>
                          {dayNum}
                        </span>
                        {posts.length > 0 && (
                          <span className="text-[10px] text-primary">{posts.length}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {posts.slice(0, 2).map((post, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <PlatformBadge platform={post.platform} size="sm" showLabel={false} />
                            <span className="text-[10px] text-muted-foreground truncate">{post.time}</span>
                          </div>
                        ))}
                        {posts.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{posts.length - 2} more</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Compose Panel */}
        <div className="w-full lg:w-80 glass-panel rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Compose</h2>

          <div className="space-y-4">
            {/* Platform selector */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select platform</option>
                <option value="onlyfans">OnlyFans</option>
                <option value="x">X (Twitter)</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Write your caption and content here..."
              />
            </div>

            {/* Date/Time */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Schedule for</label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Media upload placeholder */}
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Plus className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Add media</span>
            </div>

            <Button variant="brand" className="w-full" onClick={handleSchedule}>
              Schedule post
            </Button>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
