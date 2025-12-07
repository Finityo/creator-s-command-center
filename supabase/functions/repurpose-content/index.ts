import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_GUIDELINES: Record<string, string> = {
  X: "Twitter/X: Max 280 characters. Be concise and punchy. Use 1-3 relevant hashtags. Emojis are good but sparingly. Questions drive engagement.",
  INSTAGRAM: "Instagram: Storytelling format. Use emojis liberally. Include 20-30 relevant hashtags at the end. Personal and relatable tone. Call-to-action in bio link references.",
  FACEBOOK: "Facebook: Conversational and friendly. Can be longer form. Include a clear call-to-action. Questions encourage comments. Links are clickable here.",
  ONLYFANS: "OnlyFans: Personal and intimate tone. Teasing without revealing too much. Create anticipation for exclusive content. Direct message references work well.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, sourcePlatform, targetPlatform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!content || !sourcePlatform || !targetPlatform) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Repurposing content from ${sourcePlatform} to ${targetPlatform}`);

    const systemPrompt = `You are a social media expert who adapts content between platforms while maintaining the core message and engagement potential. You understand each platform's culture, character limits, and best practices.`;

    const userPrompt = `Repurpose this ${sourcePlatform} post for ${targetPlatform}:

Original content:
"${content}"

Target platform guidelines:
${PLATFORM_GUIDELINES[targetPlatform]}

Requirements:
- Maintain the core message and intent
- Adapt the tone and style for ${targetPlatform}
- Optimize for engagement on ${targetPlatform}
- Keep within character limits
- Add appropriate hashtags if relevant
- Make it feel native to ${targetPlatform}

Return ONLY the repurposed content, no explanations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const repurposedContent = data.choices?.[0]?.message?.content?.trim();

    if (!repurposedContent) {
      throw new Error("No content generated");
    }

    console.log(`Successfully repurposed content (${repurposedContent.length} chars)`);

    return new Response(
      JSON.stringify({ repurposed_content: repurposedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("repurpose-content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
