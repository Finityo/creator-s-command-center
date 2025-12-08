// src/server/delivery/x.ts
// Text-only Twitter/X posting via OAuth 2.0 (User Context)

import type { DeliveryContext, DeliveryResult } from "./index";

const DELIVERY_MODE =
  (typeof process !== "undefined" && process.env?.FINITYO_DELIVERY_MODE?.toLowerCase()) ?? "simulation";

export async function sendToX(ctx: DeliveryContext): Promise<DeliveryResult> {
  // Global safety guard: no live delivery while in simulation
  if (DELIVERY_MODE === "simulation") {
    return {
      ok: false,
      error: "X delivery is in simulation mode (no real posts sent)",
    };
  }

  try {
    const accessToken = await getXToken(ctx.userId);
    if (!accessToken) {
      return { ok: false, error: "X access token not configured" };
    }

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

    const json = (await res.json()) as { data?: { id?: string } };
    return { ok: true, externalId: json?.data?.id };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "X delivery error";
    return { ok: false, error: message };
  }
}

// Placeholder: we *intentionally* don't look up real tokens yet
async function getXToken(_userId: string): Promise<string | null> {
  return null;
}
