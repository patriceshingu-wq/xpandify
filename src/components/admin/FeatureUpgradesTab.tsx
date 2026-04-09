import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrganizationSettings, useUpdateOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useFeatureFlags, canEnableFeature, getAutoEnabledFeatures, getAutoDisabledFeatures } from '@/hooks/useFeatureFlags';
import { FEATURES } from '@/config/features';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Target,
  Calendar,
  Languages,
  Lock,
  Info,
  Sparkles,
  GraduationCap,
  Users2,
  BarChart3,
  PieChart,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';

interface FeatureToggle {
  key: string;
  dbKey: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresFeature?: string;
  autoEnables?: string[];
}

interface FeatureGroup {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: FeatureToggle[];
}

export function FeatureUpgradesTab() {
  const { t } = useLanguage();
  const { data: orgSettings, isLoading } = useOrganizationSettings();
  const updateSettings = useUpdateOrganizationSettings();
  const currentFlags = useFeatureFlags();

  // Feature groups configuration
  const featureGroups: FeatureGroup[] = [
    {
      title: t('featureUpgrades.peopleOrganization'),
      description: t('featureUpgrades.peopleOrganizationDescription'),
      icon: <Users className="h-5 w-5" />,
      features: [
        {
          key: 'orgChart',
          dbKey: 'feature_org_chart',
          label: t('featureUpgrades.orgChart'),
          description: t('featureUpgrades.orgChartDescription'),
          icon: <Users className="h-4 w-4" />,
        },
        {
          key: 'bulkOperations',
          dbKey: 'feature_bulk_operations',
          label: t('featureUpgrades.bulkOperations'),
          description: t('featureUpgrades.bulkOperationsDescription'),
          icon: <Users className="h-4 w-4" />,
        },
      ],
    },
    {
      title: t('featureUpgrades.goalsDevelopment'),
      description: t('featureUpgrades.goalsDevelopmentDescription'),
      icon: <Target className="h-5 w-5" />,
      features: [
        {
          key: 'cascadeView',
          dbKey: 'feature_cascade_view',
          label: t('featureUpgrades.cascadeView'),
          description: t('featureUpgrades.cascadeViewDescription'),
          icon: <Target className="h-4 w-4" />,
          autoEnables: ['departmentGoals'],
        },
        {
          key: 'departmentGoals',
          dbKey: 'feature_department_goals',
          label: t('featureUpgrades.departmentGoals'),
          description: t('featureUpgrades.departmentGoalsDescription'),
          icon: <Target className="h-4 w-4" />,
        },
        {
          key: 'devPlans',
          dbKey: 'feature_dev_plans',
          label: t('featureUpgrades.devPlans'),
          description: t('featureUpgrades.devPlansDescription'),
          icon: <Target className="h-4 w-4" />,
        },
        {
          key: 'eventGoalLinking',
          dbKey: 'feature_event_goal_linking',
          label: t('featureUpgrades.eventGoalLinking'),
          description: t('featureUpgrades.eventGoalLinkingDescription'),
          icon: <Target className="h-4 w-4" />,
        },
      ],
    },
    {
      title: t('featureUpgrades.calendarAdvanced'),
      description: t('featureUpgrades.calendarAdvancedDescription'),
      icon: <Calendar className="h-5 w-5" />,
      features: [
        {
          key: 'quarters',
          dbKey: 'feature_quarters',
          label: t('featureUpgrades.quarters'),
          description: t('featureUpgrades.quartersDescription'),
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          key: 'programs',
          dbKey: 'feature_programs',
          label: t('featureUpgrades.programs'),
          description: t('featureUpgrades.programsDescription'),
          icon: <Calendar className="h-4 w-4" />,
          requiresFeature: 'quarters',
        },
      ],
    },
    {
      title: t('featureUpgrades.formsEditing'),
      description: t('featureUpgrades.formsEditingDescription'),
      icon: <Languages className="h-5 w-5" />,
      features: [
        {
          key: 'bilingualEditing',
          dbKey: 'feature_bilingual_editing',
          label: t('featureUpgrades.bilingualEditing'),
          description: t('featureUpgrades.bilingualEditingDescription'),
          icon: <Languages className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'Phase 2: Learning & Mentorship',
      description: 'Enable advanced learning and mentorship modules',
      icon: <GraduationCap className="h-5 w-5" />,
      features: [
        {
          key: 'courses',
          dbKey: 'feature_courses',
          label: 'Courses & LMS',
          description: 'Enable the course catalog, assignments, and learning management',
          icon: <GraduationCap className="h-4 w-4" />,
        },
        {
          key: 'pathways',
          dbKey: 'feature_pathways',
          label: 'Learning Pathways',
          description: 'Enable structured learning pathways with course sequences',
          icon: <GraduationCap className="h-4 w-4" />,
          requiresFeature: 'courses',
        },
        {
          key: 'mentorship',
          dbKey: 'feature_mentorship',
          label: 'Mentorship Program',
          description: 'Enable mentor-mentee matching, check-ins, and tracking',
          icon: <Users2 className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'Phase 2: Reviews & Analytics',
      description: 'Enable formal reviews, surveys, and advanced analytics',
      icon: <PieChart className="h-5 w-5" />,
      features: [
        {
          key: 'reviews',
          dbKey: 'feature_reviews',
          label: 'Performance Reviews',
          description: 'Enable formal review cycles and review forms',
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          key: 'surveys',
          dbKey: 'feature_surveys',
          label: 'Pulse Surveys',
          description: 'Enable anonymous pulse surveys for team engagement',
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          key: 'analytics',
          dbKey: 'feature_analytics',
          label: 'Advanced Analytics',
          description: 'Enable detailed reporting and analytics dashboards',
          icon: <PieChart className="h-4 w-4" />,
        },
        {
          key: 'recurringMeetings',
          dbKey: 'feature_recurring_meetings',
          label: 'Recurring Meetings',
          description: 'Enable weekly, bi-weekly, and monthly recurring meetings',
          icon: <RefreshCw className="h-4 w-4" />,
        },
      ],
    },
  ];

  const handleToggle = async (feature: FeatureToggle, enabled: boolean) => {
    if (!orgSettings?.id) return;

    const updates: Record<string, boolean> = {
      [feature.dbKey]: enabled,
    };

    // Handle auto-enable dependencies
    if (enabled && feature.autoEnables) {
      for (const autoFeature of feature.autoEnables) {
        const autoDbKey = `feature_${autoFeature.replace(/([A-Z])/g, '_$1').toLowerCase()}`;
        updates[autoDbKey] = true;
      }
    }

    // Handle auto-disable when disabling a required feature
    if (!enabled) {
      const autoDisabled = getAutoDisabledFeatures(feature.key as any);
      for (const autoFeature of autoDisabled) {
        const autoDbKey = `feature_${autoFeature.replace(/([A-Z])/g, '_$1').toLowerCase()}`;
        updates[autoDbKey] = false;
      }
    }

    await updateSettings.mutateAsync({
      id: orgSettings.id,
      ...updates,
    });
  };

  const getFeatureValue = (dbKey: string): boolean => {
    if (!orgSettings) return false;
    return (orgSettings as any)[dbKey] ?? false;
  };

  const isFeatureLocked = (feature: FeatureToggle): boolean => {
    if (!feature.requiresFeature) return false;
    return !currentFlags[feature.requiresFeature as keyof typeof currentFlags];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('featureUpgrades.title')}
          </CardTitle>
          <CardDescription>{t('featureUpgrades.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('featureUpgrades.title')}
          </CardTitle>
          <CardDescription>{t('featureUpgrades.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('featureUpgrades.description')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {featureGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {group.icon}
              {group.title}
            </CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.features.map((feature) => {
              const isEnabled = getFeatureValue(feature.dbKey);
              const isLocked = isFeatureLocked(feature);
              const autoEnables = feature.autoEnables || [];

              return (
                <div
                  key={feature.key}
                  className={`flex items-start justify-between p-4 border rounded-lg ${
                    isLocked ? 'opacity-60 bg-muted/50' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={feature.key}
                        className="font-medium cursor-pointer"
                      >
                        {feature.label}
                      </Label>
                      {isLocked && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Lock className="h-3 w-3" />
                          {t('featureUpgrades.requires')} {feature.requiresFeature}
                        </Badge>
                      )}
                      {autoEnables.length > 0 && isEnabled && (
                        <Badge variant="secondary" className="text-xs">
                          {t('featureUpgrades.autoEnabled')}: {autoEnables.join(', ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                  <Switch
                    id={feature.key}
                    checked={isEnabled}
                    disabled={isLocked || updateSettings.isPending}
                    onCheckedChange={(checked) => handleToggle(feature, checked)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
