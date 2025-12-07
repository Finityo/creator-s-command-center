import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Edit, Trash2 } from "lucide-react";

interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

interface SortableLinkItemProps {
  link: LinkItem;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
}

export function SortableLinkItem({ link, onEdit, onDelete }: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-xl bg-background border transition-colors ${
        link.is_active ? "border-border/50 hover:border-primary/30" : "border-border/30 opacity-60"
      } ${isDragging ? "shadow-elevated z-50" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <span className="text-xl">{link.icon || "🔗"}</span>
        <div>
          <p className="text-sm font-medium text-foreground">{link.label}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{link.url}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => onEdit(link)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(link.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
