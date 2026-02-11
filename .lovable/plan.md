

# Beta Readiness: Test Accounts + Forgot Password Flow

## 1. Create Test Accounts

Create 3 new beta-tester accounts via a database migration that inserts into `auth.users` -- actually, we cannot insert into `auth.users` via migrations. Instead, I will provide instructions for you to create accounts through the Auth page (sign up), then I will assign roles and link people records via migration.

**Better approach**: Since accounts already exist for testing (johnny@montcarmel.org as Admin, deo@montcarmel.org as Staff, cris@montcarmel.org as Volunteer), and bidel@gmail.com / bideldjiki@gmail.com as Super Admin -- these are already usable for beta. If you need additional accounts, you can sign them up through the app and I will assign roles afterward.

## 2. Add Forgot Password Flow

### Changes to `src/pages/Auth.tsx`
- Add a third mode: `'login' | 'signup' | 'forgot'`
- In "forgot" mode, show only the email field and a "Send Reset Link" button
- Call `supabase.auth.resetPasswordForEmail(email, { redirectTo })` 
- Add a "Forgot password?" link below the password field (translation key already exists: `auth.forgotPassword`)
- Show success toast after sending

### New page: `src/pages/ResetPassword.tsx`
- A page at `/reset-password` where users land after clicking the email link
- Reads the token from URL (Supabase appends it automatically)
- Shows a "New Password" + "Confirm Password" form
- Calls `supabase.auth.updateUser({ password })` to set the new password
- Redirects to `/dashboard` on success

### Changes to `src/App.tsx`
- Add route: `/reset-password` as a public route pointing to `ResetPassword`

### Changes to `src/contexts/AuthContext.tsx`
- Add a `resetPassword(email: string)` method that wraps `supabase.auth.resetPasswordForEmail`

### Translation keys (`src/contexts/LanguageContext.tsx`)
- `auth.forgotPasswordTitle`: "Reset your password" / "Reinitialiser votre mot de passe"
- `auth.forgotPasswordDescription`: "Enter your email to receive a reset link" / "Entrez votre courriel pour recevoir un lien"
- `auth.sendResetLink`: "Send Reset Link" / "Envoyer le lien"
- `auth.resetLinkSent`: "Check your email for a reset link" / "Verifiez votre courriel"
- `auth.newPassword`: "New Password" / "Nouveau mot de passe"
- `auth.resetPassword`: "Reset Password" / "Reinitialiser"
- `auth.resetSuccess`: "Password updated successfully" / "Mot de passe mis a jour"
- `auth.backToLogin`: "Back to login" / "Retour a la connexion"

## Summary

No database migrations needed -- the forgot password flow uses built-in auth capabilities. Four files will be changed and one new file created.

