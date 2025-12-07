import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformBadge } from "@/components/PlatformBadge";
import { 
  Link2, 
  Unlink, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";
type DisplayPlatform = "X" | "Instagram" | "Facebook" | "OnlyFans";

const platformDisplayMap: Record<Platform, DisplayPlatform> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

interface SocialAccount {
  id: string;
  platform: Platform;
  handle: string;
  is_connected: boolean;
  token_expires_at: string | null;
}

interface PlatformConfig {
  platform: Platform;
  displayName: DisplayPlatform;
  description: string;
  icon: string;
  color: string;
  requiresManualTokens: boolean;
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    platform: "X",
    displayName: "X",
    description: "Connect your X (Twitter) account to auto-post tweets",
    icon: "𝕏",
    color: "bg-foreground/10",
    requiresManualTokens: true,
  },
  {
    platform: "INSTAGRAM",
    displayName: "Instagram",
    description: "Connect Instagram Business account via Facebook",
    icon: "📸",
    color: "bg-gradient-to-r from-purple-500/20 to-pink-500/20",
    requiresManualTokens: true,
  },
  {
    platform: "FACEBOOK",
    displayName: "Facebook",
    description: "Connect your Facebook Page for automatic posting",
    icon: "📘",
    color: "bg-blue-500/20",
    requiresManualTokens: true,
  },
  {
    platform: "ONLYFANS",
    displayName: "OnlyFans",
    description: "Connect your OnlyFans account",
    icon: "⭐",
    color: "bg-sky-500/20",
    requiresManualTokens: true,
  },
];

export function SocialAccountsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<PlatformConfig | null>(null);
  const [handle, setHandle] = useState("");

  // Fetch social accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["social-accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data as SocialAccount[];
    },
    enabled: !!user?.id,
  });

  // Connect account mutation
  const connectMutation = useMutation({
    mutationFn: async ({ platform, handle }: { platform: Platform; handle: string }) => {
      // Check if account already exists
      const existing = accounts.find((a) => a.platform === platform);
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("social_accounts")
          .update({
            handle,
            is_connected: true,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("social_accounts")
          .insert({
            user_id: user?.id,
            platform,
            handle,
            is_connected: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      toast.success("Account connected!");
      setConnectingPlatform(null);
      setHandle("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to connect account");
    },
  });

  // Disconnect account mutation
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("social_accounts")
        .update({ is_connected: false })
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      toast.success("Account disconnected");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to disconnect account");
    },
  });

  const getAccountForPlatform = (platform: Platform) => {
    return accounts.find((a) => a.platform === platform && a.is_connected);
  };

  const handleConnect = () => {
    if (!connectingPlatform || !handle.trim()) {
      toast.error("Please enter your handle");
      return;
    }
    connectMutation.mutate({
      platform: connectingPlatform.platform,
      handle: handle.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Connected Accounts</h3>
          <p className="text-xs text-muted-foreground">
            Connect your social accounts for automatic posting
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["social-accounts"] })}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3">
        {PLATFORM_CONFIGS.map((config) => {
          const account = getAccountForPlatform(config.platform);
          
          return (
            <Card key={config.platform} className="bg-background/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${config.color}`}>
                      {config.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{config.displayName}</span>
                        {account && (
                          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5" />
                            Connected
                          </span>
                        )}
                      </div>
                      {account ? (
                        <p className="text-xs text-muted-foreground">@{account.handle}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      )}
                    </div>
                  </div>

                  {account ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => disconnectMutation.mutate(account.id)}
                      disabled={disconnectMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Unlink className="h-4 w-4 mr-1" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConnectingPlatform(config)}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-amber-500">API Keys Required</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              For full OAuth integration, you'll need to set up API keys in your account settings. 
              Currently, posts are queued and can be manually published.
            </p>
          </div>
        </div>
      </div>

      {/* Connect Dialog */}
      <Dialog open={!!connectingPlatform} onOpenChange={() => setConnectingPlatform(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {connectingPlatform && (
                <>
                  <span className="text-lg">{connectingPlatform.icon}</span>
                  Connect {connectingPlatform.displayName}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Enter your {connectingPlatform?.displayName} handle to connect your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="handle">Handle / Username</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="handle"
                  placeholder="yourhandle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </div>
            </div>

            {connectingPlatform?.platform === "X" && (
              <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <p className="font-medium mb-1">To enable auto-posting:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Create a Twitter Developer account</li>
                  <li>Create an app with Read and Write permissions</li>
                  <li>Add your API keys in Settings</li>
                </ol>
                <a 
                  href="https://developer.twitter.com/en/portal/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary mt-2 hover:underline"
                >
                  Twitter Developer Portal
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectingPlatform(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={connectMutation.isPending || !handle.trim()}
            >
              {connectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Connect Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
