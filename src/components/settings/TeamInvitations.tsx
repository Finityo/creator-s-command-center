import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Mail, Trash2, Clock, CheckCircle, XCircle, Users } from "lucide-react";

type AppRole = 'owner' | 'admin' | 'editor' | 'viewer';

interface TeamInvitation {
  id: string;
  email: string;
  role: AppRole;
  status: string;
  expires_at: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
  display_name?: string;
}

const roleColors: Record<AppRole, string> = {
  owner: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  editor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  viewer: "bg-muted text-muted-foreground border-border",
};

export function TeamInvitations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("editor");
  const [isInviting, setIsInviting] = useState(false);

  // Fetch pending invitations
  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ["team-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as TeamInvitation[];
    },
    enabled: !!user,
  });

  // Fetch team members with their roles
  const { data: teamMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");
      
      if (rolesError) throw rolesError;

      // Get profiles for each user
      const memberPromises = roles.map(async (role) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, display_name")
          .eq("id", role.user_id)
          .single();
        
        return {
          ...role,
          email: profile?.email,
          display_name: profile?.display_name,
        };
      });

      return Promise.all(memberPromises) as Promise<TeamMember[]>;
    },
    enabled: !!user,
  });

  // Send invitation mutation
  const sendInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      // Create invitation in database
      const { data: invitation, error: inviteError } = await supabase
        .from("team_invitations")
        .insert({
          inviter_id: user!.id,
          email,
          role,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Get inviter's profile for the email
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user!.id)
        .single();

      // Send notification email
      const { error: notifyError } = await supabase.functions.invoke("send-notification", {
        body: {
          type: "team_invitation",
          recipientEmail: email,
          data: {
            inviterName: inviterProfile?.display_name || "A team member",
            role,
            inviteUrl: `${window.location.origin}/auth?invite=${invitation.token}`,
          },
        },
      });

      if (notifyError) {
        console.warn("Failed to send invitation email:", notifyError);
      }

      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      setEmail("");
      toast.success("Invitation sent successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });

  // Delete invitation mutation
  const deleteInvitation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_invitations")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      toast.success("Invitation cancelled");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel invitation");
    },
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsInviting(true);
    try {
      await sendInvitation.mutateAsync({ email: email.trim(), role });
    } finally {
      setIsInviting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "expired":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </CardTitle>
          <CardDescription>
            Invite others to collaborate on content creation and approvals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="w-full sm:w-40 space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isInviting || !email.trim()}>
                <Mail className="h-4 w-4 mr-2" />
                {isInviting ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(isExpired(invitation.expires_at) ? "expired" : invitation.status)}
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={roleColors[invitation.role]}>
                      {invitation.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteInvitation.mutate(invitation.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <p className="text-muted-foreground">Loading team members...</p>
          ) : teamMembers.length === 0 ? (
            <p className="text-muted-foreground">No team members yet. Send an invitation above!</p>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {member.display_name || member.email || "Unknown user"}
                    </p>
                    {member.display_name && member.email && (
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={roleColors[member.role]}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
