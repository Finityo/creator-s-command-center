import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformBadge } from "@/components/PlatformBadge";
import { CheckCircle, AlertCircle, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

const platforms = [
  { platform: "X" as const, status: "connected", handle: "@creator_pilot" },
  { platform: "Instagram" as const, status: "connected", handle: "@creatorpilot" },
  { platform: "Facebook" as const, status: "pending", handle: "Page pending" },
  { platform: "OnlyFans" as const, status: "disconnected", handle: "Not connected" },
];

export default function Settings() {
  const handleConnect = (platform: string) => {
    toast.info(`Connecting to ${platform}...`, {
      description: "OAuth flow would open here",
    });
  };

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

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
              {platforms.map((item) => (
                <div
                  key={item.platform}
                  className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={item.platform} showLabel={false} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.platform}</p>
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
                  ) : item.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <Button variant="glass" size="sm" className="text-xs" onClick={() => handleConnect(item.platform)}>
                        Complete
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
                <Input placeholder="Your name or brand" defaultValue="Creator Name" />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Bio</label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Short bio or call to action"
                  defaultValue="Content creator & digital artist. Check out my links below! 👇"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Custom URL</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">creatorpilot.link/</span>
                  <Input placeholder="your-handle" defaultValue="creator-name" className="flex-1" />
                </div>
              </div>

              <Button variant="glass" className="w-full">
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
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Display Name</label>
              <Input defaultValue="Creator Name" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
              <Input type="email" defaultValue="creator@example.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Timezone</label>
              <select className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Pacific Time (PT)</option>
                <option>Eastern Time (ET)</option>
                <option>Central European Time (CET)</option>
                <option>GMT</option>
              </select>
            </div>
          </div>

          <Button variant="brand" className="mt-5" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="glass-panel rounded-2xl p-5 border-destructive/30">
          <h2 className="font-semibold text-destructive mb-2">Danger Zone</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Irreversible actions. Please be careful.
          </p>
          <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
            Delete Account
          </Button>
        </div>
      </div>
    </LayoutShell>
  );
}
