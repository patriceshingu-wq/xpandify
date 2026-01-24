import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { useLanguage } from '@/contexts/LanguageContext';
import { Course, useCreateCourse, useUpdateCourse } from '@/hooks/useCourses';

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
}

interface CourseFormData {
  code: string;
  title_en: string;
  title_fr: string;
  description_en: string;
  description_fr: string;
  category: string;
  delivery_type: string;
  estimated_duration_hours: number;
  is_active: boolean;
}

export function CourseFormDialog({ open, onOpenChange, course }: CourseFormDialogProps) {
  const { t, language } = useLanguage();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  const { register, handleSubmit, reset, setValue, watch } = useForm<CourseFormData>({
    defaultValues: {
      code: '',
      title_en: '',
      title_fr: '',
      description_en: '',
      description_fr: '',
      category: 'other',
      delivery_type: 'in_person',
      estimated_duration_hours: 1,
      is_active: true,
    },
  });

  useEffect(() => {
    if (course) {
      reset({
        code: course.code || '',
        title_en: course.title_en,
        title_fr: course.title_fr || '',
        description_en: course.description_en || '',
        description_fr: course.description_fr || '',
        category: course.category || 'other',
        delivery_type: course.delivery_type || 'in_person',
        estimated_duration_hours: course.estimated_duration_hours || 1,
        is_active: course.is_active ?? true,
      });
    } else {
      reset({
        code: '',
        title_en: '',
        title_fr: '',
        description_en: '',
        description_fr: '',
        category: 'other',
        delivery_type: 'in_person',
        estimated_duration_hours: 1,
        is_active: true,
      });
    }
  }, [course, reset]);

  const onSubmit = async (data: CourseFormData) => {
    const courseData = {
      code: data.code || null,
      title_en: data.title_en,
      title_fr: data.title_fr || null,
      description_en: data.description_en || null,
      description_fr: data.description_fr || null,
      category: data.category as any,
      delivery_type: data.delivery_type as any,
      estimated_duration_hours: data.estimated_duration_hours,
      is_active: data.is_active,
    };

    if (course) {
      await updateCourse.mutateAsync({ id: course.id, ...courseData });
    } else {
      await createCourse.mutateAsync(courseData);
    }
    onOpenChange(false);
  };

  const isLoading = createCourse.isPending || updateCourse.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course ? t('courses.editCourse') : t('courses.addCourse')}</DialogTitle>
          <DialogDescription>
            {course ? t('courses.editCourseDescription') : t('courses.addCourseDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t('courses.code')}</Label>
              <Input id="code" {...register('code')} placeholder="TRN-101" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_duration_hours">{t('courses.duration')}</Label>
              <Input
                id="estimated_duration_hours"
                type="number"
                min="1"
                {...register('estimated_duration_hours', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_en">{t('courses.titleEn')}</Label>
            <Input id="title_en" {...register('title_en', { required: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_fr">{t('courses.titleFr')}</Label>
            <Input id="title_fr" {...register('title_fr')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_en">{t('courses.descriptionEn')}</Label>
            <Textarea id="description_en" {...register('description_en')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_fr">{t('courses.descriptionFr')}</Label>
            <Textarea id="description_fr" {...register('description_fr')} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('common.category')}</Label>
              <Select value={watch('category')} onValueChange={(v) => setValue('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theology">{t('courses.theology')}</SelectItem>
                  <SelectItem value="leadership">{t('courses.leadership')}</SelectItem>
                  <SelectItem value="ministry_skills">{t('courses.ministrySkills')}</SelectItem>
                  <SelectItem value="pastoral_skills">{t('courses.pastoralSkills')}</SelectItem>
                  <SelectItem value="character">{t('courses.character')}</SelectItem>
                  <SelectItem value="other">{t('common.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('courses.deliveryType')}</Label>
              <Select value={watch('delivery_type')} onValueChange={(v) => setValue('delivery_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">{t('courses.inPerson')}</SelectItem>
                  <SelectItem value="online">{t('courses.online')}</SelectItem>
                  <SelectItem value="hybrid">{t('courses.hybrid')}</SelectItem>
                  <SelectItem value="reading_plan">{t('courses.readingPlan')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="is_active">{t('courses.isActive')}</Label>
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
