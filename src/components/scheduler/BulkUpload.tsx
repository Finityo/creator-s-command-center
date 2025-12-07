import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface ParsedPost {
  platform: string;
  content: string;
  scheduled_at: string;
  isValid: boolean;
  error?: string;
}

const VALID_PLATFORMS = ["X", "INSTAGRAM", "FACEBOOK", "ONLYFANS"];

export function BulkUpload({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [parsedPosts, setParsedPosts] = useState<ParsedPost[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const parseCSV = (text: string): ParsedPost[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const platformIdx = headers.indexOf("platform");
    const contentIdx = headers.indexOf("content");
    const dateIdx = headers.indexOf("scheduled_at") !== -1 
      ? headers.indexOf("scheduled_at") 
      : headers.indexOf("date");

    if (platformIdx === -1 || contentIdx === -1 || dateIdx === -1) {
      toast.error("CSV must have platform, content, and scheduled_at columns");
      return [];
    }

    return lines.slice(1).map((line) => {
      // Handle quoted content with commas
      const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      const values = matches.map((v) => v.replace(/^"|"$/g, "").trim());

      const platform = values[platformIdx]?.toUpperCase() || "";
      const content = values[contentIdx] || "";
      const scheduledAt = values[dateIdx] || "";

      const errors: string[] = [];
      if (!VALID_PLATFORMS.includes(platform)) {
        errors.push(`Invalid platform: ${platform}`);
      }
      if (!content) {
        errors.push("Content is empty");
      }
      if (!scheduledAt || isNaN(Date.parse(scheduledAt))) {
        errors.push("Invalid date format");
      }

      return {
        platform,
        content,
        scheduled_at: scheduledAt,
        isValid: errors.length === 0,
        error: errors.join(", "),
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const posts = parseCSV(text);
      setParsedPosts(posts);
      if (posts.length === 0) {
        toast.error("No valid posts found in CSV");
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const validPosts = parsedPosts.filter((p) => p.isValid);
    if (validPosts.length === 0) {
      toast.error("No valid posts to upload");
      return;
    }

    setIsUploading(true);
    try {
      const postsToInsert = validPosts.map((p) => ({
        user_id: user.id,
        platform: p.platform as "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS",
        content: p.content,
        scheduled_at: new Date(p.scheduled_at).toISOString(),
        status: "SCHEDULED" as const,
      }));

      const { error } = await supabase
        .from("scheduled_posts")
        .insert(postsToInsert);

      if (error) throw error;

      toast.success(`${validPosts.length} posts scheduled successfully!`);
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload posts");
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = parsedPosts.filter((p) => p.isValid).length;
  const invalidCount = parsedPosts.filter((p) => !p.isValid).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Bulk Upload</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Upload a CSV file with columns: <code className="bg-muted px-1 rounded">platform</code>, <code className="bg-muted px-1 rounded">content</code>, <code className="bg-muted px-1 rounded">scheduled_at</code></p>
        <p>Valid platforms: X, INSTAGRAM, FACEBOOK, ONLYFANS</p>
        <p>Date format: YYYY-MM-DD HH:MM or ISO 8601</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {!fileName ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
        >
          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Click to upload CSV</span>
        </button>
      ) : (
        <div className="border border-border rounded-xl p-3 flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm flex-1 truncate">{fileName}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setFileName(null);
              setParsedPosts([]);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {parsedPosts.length > 0 && (
        <>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-500">
              <Check className="h-4 w-4" /> {validCount} valid
            </span>
            {invalidCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-4 w-4" /> {invalidCount} invalid
              </span>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto border border-border rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Platform</th>
                  <th className="p-2 text-left">Content</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {parsedPosts.map((post, idx) => (
                  <tr key={idx} className={post.isValid ? "" : "bg-destructive/10"}>
                    <td className="p-2">
                      {post.isValid ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <span title={post.error}>
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        </span>
                      )}
                    </td>
                    <td className="p-2">{post.platform}</td>
                    <td className="p-2 max-w-[150px] truncate">{post.content}</td>
                    <td className="p-2">{post.scheduled_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            variant="brand"
            className="w-full"
            onClick={handleUpload}
            disabled={isUploading || validCount === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              `Schedule ${validCount} Posts`
            )}
          </Button>
        </>
      )}
    </div>
  );
}
