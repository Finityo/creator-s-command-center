// src/server/delivery/index.ts
// Unified delivery boundary with simulation-first behavior

import { DeliveryContext, DeliveryResult } from "./types";
import { sendToX } from "./x";

export type { Platform, DeliveryContext, DeliveryResult } from "./types";

export async function deliver(ctx: DeliveryContext): Promise<DeliveryResult> {
  switch (ctx.platform) {
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

// -----------------------------
// Shared simulation helper
// -----------------------------
function simulateDelivery(ctx: DeliveryContext): DeliveryResult {
  const simId = `sim_${ctx.platform.toLowerCase()}_${Date.now()}`;
  console.log(`[SIMULATION] Delivered ${ctx.platform} post`, {
    postId: ctx.postId,
    externalId: simId,
  });
  return { ok: true, externalId: simId };
}

// -----------------------------
// INSTAGRAM
// -----------------------------
async function sendToInstagram(ctx: DeliveryContext): Promise<DeliveryResult> {
  if (process.env.FINITYO_DELIVERY_MODE === "simulation") {
    return simulateDelivery(ctx);
  }

  return { ok: false, error: "Instagram delivery not enabled" };
}

// -----------------------------
// FACEBOOK
// -----------------------------
async function sendToFacebook(ctx: DeliveryContext): Promise<DeliveryResult> {
  if (process.env.FINITYO_DELIVERY_MODE === "simulation") {
    return simulateDelivery(ctx);
  }

  return { ok: false, error: "Facebook delivery not enabled" };
}

// -----------------------------
// ONLYFANS (manual / partner-only)
// -----------------------------
async function sendToOnlyFans(ctx: DeliveryContext): Promise<DeliveryResult> {
  if (process.env.FINITYO_DELIVERY_MODE === "simulation") {
    return simulateDelivery(ctx);
  }

  return { ok: false, error: "OnlyFans manual delivery" };
}
