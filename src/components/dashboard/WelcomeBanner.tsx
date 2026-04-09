import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useGoals } from '@/hooks/useGoals';
import { useMeetings } from '@/hooks/useMeetings';
import { usePersonMinistries } from '@/hooks/usePersonMinistries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, X, Sparkles, User, Church, CalendarDays, Target } from 'lucide-react';

const DISMISS_KEY = 'xpandify-welcome-dismissed';

export function WelcomeBanner() {
  const { person } = useAuth();
  const { t, language } = useLanguage();
  const { data: orgSettings } = useOrganizationSettings();
  const { data: goals } = useGoals();
  const { data: meetings } = useMeetings();
  const { data: ministries } = usePersonMinistries(person?.id);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true');

  if (dismissed || !person) return null;

  // Show banner when user has no goals and no meetings (new user experience)
  const myGoals = goals?.filter(g => g.owner_person_id === person.id) || [];
  const hasNoData = myGoals.length === 0 && (meetings?.length || 0) === 0;

  if (!hasNoData) return null;

  const displayName = person.preferred_name || person.first_name || 'User';
  const themeName = language === 'fr'
    ? orgSettings?.yearly_theme_fr || orgSettings?.yearly_theme_en
    : orgSettings?.yearly_theme_en;

  const hasMinistry = (ministries?.length || 0) > 0;
  const hasGoals = (goals?.filter(g => g.owner_person_id === person.id)?.length || 0) > 0;

  const checklist = [
    { done: hasPhoto, label: t('welcome.completeProfile') || 'Complete your profile', icon: User, path: '/profile' },
    { done: hasMinistry, label: t('welcome.viewMinistry') || 'View your ministry', icon: Church, path: '/ministries' },
    { done: false, label: t('welcome.checkEvents') || 'Check upcoming events', icon: CalendarDays, path: '/calendar/events' },
    { done: hasGoals, label: t('welcome.reviewGoals') || 'Review your goals', icon: Target, path: '/goals' },
  ];

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              {t('welcome.title') || `Welcome, ${displayName}!`}
            </h2>
            {themeName && (
              <p className="text-sm text-muted-foreground mt-1">
                {orgSettings?.theme_year ? `${orgSettings.theme_year} — ` : ''}{themeName}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0 -mt-1 -mr-1">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {t('welcome.subtitle') || 'Here are a few things to get you started:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklist.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 p-3 rounded-lg border bg-background/60 hover:bg-background transition-colors"
              >
                {item.done ? (
                  <CheckCircle className="h-5 w-5 text-success shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                )}
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
