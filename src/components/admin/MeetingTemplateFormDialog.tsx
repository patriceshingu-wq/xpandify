import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  MeetingTemplate,
  MeetingTemplateItem,
  AgendaSectionType,
  useCreateMeetingTemplate,
  useUpdateMeetingTemplate,
  useCreateTemplateItem,
  useUpdateTemplateItem,
  useDeleteTemplateItem,
  getSectionTypeLabel,
  getSectionTypeColor,
} from '@/hooks/useMeetingTemplates';

interface MeetingTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: MeetingTemplate | null;
}

const meetingTypes = [
  { value: 'one_on_one', label: '1:1 Meeting' },
  { value: 'team', label: 'Team Meeting' },
  { value: 'ministry', label: 'Ministry Meeting' },
  { value: 'board', label: 'Board Meeting' },
  { value: 'other', label: 'Other' },
];

const sectionTypes: { value: AgendaSectionType; label: string }[] = [
  { value: 'spiritual_life', label: 'Spiritual Life' },
  { value: 'personal_family', label: 'Personal & Family' },
  { value: 'ministry_updates', label: 'Ministry Updates' },
  { value: 'goals_review', label: 'Goals Review' },
  { value: 'development_training', label: 'Development & Training' },
  { value: 'feedback_coaching', label: 'Feedback & Coaching' },
  { value: 'other', label: 'Other' },
];

interface LocalItem {
  id?: string;
  topic_en: string;
  topic_fr: string;
  section_type: AgendaSectionType;
  is_required: boolean;
  order_index: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

export function MeetingTemplateFormDialog({ open, onOpenChange, template }: MeetingTemplateFormDialogProps) {
  const { t } = useLanguage();
  const { person } = useAuth();

  const createTemplate = useCreateMeetingTemplate();
  const updateTemplate = useUpdateMeetingTemplate();
  const createItem = useCreateTemplateItem();
  const updateItem = useUpdateTemplateItem();
  const deleteItem = useDeleteTemplateItem();

  const [nameEn, setNameEn] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [meetingType, setMeetingType] = useState<string>('one_on_one');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [items, setItems] = useState<LocalItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setNameEn(template.name_en);
        setNameFr(template.name_fr || '');
        setDescriptionEn(template.description_en || '');
        setDescriptionFr(template.description_fr || '');
        setMeetingType(template.meeting_type);
        setIsActive(template.is_active ?? true);
        setIsDefault(template.is_default ?? false);
        setItems(
          (template.items || [])
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map((item) => ({
              id: item.id,
              topic_en: item.topic_en,
              topic_fr: item.topic_fr || '',
              section_type: item.section_type,
              is_required: item.is_required ?? false,
              order_index: item.order_index || 0,
            }))
        );
      } else {
        setNameEn('');
        setNameFr('');
        setDescriptionEn('');
        setDescriptionFr('');
        setMeetingType('one_on_one');
        setIsActive(true);
        setIsDefault(false);
        setItems([]);
      }
    }
  }, [open, template]);

  const handleAddItem = () => {
    const maxOrder = items.reduce((max, item) => Math.max(max, item.order_index), -1);
    setItems([
      ...items,
      {
        topic_en: '',
        topic_fr: '',
        section_type: 'other',
        is_required: false,
        order_index: maxOrder + 1,
        isNew: true,
      },
    ]);
  };

  const handleUpdateItem = (index: number, updates: Partial<LocalItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    const item = items[index];
    if (item.id) {
      // Mark existing item as deleted
      setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, isDeleted: true } : it))
      );
    } else {
      // Remove new item entirely
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!nameEn.trim()) return;

    setIsSaving(true);
    try {
      let templateId = template?.id;

      if (template) {
        // Update existing template
        await updateTemplate.mutateAsync({
          id: template.id,
          name_en: nameEn,
          name_fr: nameFr || null,
          description_en: descriptionEn || null,
          description_fr: descriptionFr || null,
          meeting_type: meetingType as any,
          is_active: isActive,
          is_default: isDefault,
        });
      } else {
        // Create new template
        const newTemplate = await createTemplate.mutateAsync({
          name_en: nameEn,
          name_fr: nameFr || null,
          description_en: descriptionEn || null,
          description_fr: descriptionFr || null,
          meeting_type: meetingType as any,
          is_active: isActive,
          is_default: isDefault,
          created_by_id: person?.id || null,
        });
        templateId = newTemplate.id;
      }

      // Process items
      for (const item of items) {
        if (item.isDeleted && item.id) {
          await deleteItem.mutateAsync({ id: item.id, template_id: templateId! });
        } else if (item.isNew && !item.isDeleted && item.topic_en.trim()) {
          await createItem.mutateAsync({
            template_id: templateId!,
            topic_en: item.topic_en,
            topic_fr: item.topic_fr || null,
            section_type: item.section_type,
            is_required: item.is_required,
            order_index: item.order_index,
          });
        } else if (item.id && !item.isNew && !item.isDeleted) {
          await updateItem.mutateAsync({
            id: item.id,
            template_id: templateId!,
            topic_en: item.topic_en,
            topic_fr: item.topic_fr || null,
            section_type: item.section_type,
            is_required: item.is_required,
            order_index: item.order_index,
          });
        }
      }

      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const visibleItems = items.filter((item) => !item.isDeleted);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Meeting Template' : 'Create Meeting Template'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_en">Name (English) *</Label>
                  <Input
                    id="name_en"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Template name..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_fr">Name (French)</Label>
                  <Input
                    id="name_fr"
                    value={nameFr}
                    onChange={(e) => setNameFr(e.target.value)}
                    placeholder="Nom du modèle..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description_en">Description (English)</Label>
                  <Textarea
                    id="description_en"
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="Template description..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_fr">Description (French)</Label>
                  <Textarea
                    id="description_fr"
                    value={descriptionFr}
                    onChange={(e) => setDescriptionFr(e.target.value)}
                    placeholder="Description du modèle..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select value={meetingType} onValueChange={setMeetingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4 pt-6">
                  <div className="flex items-center gap-3">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                    <Label>Default for this type</Label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Agenda Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Agenda Items</Label>
                <Button variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {visibleItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No agenda items yet. Add items to create a template structure.
                </p>
              ) : (
                <div className="space-y-3">
                  {visibleItems.map((item, index) => {
                    const actualIndex = items.findIndex((it) => it === item);
                    return (
                      <Card key={actualIndex}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab shrink-0" />
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  placeholder="Topic (English) *"
                                  value={item.topic_en}
                                  onChange={(e) =>
                                    handleUpdateItem(actualIndex, { topic_en: e.target.value })
                                  }
                                />
                                <Input
                                  placeholder="Sujet (French)"
                                  value={item.topic_fr}
                                  onChange={(e) =>
                                    handleUpdateItem(actualIndex, { topic_fr: e.target.value })
                                  }
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <Select
                                  value={item.section_type}
                                  onValueChange={(v) =>
                                    handleUpdateItem(actualIndex, { section_type: v as AgendaSectionType })
                                  }
                                >
                                  <SelectTrigger className="w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sectionTypes.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={item.is_required}
                                    onCheckedChange={(checked) =>
                                      handleUpdateItem(actualIndex, { is_required: checked })
                                    }
                                  />
                                  <span className="text-sm text-muted-foreground">Required</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(actualIndex)}
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!nameEn.trim() || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {template ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
