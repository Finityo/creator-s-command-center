import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledPost {
  id: string;
  platform: string;
  scheduled_at: string;
  queue_order: number | null;
}

interface TimeSlot {
  dayOfWeek: number;
  hour: number;
  score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auto-scheduling posts for user:', user.id);

    // Get analytics data to find best performing times
    const { data: analytics } = await supabase
      .from('analytics_snapshots')
      .select('platform, taken_at, engagement, impressions')
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false })
      .limit(200);

    // Get sent posts to analyze historical performance
    const { data: sentPosts } = await supabase
      .from('scheduled_posts')
      .select('platform, scheduled_at, status')
      .eq('user_id', user.id)
      .eq('status', 'SENT')
      .order('scheduled_at', { ascending: false })
      .limit(100);

    // Calculate best time slots based on historical data
    const bestTimeSlots = calculateBestTimeSlots(analytics || [], sentPosts || []);

    // Get posts that need scheduling (DRAFT or SCHEDULED with queue_order)
    const { data: postsToSchedule, error: postsError } = await supabase
      .from('scheduled_posts')
      .select('id, platform, scheduled_at, queue_order')
      .eq('user_id', user.id)
      .in('status', ['DRAFT', 'SCHEDULED'])
      .order('queue_order', { ascending: true });

    if (postsError) throw postsError;

    if (!postsToSchedule || postsToSchedule.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts to schedule', updates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign optimal times to posts based on platform and queue order
    const updates = assignOptimalTimes(postsToSchedule, bestTimeSlots);

    // Update posts with new scheduled times
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({ scheduled_at: update.scheduled_at, status: 'SCHEDULED' })
        .eq('id', update.id);

      if (updateError) {
        console.error('Failed to update post:', update.id, updateError);
      }
    }

    console.log('Successfully auto-scheduled', updates.length, 'posts');

    return new Response(
      JSON.stringify({ 
        message: `Auto-scheduled ${updates.length} posts`,
        updates,
        bestTimeSlots: bestTimeSlots.slice(0, 5)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in auto-schedule function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to auto-schedule';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateBestTimeSlots(
  analytics: { platform: string; taken_at: string; engagement: number | null; impressions: number | null }[],
  sentPosts: { platform: string; scheduled_at: string; status: string }[]
): TimeSlot[] {
  const timeScores: Map<string, { count: number; totalScore: number }> = new Map();

  // Analyze analytics data
  for (const snap of analytics) {
    const date = new Date(snap.taken_at);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const key = `${dayOfWeek}-${hour}`;
    
    const score = (snap.engagement || 0) + (snap.impressions || 0) * 0.1;
    
    const existing = timeScores.get(key) || { count: 0, totalScore: 0 };
    timeScores.set(key, {
      count: existing.count + 1,
      totalScore: existing.totalScore + score,
    });
  }

  // Analyze sent posts frequency
  for (const post of sentPosts) {
    const date = new Date(post.scheduled_at);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const key = `${dayOfWeek}-${hour}`;
    
    const existing = timeScores.get(key) || { count: 0, totalScore: 0 };
    timeScores.set(key, {
      count: existing.count + 1,
      totalScore: existing.totalScore + 5, // Base score for sent posts
    });
  }

  // If no data, use default optimal times
  if (timeScores.size === 0) {
    return getDefaultOptimalTimes();
  }

  // Convert to array and sort by average score
  const slots: TimeSlot[] = [];
  for (const [key, value] of timeScores.entries()) {
    const [dayOfWeek, hour] = key.split('-').map(Number);
    slots.push({
      dayOfWeek,
      hour,
      score: value.totalScore / value.count,
    });
  }

  // Sort by score descending
  slots.sort((a, b) => b.score - a.score);

  // If we have limited data, supplement with defaults
  if (slots.length < 10) {
    const defaults = getDefaultOptimalTimes();
    for (const def of defaults) {
      if (!slots.find(s => s.dayOfWeek === def.dayOfWeek && s.hour === def.hour)) {
        slots.push(def);
      }
    }
  }

  return slots;
}

function getDefaultOptimalTimes(): TimeSlot[] {
  // Research-based optimal posting times
  return [
    { dayOfWeek: 2, hour: 10, score: 10 }, // Tuesday 10am
    { dayOfWeek: 3, hour: 11, score: 10 }, // Wednesday 11am
    { dayOfWeek: 4, hour: 12, score: 10 }, // Thursday 12pm
    { dayOfWeek: 2, hour: 14, score: 9 },  // Tuesday 2pm
    { dayOfWeek: 3, hour: 9, score: 9 },   // Wednesday 9am
    { dayOfWeek: 5, hour: 10, score: 8 },  // Friday 10am
    { dayOfWeek: 1, hour: 11, score: 8 },  // Monday 11am
    { dayOfWeek: 4, hour: 15, score: 7 },  // Thursday 3pm
    { dayOfWeek: 6, hour: 10, score: 6 },  // Saturday 10am
    { dayOfWeek: 0, hour: 11, score: 5 },  // Sunday 11am
  ];
}

function assignOptimalTimes(
  posts: ScheduledPost[],
  bestTimeSlots: TimeSlot[]
): { id: string; scheduled_at: string }[] {
  const updates: { id: string; scheduled_at: string }[] = [];
  const usedSlots: Set<string> = new Set();
  
  const now = new Date();
  let currentDate = new Date(now);
  currentDate.setMinutes(0, 0, 0);
  
  // Start from tomorrow if current time is past typical working hours
  if (now.getHours() >= 18) {
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(9, 0, 0, 0);
  }

  for (const post of posts) {
    // Find the next best available time slot
    let assigned = false;
    
    for (let dayOffset = 0; dayOffset < 14 && !assigned; dayOffset++) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() + dayOffset);
      const targetDayOfWeek = targetDate.getDay();
      
      // Find best slots for this day
      const daySlots = bestTimeSlots
        .filter(s => s.dayOfWeek === targetDayOfWeek)
        .sort((a, b) => b.score - a.score);

      for (const slot of daySlots) {
        const slotDate = new Date(targetDate);
        slotDate.setHours(slot.hour, 0, 0, 0);
        
        // Skip if in the past
        if (slotDate <= now) continue;
        
        const slotKey = slotDate.toISOString();
        if (!usedSlots.has(slotKey)) {
          usedSlots.add(slotKey);
          updates.push({
            id: post.id,
            scheduled_at: slotDate.toISOString(),
          });
          assigned = true;
          break;
        }
      }
    }

    // Fallback: assign to next available hour if no optimal slot found
    if (!assigned) {
      const fallbackDate = new Date(currentDate);
      fallbackDate.setDate(fallbackDate.getDate() + updates.length);
      fallbackDate.setHours(10, 0, 0, 0);
      
      updates.push({
        id: post.id,
        scheduled_at: fallbackDate.toISOString(),
      });
    }
  }

  return updates;
}
