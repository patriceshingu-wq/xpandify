import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnlinkedCounts } from '@/hooks/useOrgchartSync';
import { OrgchartBackfillMinistries } from './OrgchartBackfillMinistries';
import { OrgchartBackfillPeople } from './OrgchartBackfillPeople';

export function OrgchartSyncTab() {
  const { t } = useLanguage();
  const { data: counts } = useUnlinkedCounts();
  const backfillComplete = counts ? counts.ministries === 0 && counts.people === 0 : false;

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('orgchartSync.title')}</CardTitle>
          <CardDescription>{t('orgchartSync.description')}</CardDescription>
        </CardHeader>
      </Card>

      <OrgchartBackfillMinistries />
      <OrgchartBackfillPeople />

      <Card>
        <CardHeader>
          <CardTitle>{t('orgchartSync.runSync')}</CardTitle>
          <CardDescription>{t('orgchartSync.runSyncDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled className="touch-target">
            {backfillComplete
              ? t('orgchartSync.comingPhase2')
              : t('orgchartSync.availableAfterBackfill')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('orgchartSync.reviewQueue')}</CardTitle>
          <CardDescription>{t('orgchartSync.reviewQueueDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('orgchartSync.noChangesNeedReview')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
