-- Add new values to goal_category enum
ALTER TYPE public.goal_category ADD VALUE IF NOT EXISTS 'spiritual';
ALTER TYPE public.goal_category ADD VALUE IF NOT EXISTS 'operational';
ALTER TYPE public.goal_category ADD VALUE IF NOT EXISTS 'financial';
ALTER TYPE public.goal_category ADD VALUE IF NOT EXISTS 'growth';
ALTER TYPE public.goal_category ADD VALUE IF NOT EXISTS 'leadership';
