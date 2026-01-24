import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type: 'course_deadline' | 'assignment' | 'meeting_reminder' | 'general';
  link?: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const notifications: NotificationPayload[] = [];

    // 1. Check for upcoming meeting reminders (meetings in the next 24 hours)
    const { data: upcomingMeetings, error: meetingsError } = await supabase
      .from('meetings')
      .select(`
        id,
        title_en,
        title_fr,
        date_time,
        meeting_type,
        organizer_id,
        meeting_participants (
          person_id
        )
      `)
      .gte('date_time', now.toISOString())
      .lte('date_time', tomorrow.toISOString());

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
    } else if (upcomingMeetings) {
      for (const meeting of upcomingMeetings) {
        const participantPersonIds = meeting.meeting_participants?.map((p: { person_id: string }) => p.person_id) || [];
        const allPersonIds = [meeting.organizer_id, ...participantPersonIds];
        
        const { data: people } = await supabase
          .from('people')
          .select('user_id')
          .in('id', allPersonIds)
          .not('user_id', 'is', null);

        for (const person of people || []) {
          if (person.user_id) {
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', person.user_id)
              .eq('type', 'meeting_reminder')
              .eq('metadata->>meeting_id', meeting.id)
              .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!existing) {
              const meetingTime = new Date(meeting.date_time);
              notifications.push({
                user_id: person.user_id,
                title: 'Upcoming Meeting',
                message: `${meeting.title_en || 'Meeting'} is scheduled for ${meetingTime.toLocaleString()}`,
                type: 'meeting_reminder',
                link: '/meetings',
                metadata: { meeting_id: meeting.id },
              });
            }
          }
        }
      }
    }

    // 2. Check for in-progress course assignments (remind weekly)
    const { data: inProgressAssignments, error: assignmentsError } = await supabase
      .from('course_assignments')
      .select(`
        id,
        person_id,
        status,
        course:courses (
          id,
          title_en,
          title_fr
        )
      `)
      .eq('status', 'in_progress');

    if (assignmentsError) {
      console.error('Error fetching course assignments:', assignmentsError);
    } else if (inProgressAssignments) {
      for (const assignment of inProgressAssignments) {
        const { data: person } = await supabase
          .from('people')
          .select('user_id')
          .eq('id', assignment.person_id)
          .maybeSingle();

        if (person?.user_id) {
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', person.user_id)
            .eq('type', 'course_deadline')
            .eq('metadata->>assignment_id', assignment.id)
            .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle();

          if (!existing) {
            const courseData = assignment.course as unknown as { id: string; title_en: string; title_fr: string | null } | null;
            notifications.push({
              user_id: person.user_id,
              title: 'Course In Progress',
              message: `Don't forget to complete "${courseData?.title_en || 'your course'}"`,
              type: 'course_deadline',
              link: '/development',
              metadata: { assignment_id: assignment.id, course_id: courseData?.id },
            });
          }
        }
      }
    }

    // 3. Check for new course assignments (created in the last 24 hours)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: newAssignments, error: newAssignmentsError } = await supabase
      .from('course_assignments')
      .select(`
        id,
        person_id,
        created_at,
        course:courses (
          id,
          title_en,
          title_fr
        )
      `)
      .gte('created_at', yesterday.toISOString());

    if (newAssignmentsError) {
      console.error('Error fetching new assignments:', newAssignmentsError);
    } else if (newAssignments) {
      for (const assignment of newAssignments) {
        const { data: person } = await supabase
          .from('people')
          .select('user_id')
          .eq('id', assignment.person_id)
          .maybeSingle();

        if (person?.user_id) {
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', person.user_id)
            .eq('type', 'assignment')
            .eq('metadata->>assignment_id', assignment.id)
            .maybeSingle();

          if (!existing) {
            const courseData = assignment.course as unknown as { id: string; title_en: string; title_fr: string | null } | null;
            notifications.push({
              user_id: person.user_id,
              title: 'New Course Assignment',
              message: `You have been assigned to "${courseData?.title_en || 'a new course'}"`,
              type: 'assignment',
              link: '/development',
              metadata: { assignment_id: assignment.id, course_id: courseData?.id },
            });
          }
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }
    }

    console.log(`Generated ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: notifications.length,
        notifications: notifications.map(n => ({ type: n.type, title: n.title }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-notifications:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
