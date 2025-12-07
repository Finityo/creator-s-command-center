import { PlatformBadge } from "@/components/PlatformBadge";

type DatabasePlatform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS" | "";
type BadgePlatform = "X" | "Instagram" | "Facebook" | "OnlyFans";

const platformToBadge: Record<string, BadgePlatform> = {
  X: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ONLYFANS: "OnlyFans",
};

interface PostPreviewProps {
  platform: DatabasePlatform;
  content: string;
  mediaPreview: string | null;
}

const platformStyles: Record<string, { bg: string; textStyle: string; container: string }> = {
  X: {
    bg: "bg-black",
    textStyle: "text-white font-normal",
    container: "rounded-2xl p-4 max-w-[500px]",
  },
  INSTAGRAM: {
    bg: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    textStyle: "text-white font-normal",
    container: "rounded-xl overflow-hidden",
  },
  FACEBOOK: {
    bg: "bg-[#1877F2]",
    textStyle: "text-white",
    container: "rounded-lg p-4",
  },
  ONLYFANS: {
    bg: "bg-[#00AFF0]",
    textStyle: "text-white",
    container: "rounded-xl p-4",
  },
};

export function PostPreview({ platform, content, mediaPreview }: PostPreviewProps) {
  if (!platform) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a platform to see preview
      </div>
    );
  }

  const style = platformStyles[platform];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <PlatformBadge platform={platformToBadge[platform]} />
        <span className="text-xs text-muted-foreground">Preview</span>
      </div>

      <div className={`flex-1 ${style.bg} ${style.container}`}>
        {platform === "X" && <XPreview content={content} mediaPreview={mediaPreview} />}
        {platform === "INSTAGRAM" && <InstagramPreview content={content} mediaPreview={mediaPreview} />}
        {platform === "FACEBOOK" && <FacebookPreview content={content} mediaPreview={mediaPreview} />}
        {platform === "ONLYFANS" && <OnlyFansPreview content={content} mediaPreview={mediaPreview} />}
      </div>
    </div>
  );
}

function XPreview({ content, mediaPreview }: { content: string; mediaPreview: string | null }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-white text-sm">Your Name</span>
            <span className="text-gray-500 text-sm">@handle · now</span>
          </div>
          <p className="text-white text-sm mt-1 whitespace-pre-wrap break-words">
            {content || "Your post content will appear here..."}
          </p>
          {mediaPreview && (
            <img src={mediaPreview} alt="Media" className="mt-3 rounded-2xl max-h-64 object-cover w-full" />
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-12 text-gray-500">
        <span className="text-xs">💬</span>
        <span className="text-xs">🔁</span>
        <span className="text-xs">❤️</span>
        <span className="text-xs">📤</span>
      </div>
    </div>
  );
}

function InstagramPreview({ content, mediaPreview }: { content: string; mediaPreview: string | null }) {
  return (
    <div className="bg-white text-black">
      <div className="flex items-center gap-2 p-3">
        <div className="w-8 h-8 rounded-full bg-gray-300" />
        <span className="font-semibold text-sm">your_handle</span>
      </div>
      {mediaPreview ? (
        <img src={mediaPreview} alt="Media" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
          Add media for preview
        </div>
      )}
      <div className="p-3">
        <div className="flex gap-4 mb-2">
          <span>❤️</span>
          <span>💬</span>
          <span>📤</span>
        </div>
        <p className="text-sm">
          <span className="font-semibold">your_handle</span>{" "}
          <span className="whitespace-pre-wrap">{content || "Caption will appear here..."}</span>
        </p>
      </div>
    </div>
  );
}

function FacebookPreview({ content, mediaPreview }: { content: string; mediaPreview: string | null }) {
  return (
    <div className="bg-white text-black rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <div className="w-10 h-10 rounded-full bg-gray-300" />
        <div>
          <span className="font-semibold text-sm block">Your Name</span>
          <span className="text-xs text-gray-500">Just now · 🌐</span>
        </div>
      </div>
      <div className="px-3 pb-3">
        <p className="text-sm whitespace-pre-wrap">{content || "Your post will appear here..."}</p>
      </div>
      {mediaPreview && (
        <img src={mediaPreview} alt="Media" className="w-full max-h-72 object-cover" />
      )}
      <div className="flex items-center justify-around p-3 border-t text-gray-500 text-sm">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗️ Share</span>
      </div>
    </div>
  );
}

function OnlyFansPreview({ content, mediaPreview }: { content: string; mediaPreview: string | null }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/20" />
        <div>
          <span className="font-bold text-white block">Your Name</span>
          <span className="text-white/70 text-xs">@your_handle</span>
        </div>
      </div>
      <p className="text-white text-sm whitespace-pre-wrap">
        {content || "Your post content will appear here..."}
      </p>
      {mediaPreview && (
        <img src={mediaPreview} alt="Media" className="rounded-xl max-h-64 object-cover w-full" />
      )}
      <div className="flex items-center gap-4 pt-2 text-white/80">
        <span className="text-sm">❤️ Like</span>
        <span className="text-sm">💬 Comment</span>
        <span className="text-sm">💰 Tip</span>
      </div>
    </div>
  );
}
