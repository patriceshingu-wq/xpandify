import { useState, useEffect } from 'react';
import { useUpdateMeeting } from '@/hooks/useMeetings';
import { 
  MeetingConflict, 
  SuggestedTimeSlot, 
  findAlternativeTimeSlots 
} from '@/hooks/useMeetingConflicts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface RescheduleConflictsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: MeetingConflict[];
  proposedDateTime: Date;
  proposedDuration: number;
  personIds: string[];
  onProceedAnyway: () => void;
  onRescheduled: () => void;
}

interface RescheduleAction {
  meetingId: string;
  newDateTime: Date;
}

export function RescheduleConflictsDialog({
  open,
  onOpenChange,
  conflicts,
  proposedDateTime,
  proposedDuration,
  personIds,
  onProceedAnyway,
  onRescheduled,
}: RescheduleConflictsDialogProps) {
  const updateMeeting = useUpdateMeeting();
  
  const [suggestions, setSuggestions] = useState<SuggestedTimeSlot[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedMeetings, setSelectedMeetings] = useState<Set<string>>(new Set());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<SuggestedTimeSlot | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleResults, setRescheduleResults] = useState<Map<string, 'success' | 'error'>>(new Map());

  // Load alternative time slots when dialog opens
  useEffect(() => {
    if (open && conflicts.length > 0) {
      loadSuggestions();
    }
  }, [open, conflicts]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedMeetings(new Set());
      setSelectedTimeSlot(null);
      setRescheduleResults(new Map());
    }
  }, [open]);

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      // Get suggestions for all conflicting meetings to be rescheduled
      const allPersonIds = [...new Set([
        ...personIds,
        ...conflicts.map(c => c.conflictingPersonId)
      ])];
      
      const slots = await findAlternativeTimeSlots({
        personIds: allPersonIds,
        durationMinutes: proposedDuration,
        preferredDate: proposedDateTime,
      });
      setSuggestions(slots);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast.error('Failed to load alternative time slots');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const toggleMeetingSelection = (meetingId: string) => {
    const newSelection = new Set(selectedMeetings);
    if (newSelection.has(meetingId)) {
      newSelection.delete(meetingId);
    } else {
      newSelection.add(meetingId);
    }
    setSelectedMeetings(newSelection);
  };

  const selectAllMeetings = () => {
    setSelectedMeetings(new Set(conflicts.map(c => c.id)));
  };

  const handleReschedule = async () => {
    if (selectedMeetings.size === 0 || !selectedTimeSlot) {
      toast.error('Please select meetings and a new time slot');
      return;
    }

    setIsRescheduling(true);
    const results = new Map<string, 'success' | 'error'>();

    for (const meetingId of selectedMeetings) {
      try {
        await updateMeeting.mutateAsync({
          id: meetingId,
          date_time: selectedTimeSlot.start.toISOString(),
        });
        results.set(meetingId, 'success');
      } catch (error) {
        console.error(`Error rescheduling meeting ${meetingId}:`, error);
        results.set(meetingId, 'error');
      }
    }

    setRescheduleResults(results);
    setIsRescheduling(false);

    const successCount = Array.from(results.values()).filter(r => r === 'success').length;
    const errorCount = Array.from(results.values()).filter(r => r === 'error').length;

    if (successCount > 0 && errorCount === 0) {
      toast.success(`${successCount} meeting${successCount > 1 ? 's' : ''} rescheduled successfully`);
      onRescheduled();
      onOpenChange(false);
    } else if (successCount > 0) {
      toast.warning(`${successCount} rescheduled, ${errorCount} failed`);
    } else {
      toast.error('Failed to reschedule meetings');
    }
  };

  const handleProceedAnyway = () => {
    onProceedAnyway();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Scheduling Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            {conflicts.length} conflicting meeting{conflicts.length > 1 ? 's' : ''} found. 
            You can reschedule them to an available time or proceed anyway.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Conflicting Meetings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Conflicting Meetings</h3>
                {conflicts.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={selectAllMeetings}>
                    Select All
                  </Button>
                )}
              </div>
              
              {conflicts.map((conflict) => {
                const result = rescheduleResults.get(conflict.id);
                return (
                  <Card 
                    key={conflict.id} 
                    className={`transition-all ${
                      selectedMeetings.has(conflict.id) ? 'ring-2 ring-primary' : ''
                    } ${result === 'success' ? 'bg-success/10' : result === 'error' ? 'bg-destructive/10' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`meeting-${conflict.id}`}
                          checked={selectedMeetings.has(conflict.id)}
                          onCheckedChange={() => toggleMeetingSelection(conflict.id)}
                          disabled={isRescheduling || result === 'success'}
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`meeting-${conflict.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {conflict.title_en}
                          </Label>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(conflict.date_time), 'EEE, MMM d')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {format(new Date(conflict.date_time), 'h:mm a')}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {conflict.duration_minutes} min
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Conflicts with: {conflict.conflictingPersonName}
                          </p>
                        </div>
                        {result === 'success' && (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        )}
                        {result === 'error' && (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Suggested Time Slots */}
            {selectedMeetings.size > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Reschedule to...
                </h3>
                
                {isLoadingSuggestions ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="grid gap-2">
                    {suggestions.map((slot, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer transition-all hover:bg-muted ${
                          selectedTimeSlot === slot ? 'ring-2 ring-foreground bg-muted/50' : ''
                        }`}
                        onClick={() => setSelectedTimeSlot(slot)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{slot.label}</span>
                            </div>
                            {selectedTimeSlot === slot && (
                              <CheckCircle2 className="h-4 w-4 text-foreground" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No available time slots found in the next 7 days. 
                    Try proceeding anyway or manually reschedule later.
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="secondary"
            onClick={handleProceedAnyway}
            disabled={isRescheduling}
          >
            Proceed Anyway
          </Button>
          <Button 
            onClick={handleReschedule}
            disabled={selectedMeetings.size === 0 || !selectedTimeSlot || isRescheduling}
          >
            {isRescheduling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reschedule {selectedMeetings.size > 0 ? `(${selectedMeetings.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}