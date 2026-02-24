import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { usePeopleInfinite, usePeople, Person } from '@/hooks/usePeople';
import { useCampuses } from '@/hooks/useCampuses';
import { generateCSVExport, downloadCSV } from '@/hooks/useBulkPeopleOperations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, Users, Mail, Phone, Building, Loader2, Download, Upload, MoreHorizontal } from 'lucide-react';
import { PersonFormDialog } from '@/components/people/PersonFormDialog';
import { BulkImportDialog } from '@/components/people/BulkImportDialog';

export function DirectoryTab() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAdminOrSuper } = useAuth();
  const { bulkOperations } = useFeatureFlags();
  const [search, setSearch] = useState('');
  const [personType, setPersonType] = useState('all');
  const [status, setStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // For export - fetch all people
  const { data: allPeople } = usePeople();
  const { data: campuses } = useCampuses();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePeopleInfinite({
    search: search || undefined,
    person_type: personType,
    status: status,
  });

  const people = data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  const handleViewProfile = (person: Person) => {
    navigate(`/people/${person.id}`);
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPerson(null);
  };

  const getInitials = (person: Person) => {
    return `${person.first_name.charAt(0)}${person.last_name.charAt(0)}`.toUpperCase();
  };

  const handleExport = () => {
    if (!allPeople || !campuses) return;
    const csv = generateCSVExport(allPeople, campuses);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `people_export_${date}.csv`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {isAdminOrSuper && bulkOperations && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 touch-target">
                <MoreHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">{t('people.bulkActions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                {t('people.bulkImport')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport} disabled={!allPeople?.length}>
                <Download className="h-4 w-4 mr-2" />
                {t('people.exportCsv')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button onClick={() => setIsFormOpen(true)} className="gap-2 touch-target">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('people.addPerson')}</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('people.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 touch-target"
              />
            </div>
            <div className="flex gap-2">
              <Select value={personType} onValueChange={setPersonType}>
                <SelectTrigger className="flex-1 touch-target" aria-label={t('common.filterByType')}>
                  <SelectValue placeholder={t('common.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="staff">{t('people.staff')}</SelectItem>
                  <SelectItem value="volunteer">{t('people.volunteer')}</SelectItem>
                  <SelectItem value="congregant">{t('people.congregant')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="flex-1 touch-target" aria-label={t('common.filterByStatus')}>
                  <SelectValue placeholder={t('common.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="active">{t('people.active')}</SelectItem>
                  <SelectItem value="inactive">{t('people.inactive')}</SelectItem>
                  <SelectItem value="on_leave">{t('people.onLeave')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      ) : people.length > 0 ? (
        <>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('common.showing')} {people.length} {t('common.of')} {totalCount}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {people.map((person) => (
              <Card
                key={person.id}
                className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                onClick={() => handleViewProfile(person)}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-3 md:gap-4">
                    <Avatar className="h-11 w-11 md:h-12 md:w-12 flex-shrink-0">
                      {person.photo_url && (
                        <AvatarImage src={person.photo_url} alt={`${person.first_name} ${person.last_name}`} />
                      )}
                      <AvatarFallback className="bg-accent/10 text-accent font-medium text-sm md:text-base">
                        {getInitials(person)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground truncate text-sm md:text-base">
                            {person.preferred_name || person.first_name} {person.last_name}
                          </h3>
                          {person.title ? (
                            <p className="text-xs md:text-sm text-muted-foreground truncate">
                              {person.title}
                            </p>
                          ) : (
                            <p className="text-xs md:text-sm text-muted-foreground capitalize">
                              {person.person_type}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={person.status} className="shrink-0 text-xs" />
                      </div>
                      <div className="mt-2 space-y-0.5">
                        {person.email && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                            <span className="truncate">{person.email}</span>
                          </div>
                        )}
                        {person.phone && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                            <span>{person.phone}</span>
                          </div>
                        )}
                        {person.campus && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                            <Building className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                            <span className="truncate">{person.campus.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="py-4 flex justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{t('common.loading')}</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Users className="h-16 w-16" />}
          title={t('common.noResults')}
          description="No people found matching your criteria"
          action={{
            label: t('people.addPerson'),
            onClick: () => setIsFormOpen(true),
          }}
        />
      )}

      <PersonFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        person={editingPerson}
      />

      <BulkImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </div>
  );
}
