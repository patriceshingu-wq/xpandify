import { useState } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReviewMeetingHistory, GroupedAgendaItems, MeetingWithAgenda, MeetingAgendaItemWithMeeting, ActionItemSummary } from '@/hooks/useReviewMeetingHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, 
  Heart, 
  Home, 
  Briefcase, 
  Target, 
  GraduationCap, 
  MessageCircle,
  FileText,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type AgendaSectionType = Database['public']['Enums']['agenda_section_type'];

interface MeetingHistoryPanelProps {
  personId: string;
  startDate: string;
  endDate: string;
}

const sectionIcons: Record<string, React.ReactNode> = {
  spiritual_life: <Heart className="h-4 w-4" />,
  personal_family: <Home className="h-4 w-4" />,
  ministry_updates: <Briefcase className="h-4 w-4" />,
  goals_review: <Target className="h-4 w-4" />,
  development_training: <GraduationCap className="h-4 w-4" />,
  feedback_coaching: <MessageCircle className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

const sectionColors: Record<string, string> = {
  spiritual_life: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  personal_family: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  ministry_updates: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  goals_review: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  development_training: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  feedback_coaching: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const actionStatusConfig = {
  open: { icon: <Clock className="h-3 w-3" />, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  in_progress: { icon: <AlertCircle className="h-3 w-3" />, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  done: { icon: <CheckCircle2 className="h-3 w-3" />, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

export function MeetingHistoryPanel({ personId, startDate, endDate }: MeetingHistoryPanelProps) {
  const { getLocalizedField } = useLanguage();
  const { data, isLoading } = useReviewMeetingHistory(personId, startDate, endDate);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithAgenda | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Meeting History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  const meetings = data?.meetings || [];
  const groupedItems = data?.groupedItems || [];
  const actionItems = data?.actionItems || { total: 0, open: 0, in_progress: 0, done: 0, items: [] };

  if (meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Meeting History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No 1:1 meetings found in this review period
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Meeting History
            <Badge variant="secondary" className="ml-2">
              {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="by-section" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="by-section">By Section</TabsTrigger>
              <TabsTrigger value="by-meeting">By Meeting</TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-1">
                <ListTodo className="h-3 w-3" />
                Actions
                {actionItems.total > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {actionItems.open + actionItems.in_progress}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Grouped by Section Type */}
            <TabsContent value="by-section" className="mt-0">
              <ScrollArea className="h-[400px] pr-4">
                {groupedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No discussion notes recorded in meetings
                  </p>
                ) : (
                  <Accordion type="multiple" className="space-y-2">
                    {groupedItems.map((group) => (
                      <AccordionItem
                        key={group.section_type}
                        value={group.section_type}
                        className="border rounded-lg px-3"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${sectionColors[group.section_type]}`}>
                              {sectionIcons[group.section_type]}
                            </div>
                            <span className="font-medium">{group.label}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {group.items.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                          <div className="space-y-3">
                            {group.items.map((item) => (
                              <AgendaItemCard key={item.id} item={item} />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </ScrollArea>
            </TabsContent>

            {/* By Meeting Timeline */}
            <TabsContent value="by-meeting" className="mt-0">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">
                            {getLocalizedField(meeting, 'title')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(meeting.date_time), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                      {meeting.agenda_items.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Array.from(new Set(meeting.agenda_items.map(i => i.section_type))).map((type) => {
                            if (!type) return null;
                            const sectionType = type as AgendaSectionType;
                            return (
                              <span
                                key={sectionType}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${sectionColors[sectionType]}`}
                              >
                                {sectionIcons[sectionType]}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Action Items Tab */}
            <TabsContent value="actions" className="mt-0">
              <ScrollArea className="h-[400px] pr-4">
                {/* Summary Stats */}
                {actionItems.total > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-center">
                      <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{actionItems.open}</div>
                      <div className="text-xs text-yellow-600 dark:text-yellow-400">Open</div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                      <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{actionItems.in_progress}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">In Progress</div>
                    </div>
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                      <div className="text-lg font-semibold text-green-700 dark:text-green-300">{actionItems.done}</div>
                      <div className="text-xs text-green-600 dark:text-green-400">Done</div>
                    </div>
                  </div>
                )}

                {actionItems.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No action items from meetings in this period
                  </p>
                ) : (
                  <div className="space-y-3">
                    {actionItems.items.map((item) => (
                      <ActionItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Meeting Detail Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMeeting && getLocalizedField(selectedMeeting, 'title')}
            </DialogTitle>
            {selectedMeeting && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(selectedMeeting.date_time), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            )}
          </DialogHeader>
          {selectedMeeting && (
            <div className="space-y-4">
              {selectedMeeting.agenda_items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No agenda items recorded</p>
              ) : (
                selectedMeeting.agenda_items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {item.section_type && (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${sectionColors[item.section_type]}`}>
                          {sectionIcons[item.section_type]}
                          {item.section_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm">{getLocalizedField(item, 'topic')}</p>
                    {item.discussion_notes && (
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                        {item.discussion_notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AgendaItemCard({ item }: { item: MeetingAgendaItemWithMeeting }) {
  const { getLocalizedField } = useLanguage();

  return (
    <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-medium text-sm">{getLocalizedField(item, 'topic')}</p>
        <span className="text-xs text-muted-foreground shrink-0">
          {format(new Date(item.meeting.date_time), 'MMM d, yyyy')}
        </span>
      </div>
      {item.discussion_notes && (
        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">
          {item.discussion_notes}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {item.linked_goal_id && (
          <Badge variant="outline" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            Linked to goal
          </Badge>
        )}
        {item.action_required && item.action_status && (
          <Badge className={`text-xs ${actionStatusConfig[item.action_status]?.className}`}>
            {actionStatusConfig[item.action_status]?.icon}
            <span className="ml-1">{item.action_status.replace(/_/g, ' ')}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}

function ActionItemCard({ item }: { item: MeetingAgendaItemWithMeeting }) {
  const { getLocalizedField } = useLanguage();
  const status = item.action_status || 'open';
  const statusConfig = actionStatusConfig[status];

  return (
    <div className={`p-3 rounded-lg border ${status === 'done' ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-card'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`text-xs shrink-0 ${statusConfig.className}`}>
              {statusConfig.icon}
              <span className="ml-1 capitalize">{status.replace(/_/g, ' ')}</span>
            </Badge>
            {item.section_type && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${sectionColors[item.section_type]}`}>
                {sectionIcons[item.section_type]}
              </span>
            )}
          </div>
          <p className={`font-medium text-sm ${status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
            {getLocalizedField(item, 'topic')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            From: {format(new Date(item.meeting.date_time), 'MMM d, yyyy')} • {getLocalizedField(item.meeting, 'title')}
          </p>
        </div>
      </div>
      {item.action_due_date && (
        <div className="mt-2">
          <Badge variant="outline" className={`text-xs ${new Date(item.action_due_date) < new Date() && status !== 'done' ? 'border-red-300 text-red-600 dark:border-red-700 dark:text-red-400' : ''}`}>
            Due: {format(new Date(item.action_due_date), 'MMM d, yyyy')}
          </Badge>
        </div>
      )}
    </div>
  );
}
