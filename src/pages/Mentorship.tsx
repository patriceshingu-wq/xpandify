import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyMentorships, useDeleteMentorship } from '@/hooks/useMentorship';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users2, 
  Plus, 
  Calendar,
  MessageSquare,
  User,
  ArrowRight,
  Clock,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { MentorshipFormDialog } from '@/components/mentorship/MentorshipFormDialog';
import { MentorshipDetailDialog } from '@/components/mentorship/MentorshipDetailDialog';
import type { Mentorship } from '@/hooks/useMentorship';

export default function MentorshipPage() {
  const { t } = useLanguage();
  const { person, hasAnyRole } = useAuth();
  const { data: mentorships, isLoading } = useMyMentorships();
  const deleteMentorship = useDeleteMentorship();
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState<Mentorship | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingMentorship, setDeletingMentorship] = useState<Mentorship | null>(null);

  const isAdmin = hasAnyRole(['super_admin', 'admin']);

  // Separate mentorships where user is mentor vs mentee
  const asMentor = mentorships?.filter(m => m.mentor_id === person?.id) || [];
  const asMentee = mentorships?.filter(m => m.mentee_id === person?.id) || [];

  const handleDelete = (mentorship: Mentorship) => {
    setDeletingMentorship(mentorship);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deletingMentorship) {
      deleteMentorship.mutate(deletingMentorship.id);
      setDeleteConfirmOpen(false);
      setDeletingMentorship(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFrequencyLabel = (freq: string | null) => {
    switch (freq) {
      case 'weekly': return 'Weekly';
      case 'bi-weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      default: return freq;
    }
  };

  if (isLoading) {
    return (
      <MainLayout title={t('mentorship.title') || 'Mentorship'} subtitle={t('mentorship.subtitle') || 'Grow through intentional relationships'}>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const renderMentorshipCard = (mentorship: Mentorship, isMentor: boolean) => {
    const otherPerson = isMentor ? mentorship.mentee : mentorship.mentor;
    const displayName = otherPerson?.preferred_name || otherPerson?.first_name || 'Unknown';
    const initials = `${otherPerson?.first_name?.[0] || ''}${otherPerson?.last_name?.[0] || ''}`;

    return (
      <Card 
        key={mentorship.id} 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setSelectedMentorship(mentorship)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{displayName}</h3>
                {getStatusBadge(mentorship.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {isMentor ? 'You are mentoring' : 'Your mentor'}
              </p>
              
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {mentorship.focus_area && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {mentorship.focus_area}
                  </span>
                )}
                {mentorship.meeting_frequency && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getFrequencyLabel(mentorship.meeting_frequency)}
                  </span>
                )}
                {mentorship.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Since {format(new Date(mentorship.start_date), 'MMM yyyy')}
                  </span>
                )}
              </div>
            </div>

            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(mentorship);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const totalMentorships = (mentorships?.length || 0);

  return (
    <MainLayout title={t('mentorship.title') || 'Mentorship'} subtitle={t('mentorship.subtitle') || 'Grow through intentional relationships'}>
      <div className="space-y-6">
        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Mentorship
            </Button>
          </div>
        )}

      {totalMentorships === 0 ? (
        <EmptyState
          icon={<Users2 className="h-12 w-12" />}
          title={t('mentorship.noMentorships') || 'No mentorships yet'}
          description={t('mentorship.noMentorshipsDesc') || 'Start a mentoring relationship to grow together.'}
          action={
            isAdmin ? {
              label: 'Create Mentorship',
              onClick: () => setFormOpen(true),
            } : undefined
          }
        />
      ) : (
        <Tabs defaultValue="mentoring" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mentoring" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              I'm Mentoring ({asMentor.length})
            </TabsTrigger>
            <TabsTrigger value="mentored" className="gap-2">
              <User className="h-4 w-4" />
              My Mentors ({asMentee.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mentoring" className="space-y-4">
            {asMentor.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                You're not mentoring anyone yet
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {asMentor.map(m => renderMentorshipCard(m, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mentored" className="space-y-4">
            {asMentee.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                You don't have a mentor assigned yet
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {asMentee.map(m => renderMentorshipCard(m, false))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <MentorshipFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <MentorshipDetailDialog
        open={!!selectedMentorship}
        onOpenChange={(open) => !open && setSelectedMentorship(null)}
        mentorship={selectedMentorship}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Mentorship</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mentorship relationship? 
              This will also remove all check-in records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </MainLayout>
  );
}
