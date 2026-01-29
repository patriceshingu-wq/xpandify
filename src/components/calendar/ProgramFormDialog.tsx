import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateProgram, useUpdateProgram, type Program, type ProgramLanguage } from '@/hooks/usePrograms';
import type { Quarter } from '@/hooks/useQuarters';
import type { Ministry } from '@/hooks/useMinistries';

interface ProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: Program | null;
  quarters: Quarter[];
  ministries: Ministry[];
}

export default function ProgramFormDialog({ open, onOpenChange, program, quarters, ministries }: ProgramFormDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const [formData, setFormData] = useState({
    code: '',
    name_en: '',
    name_fr: '',
    theme_en: '',
    theme_fr: '',
    primary_language: 'Bilingual' as ProgramLanguage,
    description_en: '',
    description_fr: '',
    quarter_id: null as string | null,
    primary_ministry_id: null as string | null,
  });

  useEffect(() => {
    if (program) {
      setFormData({
        code: program.code,
        name_en: program.name_en,
        name_fr: program.name_fr || '',
        theme_en: program.theme_en || '',
        theme_fr: program.theme_fr || '',
        primary_language: program.primary_language,
        description_en: program.description_en || '',
        description_fr: program.description_fr || '',
        quarter_id: program.quarter_id,
        primary_ministry_id: program.primary_ministry_id,
      });
    } else {
      setFormData({
        code: '',
        name_en: '',
        name_fr: '',
        theme_en: '',
        theme_fr: '',
        primary_language: 'Bilingual',
        description_en: '',
        description_fr: '',
        quarter_id: null,
        primary_ministry_id: null,
      });
    }
  }, [program, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (program) {
      await updateProgram.mutateAsync({ id: program.id, ...formData });
    } else {
      await createProgram.mutateAsync(formData);
    }

    onOpenChange(false);
  };

  const isPending = createProgram.isPending || updateProgram.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {program ? t('calendar.editProgram') || 'Edit Program' : t('calendar.addProgram') || 'Add Program'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t('calendar.programCode') || 'Code'}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., AFJ, 1SPJ"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_language">{t('calendar.primaryLanguage') || 'Primary Language'}</Label>
              <Select
                value={formData.primary_language}
                onValueChange={(value: ProgramLanguage) => setFormData({ ...formData, primary_language: value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_en">{t('calendar.nameEnglish') || 'Name (English)'}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_fr">{t('calendar.nameFrench') || 'Name (French)'}</Label>
              <Input
                id="name_fr"
                value={formData.name_fr}
                onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme_en">{t('calendar.themeEnglish') || 'Theme (English)'}</Label>
              <Input
                id="theme_en"
                value={formData.theme_en}
                onChange={(e) => setFormData({ ...formData, theme_en: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme_fr">{t('calendar.themeFrench') || 'Theme (French)'}</Label>
              <Input
                id="theme_fr"
                value={formData.theme_fr}
                onChange={(e) => setFormData({ ...formData, theme_fr: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quarter_id">{t('calendar.quarter') || 'Quarter'}</Label>
              <Select
                value={formData.quarter_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, quarter_id: value === 'none' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('calendar.selectQuarter') || 'Select quarter'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.none') || 'None'}</SelectItem>
                  {quarters.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      Q{q.quarter_number} {q.year} - {q.theme_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ministry_id">{t('calendar.ministry') || 'Ministry'}</Label>
              <Select
                value={formData.primary_ministry_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, primary_ministry_id: value === 'none' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('calendar.selectMinistry') || 'Select ministry'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.none') || 'None'}</SelectItem>
                  {ministries.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {getLocalizedField(m, 'name')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_en">{t('calendar.descriptionEnglish') || 'Description (English)'}</Label>
            <Textarea
              id="description_en"
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_fr">{t('calendar.descriptionFrench') || 'Description (French)'}</Label>
            <Textarea
              id="description_fr"
              value={formData.description_fr}
              onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') || 'Saving...' : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
