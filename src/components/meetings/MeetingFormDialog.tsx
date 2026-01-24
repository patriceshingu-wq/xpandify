import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Meeting, useCreateMeeting, useUpdateMeeting } from '@/hooks/useMeetings';
import { usePeople } from '@/hooks/usePeople';
import { useMinistries } from '@/hooks/useMinistries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
}

export function MeetingFormDialog({ open, onOpenChange, meeting }: MeetingFormDialogProps) {
  const { t } = useLanguage();
  const { person } = useAuth();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const { data: people } = usePeople();
  const { data: ministries } = useMinistries();
  
  const isEditing = !!meeting;

  const [formData, setFormData] = useState({
    meeting_type: 'team' as 'one_on_one' | 'team' | 'ministry' | 'board' | 'other',
    title_en: '',
    title_fr: '',
    date_time: '',
    duration_minutes: 60,
    organizer_id: '',
    ministry_id: '',
  });

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
      });
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
      });
    }
  }, [meeting, open, person]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      ministry_id: formData.ministry_id || null,
      date_time: new Date(formData.date_time).toISOString(),
    };

    if (isEditing && meeting) {
      await updateMeeting.mutateAsync({ id: meeting.id, ...payload });
    } else {
      await createMeeting.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isLoading = createMeeting.isPending || updateMeeting.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
              onValueChange={(value) => setFormData({ ...formData, meeting_type: value as any })}
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
