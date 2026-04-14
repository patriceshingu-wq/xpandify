import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMinistries, Ministry, MinistryTreeNode, buildMinistryTree, getAncestorChain } from '@/hooks/useMinistries';
import { useMinistryMembers } from '@/hooks/useMinistryMembers';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Plus, Church, User, ArrowLeft, Pencil, ChevronRight, Building2 } from 'lucide-react';
import { MinistryFormDialog } from '@/components/ministries/MinistryFormDialog';
import { MinistryMembersList } from '@/components/ministries/MinistryMembersList';
import React from 'react';

function MinistryTreeItem({
  node,
  onSelect,
  getLocalizedField,
  t,
  depth = 0,
}: {
  node: MinistryTreeNode;
  onSelect: (m: Ministry) => void;
  getLocalizedField: (obj: Record<string, unknown>, field: string) => string;
  t: (key: string) => string;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-border pl-4' : ''}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {hasChildren && (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={isOpen ? t('common.collapse') : t('common.expand')}
                  >
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
              )}
              {!hasChildren && <div className="w-8 shrink-0" />}

              <div
                className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                onClick={() => onSelect(node)}
              >
                <div className="p-2.5 rounded-xl bg-muted shrink-0">
                  {depth === 0 ? (
                    <Church className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground truncate">
                    {getLocalizedField(node as unknown as Record<string, unknown>, 'name')}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {node.leader && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {node.leader.first_name} {node.leader.last_name}
                      </span>
                    )}
                    {hasChildren && (
                      <span className="text-xs">
                        {node.children.length} {node.children.length === 1 ? t('ministries.department') : t('ministries.departments')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasChildren && (
          <CollapsibleContent className="mt-2 space-y-2">
            {node.children.map((child) => (
              <MinistryTreeItem
                key={child.id}
                node={child}
                onSelect={onSelect}
                getLocalizedField={getLocalizedField}
                t={t}
                depth={depth + 1}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export default function Ministries() {
  const { id: ministryId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { t, getLocalizedField } = useLanguage();
  const { isAdminOrSuper, person } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [parentForNewMinistry, setParentForNewMinistry] = useState<string | undefined>();

  const { data: ministries, isLoading } = useMinistries();

  // Find the selected ministry from URL param
  const selectedMinistry = ministryId && ministries
    ? ministries.find(m => m.id === ministryId) || null
    : null;

  const { data: members = [], isLoading: membersLoading } = useMinistryMembers(selectedMinistry?.id);

  const isLeaderOfSelected = selectedMinistry?.leader_id && person?.id === selectedMinistry.leader_id;
  const canManageMembers = isAdminOrSuper || !!isLeaderOfSelected;

  const tree = ministries ? buildMinistryTree(ministries) : [];
  const childMinistries = ministries?.filter(m => m.parent_ministry_id === selectedMinistry?.id) || [];

  const handleEdit = (ministry: Ministry) => {
    setEditingMinistry(ministry);
    setParentForNewMinistry(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMinistry(null);
    setParentForNewMinistry(undefined);
  };

  const handleAddDepartment = (parentId: string) => {
    setEditingMinistry(null);
    setParentForNewMinistry(parentId);
    setIsFormOpen(true);
  };

  const handleBreadcrumbNavigate = (ministry: Ministry | null) => {
    if (ministry) {
      navigate(`/ministries/${ministry.id}`);
    } else {
      navigate('/ministries');
    }
  };

  // Detail view
  if (selectedMinistry) {
    const ancestors = ministries ? getAncestorChain(ministries, selectedMinistry.id) : [];

    return (
      <MainLayout title={getLocalizedField(selectedMinistry, 'name')} subtitle={t('ministries.ministryDetails')}>
        <div className="space-y-6 animate-fade-in">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => handleBreadcrumbNavigate(null)}
                >
                  {t('nav.ministries')}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {ancestors.map((ancestor) => (
                <React.Fragment key={ancestor.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => handleBreadcrumbNavigate(ancestor)}
                    >
                      {getLocalizedField(ancestor, 'name')}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getLocalizedField(selectedMinistry, 'name')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              // Go to parent or list
              if (selectedMinistry.parent_ministry_id) {
                navigate(`/ministries/${selectedMinistry.parent_ministry_id}`);
              } else {
                navigate('/ministries');
              }
            }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{getLocalizedField(selectedMinistry, 'name')}</h1>
              {getLocalizedField(selectedMinistry, 'description') && (
                <p className="text-muted-foreground mt-1">{getLocalizedField(selectedMinistry, 'description')}</p>
              )}
            </div>
            {isAdminOrSuper && (
              <Button variant="outline" size="sm" onClick={() => handleEdit(selectedMinistry)} className="gap-2">
                <Pencil className="h-4 w-4" />
                {t('common.edit')}
              </Button>
            )}
          </div>

          {selectedMinistry.leader && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{t('ministries.ledBy')} {selectedMinistry.leader.first_name} {selectedMinistry.leader.last_name}</span>
            </div>
          )}

          <Separator />

          {/* Sub-Ministries / Departments */}
          {(childMinistries.length > 0 || isAdminOrSuper) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('ministries.subMinistries')}</h2>
                {isAdminOrSuper && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddDepartment(selectedMinistry.id)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t('ministries.addDepartment')}
                  </Button>
                )}
              </div>
              {childMinistries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {childMinistries.map((child) => (
                    <Card
                      key={child.id}
                      className="transition-all hover:shadow-md cursor-pointer hover:-translate-y-0.5"
                      onClick={() => navigate(`/ministries/${child.id}`)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-muted">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {getLocalizedField(child, 'name')}
                          </h3>
                          {child.leader && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {child.leader.first_name} {child.leader.last_name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('ministries.noDepartments')}</p>
              )}
              <Separator />
            </div>
          )}

          <MinistryMembersList
            ministryId={selectedMinistry.id}
            members={members}
            isLoading={membersLoading}
            canManage={canManageMembers}
          />
        </div>

        {isAdminOrSuper && (
          <MinistryFormDialog
            open={isFormOpen}
            onOpenChange={handleCloseForm}
            ministry={editingMinistry}
            ministries={ministries || []}
            defaultParentId={parentForNewMinistry}
          />
        )}
      </MainLayout>
    );
  }

  // List view
  return (
    <MainLayout title={t('nav.ministries')} subtitle={t('ministries.subtitle')}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('nav.ministries')}
          subtitle={t('ministries.subtitle')}
          actions={
            isAdminOrSuper && (
              <Button onClick={() => { setParentForNewMinistry(undefined); setIsFormOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('ministries.addMinistry')}
              </Button>
            )
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : tree.length > 0 ? (
          <div className="space-y-3">
            {tree.map((node) => (
              <MinistryTreeItem
                key={node.id}
                node={node}
                onSelect={(m) => navigate(`/ministries/${m.id}`)}
                getLocalizedField={getLocalizedField}
                t={t}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Church className="h-16 w-16" />}
            title={t('common.noResults')}
            description={t('ministries.noMinistries')}
            action={isAdminOrSuper ? {
              label: t('ministries.addMinistry'),
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
          ministries={ministries || []}
          defaultParentId={parentForNewMinistry}
        />
      )}
    </MainLayout>
  );
}
