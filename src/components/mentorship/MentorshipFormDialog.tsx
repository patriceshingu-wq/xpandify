import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePeople } from '@/hooks/usePeople';
import { useCreateMentorship } from '@/hooks/useMentorship';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  mentor_id: z.string().min(1, 'Mentor is required'),
  mentee_id: z.string().min(1, 'Mentee is required'),
  focus_area: z.string().optional(),
  meeting_frequency: z.enum(['weekly', 'bi-weekly', 'monthly']),
  notes: z.string().optional(),
}).refine((data) => data.mentor_id !== data.mentee_id, {
  message: "Mentor and mentee cannot be the same person",
  path: ["mentee_id"],
});

type FormData = z.infer<typeof formSchema>;

interface MentorshipFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MentorshipFormDialog({ open, onOpenChange }: MentorshipFormDialogProps) {
  const { data: people } = usePeople();
  const createMentorship = useCreateMentorship();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mentor_id: '',
      mentee_id: '',
      focus_area: '',
      meeting_frequency: 'bi-weekly',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        mentor_id: '',
        mentee_id: '',
        focus_area: '',
        meeting_frequency: 'bi-weekly',
        notes: '',
      });
    }
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    try {
      await createMentorship.mutateAsync({
        mentor_id: data.mentor_id,
        mentee_id: data.mentee_id,
        focus_area: data.focus_area || null,
        meeting_frequency: data.meeting_frequency,
        notes: data.notes || null,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const getPersonName = (person: { first_name: string; last_name: string; preferred_name?: string | null }) => {
    return person.preferred_name || `${person.first_name} ${person.last_name}`;
  };

  // Filter active people only
  const activePeople = people?.filter(p => p.status === 'active') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Mentorship</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mentor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mentor *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mentor..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activePeople.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {getPersonName(person)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mentee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mentee *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mentee..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activePeople
                        .filter(p => p.id !== form.watch('mentor_id'))
                        .map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {getPersonName(person)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="focus_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Focus Area</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Leadership, Spiritual Growth..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meeting_frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMentorship.isPending}>
                Create Mentorship
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
