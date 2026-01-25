import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TeamMemberStats } from '@/hooks/useTeamMembers';
import {
  Calendar,
  Target,
  GraduationCap,
  MessageSquare,
  CheckSquare,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Heart,
  TrendingUp,
  User,
  Star,
  Plus,
} from 'lucide-react';
import { CourseAssignmentDialog } from '@/components/development/CourseAssignmentDialog';
import { FeedbackFormDialog } from '@/components/feedback/FeedbackFormDialog';
import { format, formatDistanceToNow } from 'date-fns';

interface TeamMemberDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMemberStats | null;
  onScheduleMeeting: () => void;
}

export function TeamMemberDetailDialog({
  open,
  onOpenChange,
  member,
  onScheduleMeeting,
}: TeamMemberDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCourseAssignment, setShowCourseAssignment] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  if (!member) return null;

  const initials = `${member.member.first_name[0]}${member.member.last_name[0]}`.toUpperCase();
  const displayName = member.member.preferred_name || `${member.member.first_name} ${member.member.last_name}`;
  const goalProgress = member.goals.total > 0 ? Math.round((member.goals.completed / member.goals.total) * 100) : 0;
  const courseProgress = member.courses.assigned > 0 ? Math.round((member.courses.completed / member.courses.assigned) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogHeader className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-2xl font-serif">{displayName}</DialogTitle>
                  <Badge variant="secondary">{member.member.person_type || 'Staff'}</Badge>
                </div>
                <DialogDescription className="flex flex-wrap items-center gap-4 text-sm">
                  {member.member.email && (
                    <a href={`mailto:${member.member.email}`} className="flex items-center gap-1 hover:text-primary">
                      <Mail className="h-3.5 w-3.5" />
                      {member.member.email}
                    </a>
                  )}
                  {member.member.phone && (
                    <a href={`tel:${member.member.phone}`} className="flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3.5 w-3.5" />
                      {member.member.phone}
                    </a>
                  )}
                  {member.member.campus && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {member.member.campus}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
            </div>
            <Button onClick={onScheduleMeeting} className="shrink-0">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule 1:1
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6 border-b">
            <TabsList className="h-12 w-full justify-start gap-4 bg-transparent p-0">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Performance
              </TabsTrigger>
              <TabsTrigger value="development" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Development
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Profile
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 text-primary/70" />
                      <p className="text-2xl font-bold">{goalProgress}%</p>
                      <p className="text-xs text-muted-foreground">Goal Completion</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <CheckSquare className="h-8 w-8 mx-auto mb-2 text-warning/70" />
                      <p className="text-2xl font-bold">{member.actionItems.open}</p>
                      <p className="text-xs text-muted-foreground">Open Actions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <GraduationCap className="h-8 w-8 mx-auto mb-2 text-info/70" />
                      <p className="text-2xl font-bold">{courseProgress}%</p>
                      <p className="text-xs text-muted-foreground">Courses Complete</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-success/70" />
                      <p className="text-2xl font-bold">{member.feedback.received}</p>
                      <p className="text-xs text-muted-foreground">Feedback Items</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Meeting Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Meeting Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Next 1:1</span>
                    {member.meetings.nextMeetingDate ? (
                        <span className="text-sm font-medium">
                          {format(new Date(member.meetings.nextMeetingDate), "EEE, MMM d 'at' h:mm a")}
                        </span>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Not scheduled</Badge>
                      )}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Meeting</span>
                      {member.meetings.lastMeetingDate ? (
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(member.meetings.lastMeetingDate), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No previous meetings</span>
                      )}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Meetings</span>
                      <span className="text-sm font-medium">{member.meetings.total}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="mt-0 space-y-6">
                {/* Goals Progress */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Goals ({member.goals.total})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Progress</span>
                        <span className="font-medium">{goalProgress}%</span>
                      </div>
                      <Progress value={goalProgress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-semibold text-success">{member.goals.completed}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-semibold text-info">{member.goals.inProgress}</p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-semibold text-muted-foreground">{member.goals.notStarted}</p>
                        <p className="text-xs text-muted-foreground">Not Started</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" />
                      Action Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 rounded-lg bg-warning/10">
                        <p className="text-2xl font-bold text-warning">{member.actionItems.open}</p>
                        <p className="text-sm text-muted-foreground">Open</p>
                      </div>
                      <div className="p-4 rounded-lg bg-success/10">
                        <p className="text-2xl font-bold text-success">{member.actionItems.completed}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="development" className="mt-0 space-y-6">
                {/* Courses */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Training & Courses
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => setShowCourseAssignment(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Assign Course
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Course Completion</span>
                        <span className="font-medium">{courseProgress}%</span>
                      </div>
                      <Progress value={courseProgress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-semibold">{member.courses.assigned}</p>
                        <p className="text-xs text-muted-foreground">Assigned</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-semibold text-info">{member.courses.inProgress}</p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-semibold text-success">{member.courses.completed}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* PDPs */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Personal Development Plans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 rounded-lg bg-primary/10">
                        <p className="text-2xl font-bold text-primary">{member.pdps.active}</p>
                        <p className="text-sm text-muted-foreground">Active Plans</p>
                      </div>
                      <div className="p-4 rounded-lg bg-success/10">
                        <p className="text-2xl font-bold text-success">{member.pdps.completed}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feedback */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Feedback Received
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => setShowFeedbackForm(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Give Feedback
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-semibold">{member.feedback.received}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="p-3 rounded-lg bg-success/10">
                        <p className="text-lg font-semibold text-success">{member.feedback.encouragement}</p>
                        <p className="text-xs text-muted-foreground">Encouragement</p>
                      </div>
                      <div className="p-3 rounded-lg bg-info/10">
                        <p className="text-lg font-semibold text-info">{member.feedback.coaching}</p>
                        <p className="text-xs text-muted-foreground">Coaching</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile" className="mt-0 space-y-6">
                {/* Personal Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                        <p className="font-medium">{member.member.first_name} {member.member.last_name}</p>
                      </div>
                      {member.member.preferred_name && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Preferred Name</p>
                          <p className="font-medium">{member.member.preferred_name}</p>
                        </div>
                      )}
                      {member.member.start_date && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                          <p className="font-medium">{format(new Date(member.member.start_date), 'MMMM d, yyyy')}</p>
                        </div>
                      )}
                      {member.member.campus && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Campus</p>
                          <p className="font-medium">{member.member.campus}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Calling & Growth */}
                {(member.member.calling_description || member.member.strengths || member.member.growth_areas) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Ministry & Growth
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {member.member.calling_description && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Calling Description</p>
                          <p className="text-sm">{member.member.calling_description}</p>
                        </div>
                      )}
                      {member.member.strengths && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Star className="h-3 w-3" /> Strengths
                          </p>
                          <p className="text-sm">{member.member.strengths}</p>
                        </div>
                      )}
                      {member.member.growth_areas && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Growth Areas
                          </p>
                          <p className="text-sm">{member.member.growth_areas}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Course Assignment Dialog */}
        <CourseAssignmentDialog
          open={showCourseAssignment}
          onOpenChange={setShowCourseAssignment}
          defaultPersonId={member.member.id}
        />

        {/* Feedback Form Dialog */}
        <FeedbackFormDialog
          open={showFeedbackForm}
          onOpenChange={setShowFeedbackForm}
          defaultPersonId={member.member.id}
        />
      </DialogContent>
    </Dialog>
  );
}
