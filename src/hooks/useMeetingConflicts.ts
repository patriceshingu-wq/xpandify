import { supabase } from '@/integrations/supabase/client';

export interface MeetingConflict {
  id: string;
  title_en: string;
  date_time: string;
  duration_minutes: number;
  conflictingPersonId: string;
  conflictingPersonName: string;
}

interface CheckConflictsParams {
  dateTime: Date;
  durationMinutes: number;
  personIds: string[];
  excludeMeetingId?: string;
}

/**
 * Checks for meeting conflicts for given persons at a specific time
 * Returns an array of conflicts if any exist
 */
export async function checkMeetingConflicts({
  dateTime,
  durationMinutes,
  personIds,
  excludeMeetingId,
}: CheckConflictsParams): Promise<MeetingConflict[]> {
  if (personIds.length === 0) return [];

  const proposedStart = dateTime;
  const proposedEnd = new Date(dateTime.getTime() + durationMinutes * 60 * 1000);

  // Query meetings where any of the persons are involved
  // A person is involved if they are:
  // 1. The organizer
  // 2. The person_focus (for 1:1s)
  // 3. A participant

  const conflicts: MeetingConflict[] = [];

  // Check meetings where person is organizer or person_focus
  let meetingsQuery = supabase
    .from('meetings')
    .select(`
      id,
      title_en,
      date_time,
      duration_minutes,
      organizer_id,
      person_focus_id,
      organizer:people!meetings_organizer_id_fkey(id, first_name, last_name)
    `)
    .or(`organizer_id.in.(${personIds.join(',')}),person_focus_id.in.(${personIds.join(',')})`);

  if (excludeMeetingId) {
    meetingsQuery = meetingsQuery.neq('id', excludeMeetingId);
  }

  const { data: directMeetings, error: directError } = await meetingsQuery;

  if (directError) {
    console.error('Error checking meeting conflicts:', directError);
    throw directError;
  }

  // Check for time overlaps in direct meetings
  for (const meeting of directMeetings || []) {
    const meetingStart = new Date(meeting.date_time);
    const meetingEnd = new Date(meetingStart.getTime() + (meeting.duration_minutes || 60) * 60 * 1000);

    // Check if times overlap
    if (proposedStart < meetingEnd && proposedEnd > meetingStart) {
      // Find which person has the conflict
      let conflictingPersonId = '';
      let conflictingPersonName = '';

      if (personIds.includes(meeting.organizer_id)) {
        conflictingPersonId = meeting.organizer_id;
        const organizer = meeting.organizer as { id: string; first_name: string; last_name: string } | null;
        conflictingPersonName = organizer 
          ? `${organizer.first_name} ${organizer.last_name}`
          : 'Unknown';
      } else if (meeting.person_focus_id && personIds.includes(meeting.person_focus_id)) {
        conflictingPersonId = meeting.person_focus_id;
        // We'd need another query to get this person's name, for now use the title hint
        conflictingPersonName = 'the selected person';
      }

      conflicts.push({
        id: meeting.id,
        title_en: meeting.title_en,
        date_time: meeting.date_time,
        duration_minutes: meeting.duration_minutes || 60,
        conflictingPersonId,
        conflictingPersonName,
      });
    }
  }

  // Also check meeting_participants table
  let participantsQuery = supabase
    .from('meeting_participants')
    .select(`
      meeting_id,
      person_id,
      meeting:meetings(id, title_en, date_time, duration_minutes),
      person:people!meeting_participants_person_id_fkey(id, first_name, last_name)
    `)
    .in('person_id', personIds);

  const { data: participantMeetings, error: participantError } = await participantsQuery;

  if (participantError) {
    console.error('Error checking participant conflicts:', participantError);
    throw participantError;
  }

  for (const participation of participantMeetings || []) {
    const meeting = participation.meeting as { id: string; title_en: string; date_time: string; duration_minutes: number } | null;
    
    if (!meeting) continue;
    if (excludeMeetingId && meeting.id === excludeMeetingId) continue;
    
    // Skip if we already found this conflict
    if (conflicts.some(c => c.id === meeting.id)) continue;

    const meetingStart = new Date(meeting.date_time);
    const meetingEnd = new Date(meetingStart.getTime() + (meeting.duration_minutes || 60) * 60 * 1000);

    if (proposedStart < meetingEnd && proposedEnd > meetingStart) {
      const person = participation.person as { id: string; first_name: string; last_name: string } | null;
      
      conflicts.push({
        id: meeting.id,
        title_en: meeting.title_en,
        date_time: meeting.date_time,
        duration_minutes: meeting.duration_minutes || 60,
        conflictingPersonId: participation.person_id,
        conflictingPersonName: person 
          ? `${person.first_name} ${person.last_name}`
          : 'Unknown',
      });
    }
  }

  return conflicts;
}

/**
 * Formats conflict messages for display
 */
export function formatConflictMessage(conflicts: MeetingConflict[]): string {
  if (conflicts.length === 0) return '';

  const uniquePersons = [...new Set(conflicts.map(c => c.conflictingPersonName))];
  const meetingTitles = [...new Set(conflicts.map(c => c.title_en))];

  if (conflicts.length === 1) {
    const conflict = conflicts[0];
    const time = new Date(conflict.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${conflict.conflictingPersonName} already has "${conflict.title_en}" scheduled at ${time}`;
  }

  return `Scheduling conflicts found for: ${uniquePersons.join(', ')}. Conflicting meetings: ${meetingTitles.join(', ')}`;
}
