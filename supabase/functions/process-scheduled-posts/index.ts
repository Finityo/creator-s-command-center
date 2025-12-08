import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

interface ScheduledPost {
  id: string;
  platform: 'X' | 'INSTAGRAM' | 'FACEBOOK' | 'ONLYFANS';
  content: string;
  media_url?: string;
  scheduled_at: string;
  user_id: string;
  retry_count?: number;
}

interface PublishResult {
  id: string;
  status: 'SENT' | 'FAILED';
  error?: string;
  attempts?: number;
  externalId?: string;
}

type DeliveryResult =
  | { ok: true; externalId?: string }
  | { ok: false; error: string };

interface DeliveryContext {
  postId: string;
  userId: string;
  content: string;
  mediaUrl?: string | null;
  scheduledAt: string;
}

// Platform-agnostic delivery function
async function deliverPost(
  platform: ScheduledPost['platform'],
  ctx: DeliveryContext,
  serviceKey: string
): Promise<{ result: DeliveryResult; attempts: number }> {
  const functionMap: Record<ScheduledPost['platform'], string> = {
    X: 'publish-to-twitter',
    INSTAGRAM: 'publish-to-instagram',
    FACEBOOK: 'publish-to-facebook',
    ONLYFANS: 'publish-to-onlyfans',
  };
  
  const functionName = functionMap[platform];
  if (!functionName) {
    return { result: { ok: false, error: `Unsupported platform: ${platform}` }, attempts: 1 };
  }
  
  const publishResult = await callPublishFunctionWithRetry(functionName, ctx, serviceKey);
  
  if (publishResult.success) {
    return { 
      result: { ok: true, externalId: publishResult.externalId }, 
      attempts: publishResult.attempts 
    };
  }
  
  return { 
    result: { ok: false, error: publishResult.error || 'Unknown error' }, 
    attempts: publishResult.attempts 
  };
}

// Get the base URL for edge functions
function getEdgeFunctionUrl(functionName: string): string {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  return `${supabaseUrl}/functions/v1/${functionName}`;
}

// Delay helper for retry logic
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Call a platform-specific publishing function with retry logic
async function callPublishFunctionWithRetry(
  functionName: string, 
  ctx: DeliveryContext,
  serviceKey: string,
  maxAttempts: number = MAX_RETRY_ATTEMPTS
): Promise<{ success: boolean; error?: string; attempts: number; externalId?: string }> {
  let lastError: string | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Attempt ${attempt}/${maxAttempts} - Calling ${functionName} for post ${ctx.postId}`);
    
    try {
      const url = getEdgeFunctionUrl(functionName);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          postId: ctx.postId,
          content: ctx.content,
          mediaUrl: ctx.mediaUrl,
          scheduledAt: ctx.scheduledAt,
        }),
      });

      const responseText = await response.text();
      console.log(`${functionName} response status: ${response.status}`);
      console.log(`${functionName} response: ${responseText}`);

      if (!response.ok) {
        const errorData = JSON.parse(responseText);
        lastError = errorData.error || `HTTP ${response.status}`;
        
        // Don't retry on 4xx client errors (except 429 rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          console.log(`Client error ${response.status} - not retrying`);
          return { success: false, error: lastError, attempts: attempt };
        }
        
        if (attempt < maxAttempts) {
          const delayTime = RETRY_DELAY_MS * attempt; // Exponential backoff
          console.log(`Retrying in ${delayTime}ms...`);
          await delay(delayTime);
          continue;
        }
        
        return { success: false, error: lastError, attempts: attempt };
      }

      const result = JSON.parse(responseText);
      if (result.success !== false) {
        return { success: true, attempts: attempt, externalId: result.externalId };
      }
      
      lastError = result.error || 'Unknown error';
      
      if (attempt < maxAttempts) {
        const delayTime = RETRY_DELAY_MS * attempt;
        console.log(`Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    } catch (error: any) {
      console.error(`Error on attempt ${attempt}:`, error);
      lastError = error.message;
      
      if (attempt < maxAttempts) {
        const delayTime = RETRY_DELAY_MS * attempt;
        console.log(`Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    }
  }
  
  return { success: false, error: lastError, attempts: maxAttempts };
}

// Build delivery context from post
function buildDeliveryContext(post: ScheduledPost): DeliveryContext {
  return {
    postId: post.id,
    userId: post.user_id,
    content: post.content,
    mediaUrl: post.media_url,
    scheduledAt: post.scheduled_at,
  };
}

// Send notification to user
async function sendNotification(
  supabase: any,
  serviceKey: string,
  userId: string,
  type: 'post_sent' | 'post_failed',
  platform: string,
  error?: string
): Promise<void> {
  try {
    // Get user email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile?.email) {
      console.log(`Could not fetch user email for notification: ${profileError?.message || 'No email found'}`);
      return;
    }

    const notificationUrl = getEdgeFunctionUrl('send-notification');
    
    const response = await fetch(notificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type,
        recipientEmail: profile.email,
        recipientName: profile.display_name,
        userId,
        data: {
          platform,
          error,
        },
      }),
    });

    const result = await response.text();
    console.log(`Notification response: ${result}`);
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw - notifications failing shouldn't break the main flow
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    console.log(`Processing scheduled posts at ${now}`);

    // Find all scheduled posts that are due
    const { data: duePosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'SCHEDULED')
      .lte('scheduled_at', now);

    if (fetchError) {
      console.error('Error fetching due posts:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${duePosts?.length || 0} posts to process`);

    if (!duePosts || duePosts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: PublishResult[] = [];

    for (const post of duePosts as ScheduledPost[]) {
      console.log(`Processing post ${post.id} for platform ${post.platform}`);
      
      try {
        // Build delivery context and call platform delivery
        const ctx = buildDeliveryContext(post);
        const { result, attempts } = await deliverPost(post.platform, ctx, supabaseServiceKey);
        
        if (result.ok) {
          console.log(`Successfully published post ${post.id} to ${post.platform} after ${attempts} attempt(s)`);
          
          // Update post status to SENT with external_post_id
          await supabase
            .from('scheduled_posts')
            .update({ 
              status: 'SENT',
              external_post_id: result.externalId ?? null,
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id)
            .eq('status', 'SCHEDULED');
          
          results.push({ id: post.id, status: 'SENT', attempts, externalId: result.externalId });
          
          // Send success notification
          await sendNotification(supabase, supabaseServiceKey, post.user_id, 'post_sent', post.platform);
        } else {
          console.error(`Failed to publish post ${post.id} after ${attempts} attempts: ${result.error}`);
          
          // Update post status to FAILED
          await supabase
            .from('scheduled_posts')
            .update({ 
              status: 'FAILED',
              error_message: `Failed after ${attempts} attempts: ${result.error}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id)
            .eq('status', 'SCHEDULED');
          
          results.push({ 
            id: post.id, 
            status: 'FAILED', 
            error: result.error,
            attempts 
          });
          
          // Send failure notification
          await sendNotification(
            supabase, 
            supabaseServiceKey, 
            post.user_id, 
            'post_failed', 
            post.platform,
            result.error
          );
        }
      } catch (postError: any) {
        console.error(`Error processing post ${post.id}:`, postError);
        
        await supabase
          .from('scheduled_posts')
          .update({ 
            status: 'FAILED',
            error_message: postError.message || 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);
        
        results.push({ id: post.id, status: 'FAILED', error: postError.message, attempts: 1 });
        
        // Send failure notification
        await sendNotification(
          supabase, 
          supabaseServiceKey, 
          post.user_id, 
          'post_failed', 
          post.platform,
          postError.message
        );
      }
    }

    const processed = results.filter(r => r.status === 'SENT').length;
    const failed = results.filter(r => r.status === 'FAILED').length;

    console.log(`Completed: ${processed} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Processing complete',
        processed,
        failed,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in process-scheduled-posts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
