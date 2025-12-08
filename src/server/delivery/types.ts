// src/server/delivery/types.ts
// Shared types for the delivery boundary

export type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";

export type DeliveryResult =
  | { ok: true; externalId?: string }
  | { ok: false; error: string };

export interface DeliveryContext {
  platform: Platform;
  postId: string;
  userId: string;
  content: string;
  mediaUrl?: string | null;
  scheduledAt: string;
}
