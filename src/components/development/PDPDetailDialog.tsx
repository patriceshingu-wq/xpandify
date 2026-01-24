import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDevelopmentPlan, useCreatePDPItem, useUpdatePDPItem, useDeletePDPItem, PDPItem } from '@/hooks/useDevelopmentPlans';
import { Plus, CheckCircle2, Circle, Clock, XCircle, Trash2, Edit2, Loader2 } from 'lucide-react';

interface PDPDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdpId: string | null;
}

const statusIcons: Record<string, React.ReactNode> = {
  not_started: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Clock className="h-4 w-4 text-info" />,
  completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  cancelled: <XCircle className="h-4 w-4 text-destructive" />,
};

const itemTypeLabels: Record<string, string> = {
  course: 'Course',
  mentoring: 'Mentoring',
  project: 'Project',
  reading: 'Reading',
  other: 'Other',
};

export function PDPDetailDialog({ open, onOpenChange, pdpId }: PDPDetailDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const { data: pdp, isLoading } = useDevelopmentPlan(pdpId || undefined);
  const createItem = useCreatePDPItem();
  const updateItem = useUpdatePDPItem();
  const deleteItem = useDeletePDPItem();

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<PDPItem | null>(null);
  const [newItem, setNewItem] = useState({
    title_en: '',
    title_fr: '',
    item_type: 'other' as 'course' | 'mentoring' | 'project' | 'reading' | 'other',
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed' | 'cancelled',
    due_date: '',
  });

  const handleAddItem = async () => {
    if (!pdpId || !newItem.title_en) return;

    await createItem.mutateAsync({
      pdp_id: pdpId,
      title_en: newItem.title_en,
      title_fr: newItem.title_fr || null,
      item_type: newItem.item_type,
      status: newItem.status,
      due_date: newItem.due_date || null,
    });

    setNewItem({
      title_en: '',
      title_fr: '',
      item_type: 'other',
      status: 'not_started',
      due_date: '',
    });
    setShowAddItem(false);
  };

  const handleUpdateItemStatus = async (item: PDPItem, newStatus: string) => {
    await updateItem.mutateAsync({
      id: item.id,
      pdp_id: pdpId!,
      status: newStatus as 'not_started' | 'in_progress' | 'completed' | 'cancelled',
    });
  };

  const handleDeleteItem = async (item: PDPItem) => {
    await deleteItem.mutateAsync({ id: item.id, pdp_id: pdpId! });
  };

  const completedCount = pdp?.items?.filter(i => i.status === 'completed').length || 0;
  const totalCount = pdp?.items?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!pdp) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getLocalizedField(pdp, 'plan_title')}</DialogTitle>
          <DialogDescription>
            {pdp.person?.first_name} {pdp.person?.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('common.progress')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={progressPercent} className="flex-1" />
                <span className="text-sm font-medium">{progressPercent}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {completedCount} of {totalCount} items completed
              </p>
            </CardContent>
          </Card>

          {/* Summary */}
          {(pdp.summary_en || pdp.summary_fr) && (
            <div>
              <h4 className="text-sm font-medium mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">
                {getLocalizedField(pdp, 'summary')}
              </p>
            </div>
          )}

          <Separator />

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">Development Items</h4>
              <Button size="sm" variant="outline" onClick={() => setShowAddItem(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {/* Add Item Form */}
            {showAddItem && (
              <Card className="mb-4 border-dashed">
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Title (English) *</Label>
                      <Input
                        value={newItem.title_en}
                        onChange={(e) => setNewItem({ ...newItem, title_en: e.target.value })}
                        placeholder="Item title"
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Title (French)</Label>
                      <Input
                        value={newItem.title_fr}
                        onChange={(e) => setNewItem({ ...newItem, title_fr: e.target.value })}
                        placeholder="Titre de l'élément"
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={newItem.item_type}
                        onValueChange={(v: 'course' | 'mentoring' | 'project' | 'reading' | 'other') =>
                          setNewItem({ ...newItem, item_type: v })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="course">Course</SelectItem>
                          <SelectItem value="mentoring">Mentoring</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="reading">Reading</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={newItem.status}
                        onValueChange={(v: 'not_started' | 'in_progress' | 'completed' | 'cancelled') =>
                          setNewItem({ ...newItem, status: v })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">{t('goals.notStarted')}</SelectItem>
                          <SelectItem value="in_progress">{t('goals.inProgress')}</SelectItem>
                          <SelectItem value="completed">{t('goals.completed')}</SelectItem>
                          <SelectItem value="cancelled">{t('goals.cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('common.dueDate')}</Label>
                      <Input
                        type="date"
                        value={newItem.due_date}
                        onChange={(e) => setNewItem({ ...newItem, due_date: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowAddItem(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button size="sm" onClick={handleAddItem} disabled={!newItem.title_en || createItem.isPending}>
                      {createItem.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items List */}
            <div className="space-y-2">
              {(!pdp.items || pdp.items.length === 0) && !showAddItem && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No items yet. Add items to track development activities.
                </p>
              )}
              {pdp.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="cursor-pointer" onClick={() => {
                    const nextStatus = item.status === 'not_started' ? 'in_progress' :
                      item.status === 'in_progress' ? 'completed' : item.status;
                    if (nextStatus !== item.status) {
                      handleUpdateItemStatus(item, nextStatus);
                    }
                  }}>
                    {statusIcons[item.status || 'not_started']}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {getLocalizedField(item, 'title')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {itemTypeLabels[item.item_type || 'other']}
                      </Badge>
                      {item.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(item.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Select
                    value={item.status || 'not_started'}
                    onValueChange={(v) => handleUpdateItemStatus(item, v)}
                  >
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">{t('goals.notStarted')}</SelectItem>
                      <SelectItem value="in_progress">{t('goals.inProgress')}</SelectItem>
                      <SelectItem value="completed">{t('goals.completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('goals.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteItem(item)}>{t('common.delete')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
