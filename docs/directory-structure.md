# Xpandify — Project Directory Structure

```
xpandify/
├── docs/
│   ├── PRD.md
│   └── directory-structure.md
│
├── e2e/
│   ├── fixtures/
│   │   ├── auth.fixture.ts
│   │   └── page-objects.ts
│   ├── README.md
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   ├── meeting-workflow.spec.ts
│   └── role-access.spec.ts
│
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── LinkPersonDialog.tsx
│   │   │   ├── MeetingTemplateFormDialog.tsx
│   │   │   ├── MeetingTemplateManagement.tsx
│   │   │   ├── UserManagementTable.tsx
│   │   │   └── UserRoleDialog.tsx
│   │   │
│   │   ├── calendar/
│   │   │   ├── EventGoalDialog.tsx
│   │   │   ├── EventRoleDialog.tsx
│   │   │   ├── EventStatusBadge.tsx
│   │   │   ├── ProgramFormDialog.tsx
│   │   │   └── QuarterFormDialog.tsx
│   │   │
│   │   ├── courses/
│   │   │   └── CourseFormDialog.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DevelopmentProgressWidget.tsx
│   │   │   ├── DirectReportCard.tsx
│   │   │   ├── GoalCompletionChart.tsx
│   │   │   ├── QuickScheduleDialog.tsx
│   │   │   ├── StaffDashboard.tsx
│   │   │   ├── SupervisorDashboard.tsx
│   │   │   ├── TeamEngagementChart.tsx
│   │   │   └── TrainingProgressChart.tsx
│   │   │
│   │   ├── development/
│   │   │   ├── CourseAssignmentDialog.tsx
│   │   │   ├── PDPDetailDialog.tsx
│   │   │   └── PDPFormDialog.tsx
│   │   │
│   │   ├── feedback/
│   │   │   └── FeedbackFormDialog.tsx
│   │   │
│   │   ├── goals/
│   │   │   ├── GoalCascadeView.tsx
│   │   │   └── GoalFormDialog.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   ├── MobileHeader.tsx
│   │   │   ├── MobileMoreMenu.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   ├── learning/
│   │   │   ├── CourseCatalogTab.tsx
│   │   │   ├── MyProgressTab.tsx
│   │   │   └── PathwaysTab.tsx
│   │   │
│   │   ├── meetings/
│   │   │   ├── AttachGoalDialog.tsx
│   │   │   ├── AttachPDPDialog.tsx
│   │   │   ├── LinkedItemProgress.tsx
│   │   │   ├── MeetingDetailDialog.tsx
│   │   │   ├── MeetingFormDialog.tsx
│   │   │   ├── MonthlyCalendarView.tsx
│   │   │   ├── RescheduleConflictsDialog.tsx
│   │   │   └── WeeklyCalendarView.tsx
│   │   │
│   │   ├── mentorship/
│   │   │   ├── MentorshipDetailDialog.tsx
│   │   │   └── MentorshipFormDialog.tsx
│   │   │
│   │   ├── ministries/
│   │   │   └── MinistryFormDialog.tsx
│   │   │
│   │   ├── notifications/
│   │   │   └── NotificationsDropdown.tsx
│   │   │
│   │   ├── pathways/
│   │   │   ├── PathwayDetailDialog.tsx
│   │   │   └── PathwayFormDialog.tsx
│   │   │
│   │   ├── people/
│   │   │   ├── DirectoryTab.tsx
│   │   │   ├── MyTeamTab.tsx
│   │   │   ├── PeersTab.tsx
│   │   │   ├── PersonFormDialog.tsx
│   │   │   └── SupervisorTab.tsx
│   │   │
│   │   ├── reviews/
│   │   │   ├── FeedbackTab.tsx
│   │   │   ├── MeetingHistoryPanel.tsx
│   │   │   ├── ReviewFormDialog.tsx
│   │   │   └── ReviewPeriodDataPanel.tsx
│   │   │
│   │   ├── settings/
│   │   │   └── CampusFormDialog.tsx
│   │   │
│   │   ├── surveys/
│   │   │   └── SurveyFormDialog.tsx
│   │   │
│   │   ├── team/
│   │   │   ├── SupervisorCard.tsx
│   │   │   ├── TeamMemberDetailDialog.tsx
│   │   │   └── TeammateCard.tsx
│   │   │
│   │   ├── ui/
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── mobile-skeletons.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── pull-to-refresh.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── responsive-dialog.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── stat-card.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── swipeable-tabs.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── use-toast.ts
│   │   │
│   │   └── NavLink.tsx
│   │
│   ├── config/
│   │   └── features.ts
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useActivityCategories.ts
│   │   ├── useAdminUsers.ts
│   │   ├── useCampuses.ts
│   │   ├── useCourseAssignments.ts
│   │   ├── useCourseProgress.ts
│   │   ├── useCourses.ts
│   │   ├── useDevelopmentPlans.ts
│   │   ├── useDirectReports.ts
│   │   ├── useEventGoals.ts
│   │   ├── useEventRoles.ts
│   │   ├── useEvents.ts
│   │   ├── useFeedback.ts
│   │   ├── useGoals.ts
│   │   ├── useMeetingConflicts.ts
│   │   ├── useMeetingParticipants.ts
│   │   ├── useMeetingTemplates.ts
│   │   ├── useMeetings.ts
│   │   ├── useMentorship.ts
│   │   ├── useMinistries.ts
│   │   ├── useNotifications.ts
│   │   ├── useOrganizationSettings.ts
│   │   ├── usePathways.ts
│   │   ├── usePeople.ts
│   │   ├── usePrograms.ts
│   │   ├── usePullToRefresh.ts
│   │   ├── useQuarters.ts
│   │   ├── useReviewMeetingHistory.ts
│   │   ├── useReviews.ts
│   │   ├── useSupervisor.ts
│   │   ├── useSurveys.ts
│   │   ├── useSwipeNavigation.ts
│   │   ├── useTeamMembers.ts
│   │   ├── useTeammates.ts
│   │   ├── useUserActionItems.ts
│   │   └── useVisibleFeedback.ts
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── lib/
│   │   └── utils.ts
│   │
│   ├── pages/
│   │   ├── calendar/
│   │   │   ├── EventDetail.tsx
│   │   │   ├── EventEditor.tsx
│   │   │   ├── EventsCalendar.tsx
│   │   │   ├── Programs.tsx
│   │   │   ├── QuarterDetail.tsx
│   │   │   └── Quarters.tsx
│   │   ├── Admin.tsx
│   │   ├── Administration.tsx
│   │   ├── Analytics.tsx
│   │   ├── Auth.tsx
│   │   ├── Courses.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Development.tsx
│   │   ├── Feedback.tsx
│   │   ├── Goals.tsx
│   │   ├── Index.tsx
│   │   ├── Learning.tsx
│   │   ├── Meetings.tsx
│   │   ├── Mentorship.tsx
│   │   ├── Ministries.tsx
│   │   ├── MyLearning.tsx
│   │   ├── NotFound.tsx
│   │   ├── Pathways.tsx
│   │   ├── People.tsx
│   │   ├── Profile.tsx
│   │   ├── Reviews.tsx
│   │   ├── Settings.tsx
│   │   ├── Surveys.tsx
│   │   └── Team.tsx
│   │
│   ├── test/
│   │   ├── components/
│   │   │   ├── Dashboard.test.tsx
│   │   │   └── MeetingTemplateManagement.test.tsx
│   │   ├── hooks/
│   │   │   ├── useGoals.test.tsx
│   │   │   └── useMeetings.test.tsx
│   │   ├── integration/
│   │   │   ├── meeting-workflow.test.tsx
│   │   │   └── role-access.test.tsx
│   │   ├── mocks/
│   │   │   ├── authMock.ts
│   │   │   └── hookMocks.ts
│   │   ├── example.test.ts
│   │   └── setup.ts
│   │
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── supabase/
│   ├── functions/
│   │   ├── generate-notifications/
│   │   │   ├── index.test.ts
│   │   │   └── index.ts
│   │   └── send-notification-email/
│   │       ├── index.test.ts
│   │       └── index.ts
│   ├── migrations/
│   └── config.toml
│
├── .env
├── components.json
├── eslint.config.js
├── index.html
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── package.json
└── README.md
```
