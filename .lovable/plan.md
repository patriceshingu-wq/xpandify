
# Surface the Yearly Theme Across the App

## Overview
The yearly theme ("EXPANSION", Isaiah 54:1-3) is fully configured in org settings but never shown to users. This plan adds a prominent theme banner on the Dashboard and a subtle theme reference in the Sidebar, making it a daily touchpoint for alignment.

## Changes

### 1. New Component: YearlyThemeBanner
**File**: `src/components/dashboard/YearlyThemeBanner.tsx`

A visually striking card displayed at the top of the Dashboard, above the stats grid. It will:
- Fetch org settings via `useOrganizationSettings()`
- Display the theme name (e.g., "EXPANSION") in bold, decorative typography (Playfair Display)
- Show the guiding scripture reference (Isaiah 54:1-3)
- Include a collapsible section with the full vision statement (localized EN/FR via `getLocalizedField`)
- Use the theme year as a label (e.g., "2026 Theme")
- Gracefully hide if no theme is configured
- Use a subtle gradient or accent-colored border to stand out without being overwhelming

### 2. Dashboard Integration
**File**: `src/pages/Dashboard.tsx`

- Import and render `YearlyThemeBanner` just below the welcome title, above the stats grid
- The banner only renders when theme data exists in org settings

### 3. Sidebar Theme Badge
**File**: `src/components/layout/Sidebar.tsx`

- Add a small, elegant theme badge near the bottom of the sidebar (above the user profile area)
- Shows the theme year and name (e.g., "2026 -- EXPANSION")
- Localized to the user's language preference
- Only visible when theme data is configured

## Technical Details

- Uses the existing `useOrganizationSettings()` hook (no new queries needed)
- Uses the existing `getLocalizedField()` helper for bilingual support
- The banner uses Radix Collapsible for the expandable vision statement
- No database changes required -- all data already exists
- Mobile-responsive: banner stacks vertically, sidebar badge hidden on mobile (sidebar is already hidden)
