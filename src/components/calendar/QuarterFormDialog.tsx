import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateQuarter, useUpdateQuarter, type Quarter } from '@/hooks/useQuarters';

interface QuarterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quarter?: Quarter | null;
}

export default function QuarterFormDialog({ open, onOpenChange, quarter }: QuarterFormDialogProps) {
  const { t } = useLanguage();
  const createQuarter = useCreateQuarter();
  const updateQuarter = useUpdateQuarter();

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    quarter_number: 1,
    theme_en: '',
    theme_fr: '',
    description_en: '',
    description_fr: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (quarter) {
      setFormData({
        year: quarter.year,
        quarter_number: quarter.quarter_number,
        theme_en: quarter.theme_en,
        theme_fr: quarter.theme_fr || '',
        description_en: quarter.description_en || '',
        description_fr: quarter.description_fr || '',
        start_date: quarter.start_date,
        end_date: quarter.end_date,
      });
    } else {
      setFormData({
        year: new Date().getFullYear(),
        quarter_number: 1,
        theme_en: '',
        theme_fr: '',
        description_en: '',
        description_fr: '',
        start_date: '',
        end_date: '',
      });
    }
  }, [quarter, open]);

  const dateError = formData.start_date && formData.end_date && formData.end_date < formData.start_date
    ? 'End date must be on or after start date'
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dateError) return;

    if (quarter) {
      await updateQuarter.mutateAsync({ id: quarter.id, ...formData });
    } else {
      await createQuarter.mutateAsync(formData);
    }

    onOpenChange(false);
  };

  const isPending = createQuarter.isPending || updateQuarter.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quarter ? t('calendar.editQuarter') || 'Edit Quarter' : t('calendar.addQuarter') || 'Add Quarter'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">{t('calendar.year') || 'Year'}</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter_number">{t('calendar.quarterNumber') || 'Quarter'}</Label>
              <select
                id="quarter_number"
                className="w-full h-10 px-3 border border-input rounded-md bg-background"
                value={formData.quarter_number}
                onChange={(e) => setFormData({ ...formData, quarter_number: parseInt(e.target.value) })}
              >
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">{t('calendar.startDate') || 'Start Date'}</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">{t('calendar.endDate') || 'End Date'}</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme_en">{t('calendar.themeEnglish') || 'Theme (English)'}</Label>
            <Input
              id="theme_en"
              value={formData.theme_en}
              onChange={(e) => setFormData({ ...formData, theme_en: e.target.value })}
              placeholder="Enter English theme"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme_fr">{t('calendar.themeFrench') || 'Theme (French)'}</Label>
            <Input
              id="theme_fr"
              value={formData.theme_fr}
              onChange={(e) => setFormData({ ...formData, theme_fr: e.target.value })}
              placeholder="Enter French theme"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_en">{t('calendar.descriptionEnglish') || 'Description (English)'}</Label>
            <Textarea
              id="description_en"
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              placeholder="Enter English description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_fr">{t('calendar.descriptionFrench') || 'Description (French)'}</Label>
            <Textarea
              id="description_fr"
              value={formData.description_fr}
              onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
              placeholder="Enter French description"
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
