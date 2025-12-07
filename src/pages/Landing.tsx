import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, BarChart3, Link as LinkIcon, Radio } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl gradient-brand flex items-center justify-center shadow-glow">
            <span className="text-foreground font-bold text-lg">CP</span>
          </div>
          <span className="font-semibold tracking-wide text-lg">CreatorPilot</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/auth">
            <Button variant="brand" size="sm">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 lg:px-16 gap-12 py-16">
        <div className="max-w-xl space-y-6 animate-slide-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            One control center for{" "}
            <span className="gradient-text">
              all your platforms.
            </span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Connect OnlyFans, X, Instagram & Facebook. Schedule posts, track analytics, 
            and manage your link-in-bio — all from one beautiful, iOS-style dashboard.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/auth">
              <Button variant="brand" size="lg">
                Launch dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="glass" size="lg">
                View demo
              </Button>
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-4">
            {[
              { icon: Calendar, label: "Smart scheduling" },
              { icon: BarChart3, label: "Cross-platform analytics" },
              { icon: Radio, label: "Multi-column streams" },
              { icon: LinkIcon, label: "Link-in-bio" },
            ].map((feature) => (
              <span 
                key={feature.label}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-sm text-muted-foreground border border-border/50"
              >
                <feature.icon className="h-3.5 w-3.5 text-primary" />
                {feature.label}
              </span>
            ))}
          </div>
        </div>

        {/* Preview card */}
        <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="glass-panel rounded-3xl p-5 shadow-elevated">
            <div className="rounded-2xl bg-background border border-border p-4">
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                <span>Today's Queue</span>
                <span className="text-primary">CreatorPilot</span>
              </div>
              
              <div className="space-y-3">
                {[
                  { platform: "OnlyFans", time: "6:30 PM", content: "Exclusive drop tonight 🔥", status: "Scheduled" },
                  { platform: "X + Instagram", time: "8:00 PM", content: "Teaser carousel for upcoming content", status: "Queued" },
                  { platform: "Analytics", time: "Live", content: "+324 followers this week", status: "Live" },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="rounded-xl bg-secondary/30 border border-border/50 p-3 transition-colors hover:bg-secondary/50"
                    style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                  >
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1.5">
                      <span className="text-primary">{item.platform}</span>
                      <span>{item.status} · {item.time}</span>
                    </div>
                    <div className="text-sm text-foreground">{item.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-4">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} CreatorPilot. Built for creators who mean business.
        </p>
      </footer>
    </div>
  );
}
