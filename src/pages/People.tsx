import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePeople, Person } from '@/hooks/usePeople';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Users, Mail, Phone, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PersonFormDialog } from '@/components/people/PersonFormDialog';

export default function People() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [personType, setPersonType] = useState('all');
  const [status, setStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const { data: people, isLoading } = usePeople({
    search: search || undefined,
    person_type: personType,
    status: status,
  });

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

  return (
    <MainLayout title={t('people.title')} subtitle={t('people.subtitle')}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <PageHeader
          title={t('people.title')}
          subtitle={t('people.subtitle')}
          actions={
            <Button onClick={() => setIsFormOpen(true)} className="gap-2 touch-target">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('people.addPerson')}</span>
              <span className="sm:hidden">Add</span>
            </Button>
          }
        />

        {/* Filters - More compact on mobile */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-3">
              {/* Search - Full width */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('people.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 touch-target"
                />
              </div>
              {/* Filter row */}
              <div className="flex gap-2">
                <Select value={personType} onValueChange={setPersonType}>
                  <SelectTrigger className="flex-1 touch-target">
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
                  <SelectTrigger className="flex-1 touch-target">
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

        {/* People Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : people && people.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {people.map((person) => (
              <Card
                key={person.id}
                className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                onClick={() => handleEdit(person)}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-3 md:gap-4">
                    <Avatar className="h-11 w-11 md:h-12 md:w-12 flex-shrink-0">
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
                          <p className="text-xs md:text-sm text-muted-foreground capitalize">
                            {person.person_type}
                          </p>
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
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
      </div>

      <PersonFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        person={editingPerson}
      />
    </MainLayout>
  );
}
