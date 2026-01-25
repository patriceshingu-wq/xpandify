import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Plus, User, Target, BookOpen, GripVertical, Trash2, Loader2, Link } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMeeting, useMeetingAgendaItems, useCreateAgendaItem, useUpdateAgendaItem, Meeting, MeetingAgendaItem } from '@/hooks/useMeetings';
import { useMeetingParticipants } from '@/hooks/useMeetingParticipants';
import { usePeople } from '@/hooks/usePeople';
import { useGoals } from '@/hooks/useGoals';
import { useDevelopmentPlans } from '@/hooks/useDevelopmentPlans';
import { getSectionTypeLabel, getSectionTypeColor, AgendaSectionType } from '@/hooks/useMeetingTemplates';
import { AttachGoalDialog } from './AttachGoalDialog';
import { AttachPDPDialog } from './AttachPDPDialog';

interface MeetingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string | null;
}

export function MeetingDetailDialog({ open, onOpenChange, meetingId }: MeetingDetailDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const { person, isAdminOrSuper } = useAuth();
  
  const { data: meeting, isLoading: meetingLoading } = useMeeting(meetingId || undefined);
  const { data: agendaItems, isLoading: agendaLoading } = useMeetingAgendaItems(meetingId || undefined);
  const { data: participants } = useMeetingParticipants(meetingId || undefined);
  const { data: people } = usePeople();
  
  const createAgendaItem = useCreateAgendaItem();
  const updateAgendaItem = useUpdateAgendaItem();

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTopic, setNewItemTopic] = useState('');
  const [newItemSectionType, setNewItemSectionType] = useState<AgendaSectionType>('other');
  const [attachGoalOpen, setAttachGoalOpen] = useState(false);
  const [attachPDPOpen, setAttachPDPOpen] = useState(false);

  const isOrganizer = meeting?.organizer_id === person?.id;
  const isParticipant = participants?.some(p => p.person_id === person?.id);
  const canEdit = isOrganizer || isParticipant || isAdminOrSuper;

  const handleAddAgendaItem = async () => {
    if (!meetingId || !newItemTopic.trim()) return;

    const maxOrder = agendaItems?.reduce((max, item) => Math.max(max, item.order_index || 0), 0) || 0;

    await createAgendaItem.mutateAsync({
      meeting_id: meetingId,
      topic_en: newItemTopic,
      section_type: newItemSectionType as any,
      order_index: maxOrder + 1,
    });

    setNewItemTopic('');
    setNewItemSectionType('other');
    setIsAddingItem(false);
  };

  const handleToggleActionRequired = async (item: MeetingAgendaItem, checked: boolean) => {
    await updateAgendaItem.mutateAsync({
      id: item.id,
      meeting_id: item.meeting_id,
      action_required: checked,
      action_status: checked ? 'open' : null,
    });
  };

  const handleUpdateNotes = async (item: MeetingAgendaItem, notes: string) => {
    await updateAgendaItem.mutateAsync({
      id: item.id,
      meeting_id: item.meeting_id,
      discussion_notes: notes,
    });
  };

  const handleUpdateActionStatus = async (item: MeetingAgendaItem, status: string) => {
    await updateAgendaItem.mutateAsync({
      id: item.id,
      meeting_id: item.meeting_id,
      action_status: status as any,
    });
  };

  const handleUpdateActionOwner = async (item: MeetingAgendaItem, ownerId: string) => {
    await updateAgendaItem.mutateAsync({
      id: item.id,
      meeting_id: item.meeting_id,
      action_owner_id: ownerId || null,
    });
  };

  const groupedItems = agendaItems?.reduce((acc, item) => {
    const section = (item as any).section_type || 'other';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, MeetingAgendaItem[]>) || {};

  if (!meetingId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {meetingLoading ? 'Loading...' : getLocalizedField(meeting, 'title')}
            </DialogTitle>
            {meeting && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{format(new Date(meeting.date_time), 'EEEE, MMMM d, yyyy • HH:mm')}</span>
                <span>{meeting.duration_minutes} min</span>
                {meeting.organizer && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {meeting.organizer.first_name} {meeting.organizer.last_name}
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          <Tabs defaultValue="agenda" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="actions">Action Items</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
            </TabsList>

            <TabsContent value="agenda" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {/* Add item buttons */}
                  {canEdit && (
                    <div className="flex gap-2 mb-4">
                      <Button variant="outline" size="sm" onClick={() => setIsAddingItem(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                      {meeting?.meeting_type === 'one_on_one' && meeting?.person_focus_id && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setAttachGoalOpen(true)}>
                            <Target className="h-4 w-4 mr-1" />
                            Attach Goals
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setAttachPDPOpen(true)}>
                            <BookOpen className="h-4 w-4 mr-1" />
                            Attach PDP Items
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* New item form */}
                  {isAddingItem && (
                    <Card className="border-dashed">
                      <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-4 gap-3">
                          <div className="col-span-3">
                            <Input
                              placeholder="Agenda topic..."
                              value={newItemTopic}
                              onChange={(e) => setNewItemTopic(e.target.value)}
                            />
                          </div>
                          <Select value={newItemSectionType} onValueChange={(v) => setNewItemSectionType(v as AgendaSectionType)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spiritual_life">Spiritual Life</SelectItem>
                              <SelectItem value="personal_family">Personal & Family</SelectItem>
                              <SelectItem value="ministry_updates">Ministry Updates</SelectItem>
                              <SelectItem value="goals_review">Goals Review</SelectItem>
                              <SelectItem value="development_training">Development</SelectItem>
                              <SelectItem value="feedback_coaching">Feedback</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAddAgendaItem} disabled={createAgendaItem.isPending}>
                            {createAgendaItem.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsAddingItem(false)}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Grouped agenda items */}
                  {agendaLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : Object.keys(groupedItems).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No agenda items yet</p>
                  ) : (
                    Object.entries(groupedItems).map(([section, items]) => (
                      <div key={section} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSectionTypeColor(section as AgendaSectionType)}>
                            {getSectionTypeLabel(section as AgendaSectionType, t)}
                          </Badge>
                        </div>
                        {items.map((item) => (
                          <AgendaItemCard
                            key={item.id}
                            item={item}
                            canEdit={canEdit}
                            people={people || []}
                            onUpdateNotes={handleUpdateNotes}
                            onToggleActionRequired={handleToggleActionRequired}
                            onUpdateActionStatus={handleUpdateActionStatus}
                            onUpdateActionOwner={handleUpdateActionOwner}
                            getLocalizedField={getLocalizedField}
                          />
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="actions" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {agendaItems?.filter(item => item.action_required).map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{getLocalizedField(item, 'topic')}</p>
                            {item.action_owner && (
                              <p className="text-sm text-muted-foreground">
                                Assigned to: {item.action_owner.first_name} {item.action_owner.last_name}
                              </p>
                            )}
                            {item.action_due_date && (
                              <p className="text-sm text-muted-foreground">
                                Due: {format(new Date(item.action_due_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                          <Badge variant={item.action_status === 'done' ? 'default' : 'outline'}>
                            {item.action_status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!agendaItems?.some(item => item.action_required) && (
                    <p className="text-center text-muted-foreground py-8">No action items</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="participants" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {participants?.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {p.person?.first_name?.[0]}{p.person?.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {p.person?.preferred_name || p.person?.first_name} {p.person?.last_name}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!participants?.length && (
                    <p className="text-center text-muted-foreground py-8">No participants added</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {meeting?.person_focus_id && (
        <>
          <AttachGoalDialog
            open={attachGoalOpen}
            onOpenChange={setAttachGoalOpen}
            meetingId={meetingId || ''}
            personId={meeting.person_focus_id}
          />
          <AttachPDPDialog
            open={attachPDPOpen}
            onOpenChange={setAttachPDPOpen}
            meetingId={meetingId || ''}
            personId={meeting.person_focus_id}
          />
        </>
      )}
    </>
  );
}

interface AgendaItemCardProps {
  item: MeetingAgendaItem;
  canEdit: boolean;
  people: any[];
  onUpdateNotes: (item: MeetingAgendaItem, notes: string) => void;
  onToggleActionRequired: (item: MeetingAgendaItem, checked: boolean) => void;
  onUpdateActionStatus: (item: MeetingAgendaItem, status: string) => void;
  onUpdateActionOwner: (item: MeetingAgendaItem, ownerId: string) => void;
  getLocalizedField: (obj: any, field: string) => string;
}

function AgendaItemCard({
  item,
  canEdit,
  people,
  onUpdateNotes,
  onToggleActionRequired,
  onUpdateActionStatus,
  onUpdateActionOwner,
  getLocalizedField,
}: AgendaItemCardProps) {
  const [notes, setNotes] = useState(item.discussion_notes || '');
  const [notesTimeout, setNotesTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesTimeout) clearTimeout(notesTimeout);
    const timeout = setTimeout(() => {
      onUpdateNotes(item, value);
    }, 1000);
    setNotesTimeout(timeout);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 cursor-grab" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium">{getLocalizedField(item, 'topic')}</p>
                {(item as any).linked_goal_id && (
                  <Badge variant="outline" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    Goal linked
                  </Badge>
                )}
                {(item as any).linked_pdp_item_id && (
                  <Badge variant="outline" className="text-xs">
                    <BookOpen className="h-3 w-3 mr-1" />
                    PDP linked
                  </Badge>
                )}
              </div>
            </div>

            {canEdit && (
              <>
                <Textarea
                  placeholder="Discussion notes..."
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  className="mt-2 min-h-[60px]"
                />

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`action-${item.id}`}
                      checked={item.action_required || false}
                      onCheckedChange={(checked) => onToggleActionRequired(item, checked as boolean)}
                    />
                    <Label htmlFor={`action-${item.id}`} className="text-sm">
                      Action required
                    </Label>
                  </div>

                  {item.action_required && (
                    <>
                      <Select
                        value={item.action_owner_id || ''}
                        onValueChange={(v) => onUpdateActionOwner(item, v)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {people.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.first_name} {p.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={item.action_status || 'open'}
                        onValueChange={(v) => onUpdateActionStatus(item, v)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
