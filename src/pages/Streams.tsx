import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Filter, RefreshCw, TrendingUp, Lightbulb, Sparkles, Copy, 
  Hash, Clock, ArrowRight, Search, Flame, Zap
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const platforms = ["OnlyFans", "X", "Instagram", "Facebook"] as const;

// Trending topics data
const trendingTopics = [
  { topic: "#CreatorEconomy", posts: "125K", growth: "+34%", platform: "X" },
  { topic: "#ContentCreator", posts: "89K", growth: "+22%", platform: "Instagram" },
  { topic: "#BehindTheScenes", posts: "67K", growth: "+18%", platform: "OnlyFans" },
  { topic: "#DigitalCreator", posts: "45K", growth: "+15%", platform: "Facebook" },
  { topic: "#CreatorLife", posts: "38K", growth: "+12%", platform: "X" },
  { topic: "#SocialMedia2024", posts: "32K", growth: "+28%", platform: "Instagram" },
];

// Content ideas
const contentIdeas = [
  { 
    title: "Behind the Scenes", 
    description: "Show your creative process or daily routine",
    engagement: "High",
    platforms: ["Instagram", "OnlyFans"],
    icon: "🎬"
  },
  { 
    title: "Q&A Session", 
    description: "Answer fan questions in a video or post",
    engagement: "Very High",
    platforms: ["X", "Instagram"],
    icon: "❓"
  },
  { 
    title: "Tutorial/How-To", 
    description: "Teach something related to your niche",
    engagement: "Medium",
    platforms: ["Instagram", "Facebook"],
    icon: "📚"
  },
  { 
    title: "Poll/Vote", 
    description: "Let your audience decide on something",
    engagement: "High",
    platforms: ["X", "Instagram"],
    icon: "📊"
  },
  { 
    title: "Throwback Post", 
    description: "Share memorable moments from your journey",
    engagement: "Medium",
    platforms: ["Instagram", "Facebook"],
    icon: "📸"
  },
  { 
    title: "Exclusive Preview", 
    description: "Tease upcoming content or projects",
    engagement: "Very High",
    platforms: ["OnlyFans", "X"],
    icon: "🔥"
  },
];

// Activity stream data
const mockStreamData: Record<string, { time: string; content: string; type: string }[]> = {
  OnlyFans: [
    { time: "Just now", content: "New subscriber joined! 🎉", type: "notification" },
    { time: "5 min ago", content: "Tip received: $25", type: "tip" },
    { time: "15 min ago", content: "Message from @user123: 'Love your content!'", type: "message" },
    { time: "1 hour ago", content: "Post liked by 47 subscribers", type: "engagement" },
  ],
  X: [
    { time: "2 min ago", content: "@user mentioned you in a tweet", type: "mention" },
    { time: "10 min ago", content: "Your post got 156 likes", type: "engagement" },
    { time: "30 min ago", content: "New follower: @creator_fan", type: "follower" },
    { time: "1 hour ago", content: "Retweet from @influencer", type: "engagement" },
  ],
  Instagram: [
    { time: "3 min ago", content: "New comment on your Reel", type: "comment" },
    { time: "12 min ago", content: "Story viewed by 234 people", type: "view" },
    { time: "25 min ago", content: "@brand wants to collaborate", type: "dm" },
    { time: "45 min ago", content: "Post saved 89 times", type: "engagement" },
  ],
  Facebook: [
    { time: "8 min ago", content: "Page like from new fan", type: "like" },
    { time: "20 min ago", content: "Comment on your video", type: "comment" },
    { time: "1 hour ago", content: "Event reminder: Live stream", type: "event" },
    { time: "2 hours ago", content: "Post shared 12 times", type: "share" },
  ],
};

export default function Streams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>("all");

  const copyIdea = (title: string) => {
    navigator.clipboard.writeText(title);
    toast.success("Idea copied to clipboard!");
  };

  const filteredTrending = selectedPlatformFilter === "all" 
    ? trendingTopics 
    : trendingTopics.filter(t => t.platform.toLowerCase() === selectedPlatformFilter.toLowerCase());

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Content Streams</h1>
            <p className="text-sm text-muted-foreground">Discover trends, get ideas, and monitor activity</p>
          </div>
          <Button variant="glass" size="sm">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Content Ideas
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Trending Topics */}
          <TabsContent value="trending" className="space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trending topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedPlatformFilter === "all" ? "brand" : "glass"}
                  size="sm"
                  onClick={() => setSelectedPlatformFilter("all")}
                >
                  All
                </Button>
                {platforms.map((p) => (
                  <Button
                    key={p}
                    variant={selectedPlatformFilter.toLowerCase() === p.toLowerCase() ? "brand" : "glass"}
                    size="sm"
                    onClick={() => setSelectedPlatformFilter(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            {/* Trending Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrending.map((item, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-2xl p-4 hover:border-primary/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Hash className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.topic}</p>
                        <p className="text-xs text-muted-foreground">{item.posts} posts</p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">{item.growth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <PlatformBadge 
                      platform={item.platform as any} 
                      size="sm"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyIdea(item.topic)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Hot Topics Banner */}
            <div className="glass-panel rounded-2xl p-5 gradient-brand">
              <div className="flex items-center gap-3 mb-3">
                <Flame className="h-6 w-6 text-foreground" />
                <h3 className="font-semibold text-foreground">Hot Right Now</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {["#viral", "#trending", "#foryou", "#explore", "#fyp", "#content"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full bg-background/20 text-sm font-medium text-foreground cursor-pointer hover:bg-background/30 transition-colors"
                    onClick={() => copyIdea(tag)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Content Ideas */}
          <TabsContent value="ideas" className="space-y-4">
            <div className="glass-panel rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">AI-Powered Suggestions</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Content ideas tailored to boost engagement across your platforms
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentIdeas.map((idea, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-2xl p-4 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{idea.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{idea.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{idea.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {idea.platforms.slice(0, 2).map((p) => (
                        <PlatformBadge 
                          key={p} 
                          platform={p as any} 
                          size="sm" 
                          showLabel={false}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      idea.engagement === "Very High" 
                        ? "bg-emerald-400/20 text-emerald-400"
                        : idea.engagement === "High"
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {idea.engagement}
                    </span>
                  </div>

                  <Button 
                    variant="glass" 
                    size="sm" 
                    className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      toast.success("Idea saved! You can use it in the Scheduler.");
                    }}
                  >
                    Use this idea
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Best Times to Post */}
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Best Times to Post</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { platform: "X", times: ["9:00 AM", "12:00 PM", "5:00 PM"] },
                  { platform: "Instagram", times: ["11:00 AM", "2:00 PM", "7:00 PM"] },
                  { platform: "Facebook", times: ["1:00 PM", "4:00 PM", "8:00 PM"] },
                  { platform: "OnlyFans", times: ["8:00 PM", "9:00 PM", "10:00 PM"] },
                ].map((item) => (
                  <div key={item.platform} className="p-3 rounded-xl bg-secondary/30">
                    <PlatformBadge platform={item.platform as any} size="sm" />
                    <div className="mt-2 space-y-1">
                      {item.times.map((time) => (
                        <p key={time} className="text-xs text-muted-foreground">{time}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Activity Streams */}
          <TabsContent value="activity">
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {platforms.map((platform) => (
                <div
                  key={platform}
                  className="min-w-[280px] max-w-[320px] flex-shrink-0 glass-panel rounded-2xl p-4 flex flex-col"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <PlatformBadge platform={platform} size="md" />
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                      <Filter className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Stream Items */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                    {mockStreamData[platform].map((item, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-background border border-border/50 p-3 hover:border-primary/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-muted-foreground">{item.time}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{item.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Load more */}
                  <Button variant="ghost" size="sm" className="mt-4 w-full text-muted-foreground">
                    Load more
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutShell>
  );
}
