import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useMentorshipCheckIns, 
  useCreateCheckIn,
  type Mentorship,
  type MentorshipCheckIn 
} from '@/hooks/useMentorship';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Plus,
  Heart,
  Smile,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';

interface MentorshipDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorship: Mentorship | null;
}

export function MentorshipDetailDialog({ open, onOpenChange, mentorship }: MentorshipDetailDialogProps) {
  const { t } = useLanguage();
  const { person } = useAuth();
  const { data: checkIns, isLoading } = useMentorshipCheckIns(mentorship?.id);
  const createCheckIn = useCreateCheckIn();

  const [showAddCheckIn, setShowAddCheckIn] = useState(false);
  const [newCheckIn, setNewCheckIn] = useState({
    discussion_notes: '',
    prayer_points: '',
    next_steps: '',
    mentee_mood: '',
  });

  if (!mentorship) return null;

  const isMentor = mentorship.mentor_id === person?.id;
  const otherPerson = isMentor ? mentorship.mentee : mentorship.mentor;
  const displayName = otherPerson?.preferred_name || otherPerson?.first_name || 'Unknown';
  const initials = `${otherPerson?.first_name?.[0] || ''}${otherPerson?.last_name?.[0] || ''}`;

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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMoodIcon = (mood: string | null) => {
    switch (mood) {
      case 'struggling': return <Heart className="h-4 w-4 text-red-500" />;
      case 'okay': return <Smile className="h-4 w-4 text-yellow-500" />;
      case 'growing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'thriving': return <Sparkles className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const handleAddCheckIn = async () => {
    if (!person) return;
    
    await createCheckIn.mutateAsync({
      mentorship_id: mentorship.id,
      check_in_date: new Date().toISOString().split('T')[0],
      discussion_notes: newCheckIn.discussion_notes || null,
      prayer_points: newCheckIn.prayer_points || null,
      next_steps: newCheckIn.next_steps || null,
      mentee_mood: newCheckIn.mentee_mood || null,
      created_by_id: person.id,
    });

    setNewCheckIn({
      discussion_notes: '',
      prayer_points: '',
      next_steps: '',
      mentee_mood: '',
    });
    setShowAddCheckIn(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mentorship Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{displayName}</h2>
              <p className="text-muted-foreground">
                {isMentor ? 'You are mentoring' : 'Your mentor'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(mentorship.status)}
                {mentorship.focus_area && (
                  <Badge variant="outline">{mentorship.focus_area}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {mentorship.meeting_frequency && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {mentorship.meeting_frequency === 'bi-weekly' ? 'Bi-weekly' : 
                 mentorship.meeting_frequency.charAt(0).toUpperCase() + mentorship.meeting_frequency.slice(1)} meetings
              </span>
            )}
            {mentorship.start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Started {format(new Date(mentorship.start_date), 'MMMM d, yyyy')}
              </span>
            )}
          </div>

          {mentorship.notes && (
            <p className="text-muted-foreground">{mentorship.notes}</p>
          )}

          <Separator />

          {/* Check-ins */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Check-ins
              </h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowAddCheckIn(!showAddCheckIn)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Log Check-in
              </Button>
            </div>

            {/* Add check-in form */}
            {showAddCheckIn && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Discussion Notes</Label>
                    <Textarea
                      placeholder="What did you discuss?"
                      value={newCheckIn.discussion_notes}
                      onChange={(e) => setNewCheckIn(prev => ({ ...prev, discussion_notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prayer Points</Label>
                    <Textarea
                      placeholder="What are you praying about?"
                      value={newCheckIn.prayer_points}
                      onChange={(e) => setNewCheckIn(prev => ({ ...prev, prayer_points: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Steps</Label>
                    <Textarea
                      placeholder="What are the action items?"
                      value={newCheckIn.next_steps}
                      onChange={(e) => setNewCheckIn(prev => ({ ...prev, next_steps: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>How is the mentee doing?</Label>
                    <Select 
                      value={newCheckIn.mentee_mood} 
                      onValueChange={(v) => setNewCheckIn(prev => ({ ...prev, mentee_mood: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mood..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="struggling">Struggling</SelectItem>
                        <SelectItem value="okay">Okay</SelectItem>
                        <SelectItem value="growing">Growing</SelectItem>
                        <SelectItem value="thriving">Thriving</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddCheckIn(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCheckIn} disabled={createCheckIn.isPending}>
                      Save Check-in
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Check-in list */}
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : checkIns && checkIns.length > 0 ? (
              <div className="space-y-3">
                {checkIns.map(checkIn => (
                  <Card key={checkIn.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(checkIn.check_in_date), 'MMMM d, yyyy')}
                          </span>
                          {checkIn.mentee_mood && (
                            <div className="flex items-center gap-1">
                              {getMoodIcon(checkIn.mentee_mood)}
                              <span className="text-sm text-muted-foreground capitalize">
                                {checkIn.mentee_mood}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {checkIn.discussion_notes && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Discussion</p>
                          <p className="text-sm">{checkIn.discussion_notes}</p>
                        </div>
                      )}

                      {checkIn.prayer_points && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Prayer Points</p>
                          <p className="text-sm">{checkIn.prayer_points}</p>
                        </div>
                      )}

                      {checkIn.next_steps && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Next Steps</p>
                          <p className="text-sm">{checkIn.next_steps}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No check-ins recorded yet. Start by logging your first meeting!
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
