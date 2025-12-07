import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const results = [];

    for (const post of duePosts) {
      console.log(`Processing post ${post.id} for platform ${post.platform}`);
      
      try {
        // Here you would integrate with actual social media APIs
        // For now, we'll simulate posting and mark as sent
        
        // TODO: Integrate with platform APIs
        // - X/Twitter API
        // - Instagram API
        // - Facebook API
        // - OnlyFans API
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Mark as sent
        const { error: updateError } = await supabase
          .from('scheduled_posts')
          .update({ 
            status: 'SENT',
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);

        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError);
          
          // Mark as failed
          await supabase
            .from('scheduled_posts')
            .update({ 
              status: 'FAILED',
              error_message: updateError.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);
          
          results.push({ id: post.id, status: 'FAILED', error: updateError.message });
        } else {
          console.log(`Successfully processed post ${post.id}`);
          results.push({ id: post.id, status: 'SENT' });
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