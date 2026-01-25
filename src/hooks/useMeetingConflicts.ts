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

export interface SuggestedTimeSlot {
  start: Date;
  end: Date;
  label: string;
}

interface FindAlternativeSlotsParams {
  personIds: string[];
  durationMinutes: number;
  preferredDate: Date;
  excludeMeetingId?: string;
}

/**
 * Finds available time slots for the given persons around a preferred date
 * Returns up to 5 suggested alternatives
 */
export async function findAlternativeTimeSlots({
  personIds,
  durationMinutes,
  preferredDate,
  excludeMeetingId,
}: FindAlternativeSlotsParams): Promise<SuggestedTimeSlot[]> {
  if (personIds.length === 0) return [];

  // Get all meetings for these persons in a ±7 day window
  const startWindow = new Date(preferredDate);
  startWindow.setDate(startWindow.getDate() - 1);
  startWindow.setHours(0, 0, 0, 0);

  const endWindow = new Date(preferredDate);
  endWindow.setDate(endWindow.getDate() + 7);
  endWindow.setHours(23, 59, 59, 999);

  // Fetch all meetings for involved persons
  let meetingsQuery = supabase
    .from('meetings')
    .select('id, date_time, duration_minutes, organizer_id, person_focus_id')
    .or(`organizer_id.in.(${personIds.join(',')}),person_focus_id.in.(${personIds.join(',')})`)
    .gte('date_time', startWindow.toISOString())
    .lte('date_time', endWindow.toISOString());

  if (excludeMeetingId) {
    meetingsQuery = meetingsQuery.neq('id', excludeMeetingId);
  }

  const { data: directMeetings } = await meetingsQuery;

  // Also get participant meetings
  const { data: participantMeetings } = await supabase
    .from('meeting_participants')
    .select('meeting:meetings(id, date_time, duration_minutes)')
    .in('person_id', personIds);

  // Build list of busy periods
  const busyPeriods: { start: Date; end: Date }[] = [];

  for (const meeting of directMeetings || []) {
    if (excludeMeetingId && meeting.id === excludeMeetingId) continue;
    const start = new Date(meeting.date_time);
    const end = new Date(start.getTime() + (meeting.duration_minutes || 60) * 60 * 1000);
    busyPeriods.push({ start, end });
  }

  for (const participation of participantMeetings || []) {
    const meeting = participation.meeting as { id: string; date_time: string; duration_minutes: number } | null;
    if (!meeting) continue;
    if (excludeMeetingId && meeting.id === excludeMeetingId) continue;
    const start = new Date(meeting.date_time);
    const end = new Date(start.getTime() + (meeting.duration_minutes || 60) * 60 * 1000);
    busyPeriods.push({ start, end });
  }

  // Generate candidate time slots (business hours: 8am-6pm)
  const suggestions: SuggestedTimeSlot[] = [];
  const candidateDays: Date[] = [];

  // Start from today or preferred date, whichever is later
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let startDay = new Date(Math.max(today.getTime(), preferredDate.getTime()));
  startDay.setHours(0, 0, 0, 0);

  // Generate next 7 business days
  for (let i = 0; i < 14 && candidateDays.length < 7; i++) {
    const day = new Date(startDay);
    day.setDate(day.getDate() + i);
    // Skip weekends
    if (day.getDay() !== 0 && day.getDay() !== 6) {
      candidateDays.push(day);
    }
  }

  // Time slots to try (business hours)
  const timeSlots = [
    { hour: 9, minute: 0 },
    { hour: 10, minute: 0 },
    { hour: 11, minute: 0 },
    { hour: 13, minute: 0 }, // After lunch
    { hour: 14, minute: 0 },
    { hour: 15, minute: 0 },
    { hour: 16, minute: 0 },
  ];

  for (const day of candidateDays) {
    for (const slot of timeSlots) {
      if (suggestions.length >= 5) break;

      const slotStart = new Date(day);
      slotStart.setHours(slot.hour, slot.minute, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

      // Skip if in the past
      if (slotStart <= new Date()) continue;

      // Check if this slot conflicts with any busy period
      const hasConflict = busyPeriods.some(
        busy => slotStart < busy.end && slotEnd > busy.start
      );

      if (!hasConflict) {
        // Format label
        const dayLabel = slotStart.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const timeLabel = slotStart.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        
        suggestions.push({
          start: slotStart,
          end: slotEnd,
          label: `${dayLabel} at ${timeLabel}`,
        });
      }
    }
    if (suggestions.length >= 5) break;
  }

  return suggestions;
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
