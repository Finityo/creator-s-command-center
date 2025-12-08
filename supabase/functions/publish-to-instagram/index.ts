import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN")?.trim();
const INSTAGRAM_ACCOUNT_ID = Deno.env.get("INSTAGRAM_ACCOUNT_ID")?.trim();

function validateEnvironmentVariables() {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    throw new Error("Missing INSTAGRAM_ACCESS_TOKEN environment variable");
  }
  if (!INSTAGRAM_ACCOUNT_ID) {
    throw new Error("Missing INSTAGRAM_ACCOUNT_ID environment variable");
  }
}

// Extract and verify the authenticated user from the JWT
async function getAuthenticatedUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized: Invalid or expired token");
  }

  return user.id;
}

// Verify the caller owns the post they're trying to publish
async function verifyPostOwnership(postId: string, userId: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: post, error } = await supabase
    .from("scheduled_posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (error || !post) {
    throw new Error("Post not found");
  }

  if (post.user_id !== userId) {
    throw new Error("Unauthorized: You don't own this post");
  }
}

const GRAPH_API_URL = "https://graph.facebook.com/v18.0";

interface PublishRequest {
  postId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO" | "CAROUSEL";
}

// Step 1: Create media container
async function createMediaContainer(
  caption: string,
  mediaUrl: string,
  mediaType: string = "IMAGE"
): Promise<string> {
  const url = `${GRAPH_API_URL}/${INSTAGRAM_ACCOUNT_ID}/media`;
  
  const params: Record<string, string> = {
    access_token: INSTAGRAM_ACCESS_TOKEN!,
    caption: caption,
  };

  if (mediaType === "VIDEO") {
    params.media_type = "VIDEO";
    params.video_url = mediaUrl;
  } else {
    params.image_url = mediaUrl;
  }

  console.log("Creating media container with params:", { ...params, access_token: "[REDACTED]" });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const responseText = await response.text();
  console.log("Media container response:", responseText);

  if (!response.ok) {
    throw new Error(`Failed to create media container: ${responseText}`);
  }

  const result = JSON.parse(responseText);
  return result.id;
}

// Step 2: Check media container status (for videos)
async function checkMediaStatus(containerId: string): Promise<string> {
  const url = `${GRAPH_API_URL}/${containerId}?fields=status_code&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
  
  const response = await fetch(url);
  const result = await response.json();
  
  console.log("Media status:", result);
  return result.status_code;
}

// Step 3: Publish the media container
async function publishMedia(containerId: string): Promise<any> {
  const url = `${GRAPH_API_URL}/${INSTAGRAM_ACCOUNT_ID}/media_publish`;
  
  const params = {
    access_token: INSTAGRAM_ACCESS_TOKEN!,
    creation_id: containerId,
  };

  console.log("Publishing media container:", containerId);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const responseText = await response.text();
  console.log("Publish response:", responseText);

  if (!response.ok) {
    throw new Error(`Failed to publish media: ${responseText}`);
  }

  return JSON.parse(responseText);
}

// Wait for video processing with polling
async function waitForVideoProcessing(containerId: string, maxAttempts: number = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkMediaStatus(containerId);
    
    if (status === "FINISHED") {
      console.log("Video processing complete");
      return;
    }
    
    if (status === "ERROR") {
      throw new Error("Video processing failed");
    }
    
    console.log(`Video processing status: ${status}, attempt ${i + 1}/${maxAttempts}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  }
  
  throw new Error("Video processing timeout");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    validateEnvironmentVariables();

    // Verify the authenticated user
    const userId = await getAuthenticatedUserId(req);
    console.log(`Authenticated user: ${userId}`);

    const { postId, content, mediaUrl, mediaType = "IMAGE" }: PublishRequest = await req.json();

    if (!postId || !content) {
      return new Response(
        JSON.stringify({ error: "Missing postId or content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!mediaUrl) {
      return new Response(
        JSON.stringify({ error: "Instagram requires media (image or video) for posts" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user owns this post before publishing
    await verifyPostOwnership(postId, userId);
    console.log(`Ownership verified for post ${postId}`);

    console.log(`Publishing post ${postId} to Instagram: ${content.substring(0, 50)}...`);

    // Step 1: Create media container
    const containerId = await createMediaContainer(content, mediaUrl, mediaType);
    console.log("Created media container:", containerId);

    // Step 2: Wait for video processing if applicable
    if (mediaType === "VIDEO") {
      await waitForVideoProcessing(containerId);
    }

    // Step 3: Publish the media
    const publishResult = await publishMedia(containerId);
    console.log("Post published successfully:", publishResult);

    // Update post status in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from("scheduled_posts")
      .update({
        status: "SENT",
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateError) {
      console.error("Error updating post status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mediaId: publishResult.id,
        message: "Instagram post published successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error publishing to Instagram:", error);

    // Try to update post status to FAILED
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const body = await req.clone().json().catch(() => ({}));
      if (body.postId) {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "FAILED",
            error_message: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.postId);
      }
    } catch (e) {
      console.error("Failed to update post status:", e);
    }

    // Return appropriate error status
    const status = error.message.includes("Unauthorized") ? 401 : 500;
    return new Response(
      JSON.stringify({ error: error.message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
