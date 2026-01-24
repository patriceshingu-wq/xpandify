import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMinistries, Ministry } from '@/hooks/useMinistries';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Church, User } from 'lucide-react';
import { MinistryFormDialog } from '@/components/ministries/MinistryFormDialog';

export default function Ministries() {
  const { t, getLocalizedField } = useLanguage();
  const { isAdminOrSuper } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);

  const { data: ministries, isLoading } = useMinistries();

  const handleEdit = (ministry: Ministry) => {
    if (!isAdminOrSuper) return;
    setEditingMinistry(ministry);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMinistry(null);
  };

  return (
    <MainLayout title={t('nav.ministries')} subtitle="Manage church ministries and departments">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('nav.ministries')}
          subtitle="Manage church ministries and departments"
          actions={
            isAdminOrSuper && (
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Ministry
              </Button>
            )
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : ministries && ministries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ministries.map((ministry) => (
              <Card
                key={ministry.id}
                className={`transition-all hover:shadow-md ${isAdminOrSuper ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
                onClick={() => handleEdit(ministry)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-accent/10">
                      <Church className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg text-foreground mb-1">
                        {getLocalizedField(ministry, 'name')}
                      </h3>
                      {getLocalizedField(ministry, 'description') && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {getLocalizedField(ministry, 'description')}
                        </p>
                      )}
                      {ministry.leader && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          Led by {ministry.leader.first_name} {ministry.leader.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Church className="h-16 w-16" />}
            title={t('common.noResults')}
            description="No ministries have been created yet"
            action={isAdminOrSuper ? {
              label: 'Add Ministry',
              onClick: () => setIsFormOpen(true),
            } : undefined}
          />
        )}
      </div>

      {isAdminOrSuper && (
        <MinistryFormDialog
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          ministry={editingMinistry}
        />
      )}
    </MainLayout>
  );
}
