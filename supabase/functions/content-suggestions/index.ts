import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";
    let tools = [];
    let toolChoice = undefined;

    if (type === "hashtags") {
      systemPrompt = `You are a social media expert specializing in hashtag optimization. Analyze the content and platform to suggest relevant, trending hashtags that will maximize reach and engagement.`;
      userPrompt = `Suggest hashtags for this ${platform} post:\n\n"${content}"`;
      tools = [
        {
          type: "function",
          function: {
            name: "suggest_hashtags",
            description: "Return optimized hashtags for the social media post",
            parameters: {
              type: "object",
              properties: {
                hashtags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tag: { type: "string", description: "The hashtag without # symbol" },
                      category: { type: "string", enum: ["trending", "niche", "branded", "community"] },
                      reach: { type: "string", enum: ["high", "medium", "low"] }
                    },
                    required: ["tag", "category", "reach"],
                    additionalProperties: false
                  }
                }
              },
              required: ["hashtags"],
              additionalProperties: false
            }
          }
        }
      ];
      toolChoice = { type: "function", function: { name: "suggest_hashtags" } };
    } else if (type === "best_time") {
      systemPrompt = `You are a social media analytics expert. Based on platform-specific data and best practices, recommend optimal posting times for maximum engagement.`;
      userPrompt = `What are the best times to post on ${platform}? Consider the content type: "${content.slice(0, 100)}..."`;
      tools = [
        {
          type: "function",
          function: {
            name: "suggest_best_times",
            description: "Return optimal posting times for the platform",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
                      time: { type: "string", description: "Time in HH:MM format (24h)" },
                      engagement_level: { type: "string", enum: ["peak", "high", "moderate"] },
                      reason: { type: "string", description: "Brief explanation" }
                    },
                    required: ["day", "time", "engagement_level", "reason"],
                    additionalProperties: false
                  }
                },
                general_tips: {
                  type: "array",
                  items: { type: "string" },
                  description: "General timing tips for this platform"
                }
              },
              required: ["recommendations", "general_tips"],
              additionalProperties: false
            }
          }
        }
      ];
      toolChoice = { type: "function", function: { name: "suggest_best_times" } };
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type. Use 'hashtags' or 'best_time'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${type} request for platform: ${platform}`);

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
        tools,
        tool_choice: toolChoice,
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
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data).slice(0, 200));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("content-suggestions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
