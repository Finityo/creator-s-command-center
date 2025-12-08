import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate CRON_SECRET for cron invocations
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) {
    console.error("Unauthorized: Invalid or missing CRON_SECRET");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing recurring posts...');

    // Get all recurring posts that need new instances
    const now = new Date();
    const { data: recurringPosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .neq('recurrence_type', 'none')
      .is('parent_post_id', null) // Only get parent posts
      .in('status', ['SCHEDULED', 'SENT']);

    if (fetchError) {
      console.error('Error fetching recurring posts:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringPosts?.length || 0} recurring posts to process`);

    let createdCount = 0;

    for (const post of recurringPosts || []) {
      // Check if recurrence has ended
      if (post.recurrence_end_date && new Date(post.recurrence_end_date) < now) {
        console.log(`Skipping post ${post.id} - recurrence ended`);
        continue;
      }

      const lastScheduledAt = new Date(post.scheduled_at);
      let nextScheduledAt: Date | null = null;

      // Calculate next occurrence based on recurrence type
      switch (post.recurrence_type) {
        case 'daily':
          nextScheduledAt = new Date(lastScheduledAt);
          nextScheduledAt.setDate(nextScheduledAt.getDate() + 1);
          break;
        case 'weekly':
          nextScheduledAt = new Date(lastScheduledAt);
          nextScheduledAt.setDate(nextScheduledAt.getDate() + 7);
          break;
        case 'monthly':
          nextScheduledAt = new Date(lastScheduledAt);
          nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 1);
          break;
      }

      if (!nextScheduledAt || nextScheduledAt < now) {
        continue;
      }

      // Check if we already created this instance
      const { data: existingInstance } = await supabase
        .from('scheduled_posts')
        .select('id')
        .eq('parent_post_id', post.id)
        .eq('scheduled_at', nextScheduledAt.toISOString())
        .maybeSingle();

      if (existingInstance) {
        console.log(`Instance already exists for post ${post.id} at ${nextScheduledAt.toISOString()}`);
        continue;
      }

      // Create new instance
      const { error: createError } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: post.user_id,
          platform: post.platform,
          content: post.content,
          media_url: post.media_url,
          scheduled_at: nextScheduledAt.toISOString(),
          status: 'SCHEDULED',
          recurrence_type: 'none', // Child posts don't recur
          parent_post_id: post.id,
          queue_order: post.queue_order,
        });

      if (createError) {
        console.error(`Error creating recurring instance for post ${post.id}:`, createError);
      } else {
        createdCount++;
        console.log(`Created recurring instance for post ${post.id} at ${nextScheduledAt.toISOString()}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${recurringPosts?.length || 0} recurring posts, created ${createdCount} new instances` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in process-recurring-posts function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process recurring posts';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
