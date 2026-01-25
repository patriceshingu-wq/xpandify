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
  type: 'course_deadline' | 'assignment' | 'meeting_reminder' | 'action_item_overdue' | 'general';
  link?: string;
  metadata?: Record<string, unknown>;
}

interface EmailPayload {
  to: string;
  subject: string;
  type: 'meeting_reminder' | 'course_deadline' | 'assignment' | 'action_item_overdue' | 'general';
  data: {
    recipientName?: string;
    title?: string;
    message?: string;
    dateTime?: string;
    link?: string;
  };
}

async function sendEmailNotification(supabaseUrl: string, supabaseAnonKey: string, emailPayload: EmailPayload): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send email notification:', errorText);
    } else {
      console.log(`Email sent successfully to: ${emailPayload.to}`);
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const notifications: NotificationPayload[] = [];
    const emailsToSend: EmailPayload[] = [];

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
          .select('id, user_id, first_name, last_name, email')
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
              const message = `${meeting.title_en || 'Meeting'} is scheduled for ${meetingTime.toLocaleString()}`;
              
              notifications.push({
                user_id: person.user_id,
                title: 'Upcoming Meeting',
                message,
                type: 'meeting_reminder',
                link: '/meetings',
                metadata: { meeting_id: meeting.id },
              });

              // Send email for meeting reminders (critical alert)
              if (person.email) {
                emailsToSend.push({
                  to: person.email,
                  subject: `Reminder: ${meeting.title_en || 'Upcoming Meeting'}`,
                  type: 'meeting_reminder',
                  data: {
                    recipientName: `${person.first_name} ${person.last_name}`,
                    title: 'Upcoming Meeting Reminder',
                    message,
                    dateTime: meetingTime.toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    link: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/meetings`,
                  },
                });
              }
            }
          }
        }
      }
    }

    // 2. Check for overdue/in-progress course assignments (remind weekly with email for overdue)
    const { data: inProgressAssignments, error: assignmentsError } = await supabase
      .from('course_assignments')
      .select(`
        id,
        person_id,
        status,
        assigned_date,
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
          .select('id, user_id, first_name, last_name, email')
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
            const courseTitle = courseData?.title_en || 'your course';
            const message = `Don't forget to complete "${courseTitle}"`;
            
            notifications.push({
              user_id: person.user_id,
              title: 'Course In Progress',
              message,
              type: 'course_deadline',
              link: '/development',
              metadata: { assignment_id: assignment.id, course_id: courseData?.id },
            });

            // Check if assignment is overdue (more than 30 days old) - send email
            const assignedDate = assignment.assigned_date ? new Date(assignment.assigned_date) : null;
            const isOverdue = assignedDate && (now.getTime() - assignedDate.getTime()) > 30 * 24 * 60 * 60 * 1000;

            if (isOverdue && person.email) {
              emailsToSend.push({
                to: person.email,
                subject: `Overdue: Complete your course "${courseTitle}"`,
                type: 'course_deadline',
                data: {
                  recipientName: `${person.first_name} ${person.last_name}`,
                  title: 'Course Assignment Overdue',
                  message: `Your course "${courseTitle}" was assigned on ${assignedDate?.toLocaleDateString()} and is still in progress. Please complete it as soon as possible.`,
                  link: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/development`,
                },
              });
            }
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
          .select('id, user_id, first_name, last_name, email')
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
            const courseTitle = courseData?.title_en || 'a new course';
            const message = `You have been assigned to "${courseTitle}"`;
            
            notifications.push({
              user_id: person.user_id,
              title: 'New Course Assignment',
              message,
              type: 'assignment',
              link: '/development',
              metadata: { assignment_id: assignment.id, course_id: courseData?.id },
            });

            // Send email for new assignments
            if (person.email) {
              emailsToSend.push({
                to: person.email,
                subject: `New Assignment: ${courseTitle}`,
                type: 'assignment',
                data: {
                  recipientName: `${person.first_name} ${person.last_name}`,
                  title: 'New Course Assignment',
                  message: `You have been assigned a new course: "${courseTitle}". Please start working on it at your earliest convenience.`,
                  link: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/development`,
                },
              });
            }
          }
        }
      }
    }

    // 4. Check for overdue action items (action_required = true, action_due_date < today, action_status != 'done')
    console.log('Checking for overdue action items...');
    const { data: overdueActions, error: overdueError } = await supabase
      .from('meeting_agenda_items')
      .select(`
        id,
        topic_en,
        topic_fr,
        action_due_date,
        action_status,
        action_owner_id,
        meeting_id,
        meeting:meetings (
          id,
          title_en,
          title_fr
        )
      `)
      .eq('action_required', true)
      .lt('action_due_date', now.toISOString().split('T')[0])
      .neq('action_status', 'done')
      .neq('action_status', 'cancelled');

    if (overdueError) {
      console.error('Error fetching overdue actions:', overdueError);
    } else if (overdueActions) {
      console.log(`Found ${overdueActions.length} overdue action items`);
      
      for (const action of overdueActions) {
        if (!action.action_owner_id) continue;

        const { data: owner } = await supabase
          .from('people')
          .select('id, user_id, first_name, last_name, email')
          .eq('id', action.action_owner_id)
          .maybeSingle();

        if (owner?.user_id) {
          // Only send notification once per week per action item
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', owner.user_id)
            .eq('type', 'action_item_overdue')
            .eq('metadata->>action_item_id', action.id)
            .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle();

          if (!existing) {
            const meetingData = action.meeting as unknown as { id: string; title_en: string; title_fr: string | null } | null;
            const topicTitle = action.topic_en || 'Action item';
            const meetingTitle = meetingData?.title_en || 'Meeting';
            const dueDate = action.action_due_date ? new Date(action.action_due_date) : null;
            const daysOverdue = dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000)) : 0;
            
            const message = `"${topicTitle}" from "${meetingTitle}" was due ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`;
            
            notifications.push({
              user_id: owner.user_id,
              title: 'Overdue Action Item',
              message,
              type: 'action_item_overdue',
              link: '/meetings',
              metadata: { 
                action_item_id: action.id, 
                meeting_id: action.meeting_id,
                days_overdue: daysOverdue 
              },
            });

            // Send email for overdue action items (critical alert)
            if (owner.email) {
              emailsToSend.push({
                to: owner.email,
                subject: `Overdue: ${topicTitle}`,
                type: 'action_item_overdue',
                data: {
                  recipientName: `${owner.first_name} ${owner.last_name}`,
                  title: 'Action Item Overdue',
                  message: `Your action item "${topicTitle}" from the meeting "${meetingTitle}" was due on ${dueDate?.toLocaleDateString()} (${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago). Please complete it as soon as possible.`,
                  dateTime: dueDate?.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                  link: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/meetings`,
                },
              });
            }
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

    // Send all emails
    console.log(`Sending ${emailsToSend.length} email notifications...`);
    for (const emailPayload of emailsToSend) {
      await sendEmailNotification(supabaseUrl, supabaseAnonKey, emailPayload);
    }

    console.log(`Generated ${notifications.length} notifications, sent ${emailsToSend.length} emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: notifications.length,
        emailsSent: emailsToSend.length,
        notifications: notifications.map(n => ({ type: n.type, title: n.title })),
        emails: emailsToSend.map(e => ({ type: e.type, to: e.to })),
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
