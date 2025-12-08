import React from "react";

type PostStatus = "DRAFT" | "SCHEDULED" | "SENT" | "FAILED";

interface PostStatusPanelProps {
  status: PostStatus;
  scheduledAt?: string | null;
  updatedAt?: string | null;
  externalPostId?: string | null;
  errorMessage?: string | null;
}

const statusStyles: Record<PostStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  SCHEDULED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  SENT: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  FAILED: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function PostStatusPanel({
  status,
  scheduledAt,
  updatedAt,
  externalPostId,
  errorMessage,
}: PostStatusPanelProps) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2 bg-card">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full border ${statusStyles[status]}`}
        >
          {status}
        </span>
      </div>

      {/* Scheduled time */}
      {scheduledAt && (
        <div className="text-sm text-muted-foreground">
          <strong className="text-foreground">Scheduled:</strong>{" "}
          {new Date(scheduledAt).toLocaleString()}
        </div>
      )}

      {/* Sent time */}
      {status === "SENT" && updatedAt && (
        <div className="text-sm text-muted-foreground">
          <strong className="text-foreground">Sent:</strong>{" "}
          {new Date(updatedAt).toLocaleString()}
        </div>
      )}

      {/* External post ID (simulation + production safe) */}
      {status === "SENT" && externalPostId && (
        <div className="text-sm font-mono bg-muted border border-border rounded px-2 py-1">
          <strong className="text-foreground">External ID:</strong>{" "}
          <span className="text-muted-foreground">{externalPostId}</span>
        </div>
      )}

      {/* Error message */}
      {status === "FAILED" && errorMessage && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
}
