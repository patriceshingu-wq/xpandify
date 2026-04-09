import { useMemo } from 'react';
import { useOrganizationSettings } from './useOrganizationSettings';
import { FEATURES } from '@/config/features';

/**
 * Feature flags for advanced features
 * These can be enabled per-organization via Admin > Feature Upgrades
 */
export interface FeatureFlags {
  // People & Organization
  orgChart: boolean;
  bulkOperations: boolean;

  // Goals & Development
  cascadeView: boolean;
  departmentGoals: boolean;
  devPlans: boolean;
  eventGoalLinking: boolean;

  // Calendar Advanced
  quarters: boolean;
  programs: boolean;

  // Forms & Editing
  bilingualEditing: boolean;

  // Phase 2 modules
  courses: boolean;
  pathways: boolean;
  mentorship: boolean;
  reviews: boolean;
  surveys: boolean;
  analytics: boolean;
  recurringMeetings: boolean;

  // Loading state
  isLoading: boolean;
}

/**
 * Feature dependency rules
 * - cascadeView auto-enables departmentGoals
 * - programs requires quarters
 */
const FEATURE_DEPENDENCIES = {
  cascadeView: { autoEnable: ['departmentGoals'] },
  programs: { requires: ['quarters'] },
  quarters: { autoDisable: ['programs'] },
} as const;

/**
 * Hook to get feature flags from organization settings
 * Falls back to static FEATURES.advanced config if DB values are null
 *
 * Usage:
 * ```tsx
 * const { cascadeView, departmentGoals, isLoading } = useFeatureFlags();
 * if (cascadeView) {
 *   // Show cascade view
 * }
 * ```
 */
export function useFeatureFlags(): FeatureFlags {
  const { data: orgSettings, isLoading } = useOrganizationSettings();

  const flags = useMemo((): FeatureFlags => {
    // If simpleMode is ON globally, all advanced features are OFF
    if (FEATURES.simpleMode) {
      return {
        orgChart: false,
        bulkOperations: false,
        cascadeView: false,
        departmentGoals: false,
        devPlans: false,
        eventGoalLinking: false,
        quarters: false,
        programs: false,
        bilingualEditing: false,
        isLoading,
      };
    }

    // Get values from DB, falling back to static config
    const orgChart = orgSettings?.feature_org_chart ?? FEATURES.advanced.orgChart;
    const bulkOperations = orgSettings?.feature_bulk_operations ?? FEATURES.advanced.bulkOperations;
    const cascadeView = orgSettings?.feature_cascade_view ?? FEATURES.advanced.cascadeView;
    const devPlans = orgSettings?.feature_dev_plans ?? FEATURES.advanced.devPlans;
    const eventGoalLinking = orgSettings?.feature_event_goal_linking ?? FEATURES.advanced.eventGoalLinking;
    const quarters = orgSettings?.feature_quarters ?? FEATURES.calendarFeatures.quarters;
    const bilingualEditing = orgSettings?.feature_bilingual_editing ?? FEATURES.advanced.bilingualEditing;

    // Apply dependency rules
    // cascadeView auto-enables departmentGoals
    const departmentGoals = cascadeView
      ? true
      : (orgSettings?.feature_department_goals ?? FEATURES.advanced.departmentGoals);

    // programs requires quarters
    const programsRaw = orgSettings?.feature_programs ?? FEATURES.calendarFeatures.programs;
    const programs = quarters ? programsRaw : false;

    return {
      orgChart,
      bulkOperations,
      cascadeView,
      departmentGoals,
      devPlans,
      eventGoalLinking,
      quarters,
      programs,
      bilingualEditing,
      isLoading,
    };
  }, [orgSettings, isLoading]);

  return flags;
}

/**
 * Check if a specific feature can be enabled (dependency check)
 */
export function canEnableFeature(
  feature: keyof Omit<FeatureFlags, 'isLoading'>,
  currentFlags: FeatureFlags
): { canEnable: boolean; reason?: string } {
  const deps = FEATURE_DEPENDENCIES[feature as keyof typeof FEATURE_DEPENDENCIES];

  if (deps && 'requires' in deps) {
    for (const required of deps.requires) {
      if (!currentFlags[required as keyof FeatureFlags]) {
        return {
          canEnable: false,
          reason: `Requires ${required} to be enabled first`,
        };
      }
    }
  }

  return { canEnable: true };
}

/**
 * Get features that will be auto-enabled when enabling a feature
 */
export function getAutoEnabledFeatures(
  feature: keyof Omit<FeatureFlags, 'isLoading'>
): string[] {
  const deps = FEATURE_DEPENDENCIES[feature as keyof typeof FEATURE_DEPENDENCIES];
  if (deps && 'autoEnable' in deps) {
    return [...deps.autoEnable];
  }
  return [];
}

/**
 * Get features that will be auto-disabled when disabling a feature
 */
export function getAutoDisabledFeatures(
  feature: keyof Omit<FeatureFlags, 'isLoading'>
): string[] {
  const deps = FEATURE_DEPENDENCIES[feature as keyof typeof FEATURE_DEPENDENCIES];
  if (deps && 'autoDisable' in deps) {
    return [...deps.autoDisable];
  }
  return [];
}
