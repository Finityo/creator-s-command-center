import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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

export function ContentCalendar({
  currentDate,
  posts,
  isLoading,
  onPrevMonth,
  onNextMonth,
  onReschedule,
  onDelete,
}: ContentCalendarProps) {
  const currentMonth = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const today = new Date();

  const getPostsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return posts.filter((post) => new Date(post.scheduled_at).toDateString() === dateStr);
  };

  const handleDrop = (postId: string, day: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const originalDate = new Date(post.scheduled_at);
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
      originalDate.getHours(),
      originalDate.getMinutes()
    );

    if (newDate.getTime() !== originalDate.getTime()) {
      onReschedule(postId, newDate);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Content Calendar</h2>
          <p className="text-xs text-muted-foreground">Drag posts to reschedule</p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground">{currentMonth}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNextMonth}>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[100px] rounded-xl bg-transparent" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isToday =
                dayNum === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              return (
                <CalendarDay
                  key={dayNum}
                  day={dayNum}
                  isToday={isToday}
                  posts={getPostsForDay(dayNum)}
                  onDrop={handleDrop}
                  onDelete={onDelete}
                />
              );
            })}
          </div>
        )}
      </div>
    </DndProvider>
  );
}
