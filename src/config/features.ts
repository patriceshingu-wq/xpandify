// src/config/features.ts
/**
 * Feature flags for Xpandify MVP
 * 
 * MVP Timeline: 9 weeks
 * Target: Church staff (10-30 users)
 * 
 * CORE FEATURES (Active):
 * - People & Ministries
 * - Goals (Church → Ministry → Individual with cascade)
 * - 1:1 Meetings
 * - Calendar/Events (Quarters, Programs)
 * - Feedback
 * - PDPs
 * - Admin
 * 
 * PHASE 2 (Hidden):
 * - Full LMS (courses, pathways, assessments)
 * - Mentorship
 * - Formal Reviews
 * - Advanced Analytics
 * - Event Roles & Volunteer Scheduling
 */

export const FEATURES = {
  // ========================================
  // MVP - ACTIVE (Weeks 1-9)
  // ========================================
  
  // Core modules
  people: true,
  ministries: true,
  goals: true,
  meetings: true,
  calendar: true,
  feedback: true,
  pdp: true,
  admin: true,
  
  // Goal features (all levels for MVP)
  goalLevels: {
    church: true,
    ministry: true,
    department: false,      // Phase 2 - skip for MVP
    individual: true,
  },
  
  goalFeatures: {
    parentChildAlignment: true,    // Core MVP
    cascadeView: true,             // Week 4 implementation
    autoRollupProgress: false,     // Phase 2 - manual for MVP
    goalDependencies: false,       // Phase 2
    goalTemplates: false,          // Phase 2
    goalNotifications: false,      // Phase 2
  },
  
  // Meeting features
  meetingTypes: {
    oneOnOne: true,               // MVP - core feature
    team: false,                  // Phase 2
    ministry: false,              // Phase 2
    allStaff: false,              // Phase 2
    review: false,                // Phase 2
  },
  
  meetingFeatures: {
    agendaItems: true,
    linkedGoals: true,            // Link to individual/ministry goals
    linkedFeedback: false,        // Phase 2
    linkedPdpItems: false,        // Use goals with pdp_id instead
    linkedEvents: false,          // Phase 2
    recurringMeetings: false,     // Phase 2 - manual scheduling for MVP
    meetingTemplates: false,      // Phase 2 - use default template
    dragDropRescheduling: false,  // Phase 2
  },
  
  // Calendar features
  calendarFeatures: {
    quarters: true,
    programs: true,
    events: true,
    eventRoles: false,           // Phase 2 - no volunteer scheduling
    eventGoals: false,           // Phase 2 - no event-goal alignment
    activityCategories: false,   // Phase 2 - use ministry as category
    eventRecurrence: false,      // Phase 2
    eventRsvp: false,            // Phase 2
    eventAttendance: false,      // Phase 2
  },
  
  // ========================================
  // PHASE 2 - HIDDEN (Post-MVP)
  // ========================================
  
  // Learning Management System
  courses: false,
  pathways: false,
  assessments: false,
  courseAssignments: false,
  
  // Advanced features
  mentorship: false,
  formalReviews: false,          // Informal feedback only for MVP
  surveys: false,
  analytics: false,              // Basic dashboard widgets only
  
} as const;

/**
 * Helper function to check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature] as boolean;
};

/**
 * Helper to get enabled goal levels
 */
export const getEnabledGoalLevels = () => {
  return Object.entries(FEATURES.goalLevels)
    .filter(([_, enabled]) => enabled)
    .map(([level]) => level);
};

/**
 * Helper to get enabled meeting types
 */
export const getEnabledMeetingTypes = () => {
  return Object.entries(FEATURES.meetingTypes)
    .filter(([_, enabled]) => enabled)
    .map(([type]) => type);
};
