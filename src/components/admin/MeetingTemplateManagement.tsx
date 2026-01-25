import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useMeetingTemplates, 
  useDeleteMeetingTemplate,
  MeetingTemplate,
  getSectionTypeLabel,
  getSectionTypeColor,
  AgendaSectionType
} from '@/hooks/useMeetingTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, FileText, Pencil, Trash2, Check, Loader2 } from 'lucide-react';
import { MeetingTemplateFormDialog } from './MeetingTemplateFormDialog';

const meetingTypeLabels: Record<string, string> = {
  one_on_one: '1:1 Meeting',
  team: 'Team Meeting',
  ministry: 'Ministry Meeting',
  board: 'Board Meeting',
  other: 'Other',
};

const meetingTypeColors: Record<string, string> = {
  one_on_one: 'bg-accent/10 text-accent',
  team: 'bg-info/10 text-info',
  ministry: 'bg-success/10 text-success',
  board: 'bg-destructive/10 text-destructive',
  other: 'bg-muted text-muted-foreground',
};

export function MeetingTemplateManagement() {
  const { t, getLocalizedField } = useLanguage();
  const { data: templates, isLoading } = useMeetingTemplates(undefined, true);
  const deleteTemplate = useDeleteMeetingTemplate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MeetingTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (template: MeetingTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteTemplate.mutateAsync(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Meeting Templates</CardTitle>
            <CardDescription>
              Create and manage agenda templates for different meeting types
            </CardDescription>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </CardHeader>
        <CardContent>
          {!templates || templates.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No templates yet"
              description="Create your first meeting template to streamline agenda creation"
              action={{
                label: 'Create Template',
                onClick: handleCreate,
              }}
            />
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">
                          {getLocalizedField(template, 'name')}
                        </h4>
                        <Badge className={meetingTypeColors[template.meeting_type]}>
                          {meetingTypeLabels[template.meeting_type]}
                        </Badge>
                        {template.is_default && (
                          <Badge variant="secondary" className="gap-1">
                            <Check className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                        {!template.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {(template.description_en || template.description_fr) && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {getLocalizedField(template, 'description')}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {template.items?.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((item) => (
                          <Badge
                            key={item.id}
                            variant="outline"
                            className={`text-xs ${getSectionTypeColor(item.section_type)}`}
                          >
                            {getLocalizedField(item, 'topic')}
                          </Badge>
                        ))}
                        {(!template.items || template.items.length === 0) && (
                          <span className="text-xs text-muted-foreground">No agenda items</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MeetingTemplateFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        template={editingTemplate}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template and all its agenda items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
