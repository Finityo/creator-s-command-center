import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface PublicProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  link_page_bio: string | null;
  link_page_slug: string | null;
}

interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  sort_order: number | null;
}

export default function PublicLinkPage() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch profile by slug using the public view
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("*")
        .eq("link_page_slug", slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as PublicProfile | null;
    },
    enabled: !!slug,
  });

  // Fetch active links for this user
  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ["public-links", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("link_items")
        .select("id, label, url, icon, sort_order")
        .eq("user_id", profile!.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as LinkItem[];
    },
    enabled: !!profile?.id,
  });

  const isLoading = profileLoading || linksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">This link page doesn't exist or has been removed.</p>
          <a 
            href="/" 
            className="text-primary hover:text-primary/80 font-medium"
          >
            Go to CreatorPilot
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-12">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.display_name || "Profile"} 
              className="h-24 w-24 rounded-full object-cover shadow-elevated border-4 border-background mb-4"
            />
          ) : (
            <div className="h-24 w-24 rounded-full gradient-brand flex items-center justify-center text-3xl font-bold text-foreground shadow-elevated mb-4">
              {profile.display_name?.charAt(0) || "?"}
            </div>
          )}

          <h1 className="text-2xl font-bold text-foreground text-center">
            {profile.display_name || "Creator"}
          </h1>
          
          {profile.link_page_bio && (
            <p className="text-muted-foreground text-center mt-2 max-w-sm">
              {profile.link_page_bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-3">
          {links.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No links yet
            </p>
          ) : (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 px-6 rounded-2xl glass-panel text-center font-medium text-foreground hover:bg-card hover:scale-[1.02] transition-all duration-200 shadow-subtle"
              >
                <span className="mr-2">{link.icon || "🔗"}</span>
                {link.label}
              </a>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <a 
            href="/" 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by CreatorPilot
          </a>
        </div>
      </div>
    </div>
  );
}