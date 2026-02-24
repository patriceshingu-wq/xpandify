

# Fix Invitation Redirect to Custom Domain

## Problem
Invited users are being redirected to the Lovable preview/published URL instead of the custom domain `xpandify.wearemc.church`.

## Changes

### 1. Update `src/hooks/useInviteUser.ts`
- Change the `redirect_to` value from `window.location.origin` to `https://xpandify.wearemc.church/auth`

### 2. Update `supabase/functions/invite-user/index.ts`
- Change the fallback redirect URL from using the request origin to `https://xpandify.wearemc.church/auth`

### 3. Backend Auth Configuration
- Add `https://xpandify.wearemc.church` to the allowed redirect URLs in the authentication settings so the auth system accepts this domain as a valid redirect target.

## Technical Details

**`src/hooks/useInviteUser.ts`** (line ~51):
```typescript
// Before
redirect_to: `${window.location.origin}/auth`,

// After
redirect_to: 'https://xpandify.wearemc.church/auth',
```

**`supabase/functions/invite-user/index.ts`** (line ~124):
```typescript
// Before
const redirectTo = payload.redirect_to || `${req.headers.get('origin')}/auth`;

// After
const redirectTo = payload.redirect_to || 'https://xpandify.wearemc.church/auth';
```

