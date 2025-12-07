import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'approval_needed' | 'post_approved' | 'post_rejected' | 'team_invitation' | 'post_sent' | 'post_failed';
  recipientEmail: string;
  recipientName?: string;
  userId?: string;
  postId?: string;
  data: Record<string, any>;
}

// Map notification types to preference column names
const preferenceMap: Record<string, string> = {
  'approval_needed': 'approval_needed',
  'post_approved': 'post_approved',
  'post_rejected': 'post_rejected',
  'post_sent': 'post_sent',
  'post_failed': 'post_failed',
};

const getEmailContent = (type: string, data: Record<string, any>) => {
  switch (type) {
    case 'approval_needed':
      return {
        subject: 'Post Pending Approval',
        html: `
          <h1>A post needs your approval</h1>
          <p>A new post has been scheduled and requires your approval before it can be published.</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Platform:</strong> ${data.platform}</p>
            <p><strong>Scheduled for:</strong> ${new Date(data.scheduledAt).toLocaleString()}</p>
            <p><strong>Content:</strong></p>
            <p style="white-space: pre-wrap;">${data.content}</p>
          </div>
          <p>Please log in to review and approve this post.</p>
        `,
      };
    case 'post_approved':
      return {
        subject: 'Your Post Has Been Approved',
        html: `
          <h1>Great news! Your post has been approved</h1>
          <p>Your scheduled post has been approved and will be published as planned.</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Platform:</strong> ${data.platform}</p>
            <p><strong>Scheduled for:</strong> ${new Date(data.scheduledAt).toLocaleString()}</p>
          </div>
        `,
      };
    case 'post_rejected':
      return {
        subject: 'Your Post Has Been Rejected',
        html: `
          <h1>Your post needs revision</h1>
          <p>Unfortunately, your scheduled post has been rejected.</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Platform:</strong> ${data.platform}</p>
            <p><strong>Reason:</strong> ${data.reason || 'No reason provided'}</p>
          </div>
          <p>Please review the feedback and make necessary changes.</p>
        `,
      };
    case 'team_invitation':
      return {
        subject: `You've been invited to join a team`,
        html: `
          <h1>Team Invitation</h1>
          <p>${data.inviterName || 'A team member'} has invited you to collaborate on their social media management.</p>
          <p><strong>Role:</strong> ${data.role}</p>
          <p>Click the button below to accept the invitation:</p>
          <a href="${data.inviteUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Accept Invitation</a>
          <p style="color: #666; font-size: 12px;">This invitation expires in 7 days.</p>
        `,
      };
    case 'post_sent':
      return {
        subject: 'Your Post Has Been Published',
        html: `
          <h1>Your post is live!</h1>
          <p>Your scheduled post has been successfully published.</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Platform:</strong> ${data.platform}</p>
            <p><strong>Published at:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `,
      };
    case 'post_failed':
      return {
        subject: 'Post Failed to Publish',
        html: `
          <h1>There was an issue with your post</h1>
          <p>Unfortunately, your scheduled post failed to publish.</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Platform:</strong> ${data.platform}</p>
            <p><strong>Error:</strong> ${data.error || 'Unknown error'}</p>
          </div>
          <p>Please check your account connection and try again.</p>
        `,
      };
    default:
      return {
        subject: 'Notification',
        html: '<p>You have a new notification.</p>',
      };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { type, recipientEmail, recipientName, userId, postId, data }: NotificationRequest = await req.json();

    if (!type || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type and recipientEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailContent = getEmailContent(type, data);

    // Create notification history record
    const historyRecord = {
      user_id: userId || null,
      type,
      recipient_email: recipientEmail,
      subject: emailContent.subject,
      status: 'pending',
      post_id: postId || null,
      metadata: { recipientName, ...data },
    };

    const { data: notification, error: insertError } = await supabase
      .from('notification_history')
      .insert(historyRecord)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating notification record:", insertError);
    }

    // Check user notification preferences if userId is provided and type is preference-controlled
    const preferenceColumn = preferenceMap[type];
    if (userId && preferenceColumn) {
      console.log(`Checking notification preferences for user ${userId}, type: ${type}`);

      const { data: preferences, error: prefError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (prefError) {
        console.error("Error fetching preferences:", prefError);
      } else if (preferences) {
        const prefs = preferences as Record<string, unknown>;
        if (prefs[preferenceColumn] === false) {
          console.log(`User ${userId} has disabled ${type} notifications - skipping email`);
          
          // Update notification status to skipped
          if (notification?.id) {
            await supabase
              .from('notification_history')
              .update({ status: 'skipped', error_message: 'User preference disabled' })
              .eq('id', notification.id);
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Notification skipped - user has disabled ${type} notifications` 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - logging notification only");
      
      // Update notification status
      if (notification?.id) {
        await supabase
          .from('notification_history')
          .update({ status: 'skipped', error_message: 'Email service not configured' })
          .eq('id', notification.id);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email notifications not configured. Add RESEND_API_KEY to enable." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    console.log(`Sending ${type} notification to ${recipientEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Notifications <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update notification status to sent
    if (notification?.id) {
      await supabase
        .from('notification_history')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .eq('id', notification.id);
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
