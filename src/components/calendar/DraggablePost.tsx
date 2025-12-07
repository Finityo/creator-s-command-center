import { useDrag } from "react-dnd";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Trash2, GripVertical } from "lucide-react";

interface Post {
  id: string;
  platform: "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";
  content: string;
  scheduled_at: string;
  status: string;
}

const platformDisplayMap: Record<string, "X" | "Instagram" | "Facebook" | "OnlyFans"> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

interface DraggablePostProps {
  post: Post;
  onDelete: (postId: string) => void;
}

export function DraggablePost({ post, onDelete }: DraggablePostProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: "post",
    item: { id: post.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={preview}
      className={`flex items-center gap-1 group p-1 rounded-lg hover:bg-background/50 transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div ref={drag} className="cursor-grab">
        <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <PlatformBadge platform={platformDisplayMap[post.platform]} size="sm" showLabel={false} />
      <span className="text-[10px] text-muted-foreground truncate flex-1">
        {new Date(post.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(post.id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </button>
    </div>
  );
}
