import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledPost {
  id: string;
  platform: 'X' | 'INSTAGRAM' | 'FACEBOOK' | 'ONLYFANS';
  content: string;
  media_url?: string;
  scheduled_at: string;
  user_id: string;
}

interface PublishResult {
  id: string;
  status: 'SENT' | 'FAILED';
  error?: string;
}

// Get the base URL for edge functions
function getEdgeFunctionUrl(functionName: string): string {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  return `${supabaseUrl}/functions/v1/${functionName}`;
}

// Call a platform-specific publishing function
async function callPublishFunction(
  functionName: string, 
  post: ScheduledPost,
  serviceKey: string
): Promise<{ success: boolean; error?: string }> {
  const url = getEdgeFunctionUrl(functionName);
  
  console.log(`Calling ${functionName} for post ${post.id}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        postId: post.id,
        content: post.content,
        mediaUrl: post.media_url,
        scheduledAt: post.scheduled_at,
      }),
    });

    const responseText = await response.text();
    console.log(`${functionName} response status: ${response.status}`);
    console.log(`${functionName} response: ${responseText}`);

    if (!response.ok) {
      const errorData = JSON.parse(responseText);
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    const result = JSON.parse(responseText);
    return { success: result.success !== false, error: result.error };
  } catch (error: any) {
    console.error(`Error calling ${functionName}:`, error);
    return { success: false, error: error.message };
  }
}

// Route post to the appropriate publishing function
async function publishPost(post: ScheduledPost, serviceKey: string): Promise<{ success: boolean; error?: string }> {
  switch (post.platform) {
    case 'X':
      return await callPublishFunction('publish-to-twitter', post, serviceKey);
    
    case 'INSTAGRAM':
      return await callPublishFunction('publish-to-instagram', post, serviceKey);
    
    case 'FACEBOOK':
      return await callPublishFunction('publish-to-facebook', post, serviceKey);
    
    case 'ONLYFANS':
      return await callPublishFunction('publish-to-onlyfans', post, serviceKey);
    
    default:
      console.error(`Unknown platform: ${post.platform}`);
      return { success: false, error: `Unsupported platform: ${post.platform}` };
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
        // Call the appropriate platform publishing function
        const publishResult = await publishPost(post, supabaseServiceKey);
        
        if (publishResult.success) {
          console.log(`Successfully published post ${post.id} to ${post.platform}`);
          results.push({ id: post.id, status: 'SENT' });
        } else {
          console.error(`Failed to publish post ${post.id}: ${publishResult.error}`);
          
          // Update post status to FAILED
          await supabase
            .from('scheduled_posts')
            .update({ 
              status: 'FAILED',
              error_message: publishResult.error || 'Unknown publishing error',
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);
          
          results.push({ id: post.id, status: 'FAILED', error: publishResult.error });
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
        
        results.push({ id: post.id, status: 'FAILED', error: postError.message });
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
