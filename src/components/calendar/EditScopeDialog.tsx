import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type EditScope = 'this_only' | 'this_and_future' | 'all_in_series';

interface EditScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (scope: EditScope) => void;
  mode: 'edit' | 'delete';
}

export default function EditScopeDialog({ open, onOpenChange, onSelect, mode }: EditScopeDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit'
              ? (t('calendar.editRecurringEvent') || 'Edit Recurring Event')
              : (t('calendar.deleteRecurringEvent') || 'Delete Recurring Event')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? (t('calendar.editScopeDescription') || 'How would you like to apply this change?')
              : (t('calendar.deleteScopeDescription') || 'Which events would you like to delete?')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Button variant="outline" onClick={() => onSelect('this_only')}>
            {t('calendar.thisEventOnly') || 'This event only'}
          </Button>
          <Button variant="outline" onClick={() => onSelect('this_and_future')}>
            {t('calendar.thisAndFuture') || 'This and all future events'}
          </Button>
          {mode === 'delete' && (
            <Button variant="destructive" onClick={() => onSelect('all_in_series')}>
              {t('calendar.allInSeries') || 'All events in the series'}
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common.cancel') || 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
