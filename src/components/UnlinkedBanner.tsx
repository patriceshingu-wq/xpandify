import { Link2Off } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnlinkedCounts } from '@/hooks/useOrgchartSync';

// Renders a banner on Ministries / PersonProfile when admin has unlinked rows
// pending orgchart backfill. Hidden for non-admins and when both counts are zero.
export function UnlinkedBanner() {
  const { isAdminOrSuper } = useAuth();
  const { t } = useLanguage();
  const { data } = useUnlinkedCounts();

  if (!isAdminOrSuper) return null;
  if (!data) return null;
  if (data.ministries === 0 && data.people === 0) return null;

  const message = t('orgchartSync.unlinkedBanner')
    .replace('{ministries}', String(data.ministries))
    .replace('{people}', String(data.people));

  return (
    <div className="mb-4 rounded-lg border border-warning/50 bg-warning/10 p-3 md:p-4 flex items-start gap-3">
      <Link2Off className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="text-foreground">{message}</p>
        <Link
          to="/admin?tab=orgchart-sync"
          className="text-primary hover:underline font-medium"
        >
          {t('orgchartSync.finishBackfill')}
        </Link>
      </div>
    </div>
  );
}
