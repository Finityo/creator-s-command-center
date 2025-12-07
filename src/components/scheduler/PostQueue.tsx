import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Calendar, Clock, Sparkles, Loader2 } from "lucide-react";
import { PlatformBadge } from "@/components/PlatformBadge";
import { format } from "date-fns";
import { PostStatusActions } from "./PostStatusActions";

type DbPlatform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";
type DisplayPlatform = "X" | "Instagram" | "Facebook" | "OnlyFans";
type PostStatus = "DRAFT" | "SCHEDULED" | "SENT" | "FAILED";

const platformDisplayMap: Record<DbPlatform, DisplayPlatform> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

interface Post {
  id: string;
  platform: DbPlatform;
  content: string;
  scheduled_at: string;
  status: PostStatus;
  queue_order?: number;
}

interface SortablePostItemProps {
  post: Post;
  onDelete: (id: string) => void;
}

function SortablePostItem({ post, onDelete }: SortablePostItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const scheduledDate = new Date(post.scheduled_at);
  const isPast = scheduledDate < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
        isDragging
          ? "bg-primary/10 border-primary/30 shadow-lg"
          : "bg-background border-border hover:border-primary/30"
      } ${isPast ? "opacity-60" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <PlatformBadge platform={platformDisplayMap[post.platform]} size="sm" />
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              post.status === "SCHEDULED"
                ? "bg-emerald-500/20 text-emerald-500"
                : post.status === "DRAFT"
                ? "bg-amber-500/20 text-amber-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {post.status}
          </span>
        </div>

        <p className="text-sm text-foreground line-clamp-2 mb-1.5">
          {post.content}
        </p>

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(scheduledDate, "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(scheduledDate, "h:mm a")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <PostStatusActions post={post} />
        <button
          onClick={() => onDelete(post.id)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface PostQueueProps {
  posts: Post[];
  onReorder: (posts: Post[]) => void;
  onDelete: (id: string) => void;
  onAutoSchedule: () => void;
  isAutoScheduling: boolean;
}

export function PostQueue({
  posts,
  onReorder,
  onDelete,
  onAutoSchedule,
  isAutoScheduling,
}: PostQueueProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter to only show scheduled/draft posts sorted by queue_order then scheduled_at
  const queuedPosts = posts
    .filter((p) => p.status === "SCHEDULED" || p.status === "DRAFT")
    .sort((a, b) => {
      // First by queue_order
      const orderDiff = (a.queue_order ?? 0) - (b.queue_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      // Then by scheduled_at
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queuedPosts.findIndex((p) => p.id === active.id);
      const newIndex = queuedPosts.findIndex((p) => p.id === over.id);

      const reorderedPosts = arrayMove(queuedPosts, oldIndex, newIndex);
      
      // Update queue_order for reordered posts
      const updatedPosts = reorderedPosts.map((post, index) => ({
        ...post,
        queue_order: index,
      }));

      onReorder(updatedPosts);
    }
  };

  if (queuedPosts.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No posts in queue</p>
        <p className="text-xs text-muted-foreground mt-1">
          Schedule posts to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {queuedPosts.length} post{queuedPosts.length !== 1 ? "s" : ""} in queue
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onAutoSchedule}
          disabled={isAutoScheduling || queuedPosts.length === 0}
          className="text-xs"
        >
          {isAutoScheduling ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          Auto-Schedule
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={queuedPosts.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {queuedPosts.map((post) => (
              <SortablePostItem
                key={post.id}
                post={post}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-[10px] text-muted-foreground text-center">
        Drag to reorder • Click Auto-Schedule to optimize times
      </p>
    </div>
  );
}
