import { Button } from "@/components/ui/button";
import { Plus, Bell, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function TopNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-3 ml-12 md:ml-0">
        <p className="hidden sm:block text-sm text-muted-foreground">
          Manage your content across all platforms
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
        </Button>
        
        <Link to="/scheduler">
          <Button variant="brand" size="sm" className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>

        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
        
        <Link to="/settings">
          <div className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center text-sm font-semibold text-foreground cursor-pointer hover:shadow-glow transition-shadow">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
        </Link>
      </div>
    </header>
  );
}
