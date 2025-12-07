import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Copy, Plus, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SortableLinkItem } from "@/components/links/SortableLinkItem";

interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  link_page_bio: string | null;
  link_page_slug: string | null;
}

export default function LinkPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLink, setNewLink] = useState({ label: "", url: "", icon: "🔗" });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, link_page_bio, link_page_slug")
        .eq("id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });

  // Fetch links
  const { data: links = [], isLoading } = useQuery({
    queryKey: ["link-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("link_items")
        .select("*")
        .eq("user_id", user?.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as LinkItem[];
    },
    enabled: !!user?.id,
  });

  // Create link mutation
  const createLink = useMutation({
    mutationFn: async (linkData: { label: string; url: string; icon: string }) => {
      const maxOrder = links.length > 0 ? Math.max(...links.map(l => l.sort_order || 0)) : 0;
      const { error } = await supabase.from("link_items").insert({
        user_id: user?.id,
        label: linkData.label,
        url: linkData.url,
        icon: linkData.icon,
        sort_order: maxOrder + 1,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["link-items"] });
      toast.success("Link added!");
      setIsAddOpen(false);
      setNewLink({ label: "", url: "", icon: "🔗" });
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Update link mutation
  const updateLink = useMutation({
    mutationFn: async (linkData: LinkItem) => {
      const { error } = await supabase
        .from("link_items")
        .update({
          label: linkData.label,
          url: linkData.url,
          icon: linkData.icon,
          is_active: linkData.is_active,
        })
        .eq("id", linkData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["link-items"] });
      toast.success("Link updated!");
      setEditingLink(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Delete link mutation
  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("link_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["link-items"] });
      toast.success("Link deleted");
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Reorder links mutation for drag and drop
  const reorderLinks = useMutation({
    mutationFn: async (newOrder: LinkItem[]) => {
      const updates = newOrder.map((link, index) => 
        supabase.from("link_items").update({ sort_order: index }).eq("id", link.id)
      );
      await Promise.all(updates);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id === active.id);
      const newIndex = links.findIndex((link) => link.id === over.id);

      const newOrder = arrayMove(links, oldIndex, newIndex);
      
      // Optimistically update the UI
      queryClient.setQueryData(["link-items", user?.id], newOrder);
      
      // Persist to database
      reorderLinks.mutate(newOrder);
    }
  };

  const copyLink = () => {
    const slug = profile?.link_page_slug || "your-page";
    navigator.clipboard.writeText(`${window.location.origin}/l/${slug}`);
    toast.success("Link copied to clipboard!");
  };

  const viewLive = () => {
    const slug = profile?.link_page_slug || "your-page";
    window.open(`/l/${slug}`, "_blank");
  };

  const activeLinks = links.filter(l => l.is_active);

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Link Page</h1>
            <p className="text-sm text-muted-foreground">Drag to reorder, click to edit</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="glass" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
            <Button variant="brand" size="sm" onClick={viewLive}>
              <ExternalLink className="h-4 w-4" />
              View Live
            </Button>
          </div>
        </div>

        {/* Phone Preview */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-[320px] h-[640px] rounded-[45px] border-4 border-border bg-background p-3 shadow-elevated">
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-border rounded-full" />
              
              <div className="w-full h-full rounded-[35px] overflow-hidden bg-gradient-to-b from-background to-secondary/20 relative">
                <div className="h-10" />

                <div className="p-6 flex flex-col items-center">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="h-20 w-20 rounded-full object-cover shadow-glow mb-4"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full gradient-brand flex items-center justify-center text-2xl font-bold text-foreground shadow-glow mb-4">
                      {profile?.display_name?.charAt(0) || "CP"}
                    </div>
                  )}

                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    {profile?.display_name || "Your Name"}
                  </h2>
                  <p className="text-xs text-muted-foreground text-center mb-6 px-4">
                    {profile?.link_page_bio || "Add a bio in Settings"}
                  </p>

                  <div className="w-full space-y-3">
                    {isLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : activeLinks.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-4">
                        No links yet. Add your first link!
                      </p>
                    ) : (
                      activeLinks.map((link) => (
                        <button
                          key={link.id}
                          className="w-full py-3 px-4 rounded-2xl glass-panel text-sm font-medium text-foreground flex items-center justify-center gap-2 hover:bg-card transition-colors"
                        >
                          <span>{link.icon || "🔗"}</span>
                          <span>{link.label}</span>
                        </button>
                      ))
                    )}
                  </div>

                  <p className="absolute bottom-6 text-[10px] text-muted-foreground">
                    Powered by CreatorPilot
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Links with Drag & Drop */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Your Links</h2>
            <Button variant="brand" size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Link
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : links.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No links yet. Click "Add Link" to get started.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={links.map(l => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {links.map((link) => (
                    <SortableLinkItem
                      key={link.id}
                      link={link}
                      onEdit={setEditingLink}
                      onDelete={(id) => deleteLink.mutate(id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Add Link Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Label</label>
              <Input
                value={newLink.label}
                onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                placeholder="e.g., My Website"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">URL</label>
              <Input
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Icon (emoji)</label>
              <Input
                value={newLink.icon}
                onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                placeholder="🔗"
                className="w-20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button 
                variant="brand" 
                onClick={() => createLink.mutate(newLink)}
                disabled={!newLink.label || !newLink.url || createLink.isPending}
              >
                {createLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Add Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Link Dialog */}
      <Dialog open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
          </DialogHeader>
          {editingLink && (
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Label</label>
                <Input
                  value={editingLink.label}
                  onChange={(e) => setEditingLink({ ...editingLink, label: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">URL</label>
                <Input
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Icon (emoji)</label>
                <Input
                  value={editingLink.icon || ""}
                  onChange={(e) => setEditingLink({ ...editingLink, icon: e.target.value })}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingLink.is_active ?? true}
                  onChange={(e) => setEditingLink({ ...editingLink, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm text-muted-foreground">Active (visible on page)</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setEditingLink(null)}>Cancel</Button>
                <Button 
                  variant="brand" 
                  onClick={() => updateLink.mutate(editingLink)}
                  disabled={updateLink.isPending}
                >
                  {updateLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </LayoutShell>
  );
}
