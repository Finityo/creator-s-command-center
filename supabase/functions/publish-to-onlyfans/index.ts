import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OnlyFans API credentials from environment variables
const ONLYFANS_API_KEY = Deno.env.get('ONLYFANS_API_KEY')?.trim();
const ONLYFANS_USER_ID = Deno.env.get('ONLYFANS_USER_ID')?.trim();

function validateEnvironmentVariables() {
  if (!ONLYFANS_API_KEY) {
    throw new Error("Missing ONLYFANS_API_KEY environment variable");
  }
  if (!ONLYFANS_USER_ID) {
    throw new Error("Missing ONLYFANS_USER_ID environment variable");
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

interface PublishRequest {
  postId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  scheduledAt?: string;
}

// Input validation constants
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ONLYFANS_MAX_LENGTH = 10000; // OnlyFans post limit

function validateInput(postId: string, content: string): void {
  if (!UUID_REGEX.test(postId)) {
    throw new Error("Invalid postId format: must be a valid UUID");
  }
  if (content.length > ONLYFANS_MAX_LENGTH) {
    throw new Error(`Content exceeds OnlyFans' ${ONLYFANS_MAX_LENGTH} character limit`);
  }
}

// OnlyFans API base URL (Note: OnlyFans doesn't have a public API)
// This is a placeholder implementation - actual integration requires partnership
const API_BASE_URL = "https://onlyfans.com/api2/v2";

async function createPost(content: string, mediaUrls?: string[]): Promise<any> {
  console.log("Creating OnlyFans post with content:", content.substring(0, 50) + "...");
  
  const requestBody: any = {
    text: content,
    isArchive: false,
    isPrivate: false,
  };

  if (mediaUrls && mediaUrls.length > 0) {
    requestBody.mediaFiles = mediaUrls.map((url, index) => ({
      source: url,
      position: index,
    }));
  }

  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ONLYFANS_API_KEY}`,
      "Content-Type": "application/json",
      "User-Id": ONLYFANS_USER_ID!,
      "Accept": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log("OnlyFans API Response Status:", response.status);
  console.log("OnlyFans API Response:", responseText);

  if (!response.ok) {
    throw new Error(`OnlyFans API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

async function schedulePost(content: string, scheduledAt: string, mediaUrls?: string[]): Promise<any> {
  console.log("Scheduling OnlyFans post for:", scheduledAt);
  
  const requestBody: any = {
    text: content,
    isArchive: false,
    isPrivate: false,
    scheduleDate: scheduledAt,
  };

  if (mediaUrls && mediaUrls.length > 0) {
    requestBody.mediaFiles = mediaUrls.map((url, index) => ({
      source: url,
      position: index,
    }));
  }

  const response = await fetch(`${API_BASE_URL}/posts/schedule`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ONLYFANS_API_KEY}`,
      "Content-Type": "application/json",
      "User-Id": ONLYFANS_USER_ID!,
      "Accept": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log("OnlyFans Schedule API Response Status:", response.status);
  console.log("OnlyFans Schedule API Response:", responseText);

  if (!response.ok) {
    throw new Error(`OnlyFans API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    validateEnvironmentVariables();

    // Verify the authenticated user
    const userId = await getAuthenticatedUserId(req);
    console.log(`Authenticated user: ${userId}`);

    const { postId, content, mediaUrl, scheduledAt }: PublishRequest = await req.json();
    
    console.log(`Processing OnlyFans publish request for post ${postId}`);

    if (!postId || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: postId, content" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input format and length
    validateInput(postId, content);

    // Verify the user owns this post before publishing
    await verifyPostOwnership(postId, userId);
    console.log(`Ownership verified for post ${postId}`);

    // Prepare media URLs array if media exists
    const mediaUrls = mediaUrl ? [mediaUrl] : undefined;

    let result;
    
    // Check if this is a scheduled post for the future
    if (scheduledAt) {
      const scheduleDate = new Date(scheduledAt);
      const now = new Date();
      
      if (scheduleDate > now) {
        // Schedule for future
        result = await schedulePost(content, scheduledAt, mediaUrls);
      } else {
        // Post immediately
        result = await createPost(content, mediaUrls);
      }
    } else {
      // Post immediately
      result = await createPost(content, mediaUrls);
    }

    console.log("OnlyFans post created successfully:", result);

    // Update post status in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({ 
        status: 'SENT',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (updateError) {
      console.error("Error updating post status:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId,
        onlyfansPostId: result.id,
        message: "Successfully published to OnlyFans"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error publishing to OnlyFans:", error);

    // Try to update post status to FAILED
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const body = await req.clone().json().catch(() => ({}));
      if (body.postId) {
        await supabase
          .from('scheduled_posts')
          .update({ 
            status: 'FAILED',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', body.postId);
      }
    } catch (updateError) {
      console.error("Error updating post status to FAILED:", updateError);
    }

    // Return appropriate error status
    const status = error.message.includes("Unauthorized") ? 401 : 500;
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
