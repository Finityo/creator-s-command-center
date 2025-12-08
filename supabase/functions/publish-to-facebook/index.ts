import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FACEBOOK_ACCESS_TOKEN = Deno.env.get("FACEBOOK_ACCESS_TOKEN")?.trim();
const FACEBOOK_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID")?.trim();

function validateEnvironmentVariables() {
  if (!FACEBOOK_ACCESS_TOKEN) {
    throw new Error("Missing FACEBOOK_ACCESS_TOKEN environment variable");
  }
  if (!FACEBOOK_PAGE_ID) {
    throw new Error("Missing FACEBOOK_PAGE_ID environment variable");
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
  mediaType?: "IMAGE" | "VIDEO" | "LINK";
  linkUrl?: string;
}

// Publish a text-only post
async function publishTextPost(message: string): Promise<any> {
  const url = `${GRAPH_API_URL}/${FACEBOOK_PAGE_ID}/feed`;
  
  const params = {
    access_token: FACEBOOK_ACCESS_TOKEN!,
    message: message,
  };

  console.log("Publishing text post to Facebook");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const responseText = await response.text();
  console.log("Text post response:", responseText);

  if (!response.ok) {
    throw new Error(`Failed to publish text post: ${responseText}`);
  }

  return JSON.parse(responseText);
}

// Publish a post with a link
async function publishLinkPost(message: string, linkUrl: string): Promise<any> {
  const url = `${GRAPH_API_URL}/${FACEBOOK_PAGE_ID}/feed`;
  
  const params = {
    access_token: FACEBOOK_ACCESS_TOKEN!,
    message: message,
    link: linkUrl,
  };

  console.log("Publishing link post to Facebook");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const responseText = await response.text();
  console.log("Link post response:", responseText);

  if (!response.ok) {
    throw new Error(`Failed to publish link post: ${responseText}`);
  }

  return JSON.parse(responseText);
}

// Publish a photo post
async function publishPhotoPost(message: string, imageUrl: string): Promise<any> {
  const url = `${GRAPH_API_URL}/${FACEBOOK_PAGE_ID}/photos`;
  
  const params = {
    access_token: FACEBOOK_ACCESS_TOKEN!,
    caption: message,
    url: imageUrl,
  };

  console.log("Publishing photo post to Facebook");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const responseText = await response.text();
  console.log("Photo post response:", responseText);

  if (!response.ok) {
    throw new Error(`Failed to publish photo post: ${responseText}`);
  }

  return JSON.parse(responseText);
}

// Publish a video post
async function publishVideoPost(message: string, videoUrl: string): Promise<any> {
  const url = `${GRAPH_API_URL}/${FACEBOOK_PAGE_ID}/videos`;
  
  const params = {
    access_token: FACEBOOK_ACCESS_TOKEN!,
    description: message,
    file_url: videoUrl,
  };

  console.log("Publishing video post to Facebook");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const responseText = await response.text();
  console.log("Video post response:", responseText);

  if (!response.ok) {
    throw new Error(`Failed to publish video post: ${responseText}`);
  }

  return JSON.parse(responseText);
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

    const { postId, content, mediaUrl, mediaType, linkUrl }: PublishRequest = await req.json();

    if (!postId || !content) {
      return new Response(
        JSON.stringify({ error: "Missing postId or content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user owns this post before publishing
    await verifyPostOwnership(postId, userId);
    console.log(`Ownership verified for post ${postId}`);

    console.log(`Publishing post ${postId} to Facebook: ${content.substring(0, 50)}...`);

    let publishResult;

    // Determine which type of post to publish
    if (mediaUrl && mediaType === "VIDEO") {
      publishResult = await publishVideoPost(content, mediaUrl);
    } else if (mediaUrl && mediaType === "IMAGE") {
      publishResult = await publishPhotoPost(content, mediaUrl);
    } else if (linkUrl) {
      publishResult = await publishLinkPost(content, linkUrl);
    } else {
      publishResult = await publishTextPost(content);
    }

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
        postId: publishResult.id || publishResult.post_id,
        message: "Facebook post published successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error publishing to Facebook:", error);

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
