import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerson } from '@/hooks/usePeople';
import { usePersonStats } from '@/hooks/usePersonStats';
import { usePersonMinistries } from '@/hooks/usePersonMinistries';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Target,
  MessageSquare,
  BookOpen,
  Users,
  ChevronLeft,
  Heart,
  Sparkles,
  TrendingUp,
  UserCog
} from 'lucide-react';

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { person: currentPerson, hasAnyRole, isAdminOrSuper } = useAuth();

  const { data: person, isLoading: isLoadingPerson } = usePerson(id);
  const { data: stats, isLoading: isLoadingStats } = usePersonStats(id);
  const { data: ministries, isLoading: isLoadingMinistries } = usePersonMinistries(id);

  // Access control: Basic info visible to all authenticated users
  // Development + Stats visible to self + supervisors + admins only
  const isOwnProfile = currentPerson?.id === id;
  const isSupervisorOfPerson = currentPerson?.id === person?.supervisor_id;
  const canViewPrivateInfo = isOwnProfile || isSupervisorOfPerson || isAdminOrSuper;

  if (isLoadingPerson) {
    return (
      <MainLayout title={t('personProfile.loading')}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (!person) {
    return (
      <MainLayout title={t('personProfile.notFound')}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <User className="h-16 w-16 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('personProfile.personNotFound')}</p>
          <Button variant="outline" onClick={() => navigate('/people')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('personProfile.backToPeople')}
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getInitials = () => {
    return `${person.first_name.charAt(0)}${person.last_name.charAt(0)}`.toUpperCase();
  };

  const displayName = person.preferred_name
    ? `${person.preferred_name} ${person.last_name}`
    : `${person.first_name} ${person.last_name}`;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <MainLayout title={displayName}>
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/people')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('personProfile.backToPeople')}
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-accent/10 text-accent text-3xl font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
                  <StatusBadge status={person.status} />
                </div>
                {person.title && (
                  <p className="text-lg text-muted-foreground mt-1">{person.title}</p>
                )}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  <Badge variant="secondary" className="capitalize">
                    {t(`people.${person.person_type}`)}
                  </Badge>
                  {person.campus && (
                    <Badge variant="outline">
                      <Building className="h-3 w-3 mr-1" />
                      {person.campus.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('personProfile.contactInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {person.email && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('common.email')}</p>
                      <a href={`mailto:${person.email}`} className="text-sm hover:underline">
                        {person.email}
                      </a>
                    </div>
                  </div>
                )}
                {person.phone && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('common.phone')}</p>
                      <a href={`tel:${person.phone}`} className="text-sm hover:underline">
                        {person.phone}
                      </a>
                    </div>
                  </div>
                )}
                {person.start_date && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('personProfile.startDate')}</p>
                      <p className="text-sm">{formatDate(person.start_date)}</p>
                    </div>
                  </div>
                )}
                {person.supervisor && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('personProfile.supervisor')}</p>
                      <Link
                        to={`/people/${person.supervisor.id}`}
                        className="text-sm hover:underline text-accent"
                      >
                        {person.supervisor.first_name} {person.supervisor.last_name}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ministry Memberships */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('personProfile.ministries')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMinistries ? (
                <div className="flex justify-center py-4">
                  <div className="spinner" />
                </div>
              ) : ministries && ministries.length > 0 ? (
                <div className="space-y-2">
                  {ministries.map((membership) => (
                    <div
                      key={membership.id}
                      className="flex items-center gap-2 p-2 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {membership.ministry[`name_${language}`] || membership.ministry.name_en}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('personProfile.noMinistries')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Development Section - Only visible to self, supervisor, or admin */}
        {canViewPrivateInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {t('personProfile.development')}
              </CardTitle>
              <CardDescription>{t('personProfile.developmentDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {person.calling_description && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">{t('personProfile.calling')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{person.calling_description}</p>
                  </div>
                )}
                {person.strengths && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">{t('personProfile.strengths')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{person.strengths}</p>
                  </div>
                )}
                {person.growth_areas && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">{t('personProfile.growthAreas')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{person.growth_areas}</p>
                  </div>
                )}
              </div>
              {!person.calling_description && !person.strengths && !person.growth_areas && (
                <div className="text-center py-6">
                  <Sparkles className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('personProfile.noDevelopmentInfo')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Section - Only visible to self, supervisor, or admin */}
        {canViewPrivateInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 text-accent mx-auto mb-2" />
                <p className="text-2xl font-semibold">{stats?.goalsCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t('personProfile.goals')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 text-accent mx-auto mb-2" />
                <p className="text-2xl font-semibold">{stats?.meetingsCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t('personProfile.meetings')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-6 w-6 text-accent mx-auto mb-2" />
                <p className="text-2xl font-semibold">{stats?.coursesCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t('personProfile.courses')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-6 w-6 text-accent mx-auto mb-2" />
                <p className="text-2xl font-semibold">{stats?.feedbackCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t('personProfile.feedback')}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
