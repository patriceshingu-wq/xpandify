
# Detailed Specs for Tasks 11–20 (Phase 2 Sprints 3–5)

---

## Assessment: What Already Exists

Most of these features have full infrastructure built but are disabled by feature flags:

| Task | Status | What's Needed |
|------|--------|---------------|
| 11. Volunteer "My Schedule" widget | 80% done (MyRolesWidget exists) | Add volunteer dashboard variant |
| 12. Volunteer notification system | 60% done (notification table + edge function exist) | Add role assignment notification trigger |
| 13. Enable Learning Hub | 95% done (full UI exists) | Enable feature flag, verify wiring |
| 14. Course catalog + assignment flow | 95% done (full CRUD exists) | Add "Assign to Person" button from catalog |
| 15. Pathway progress tracking | 90% done (PathwayDetailDialog exists) | Add pathway enrollment + completion tracking |
| 16. Enable Mentorship | 95% done (full UI exists) | Enable feature flag, verify wiring |
| 17. Mentorship check-in flow | 95% done (check-in form in MentorshipDetailDialog) | Already functional |
| 18. Build formal review flow | 95% done (ReviewFormDialog with 3 tabs) | Already functional with ratings + meeting history |
| 19. Self-assessment questionnaire | 0% done | NEW: Build self-assessment form |
| 20. Review + meeting history | 95% done (MeetingHistoryPanel + ReviewPeriodDataPanel) | Already wired into ReviewFormDialog |

---

## Task 11: Volunteer "My Schedule" Widget Enhancement

**Journey:** J7 | **Estimate:** 0.5 days | **Complexity:** Low

### Current State
- `MyRolesWidget` exists on StaffDashboard showing upcoming event role assignments
- No volunteer-specific dashboard view

### What to Build
1. The MyRolesWidget already shows upcoming roles — mark as ✅ DONE
2. Ensure it appears for volunteer users (check role-based dashboard rendering)

### Acceptance Criteria
- [x] MyRolesWidget shows upcoming event roles (already works)
- [ ] Volunteer users see a relevant dashboard with their schedule

---

## Task 12: Volunteer Notification for Role Assignments

**Journey:** J4, J7 | **Estimate:** 1 day | **Complexity:** Medium

### What to Build
1. When an event role is assigned to a person, create a notification for that person
2. Use existing notification system (notifications table + generate-notifications edge function)
3. Add notification creation in `useCreateEventRole` onSuccess callback

### Acceptance Criteria
- [ ] When a role is assigned, the assigned person gets a notification
- [ ] Notification links to the event detail page
- [ ] Notification includes role name and event title

---

## Task 13: Enable Learning Hub

**Journey:** J5 | **Estimate:** 0.5 days | **Complexity:** Low

### Current State
- Full Learning page exists with 3 tabs (Catalog, Pathways, My Progress)
- All hooks exist (useCourses, useCourseProgress, usePathways, useCourseAssignments)
- Feature flag `courses: false` in useFeatureFlags

### What to Build
1. Enable feature flags in organization_settings: `feature_courses = true`, `feature_pathways = true`
2. Verify the Learning nav item appears in sidebar
3. Verify all tabs render correctly

---

## Task 14: Course Catalog + Assignment Flow Enhancement

**Journey:** J5 | **Estimate:** 1 day | **Complexity:** Medium

### Current State
- CourseCatalogTab shows course grid with search/filter
- CourseAssignmentDialog exists for assigning courses to people
- useCourseAssignments hook has full CRUD

### What to Build
1. Add "Assign" button to course cards (for admins/supervisors)
2. Wire CourseAssignmentDialog to be openable from CourseCatalogTab
3. Show assignment count on course cards

---

## Task 15: Pathway Progress Tracking Enhancement

**Journey:** J5 | **Estimate:** 1 day | **Complexity:** Medium

### Current State
- PathwaysTab shows pathway cards with course counts
- PathwayDetailDialog exists for viewing pathway details
- useMyCourseProgress tracks individual course progress

### What to Build
1. In PathwayDetailDialog, show user's progress per course in the pathway
2. Add "Enroll in Pathway" button that starts all courses in the pathway
3. Show overall pathway completion percentage

---

## Task 16: Enable Mentorship

**Journey:** J5 | **Estimate:** 0.5 days | **Complexity:** Low

### Current State
- Full Mentorship page with CRUD, tabs (I'm Mentoring / My Mentors)
- MentorshipDetailDialog with check-in form
- All hooks exist (useMentorship with CRUD + check-ins)
- Feature flag `mentorship: false`

### What to Build
1. Enable feature flag: `feature_mentorship = true`
2. Verify nav item appears and page renders

---

## Task 17: Mentorship Check-in Flow

**Journey:** J5 | **Estimate:** Already done | **Complexity:** N/A

### Assessment
Already fully functional:
- MentorshipDetailDialog has "Log Check-in" button
- Check-in form captures: discussion notes, prayer points, next steps, mentee mood
- useCreateCheckIn, useUpdateCheckIn, useDeleteCheckIn hooks all work
- Check-in history is displayed chronologically

**Status: ✅ DONE — no additional work needed**

---

## Task 18: Formal Review Flow

**Journey:** J5, J6 | **Estimate:** Already done | **Complexity:** N/A

### Assessment
Already fully functional:
- ReviewFormDialog with 3 tabs (Review, Meeting History, Goals & Development)
- 5 rating dimensions (Overall, Spiritual Health, Ministry Effectiveness, Character, Skills)
- MeetingHistoryPanel shows 1:1 meeting history grouped by section + action items
- ReviewPeriodDataPanel shows goals, PDP items, course assignments
- Draft → Finalize workflow works
- Reviews page shows list with star ratings, filters, delete

**Status: ✅ DONE — enable feature flag only**

---

## Task 19: Self-Assessment Questionnaire

**Journey:** J5 | **Estimate:** 2 days | **Complexity:** Medium

### Current State
- No self-assessment capability exists
- performance_reviews table has ratings but they're reviewer-only

### What to Build
1. **Add self-assessment columns** to performance_reviews: `self_overall_rating`, `self_spiritual_rating`, `self_ministry_rating`, `self_character_rating`, `self_skills_rating`, `self_summary_en`, `self_summary_fr`, `self_submitted_at`
2. **Self-Assessment Form**: Allow the person being reviewed to complete their own ratings
3. **Comparison View**: In ReviewFormDialog, show side-by-side self vs reviewer ratings
4. **Notification**: When a review is created, notify the person to complete self-assessment

### Acceptance Criteria
- [ ] Person being reviewed can access and complete self-assessment
- [ ] Self-assessment has same rating dimensions as reviewer assessment
- [ ] Reviewer can see self-assessment alongside their own ratings
- [ ] Self-assessment can be submitted independently of the review

---

## Task 20: Review + Meeting History Integration

**Journey:** J6, J2 | **Estimate:** Already done | **Complexity:** N/A

### Assessment
Already fully functional:
- MeetingHistoryPanel shows all 1:1 meetings for the person within the review period
- Three views: By Section (grouped discussion topics), By Meeting (timeline), Actions (action item summary)
- ReviewPeriodDataPanel shows goals, PDP items, and course assignments
- Both panels are embedded in ReviewFormDialog tabs
- Data is filtered by the review period dates

**Status: ✅ DONE — no additional work needed**

---

## Implementation Summary

Only 4 tasks need actual work:
1. **Enable flags** (Tasks 13, 16, 18): Update organization_settings
2. **Volunteer notifications** (Task 12): Add notification in useCreateEventRole
3. **Course assignment from catalog** (Task 14): Wire button
4. **Self-assessment** (Task 19): Migration + new UI

Tasks 11, 15, 17, 20 are already done or need minimal polish.
