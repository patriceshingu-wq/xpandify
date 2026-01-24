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
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('people.title')}
          subtitle={t('people.subtitle')}
          actions={
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('people.addPerson')}
            </Button>
          }
        />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('people.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={personType} onValueChange={setPersonType}>
                <SelectTrigger className="w-full sm:w-40">
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
                <SelectTrigger className="w-full sm:w-40">
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
          </CardContent>
        </Card>

        {/* People Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : people && people.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {people.map((person) => (
              <Card
                key={person.id}
                className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                onClick={() => handleEdit(person)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-accent/10 text-accent font-medium">
                        {getInitials(person)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-foreground truncate">
                            {person.preferred_name || person.first_name} {person.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {person.person_type}
                          </p>
                        </div>
                        <StatusBadge status={person.status} />
                      </div>
                      <div className="mt-3 space-y-1">
                        {person.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{person.email}</span>
                          </div>
                        )}
                        {person.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
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
