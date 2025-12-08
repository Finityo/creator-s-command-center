// src/server/delivery/x.ts
// Text-only Twitter/X posting via OAuth 2.0 (User Context)

import type { DeliveryContext, DeliveryResult } from "./index";

type XToken = {
  access_token: string;
};

async function getXToken(userId: string): Promise<string> {
  // Expect you already store per-user OAuth tokens tied to social_accounts
  // This stub assumes a secure lookup layer exists
  // Replace with your real token fetch
  const token: XToken | null = await fetchUserXToken(userId);
  if (!token?.access_token) throw new Error("Missing X access token");
  return token.access_token;
}

export async function sendToX(ctx: DeliveryContext): Promise<DeliveryResult> {
  try {
    const accessToken = await getXToken(ctx.userId);

    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: ctx.content }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: err || "X post failed" };
    }

    const json = await res.json() as { data?: { id?: string } };
    return { ok: true, externalId: json?.data?.id };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "X delivery error";
    return { ok: false, error: message };
  }
}

// ----- placeholder -----
// Replace with real secure lookup (DB / vault)
async function fetchUserXToken(_userId: string): Promise<XToken | null> {
  return null;
}
