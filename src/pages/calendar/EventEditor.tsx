import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEvent, useCreateEvent, useUpdateEvent, type CalendarEvent, type EventStatus } from '@/hooks/useEvents';
import { useQuarters } from '@/hooks/useQuarters';
import { usePrograms, type ProgramLanguage } from '@/hooks/usePrograms';
import { useMinistries } from '@/hooks/useMinistries';
import { useActivityCategories } from '@/hooks/useActivityCategories';
import { useCourses } from '@/hooks/useCourses';
import { useLanguage } from '@/contexts/LanguageContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Save, Plus, CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';

export default function EventEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getLocalizedField, t } = useLanguage();
  const isEditing = !!id;

  const { data: existingEvent, isLoading: eventLoading } = useEvent(id);
  const { data: quarters } = useQuarters();
  const { data: programs } = usePrograms();
  const { data: ministries } = useMinistries();
  const { data: categories } = useActivityCategories();
  const { data: courses } = useCourses();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  // Pre-fill date from query param (e.g. when clicking a day cell)
  const initialDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    date: initialDate,
    end_date: initialDate,
    start_time: '',
    end_time: '',
    title_en: '',
    title_fr: '',
    description_en: '',
    description_fr: '',
    location: '',
    is_all_day: false,
    quarter_id: null as string | null,
    program_id: null as string | null,
    ministry_id: null as string | null,
    activity_category_id: null as string | null,
    language: 'Bilingual' as ProgramLanguage,
    status: 'Planned' as EventStatus,
    completion_percentage: 0,
    notes_internal: '',
    related_course_id: null as string | null,
    recurrence_pattern: null as string | null,
  });

  useEffect(() => {
    if (existingEvent) {
      setFormData({
        date: existingEvent.date,
        end_date: (existingEvent as any).end_date || existingEvent.date,
        start_time: existingEvent.start_time || '',
        end_time: existingEvent.end_time || '',
        title_en: existingEvent.title_en,
        title_fr: existingEvent.title_fr || '',
        description_en: existingEvent.description_en || '',
        description_fr: existingEvent.description_fr || '',
        location: existingEvent.location || '',
        is_all_day: existingEvent.is_all_day,
        quarter_id: existingEvent.quarter_id,
        program_id: existingEvent.program_id,
        ministry_id: existingEvent.ministry_id,
        activity_category_id: existingEvent.activity_category_id,
        language: existingEvent.language,
        status: existingEvent.status,
        completion_percentage: existingEvent.completion_percentage,
        notes_internal: existingEvent.notes_internal || '',
        related_course_id: existingEvent.related_course_id,
        recurrence_pattern: existingEvent.recurrence_pattern || null,
      });
    }
  }, [existingEvent]);

  const timeError = !formData.is_all_day && formData.start_time && formData.end_time && formData.end_time <= formData.start_time
    ? 'End time must be after start time'
    : '';

  const dateError = formData.end_date && formData.end_date < formData.date
    ? 'End date must be on or after start date'
    : '';

  const handleSubmit = async (e: React.FormEvent, saveAndNew = false) => {
    e.preventDefault();
    if (timeError || dateError) return;

    const eventData = {
      ...formData,
      end_date: formData.end_date || formData.date,
      start_time: formData.is_all_day ? null : formData.start_time || null,
      end_time: formData.is_all_day ? null : formData.end_time || null,
    };

    if (isEditing) {
      await updateEvent.mutateAsync({ id, ...eventData });
      navigate(`/calendar/events/${id}`);
    } else {
      const result = await createEvent.mutateAsync(eventData);
      if (saveAndNew) {
        setFormData({
          ...formData,
          title_en: '',
          title_fr: '',
          description_en: '',
          description_fr: '',
          notes_internal: '',
        });
      } else {
        navigate(`/calendar/events/${result.id}`);
      }
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  if (isEditing && eventLoading) {
    return (
      <MainLayout>
        <Skeleton className="h-[600px]" />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title={isEditing ? t('calendar.editEvent') || 'Edit Event' : t('calendar.newEvent') || 'New Event'}
            subtitle={isEditing ? getLocalizedField(existingEvent, 'title') : t('calendar.createEventDescription') || 'Create a new event'}
          />
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('calendar.basicInfo') || 'Basic Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title_en">{t('calendar.titleEnglish') || 'Title (English)'} *</Label>
                  <Input
                    id="title_en"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title_fr">{t('calendar.titleFrench') || 'Title (French)'}</Label>
                  <Input
                    id="title_fr"
                    value={formData.title_fr}
                    onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t('calendar.startDate') || 'Start Date'} *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(parse(formData.date, 'yyyy-MM-dd', new Date()), 'MM/dd/yyyy') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date ? parse(formData.date, 'yyyy-MM-dd', new Date()) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const newDate = format(date, 'yyyy-MM-dd');
                              setFormData({
                                ...formData,
                                date: newDate,
                                end_date: formData.end_date < newDate ? newDate : formData.end_date,
                              });
                            }
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('calendar.endDate') || 'End Date'} *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.end_date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(parse(formData.end_date, 'yyyy-MM-dd', new Date()), 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.end_date ? parse(formData.end_date, 'yyyy-MM-dd', new Date()) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData({ ...formData, end_date: format(date, 'yyyy-MM-dd') });
                            }
                          }}
                          disabled={(date) => date < parse(formData.date, 'yyyy-MM-dd', new Date())}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    {dateError && <p className="text-sm text-destructive">{dateError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">{t('calendar.language') || 'Language'}</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(v: ProgramLanguage) => setFormData({ ...formData, language: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EN">English</SelectItem>
                        <SelectItem value="FR">Français</SelectItem>
                        <SelectItem value="Bilingual">Bilingual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_all_day"
                      checked={formData.is_all_day}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_all_day: checked })}
                    />
                    <Label htmlFor="is_all_day">{t('calendar.allDay') || 'All Day'}</Label>
                  </div>
                </div>

                {!formData.is_all_day && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">{t('calendar.startTime') || 'Start Time'}</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">{t('calendar.endTime') || 'End Time'}</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        min={formData.start_time || undefined}
                      />
                      {timeError && <p className="text-sm text-destructive">{timeError}</p>}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="location">{t('calendar.location') || 'Location'}</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('calendar.status') || 'Status'}</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: EventStatus) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planned">{t('calendar.planned') || 'Planned'}</SelectItem>
                        <SelectItem value="Confirmed">{t('calendar.confirmed') || 'Confirmed'}</SelectItem>
                        <SelectItem value="Completed">{t('calendar.completed') || 'Completed'}</SelectItem>
                        <SelectItem value="Canceled">{t('calendar.canceled') || 'Canceled'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completion">{t('calendar.completionPercentage') || 'Completion %'}</Label>
                    <Input
                      id="completion"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.completion_percentage}
                      onChange={(e) => setFormData({ ...formData, completion_percentage: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization */}
            <Card>
              <CardHeader>
                <CardTitle>{t('calendar.organization') || 'Organization'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ministry_id">{t('calendar.ministry') || 'Ministry'}</Label>
                  <Select
                    value={formData.ministry_id || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, ministry_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('calendar.selectMinistry') || 'Select ministry'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.none') || 'None'}</SelectItem>
                      {ministries?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{getLocalizedField(m, 'name')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quarter_id">{t('calendar.quarter') || 'Quarter'}</Label>
                  <Select
                    value={formData.quarter_id || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, quarter_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('calendar.selectQuarter') || 'Select quarter'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.none') || 'None'}</SelectItem>
                      {quarters?.map((q) => (
                        <SelectItem key={q.id} value={q.id}>Q{q.quarter_number} {q.year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program_id">{t('calendar.program') || 'Program'}</Label>
                  <Select
                    value={formData.program_id || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, program_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('calendar.selectProgram') || 'Select program'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.none') || 'None'}</SelectItem>
                      {programs?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.code} - {getLocalizedField(p, 'name')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">{t('calendar.category') || 'Activity Category'}</Label>
                  <Select
                    value={formData.activity_category_id || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, activity_category_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('calendar.selectCategory') || 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.none') || 'None'}</SelectItem>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{getLocalizedField(c, 'name')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course_id">{t('calendar.relatedCourse') || 'Related Course'}</Label>
                  <Select
                    value={formData.related_course_id || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, related_course_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('calendar.selectCourse') || 'Select course'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.none') || 'None'}</SelectItem>
                      {courses?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{getLocalizedField(c, 'title')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Descriptions */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t('calendar.descriptions') || 'Descriptions'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="description_en">{t('calendar.descriptionEnglish') || 'Description (English)'}</Label>
                    <Textarea
                      id="description_en"
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_fr">{t('calendar.descriptionFrench') || 'Description (French)'}</Label>
                    <Textarea
                      id="description_fr"
                      value={formData.description_fr}
                      onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes_internal">{t('calendar.internalNotes') || 'Internal Notes'}</Label>
                  <Textarea
                    id="notes_internal"
                    value={formData.notes_internal}
                    onChange={(e) => setFormData({ ...formData, notes_internal: e.target.value })}
                    rows={3}
                    placeholder={t('calendar.internalNotesPlaceholder') || 'Notes visible only to admins and ministry leaders'}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              {t('common.cancel')}
            </Button>
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={(e) => handleSubmit(e, true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('calendar.saveAndNew') || 'Save & Add Another'}
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? t('common.saving') || 'Saving...' : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
