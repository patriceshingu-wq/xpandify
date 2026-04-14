import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MeetingTemplate } from '@/hooks/useMeetingTemplates';
import { checkMeetingConflicts, formatConflictMessage, MeetingConflict } from '@/hooks/useMeetingConflicts';
import { RescheduleConflictsDialog } from '@/components/meetings/RescheduleConflictsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, FileText, Loader2, AlertTriangle } from 'lucide-react';

interface QuickScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string;
  personName: string;
  organizerId: string;
  templates: MeetingTemplate[];
  defaultTemplateId?: string;
  onSchedule: (data: {
    personId: string;
    dateTime: Date;
    templateId: string | null;
    title: string;
  }) => void;
  isLoading: boolean;
}

export function QuickScheduleDialog({
  open,
  onOpenChange,
  personId,
  personName,
  organizerId,
  templates,
  defaultTemplateId,
  onSchedule,
  isLoading,
}: QuickScheduleDialogProps) {
  const { getLocalizedField } = useLanguage();

  // Default to next business day at 10am
  const getDefaultDateTime = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    // Skip weekends
    while (now.getDay() === 0 || now.getDay() === 6) {
      now.setDate(now.getDate() + 1);
    }
    now.setHours(10, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  const [dateTime, setDateTime] = useState(getDefaultDateTime());
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId || 'none');
  const [title, setTitle] = useState(`1:1 with ${personName}`);
  const [conflicts, setConflicts] = useState<MeetingConflict[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  useEffect(() => {
    if (open) {
      setDateTime(getDefaultDateTime());
      setSelectedTemplateId(defaultTemplateId || 'none');
      setTitle(`1:1 with ${personName}`);
      setConflicts([]);
      setShowRescheduleDialog(false);
    }
  }, [open, personName, defaultTemplateId]);

  // Check for conflicts when date/time changes
  useEffect(() => {
    const checkConflicts = async () => {
      if (!dateTime || !personId || !organizerId) return;

      setIsCheckingConflicts(true);
      try {
        const foundConflicts = await checkMeetingConflicts({
          dateTime: new Date(dateTime),
          durationMinutes: 60, // Default 1:1 duration
          personIds: [personId, organizerId],
        });
        setConflicts(foundConflicts);
      } catch (error) {
        console.error('Error checking conflicts:', error);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkConflicts, 300);
    return () => clearTimeout(timeoutId);
  }, [dateTime, personId, organizerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflicts.length > 0) {
      // Open the reschedule dialog instead of simple confirm
      setShowRescheduleDialog(true);
      return;
    }
    proceedWithSchedule();
  };

  const proceedWithSchedule = () => {
    onSchedule({
      personId,
      dateTime: new Date(dateTime),
      templateId: selectedTemplateId === 'none' ? null : selectedTemplateId || null,
      title,
    });
  };

  const handleRescheduled = () => {
    // Re-check conflicts after rescheduling
    setConflicts([]);
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Quick Schedule 1:1
          </DialogTitle>
          <DialogDescription>
            Schedule a 1:1 meeting with {personName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="1:1 Meeting"
              required
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="datetime">Date & Time</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
            {isCheckingConflicts && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking availability...
              </p>
            )}
          </div>

          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {formatConflictMessage(conflicts)}
              </AlertDescription>
            </Alert>
          )}

          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Agenda Template
            </Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {getLocalizedField(template, 'name')}
                    {template.is_default && ' (Default)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground">
                {selectedTemplate.items?.length || 0} agenda items will be added automatically
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schedule 1:1
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Reschedule Conflicts Dialog */}
      <RescheduleConflictsDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        conflicts={conflicts}
        proposedDateTime={new Date(dateTime)}
        proposedDuration={60}
        personIds={[personId, organizerId]}
        onProceedAnyway={proceedWithSchedule}
        onRescheduled={handleRescheduled}
      />
    </Dialog>
  );
}
