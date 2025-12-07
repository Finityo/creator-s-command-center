import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark, Plus, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Template {
  id: string;
  name: string;
  content: string;
  platform: string | null;
}

interface TemplateManagerProps {
  onSelectTemplate: (content: string, platform?: string) => void;
  currentContent: string;
  currentPlatform: string;
}

export function TemplateManager({ 
  onSelectTemplate, 
  currentContent, 
  currentPlatform 
}: TemplateManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["post-templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_templates")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Template[];
    },
    enabled: !!user?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (data: { name: string; content: string; platform: string | null }) => {
      const { error } = await supabase
        .from("post_templates")
        .insert({
          user_id: user?.id,
          name: data.name,
          content: data.content,
          platform: data.platform,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-templates"] });
      toast.success("Template saved!");
      setIsCreating(false);
      setNewTemplateName("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save template");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("post_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-templates"] });
      toast.success("Template deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete template");
    },
  });

  const handleSaveAsTemplate = () => {
    if (!currentContent.trim()) {
      toast.error("Write some content first");
      return;
    }
    setIsCreating(true);
  };

  const handleConfirmSave = () => {
    if (!newTemplateName.trim()) {
      toast.error("Enter a template name");
      return;
    }
    createTemplate.mutate({
      name: newTemplateName,
      content: currentContent,
      platform: currentPlatform || null,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Bookmark className="h-3 w-3" />
          Templates
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveAsTemplate}
          disabled={!currentContent.trim()}
          className="h-6 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Save current
        </Button>
      </div>

      {isCreating && (
        <div className="flex gap-2">
          <Input
            placeholder="Template name..."
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            onClick={handleConfirmSave}
            disabled={createTemplate.isPending}
            className="h-8"
          >
            {createTemplate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsCreating(false);
              setNewTemplateName("");
            }}
            className="h-8"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          No templates yet. Save your first one!
        </p>
      ) : (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <button
                onClick={() => onSelectTemplate(template.content, template.platform || undefined)}
                className="flex-1 text-left min-w-0"
              >
                <span className="text-xs font-medium block truncate">{template.name}</span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {template.content.slice(0, 50)}...
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTemplate.mutate(template.id)}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
