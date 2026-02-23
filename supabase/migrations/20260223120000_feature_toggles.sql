-- Migration: Add feature toggle columns to organization_settings
-- Purpose: Store per-organization feature upgrades (advanced features)
-- Date: 2026-02-23

-- Add feature toggle columns with sensible defaults (all OFF by default)
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS feature_org_chart boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_bulk_operations boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_cascade_view boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_department_goals boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_dev_plans boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_event_goal_linking boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_quarters boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_programs boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_bilingual_editing boolean DEFAULT false;

-- Add comment to document the feature flags
COMMENT ON COLUMN organization_settings.feature_org_chart IS 'Enable org chart visualization in People page';
COMMENT ON COLUMN organization_settings.feature_bulk_operations IS 'Enable bulk CSV import/export for people';
COMMENT ON COLUMN organization_settings.feature_cascade_view IS 'Enable goal cascade visualization';
COMMENT ON COLUMN organization_settings.feature_department_goals IS 'Enable department-level goals (auto-enabled with cascade_view)';
COMMENT ON COLUMN organization_settings.feature_dev_plans IS 'Enable Development Plans tab on Goals page';
COMMENT ON COLUMN organization_settings.feature_event_goal_linking IS 'Enable linking events to goals';
COMMENT ON COLUMN organization_settings.feature_quarters IS 'Enable calendar quarters feature';
COMMENT ON COLUMN organization_settings.feature_programs IS 'Enable programs feature (requires quarters)';
COMMENT ON COLUMN organization_settings.feature_bilingual_editing IS 'Enable side-by-side bilingual field editing';
