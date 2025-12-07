import { useDrop } from "react-dnd";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Trash2 } from "lucide-react";
import { DraggablePost } from "./DraggablePost";

interface Post {
  id: string;
  platform: "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";
  content: string;
  scheduled_at: string;
  status: string;
}

interface CalendarDayProps {
  day: number;
  isToday: boolean;
  posts: Post[];
  onDrop: (postId: string, day: number) => void;
  onDelete: (postId: string) => void;
}

export function CalendarDay({ day, isToday, posts, onDrop, onDelete }: CalendarDayProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "post",
    drop: (item: { id: string }) => {
      onDrop(item.id, day);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`min-h-[100px] rounded-xl border p-2 transition-all bg-secondary/20 border-border/50 ${
        isToday ? "border-primary bg-primary/5" : ""
      } ${isOver && canDrop ? "border-primary border-2 bg-primary/10" : ""}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs ${isToday ? "text-primary font-medium" : "text-muted-foreground"}`}>
          {day}
        </span>
        {posts.length > 0 && (
          <span className="text-[10px] text-primary font-medium">{posts.length}</span>
        )}
      </div>
      <div className="space-y-1">
        {posts.slice(0, 3).map((post) => (
          <DraggablePost key={post.id} post={post} onDelete={onDelete} />
        ))}
        {posts.length > 3 && (
          <span className="text-[10px] text-muted-foreground">+{posts.length - 3} more</span>
        )}
      </div>
    </div>
  );
}
