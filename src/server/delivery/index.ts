// src/server/delivery/index.ts
// Platform-agnostic delivery boundary

import { sendToX } from "./x";

export type Platform = "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS";

export type DeliveryResult =
  | { ok: true; externalId?: string }
  | { ok: false; error: string };

export interface DeliveryContext {
  postId: string;
  userId: string;
  content: string;
  mediaUrl?: string | null;
  scheduledAt: string;
}

export async function deliverPost(
  platform: Platform,
  ctx: DeliveryContext
): Promise<DeliveryResult> {
  switch (platform) {
    case "X":
      return sendToX(ctx);
    case "INSTAGRAM":
      return sendToInstagram(ctx);
    case "FACEBOOK":
      return sendToFacebook(ctx);
    case "ONLYFANS":
      return sendToOnlyFans(ctx);
    default:
      return { ok: false, error: "Unsupported platform" };
  }
}

// ----- Platform stubs (safe, no external calls)

async function sendToInstagram(_: DeliveryContext): Promise<DeliveryResult> {
  // TODO: wire Meta Graph API
  return { ok: false, error: "Instagram delivery not enabled" };
}

async function sendToFacebook(_: DeliveryContext): Promise<DeliveryResult> {
  // TODO: wire Meta Pages API
  return { ok: false, error: "Facebook delivery not enabled" };
}

async function sendToOnlyFans(_: DeliveryContext): Promise<DeliveryResult> {
  // Intentionally manual / partner-only
  return { ok: false, error: "OnlyFans manual delivery" };
}
