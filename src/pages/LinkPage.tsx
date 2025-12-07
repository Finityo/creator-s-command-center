import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Edit } from "lucide-react";
import { toast } from "sonner";

const links = [
  { label: "OnlyFans", url: "https://onlyfans.com/creator", icon: "⭐" },
  { label: "Instagram", url: "https://instagram.com/creator", icon: "📸" },
  { label: "X (Twitter)", url: "https://x.com/creator", icon: "𝕏" },
  { label: "Facebook", url: "https://facebook.com/creator", icon: "📘" },
  { label: "YouTube", url: "https://youtube.com/@creator", icon: "🎬" },
];

export default function LinkPage() {
  const copyLink = () => {
    navigator.clipboard.writeText("https://creatorpilot.link/creator-name");
    toast.success("Link copied to clipboard!");
  };

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Link Page</h1>
            <p className="text-sm text-muted-foreground">Preview and edit your link-in-bio page</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="glass" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
            <Button variant="brand" size="sm">
              <ExternalLink className="h-4 w-4" />
              View Live
            </Button>
          </div>
        </div>

        {/* Phone Preview */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Phone frame */}
            <div className="w-[320px] h-[640px] rounded-[45px] border-4 border-border bg-background p-3 shadow-elevated">
              {/* Notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-border rounded-full" />
              
              {/* Screen content */}
              <div className="w-full h-full rounded-[35px] overflow-hidden bg-gradient-to-b from-background to-secondary/20 relative">
                {/* Status bar */}
                <div className="h-10" />

                {/* Content */}
                <div className="p-6 flex flex-col items-center">
                  {/* Avatar */}
                  <div className="h-20 w-20 rounded-full gradient-brand flex items-center justify-center text-2xl font-bold text-foreground shadow-glow mb-4">
                    CP
                  </div>

                  {/* Name */}
                  <h2 className="text-lg font-semibold text-foreground mb-1">Creator Name</h2>
                  <p className="text-xs text-muted-foreground text-center mb-6 px-4">
                    Content creator & digital artist. Check out my links below! 👇
                  </p>

                  {/* Links */}
                  <div className="w-full space-y-3">
                    {links.map((link, i) => (
                      <button
                        key={i}
                        className="w-full py-3 px-4 rounded-2xl glass-panel text-sm font-medium text-foreground flex items-center justify-center gap-2 hover:bg-card transition-colors"
                      >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Footer */}
                  <p className="absolute bottom-6 text-[10px] text-muted-foreground">
                    Powered by CreatorPilot
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Links */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Your Links</h2>
            <Button variant="brand" size="sm">
              + Add Link
            </Button>
          </div>

          <div className="space-y-2">
            {links.map((link, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{link.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{link.url}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
