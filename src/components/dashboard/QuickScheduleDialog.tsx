import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MeetingTemplate } from '@/hooks/useMeetingTemplates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, FileText, Loader2 } from 'lucide-react';

interface QuickScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string;
  personName: string;
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
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId || '');
  const [title, setTitle] = useState(`1:1 with ${personName}`);

  useEffect(() => {
    if (open) {
      setDateTime(getDefaultDateTime());
      setSelectedTemplateId(defaultTemplateId || '');
      setTitle(`1:1 with ${personName}`);
    }
  }, [open, personName, defaultTemplateId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule({
      personId,
      dateTime: new Date(dateTime),
      templateId: selectedTemplateId || null,
      title,
    });
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
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
          </div>

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
                <SelectItem value="">No template</SelectItem>
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
    </Dialog>
  );
}
