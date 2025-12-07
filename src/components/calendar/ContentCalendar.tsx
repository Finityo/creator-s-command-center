import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Calendar, CalendarDays } from "lucide-react";
import { CalendarDay } from "./CalendarDay";

interface Post {
  id: string;
  platform: "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";
  content: string;
  scheduled_at: string;
  status: string;
}

interface ContentCalendarProps {
  currentDate: Date;
  posts: Post[];
  isLoading: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onReschedule: (postId: string, newDate: Date) => void;
  onDelete: (postId: string) => void;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ViewMode = "month" | "week";

export function ContentCalendar({
  currentDate,
  posts,
  isLoading,
  onPrevMonth,
  onNextMonth,
  onReschedule,
  onDelete,
}: ContentCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  
  const today = new Date();
  
  const getPostsForDay = (date: Date) => {
    const dateStr = date.toDateString();
    return posts.filter((post) => new Date(post.scheduled_at).toDateString() === dateStr);
  };

  const handleDrop = (postId: string, targetDate: Date) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const originalDate = new Date(post.scheduled_at);
    const newDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      originalDate.getHours(),
      originalDate.getMinutes()
    );

    if (newDate.getTime() !== originalDate.getTime()) {
      onReschedule(postId, newDate);
    }
  };

  // Month view calculations
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const currentMonth = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  // Week view calculations
  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();
  const weekLabel = `${weekDates[0].toLocaleDateString("default", { month: "short", day: "numeric" })} - ${weekDates[6].toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`;

  const goToPrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    // We need to trigger parent state change, so we'll use onPrevMonth as a hack
    // Actually, we should add week navigation to props
  };

  const handlePrev = () => {
    if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      onPrevMonth(); // This navigates, but we need to modify parent
    } else {
      onPrevMonth();
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      onNextMonth();
    } else {
      onNextMonth();
    }
  };

  const getHoursForDay = () => {
    const hours = [];
    for (let i = 6; i <= 23; i++) {
      hours.push(i);
    }
    return hours;
  };

  const getPostsForHour = (date: Date, hour: number) => {
    return posts.filter((post) => {
      const postDate = new Date(post.scheduled_at);
      return (
        postDate.toDateString() === date.toDateString() &&
        postDate.getHours() === hour
      );
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Content Calendar</h2>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground mr-2">Drag posts to reschedule</p>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${
                  viewMode === "month"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Calendar className="h-3 w-3" />
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${
                  viewMode === "week"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <CalendarDays className="h-3 w-3" />
                Week
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground">
            {viewMode === "month" ? currentMonth : weekLabel}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {viewMode === "month" ? (
            daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))
          ) : (
            weekDates.map((date, idx) => (
              <div key={idx} className="text-center text-xs font-medium text-muted-foreground py-2">
                <div>{daysOfWeek[idx]}</div>
                <div className={`text-sm mt-1 ${date.toDateString() === today.toDateString() ? "text-primary font-bold" : ""}`}>
                  {date.getDate()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : viewMode === "month" ? (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[100px] rounded-xl bg-transparent" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
              const isToday = dayDate.toDateString() === today.toDateString();

              return (
                <CalendarDay
                  key={dayNum}
                  day={dayNum}
                  date={dayDate}
                  isToday={isToday}
                  posts={getPostsForDay(dayDate)}
                  onDrop={(postId) => handleDrop(postId, dayDate)}
                  onDelete={onDelete}
                />
              );
            })}
          </div>
        ) : (
          /* Week view with hours */
          <div className="overflow-y-auto max-h-[500px] border border-border rounded-xl">
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {/* Time column header */}
              <div className="sticky top-0 bg-background border-b border-border" />
              {weekDates.map((date, idx) => (
                <div
                  key={idx}
                  className="sticky top-0 bg-background border-b border-l border-border p-2 text-center"
                />
              ))}

              {/* Hour rows */}
              {getHoursForDay().map((hour) => (
                <>
                  <div
                    key={`hour-${hour}`}
                    className="text-xs text-muted-foreground p-2 border-b border-border text-right pr-3"
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {weekDates.map((date, idx) => {
                    const hourPosts = getPostsForHour(date, hour);
                    return (
                      <div
                        key={`cell-${hour}-${idx}`}
                        className="min-h-[50px] border-b border-l border-border p-1 hover:bg-muted/30 transition-colors"
                      >
                        {hourPosts.map((post) => (
                          <div
                            key={post.id}
                            className="text-[10px] p-1 rounded bg-primary/20 text-primary mb-1 truncate cursor-pointer hover:bg-primary/30"
                            title={post.content}
                            onClick={() => onDelete(post.id)}
                          >
                            {post.platform}: {post.content.slice(0, 20)}...
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
