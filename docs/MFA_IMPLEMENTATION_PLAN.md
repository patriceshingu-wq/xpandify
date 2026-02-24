# MFA Implementation Plan for Xpandify

> **Status:** Phase 2 Planning Document
> **Priority:** Post-MVP Enhancement
> **MFA Methods:** TOTP (Authenticator Apps) + SMS
> **Enforcement:** Admin-configurable policy

---

## Context

The application currently uses email/password authentication via Supabase Auth. To enhance security for church staff management, MFA will be added supporting:
- **TOTP** - Google Authenticator, Authy, etc. (primary, no cost)
- **SMS** - Twilio integration for text message codes (secondary, per-message cost)

Organizations can configure MFA policy: optional, required for admins only, or required for all users.

---

## Prerequisites

### Twilio Setup (for SMS MFA)
1. Create Twilio account at twilio.com
2. Get Account SID, Auth Token, and Phone Number
3. Add to Supabase project environment:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
4. Enable Phone MFA in Supabase Dashboard → Authentication → MFA

### Supabase Dashboard Configuration
1. Go to Authentication → Multi-Factor Authentication
2. Enable TOTP factor
3. Enable Phone factor (requires Twilio)
4. Set MFA verification timeout (recommended: 5 minutes)

---

## Implementation Phases

### Phase 1: Core MFA Infrastructure
1. Database migration for MFA policy settings
2. Extend AuthContext with MFA support
3. MFA verification during login flow (TOTP + SMS)

### Phase 2: User Self-Service
4. MFA enrollment UI in Profile page
5. Choose between TOTP or SMS
6. Backup codes generation
7. MFA disable functionality

### Phase 3: Admin Controls
8. Security tab in Admin page
9. Org-wide MFA policy enforcement
10. User MFA status dashboard

---

## Detailed Implementation

### 1. Database Migration

**File:** `supabase/migrations/YYYYMMDD_add_mfa_support.sql`

```sql
-- Add MFA policy fields to organization_settings
ALTER TABLE organization_settings
ADD COLUMN mfa_policy text DEFAULT 'optional' CHECK (mfa_policy IN ('optional', 'required_admins', 'required_all')),
ADD COLUMN mfa_grace_period_days integer DEFAULT 30,
ADD COLUMN mfa_allowed_methods text[] DEFAULT ARRAY['totp', 'sms'];

-- Track MFA preference in profiles
ALTER TABLE profiles
ADD COLUMN mfa_enabled_at timestamp with time zone DEFAULT null,
ADD COLUMN mfa_preferred_method text DEFAULT null CHECK (mfa_preferred_method IN ('totp', 'sms'));
```

### 2. AuthContext Extensions

**File:** `src/contexts/AuthContext.tsx`

```typescript
interface MfaChallenge {
  factorId: string;
  factorType: 'totp' | 'phone';
}

interface AuthContextType {
  // ... existing fields
  mfaRequired: boolean;
  mfaChallenge: MfaChallenge | null;
  verifyMFA: (code: string) => Promise<{ error: Error | null }>;
  enrollMFA: (method: 'totp' | 'sms', phone?: string) => Promise<EnrollResult>;
  unenrollMFA: (factorId: string) => Promise<{ error: Error | null }>;
  getMfaFactors: () => Promise<Factor[]>;
}
```

**Modified signIn flow:**
```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error };

  // Check if user has MFA enrolled
  const factors = data.session?.user?.factors || [];
  if (factors.length > 0) {
    // MFA required - show challenge
    setMfaChallenge({
      factorId: factors[0].id,
      factorType: factors[0].factor_type
    });
    return { requiresMfa: true };
  }

  // Check org policy - does user NEED to enroll?
  const policy = await getMfaPolicy();
  if (shouldRequireMfa(user, policy)) {
    return { requiresMfaSetup: true };
  }

  return { success: true };
};
```

### 3. MFA Hooks

**File:** `src/hooks/useMFA.ts`

```typescript
export function useMFA() {
  // Enroll in TOTP
  const enrollTOTP = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    });
    return {
      qrCode: data?.totp?.qr_code,
      secret: data?.totp?.secret,
      factorId: data?.id,
      error
    };
  };

  // Enroll in SMS
  const enrollSMS = async (phone: string) => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'phone',
      phone
    });
    return { factorId: data?.id, error };
  };

  // Verify MFA code
  const verifyMFA = async (factorId: string, code: string) => {
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId });
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code
    });
    return { session: data?.session, error };
  };

  // Remove MFA factor
  const unenrollMFA = async (factorId: string) => {
    return await supabase.auth.mfa.unenroll({ factorId });
  };

  // List enrolled factors
  const getFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    return [...(data?.totp || []), ...(data?.phone || [])];
  };

  return { enrollTOTP, enrollSMS, verifyMFA, unenrollMFA, getFactors };
}
```

**File:** `src/hooks/useMFAPolicy.ts`

```typescript
export function useMFAPolicy() {
  const { data: settings } = useOrganizationSettings();
  const { roles, isAdminOrSuper } = useAuth();

  const policy = settings?.mfa_policy || 'optional';
  const allowedMethods = settings?.mfa_allowed_methods || ['totp', 'sms'];
  const gracePeriodDays = settings?.mfa_grace_period_days || 30;

  const isMfaRequired = useMemo(() => {
    if (policy === 'required_all') return true;
    if (policy === 'required_admins' && isAdminOrSuper) return true;
    return false;
  }, [policy, isAdminOrSuper]);

  return { policy, allowedMethods, gracePeriodDays, isMfaRequired };
}
```

### 4. Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/auth/MFAVerifyDialog.tsx` | Code input during login |
| `src/components/profile/MFASetupWizard.tsx` | Multi-step enrollment flow |
| `src/components/profile/TOTPSetup.tsx` | QR code + manual entry |
| `src/components/profile/SMSSetup.tsx` | Phone number entry + verify |
| `src/components/profile/BackupCodesDialog.tsx` | Display/regenerate codes |
| `src/components/profile/MFAManagement.tsx` | List/remove factors |
| `src/components/admin/SecuritySettingsTab.tsx` | Org MFA policy config |
| `src/components/admin/UserMFAStatusTable.tsx` | User MFA dashboard |

### 5. Auth Page Updates

**File:** `src/pages/Auth.tsx`

Add modes:
- `'mfa-verify'` - TOTP/SMS code entry after password
- `'mfa-setup'` - First-time MFA enrollment (if policy requires)

```typescript
// After password auth succeeds
if (result.requiresMfa) {
  setAuthMode('mfa-verify');
} else if (result.requiresMfaSetup) {
  setAuthMode('mfa-setup');
}
```

### 6. Profile Security Section

**File:** `src/pages/Profile.tsx`

Add Security card:
```tsx
<Card>
  <CardHeader>
    <CardTitle>{t('profile.security')}</CardTitle>
  </CardHeader>
  <CardContent>
    <MFAManagement />
    {/* Shows enrolled factors, enable/disable buttons */}
  </CardContent>
</Card>
```

### 7. Admin Security Tab

**File:** `src/components/admin/SecuritySettingsTab.tsx`

- MFA Policy selector: Optional / Required for Admins / Required for All
- Allowed methods checkboxes: TOTP, SMS
- Grace period input: 7/14/30 days
- User MFA status table with filters

---

## Files Summary

### To Modify
| File | Changes |
|------|---------|
| `src/contexts/AuthContext.tsx` | Add MFA state, methods, challenge flow |
| `src/pages/Auth.tsx` | Add mfa-verify and mfa-setup modes |
| `src/pages/Profile.tsx` | Add Security section |
| `src/pages/Admin.tsx` | Add Security tab |
| `src/hooks/useOrganizationSettings.ts` | Add MFA policy fields |
| `src/contexts/LanguageContext.tsx` | Add ~40 MFA translations |

### To Create
| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_add_mfa_support.sql` | Schema changes |
| `src/hooks/useMFA.ts` | TOTP/SMS enrollment and verification |
| `src/hooks/useMFAPolicy.ts` | Org policy checks |
| `src/components/auth/MFAVerifyDialog.tsx` | Login challenge UI |
| `src/components/profile/MFASetupWizard.tsx` | Enrollment flow |
| `src/components/profile/TOTPSetup.tsx` | QR code setup |
| `src/components/profile/SMSSetup.tsx` | Phone setup |
| `src/components/profile/BackupCodesDialog.tsx` | Backup codes |
| `src/components/profile/MFAManagement.tsx` | Factor management |
| `src/components/admin/SecuritySettingsTab.tsx` | Admin policies |
| `src/components/admin/UserMFAStatusTable.tsx` | User MFA dashboard |

---

## Translations Required

Add to `LanguageContext.tsx`:
```typescript
// MFA General
'mfa.title': 'Two-Factor Authentication' / 'Authentification à deux facteurs'
'mfa.subtitle': 'Add an extra layer of security' / 'Ajoutez une couche de sécurité supplémentaire'
'mfa.enabled': 'Enabled' / 'Activé'
'mfa.disabled': 'Disabled' / 'Désactivé'

// Setup
'mfa.setup.title': 'Set Up 2FA' / 'Configurer la 2FA'
'mfa.setup.chooseMethod': 'Choose your method' / 'Choisissez votre méthode'
'mfa.setup.totp': 'Authenticator App' / 'Application d\'authentification'
'mfa.setup.sms': 'Text Message (SMS)' / 'Message texte (SMS)'
'mfa.setup.scanQr': 'Scan QR code with your app' / 'Scannez le code QR avec votre app'
'mfa.setup.manualEntry': 'Or enter manually' / 'Ou entrez manuellement'
'mfa.setup.enterPhone': 'Enter your phone number' / 'Entrez votre numéro de téléphone'
'mfa.setup.verifyCode': 'Enter verification code' / 'Entrez le code de vérification'

// Verification
'mfa.verify.title': 'Verify Your Identity' / 'Vérifiez votre identité'
'mfa.verify.enterCode': 'Enter the 6-digit code' / 'Entrez le code à 6 chiffres'
'mfa.verify.useBackup': 'Use backup code' / 'Utiliser un code de secours'
'mfa.verify.sendAgain': 'Send code again' / 'Renvoyer le code'

// Backup Codes
'mfa.backup.title': 'Backup Codes' / 'Codes de secours'
'mfa.backup.description': 'Save these codes in a safe place' / 'Gardez ces codes en lieu sûr'
'mfa.backup.regenerate': 'Generate New Codes' / 'Générer de nouveaux codes'
'mfa.backup.download': 'Download' / 'Télécharger'

// Admin
'mfa.policy.title': 'MFA Policy' / 'Politique MFA'
'mfa.policy.optional': 'Optional (user choice)' / 'Optionnel (choix utilisateur)'
'mfa.policy.requiredAdmins': 'Required for admins' / 'Requis pour les admins'
'mfa.policy.requiredAll': 'Required for all users' / 'Requis pour tous'
'mfa.policy.gracePeriod': 'Grace period (days)' / 'Période de grâce (jours)'
'mfa.policy.allowedMethods': 'Allowed methods' / 'Méthodes autorisées'

// Errors
'mfa.error.invalidCode': 'Invalid code' / 'Code invalide'
'mfa.error.expired': 'Code expired' / 'Code expiré'
'mfa.error.tooManyAttempts': 'Too many attempts' / 'Trop de tentatives'
```

---

## Verification Plan

### Manual Testing
1. **TOTP Enrollment:**
   - Go to Profile → Security
   - Click "Enable 2FA" → Choose "Authenticator App"
   - Scan QR with Google Authenticator
   - Enter code to verify
   - Save backup codes

2. **SMS Enrollment:**
   - Choose "Text Message"
   - Enter phone number
   - Receive and enter SMS code
   - Verify enrollment

3. **Login with MFA:**
   - Sign out
   - Sign in with password
   - Verify MFA prompt appears
   - Enter TOTP/SMS code
   - Verify dashboard access

4. **Admin Policy:**
   - Set policy to "Required for Admins"
   - Create new admin user
   - Verify they're prompted to set up MFA
   - Test grace period

5. **Backup Codes:**
   - Use backup code instead of TOTP
   - Verify code is invalidated after use

### E2E Tests
Create `e2e/mfa.spec.ts`:
- Test MFA enrollment flow
- Test MFA login challenge
- Test backup code usage
- Test admin policy enforcement

---

## Cost Considerations

| Item | Cost |
|------|------|
| TOTP | Free (Supabase built-in) |
| SMS (Twilio) | ~$0.0075 per SMS sent |
| Estimated monthly (100 users, 2 logins/day) | ~$45/month |

Consider SMS only as backup option to minimize costs.

---

## Security Considerations

1. **Backup Codes:** Show only once at enrollment, hash and store
2. **Rate Limiting:** Supabase limits MFA attempts (built-in)
3. **Session Binding:** MFA challenge tied to session
4. **Audit Logging:** Log MFA enable/disable/verify events
5. **Grace Period:** Allow time for setup before enforcement
6. **Phone Verification:** Verify phone ownership before enabling SMS MFA
