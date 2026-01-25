import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Meeting, useCreateMeeting, useUpdateMeeting, useCreateAgendaItem } from '@/hooks/useMeetings';
import { usePeople } from '@/hooks/usePeople';
import { useMinistries } from '@/hooks/useMinistries';
import { useMeetingTemplates, MeetingTemplate } from '@/hooks/useMeetingTemplates';
import { useBulkAddMeetingParticipants } from '@/hooks/useMeetingParticipants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, FileText } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type MeetingType = Database['public']['Enums']['meeting_type'];

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
}

export function MeetingFormDialog({ open, onOpenChange, meeting }: MeetingFormDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const { person } = useAuth();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const createAgendaItem = useCreateAgendaItem();
  const bulkAddParticipants = useBulkAddMeetingParticipants();
  const { data: people } = usePeople();
  const { data: ministries } = useMinistries();
  const { data: templates } = useMeetingTemplates();
  
  const isEditing = !!meeting;

  const [formData, setFormData] = useState({
    meeting_type: 'team' as MeetingType,
    title_en: '',
    title_fr: '',
    date_time: '',
    duration_minutes: 60,
    organizer_id: '',
    ministry_id: '',
    person_focus_id: '',
    spiritual_focus: false,
    recurrence_pattern: '',
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Filter templates by meeting type
  const availableTemplates = templates?.filter(t => t.meeting_type === formData.meeting_type) || [];

  // Get direct reports for person_focus selection (for 1:1s)
  const directReports = people?.filter(p => p.supervisor_id === person?.id) || [];

  useEffect(() => {
    if (meeting) {
      setFormData({
        meeting_type: meeting.meeting_type || 'team',
        title_en: meeting.title_en || '',
        title_fr: meeting.title_fr || '',
        date_time: meeting.date_time ? new Date(meeting.date_time).toISOString().slice(0, 16) : '',
        duration_minutes: meeting.duration_minutes || 60,
        organizer_id: meeting.organizer_id || '',
        ministry_id: meeting.ministry_id || '',
        person_focus_id: (meeting as any).person_focus_id || '',
        spiritual_focus: (meeting as any).spiritual_focus || false,
        recurrence_pattern: (meeting as any).recurrence_pattern || '',
      });
      setSelectedTemplateId('');
    } else {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      setFormData({
        meeting_type: 'team',
        title_en: '',
        title_fr: '',
        date_time: now.toISOString().slice(0, 16),
        duration_minutes: 60,
        organizer_id: person?.id || '',
        ministry_id: '',
        person_focus_id: '',
        spiritual_focus: false,
        recurrence_pattern: '',
      });
      setSelectedTemplateId('');
    }
  }, [meeting, open, person]);

  // Auto-fill title when selecting a person focus for 1:1
  useEffect(() => {
    if (formData.meeting_type === 'one_on_one' && formData.person_focus_id && !isEditing) {
      const focusPerson = people?.find(p => p.id === formData.person_focus_id);
      if (focusPerson && !formData.title_en) {
        setFormData(prev => ({
          ...prev,
          title_en: `1:1 with ${focusPerson.first_name} ${focusPerson.last_name}`,
          title_fr: `1:1 avec ${focusPerson.first_name} ${focusPerson.last_name}`,
        }));
      }
    }
  }, [formData.person_focus_id, formData.meeting_type, isEditing, people, formData.title_en]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      meeting_type: formData.meeting_type,
      title_en: formData.title_en,
      title_fr: formData.title_fr || null,
      date_time: new Date(formData.date_time).toISOString(),
      duration_minutes: formData.duration_minutes,
      organizer_id: formData.organizer_id,
      ministry_id: formData.ministry_id || null,
      person_focus_id: formData.person_focus_id || null,
      spiritual_focus: formData.spiritual_focus,
      recurrence_pattern: formData.recurrence_pattern || null,
    };

    if (isEditing && meeting) {
      await updateMeeting.mutateAsync({ id: meeting.id, ...payload });
      onOpenChange(false);
    } else {
      // Create meeting
      const newMeeting = await createMeeting.mutateAsync(payload);

      // Add person_focus as participant for 1:1s
      if (formData.meeting_type === 'one_on_one' && formData.person_focus_id) {
        await bulkAddParticipants.mutateAsync({
          meeting_id: newMeeting.id,
          person_ids: [formData.person_focus_id],
        });
      }

      // Apply template if selected
      if (selectedTemplateId) {
        const template = templates?.find(t => t.id === selectedTemplateId);
        if (template?.items && template.items.length > 0) {
          for (const item of template.items) {
            await createAgendaItem.mutateAsync({
              meeting_id: newMeeting.id,
              topic_en: item.topic_en,
              topic_fr: item.topic_fr,
              section_type: item.section_type as any,
              order_index: item.order_index || 0,
            });
          }
        }
      }

      onOpenChange(false);
    }
  };

  const isLoading = createMeeting.isPending || updateMeeting.isPending || createAgendaItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {isEditing ? 'Edit Meeting' : t('meetings.addMeeting')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update meeting details' : 'Schedule a new meeting'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Type */}
          <div className="space-y-2">
            <Label>Meeting Type *</Label>
            <Select
              value={formData.meeting_type}
              onValueChange={(value) => setFormData({ ...formData, meeting_type: value as MeetingType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_on_one">{t('meetings.oneOnOne')}</SelectItem>
                <SelectItem value="team">{t('meetings.team')}</SelectItem>
                <SelectItem value="ministry">{t('nav.ministries')}</SelectItem>
                <SelectItem value="board">{t('meetings.board')}</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection (for new meetings) */}
          {!isEditing && availableTemplates.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Use Template
              </Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No template</SelectItem>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {getLocalizedField(template, 'name')}
                      {template.is_default && ' (Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateId && (
                <p className="text-xs text-muted-foreground">
                  {templates?.find(t => t.id === selectedTemplateId)?.items?.length || 0} agenda items will be added
                </p>
              )}
            </div>
          )}

          {/* Person Focus (for 1:1s) */}
          {formData.meeting_type === 'one_on_one' && (
            <div className="space-y-2">
              <Label>Meeting with (Direct Report) *</Label>
              <Select
                value={formData.person_focus_id}
                onValueChange={(value) => setFormData({ ...formData, person_focus_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {directReports.length > 0 ? (
                    directReports.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    people?.filter(p => p.id !== person?.id).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title_en">Title (English) *</Label>
              <Input
                id="title_en"
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                placeholder="Meeting title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_fr">Title (Français)</Label>
              <Input
                id="title_fr"
                value={formData.title_fr}
                onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                placeholder="Titre de la réunion"
              />
            </div>
          </div>

          {/* Date and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.date_time}
                onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Organizer and Ministry */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organizer *</Label>
              <Select
                value={formData.organizer_id}
                onValueChange={(value) => setFormData({ ...formData, organizer_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organizer" />
                </SelectTrigger>
                <SelectContent>
                  {people?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ministry (optional)</Label>
              <Select
                value={formData.ministry_id}
                onValueChange={(value) => setFormData({ ...formData, ministry_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ministry" />
                </SelectTrigger>
                <SelectContent>
                  {ministries?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="spiritual_focus" className="cursor-pointer">
                Spiritual Focus Meeting
              </Label>
              <Switch
                id="spiritual_focus"
                checked={formData.spiritual_focus}
                onCheckedChange={(checked) => setFormData({ ...formData, spiritual_focus: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrence">Recurrence Pattern</Label>
              <Select
                value={formData.recurrence_pattern}
                onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No recurrence</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
