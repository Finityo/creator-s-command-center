import { useState, useEffect, useRef, ChangeEvent } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformBadge } from "@/components/PlatformBadge";
import { CheckCircle, AlertCircle, ExternalLink, Save, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  link_page_bio: string | null;
  link_page_slug: string | null;
  timezone: string | null;
}

interface SocialAccount {
  id: string;
  platform: "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";
  handle: string;
  is_connected: boolean | null;
}

// Map database platform names to PlatformBadge component names
const platformDisplayMap: Record<string, "X" | "Instagram" | "Facebook" | "OnlyFans"> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "Europe/London", label: "GMT / London" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Europe/Moscow", label: "Moscow Time (MSK)" },
  { value: "Asia/Tokyo", label: "Japan Time (JST)" },
  { value: "Asia/Shanghai", label: "China Time (CST)" },
  { value: "Australia/Sydney", label: "Australia Eastern (AEST)" },
  { value: "UTC", label: "UTC" },
];

export default function Settings() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    display_name: "",
    link_page_bio: "",
    link_page_slug: "",
    timezone: "UTC",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });

  // Fetch social accounts
  const { data: socialAccounts = [] } = useQuery({
    queryKey: ["social-accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("id, platform, handle, is_connected")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data as SocialAccount[];
    },
    enabled: !!user?.id,
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        link_page_bio: profile.link_page_bio || "",
        link_page_slug: profile.link_page_slug || "",
        timezone: profile.timezone || "UTC",
      });
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if changed
      if (avatarFile && user) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("post-media")
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      } else if (avatarPreview === null && profile?.avatar_url) {
        // Avatar was removed
        avatarUrl = null;
      }

      await updateProfile.mutateAsync({
        display_name: formData.display_name || null,
        link_page_bio: formData.link_page_bio || null,
        link_page_slug: formData.link_page_slug || null,
        timezone: formData.timezone,
        avatar_url: avatarUrl,
      });

      setAvatarFile(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    } finally {
      setUploading(false);
    }
  };

  const handleConnect = (platform: string) => {
    toast.info(`Connecting to ${platform}...`, {
      description: "OAuth integration coming soon",
    });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (confirmed) {
      toast.error("Account deletion requires contacting support");
    }
  };

  // Get all platforms with connection status
  const allPlatforms = (["X", "INSTAGRAM", "FACEBOOK", "ONLYFANS"] as const).map(p => {
    const account = socialAccounts.find(a => a.platform === p);
    return {
      platform: p,
      displayPlatform: platformDisplayMap[p],
      status: account?.is_connected ? "connected" as const : "disconnected" as const,
      handle: account?.handle || "Not connected",
    };
  });

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Connect Platforms */}
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-2">Connected Platforms</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Connect your accounts to schedule posts and view analytics.
            </p>

            <div className="space-y-3">
              {allPlatforms.map((item) => (
                <div
                  key={item.platform}
                  className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={item.displayPlatform} showLabel={false} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.displayPlatform}</p>
                      <p className="text-xs text-muted-foreground">{item.handle}</p>
                    </div>
                  </div>

                  {item.status === "connected" ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <Button variant="ghost" size="sm" className="text-xs">
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button variant="brand" size="sm" className="text-xs" onClick={() => handleConnect(item.platform)}>
                      Connect
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Link-in-Bio Settings */}
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-2">Link-in-Bio</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Customize your link page that fans see when they click your bio link.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Page Title</label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Your name or brand"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Bio</label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Short bio or call to action"
                  value={formData.link_page_bio}
                  onChange={(e) => setFormData({ ...formData, link_page_bio: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Custom URL</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">/l/</span>
                  <Input
                    value={formData.link_page_slug}
                    onChange={(e) => setFormData({ ...formData, link_page_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="your-handle"
                    className="flex-1"
                  />
                </div>
              </div>

              <Button variant="glass" className="w-full" onClick={() => navigate("/link-page")}>
                Manage Links
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-2">Profile Settings</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Update your account information.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Avatar */}
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Avatar</label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-16 w-16 rounded-full object-cover border-2 border-border"
                    />
                    <button
                      onClick={removeAvatar}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full gradient-brand flex items-center justify-center text-xl font-bold text-foreground">
                    {formData.display_name?.charAt(0) || "?"}
                  </div>
                )}
                <Button variant="glass" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Display Name</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
              <Input type="email" value={profile?.email || ""} disabled className="opacity-60" />
              <p className="text-[10px] text-muted-foreground mt-1">Contact support to change email</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button 
            variant="brand" 
            className="mt-5" 
            onClick={handleSave}
            disabled={uploading || updateProfile.isPending}
          >
            {(uploading || updateProfile.isPending) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="glass-panel rounded-2xl p-5 border-destructive/30">
          <h2 className="font-semibold text-destructive mb-2">Danger Zone</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Irreversible actions. Please be careful.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}