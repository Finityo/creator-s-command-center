import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Calendar, 
  Radio, 
  BarChart3, 
  Settings, 
  Link as LinkIcon,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scheduler", label: "Scheduler", icon: Calendar },
  { to: "/streams", label: "Streams", icon: Radio },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/link-page", label: "Link Page", icon: LinkIcon },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-screen w-64 flex flex-col border-r border-border bg-background/95 backdrop-blur-xl transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="h-10 w-10 rounded-2xl gradient-brand flex items-center justify-center shadow-glow">
            <span className="text-foreground font-bold text-lg">CP</span>
          </div>
          <div>
            <div className="font-semibold tracking-wide text-foreground">CreatorPilot</div>
            <div className="text-muted-foreground text-xs">Control center</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CreatorPilot
          </p>
        </div>
      </aside>
    </>
  );
}
