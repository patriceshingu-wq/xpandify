import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreatePathway, useUpdatePathway, type Pathway } from '@/hooks/usePathways';
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
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  name_en: z.string().min(2, 'Name is required'),
  name_fr: z.string().optional(),
  description_en: z.string().optional(),
  description_fr: z.string().optional(),
  estimated_duration_weeks: z.coerce.number().min(1).max(104),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface PathwayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathway: Pathway | null;
}

export function PathwayFormDialog({ open, onOpenChange, pathway }: PathwayFormDialogProps) {
  const { t } = useLanguage();
  const createPathway = useCreatePathway();
  const updatePathway = useUpdatePathway();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name_en: '',
      name_fr: '',
      description_en: '',
      description_fr: '',
      estimated_duration_weeks: 12,
      difficulty_level: 'intermediate',
      is_active: true,
    },
  });

  useEffect(() => {
    if (pathway) {
      form.reset({
        code: pathway.code,
        name_en: pathway.name_en,
        name_fr: pathway.name_fr || '',
        description_en: pathway.description_en || '',
        description_fr: pathway.description_fr || '',
        estimated_duration_weeks: pathway.estimated_duration_weeks || 12,
        difficulty_level: (pathway.difficulty_level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
        is_active: pathway.is_active ?? true,
      });
    } else {
      form.reset({
        code: '',
        name_en: '',
        name_fr: '',
        description_en: '',
        description_fr: '',
        estimated_duration_weeks: 12,
        difficulty_level: 'intermediate',
        is_active: true,
      });
    }
  }, [pathway, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (pathway) {
        await updatePathway.mutateAsync({ id: pathway.id, ...data });
      } else {
        await createPathway.mutateAsync({
          code: data.code,
          name_en: data.name_en,
          name_fr: data.name_fr || null,
          description_en: data.description_en || null,
          description_fr: data.description_fr || null,
          estimated_duration_weeks: data.estimated_duration_weeks,
          difficulty_level: data.difficulty_level,
          is_active: data.is_active,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pathway ? 'Edit Pathway' : 'Create Pathway'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., DISC101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (EN) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Pathway name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name_fr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (FR)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du parcours" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (EN)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this learning pathway..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description_fr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (FR)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez ce parcours d'apprentissage..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="estimated_duration_weeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (weeks)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={104} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Make this pathway visible to users
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPathway.isPending || updatePathway.isPending}>
                {pathway ? 'Save Changes' : 'Create Pathway'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
