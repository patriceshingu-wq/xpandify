
# Rename "Pastor Supervisor" + Add Change Password to Profile

## 1. Rename "Pastor Supervisor" to "Supervisor"

Update display labels only -- the database enum value `pastor_supervisor` stays the same (no migration needed).

### Files to update

| File | What changes |
|------|-------------|
| `src/contexts/LanguageContext.tsx` | Change `roles.pastor_supervisor` from "Pastor / Supervisor" to "Supervisor" (en) and "Superviseur" (fr). Update `profile.role.pastor_supervisor` description similarly. |
| `src/pages/Profile.tsx` | The role display uses `role.replace('_', ' ')` which currently shows "pastor supervisor" -- update to use the translation key `roles.{role}` instead for proper display. |
| `src/components/admin/UserRoleDialog.tsx` | Same fix: use translation key for role name display instead of raw string replacement. |
| `src/components/admin/UserManagementTable.tsx` | Same fix if it displays role names via string replacement. |

## 2. Add Change Password Section to Profile Page

Add a new card in the right column of the profile page (below the Language and Roles cards).

### UI
- Card titled "Change Password" with a Lock icon
- Two fields: "New Password" and "Confirm Password"
- "Update Password" button
- Client-side validation: passwords must match and be at least 6 characters
- Calls `supabase.auth.updateUser({ password })` on submit
- Shows success/error toast

### Files to update

| File | What changes |
|------|-------------|
| `src/pages/Profile.tsx` | Add password change card with form state, validation, and submit handler |
| `src/contexts/LanguageContext.tsx` | Add translation keys: `profile.changePassword`, `profile.changePasswordDescription`, `profile.confirmPassword`, `profile.passwordUpdated`, `profile.passwordTooShort`, `profile.passwordsMismatch` |

## Technical Notes

- No database migration needed for either change
- Password update uses the existing `supabase.auth.updateUser()` API -- the user is already authenticated via their session
- The `pastor_supervisor` enum value in the database remains unchanged; only UI labels are updated
