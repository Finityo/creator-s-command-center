import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DELIVERY_MODE = Deno.env.get("FINITYO_DELIVERY_MODE")?.toLowerCase() ?? "simulation";

// Simulation helper
function simulateDelivery(postId: string, content: string): Response {
  const simId = `sim_facebook_${Date.now()}`;
  console.log(`[SIMULATION] Would post to Facebook:`, {
    postId,
    content: content?.substring(0, 50) + "...",
    externalId: simId,
  });
  return new Response(
    JSON.stringify({
      success: true,
      externalId: simId,
      message: "[SIMULATION] Facebook post simulated successfully",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, content } = await req.json();

    // Safety guard: simulate delivery when in simulation mode
    if (DELIVERY_MODE === "simulation") {
      return simulateDelivery(postId, content);
    }

    // Real Facebook delivery not yet implemented
    return new Response(
      JSON.stringify({
        success: false,
        error: "Facebook delivery not enabled",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in Facebook function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
