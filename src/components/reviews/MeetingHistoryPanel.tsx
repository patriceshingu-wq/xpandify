import { useState } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReviewMeetingHistory, GroupedAgendaItems, MeetingWithAgenda, MeetingAgendaItemWithMeeting } from '@/hooks/useReviewMeetingHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, 
  MessageSquare, 
  Heart, 
  Home, 
  Briefcase, 
  Target, 
  GraduationCap, 
  MessageCircle,
  FileText,
  ChevronRight
} from 'lucide-react';

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
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="by-section">By Section</TabsTrigger>
              <TabsTrigger value="by-meeting">By Meeting</TabsTrigger>
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
                          {Array.from(new Set(meeting.agenda_items.map(i => i.section_type))).map((type) => (
                            type && (
                              <span
                                key={type}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${sectionColors[type]}`}
                              >
                                {sectionIcons[type]}
                              </span>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
      {item.linked_goal_id && (
        <Badge variant="outline" className="mt-2 text-xs">
          <Target className="h-3 w-3 mr-1" />
          Linked to goal
        </Badge>
      )}
    </div>
  );
}
