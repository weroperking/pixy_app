# Aurora Premium Backend Integration

Complete backend setup guide for Aurora mood tracker app with Supabase authentication and Dodo Payments integration.

## Overview

This setup provides:
- ✅ Email/Password authentication with Supabase Auth
- ✅ OTP verification for email confirmation
- ✅ User profile management in PostgreSQL
- ✅ Session persistence with AsyncStorage
- ✅ Row Level Security (RLS) for data protection
- ⏳ Dodo Payments integration (template provided)
- 📊 Mood tracking database with user isolation

## Quick Start

### 1. Environment Setup

Create `.env.local` in project root:
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Dodo Payments (Optional)
EXPO_PUBLIC_DODO_API_KEY=your-dodo-api-key
EXPO_PUBLIC_DODO_MERCHANT_ID=your-merchant-id
EXPO_PUBLIC_DODO_API_URL=https://api.dodo-payments.com
```

### 2. Supabase Project Creation

```bash
# 1. Visit https://app.supabase.com
# 2. Create new project
# 3. Wait for initialization
# 4. Copy URL and Anon Key to .env.local
```

### 3. Database Setup

```bash
# In Supabase Dashboard > SQL Editor:
# 1. Create new query
# 2. Copy contents of supabase/database_schema.sql
# 3. Execute the query
```

### 4. Email Authentication

```
Supabase Dashboard > Authentication > Providers:
✓ Enable Email
✓ Configure email templates (if needed)
✓ Test with a test email
```

### 5. Redirect URLs

```
Supabase Dashboard > Authentication > URL Configuration:
Add:
- exp://localhost:19000/*
- exp://localhost:19001/*
- Your production URLs
```

## Architecture

### User Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│ App Launch                                          │
└──────────────────────┬──────────────────────────────┘
                       │
                ┌──────▼──────┐
                │ Onboarding? │
                └──────┬──────┘
                       │ NO
        ┌──────────────▼──────────────┐
        │ Check hasActionDone         │
        │ ('premium_purchase')        │
        └──────────────┬──────────────┘
                       │ NO
        ┌──────────────▼───────────────┐
        │ Premium Screen (FORCED)      │
        │ - $25/year pricing           │
        │ - Feature list               │
        │ - Purchase or Sign in        │
        └──────────────┬───────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
    ┌─────▼─────┐          ┌────────▼───────┐
    │ Purchase  │          │ Sign in (Login)│
    │ (Dodo)    │          └────────┬───────┘
    └─────┬─────┘                   │
          │                ┌────────▼────────┐
          │                │ Enter credentials
          │                │ Verify with      │
          │                │ Supabase        │
          │                └────────┬────────┘
          │                         │
    ┌─────▼────────────┐   ┌────────▼────────────────┐
    │ Signup Screen    │   │ Check subscription     │
    │ - Email          │   │ status & expiry        │
    │ - Password       │   └────────┬───────────────┘
    │ - Full Name      │            │
    │ - Terms agree    │   ┌────────▼────────────┐
    └─────┬────────────┘   │ If premium expired:  │
          │                │ Mark as free        │
    ┌─────▼──────────────┐ └────────┬────────────┘
    │ Create user        │          │
    │ (Supabase Auth)    │   ┌──────▼──────┐
    └─────┬──────────────┘   │ Home Screen │
          │                  │ (Auth'd)    │
    ┌─────▼──────────────┐   └─────────────┘
    │ OTP Verification   │
    │ - 6-digit code     │
    │ - 60s timer        │
    │ - Email confirm    │
    └─────┬──────────────┘
          │
    ┌─────▼──────────────┐
    │ Verify OTP         │
    │ (Supabase Auth)    │
    └─────┬──────────────┘
          │
    ┌─────▼──────────────┐
    │ Home Screen        │
    │ (Auth'd)           │
    └────────────────────┘
```

## File Structure

```
project-root/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          (Auth state management)
│   ├── lib/
│   │   ├── supabase.ts              (Supabase client)
│   │   └── dodoPayments.ts          (Dodo Payments integration)
│   ├── screens/
│   │   ├── Premium/
│   │   │   └── index.tsx            (Premium pricing screen)
│   │   └── Auth/
│   │       ├── Signup.tsx           (User registration)
│   │       ├── Login.tsx            (User authentication)
│   │       ├── OTPVerification.tsx  (Email verification)
│   │       └── ForgotPassword.tsx   (Password reset)
│   └── navigation/
│       └── index.tsx                (Navigation with auth flow)
│
├── supabase/
│   └── database_schema.sql          (Database tables & RLS)
│
└── SUPABASE_SETUP.md                (Detailed setup guide)
```

## Database Schema

### users table
- `id` (UUID) - Primary key
- `email` (TEXT) - Unique email address
- `full_name` (TEXT) - User's name
- `subscription` (TEXT) - 'free' or 'premium'
- `subscription_expiry` (TIMESTAMP) - When premium expires
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last update time

### purchases table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `amount` (DECIMAL) - Payment amount
- `currency` (TEXT) - Payment currency
- `status` (TEXT) - 'pending', 'completed', 'failed', 'refunded'
- `payment_method` (TEXT) - Payment method used
- `transaction_id` (TEXT) - Dodo transaction ID
- `created_at` (TIMESTAMP) - Purchase time
- `updated_at` (TIMESTAMP) - Last update time

### logs table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `mood` (INTEGER) - 1-10 mood scale
- `notes` (TEXT) - Optional notes
- `tags` (TEXT[]) - Associated tags
- `created_at` (TIMESTAMP) - Entry creation time
- `updated_at` (TIMESTAMP) - Last update time

### actions table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `action_type` (TEXT) - Type of action
- `data` (JSONB) - Action metadata
- `created_at` (TIMESTAMP) - Action time

## Authentication Flow

### Signup Process
1. User fills signup form with email, password, name
2. `AuthContext.signup()` called:
   - Creates user in Supabase Auth
   - Creates user profile in database
   - Sends OTP to email
3. User verifies OTP
4. `AuthContext.verifyOtp()` called:
   - Verifies OTP token
   - Creates auth session
   - Stores session token in AsyncStorage
5. User logged in automatically

### Login Process
1. User enters email and password
2. `AuthContext.login()` called:
   - Authenticates with Supabase
   - Fetches user profile
   - Checks subscription expiry
   - Updates to 'free' if expired
   - Stores session token
3. User redirected to home

### Session Management
1. On app launch, `AuthContext.restoreToken()` called
2. Validates stored token with Supabase
3. Restores user data if valid
4. Clears data if token expired
5. App uses `isSignedIn` to show appropriate UI

## Security

### Row Level Security (RLS)
All tables have RLS policies:
- Users can only read/write their own data
- Delete operations also protected
- Logged-in users identified via `auth.uid()`

### Data Protection
- All passwords handled by Supabase Auth
- Tokens stored in AsyncStorage
- Sensitive data never exposed to client
- OTP tokens validated server-side

### Best Practices
- Never store passwords locally
- Always validate tokens on app startup
- Clear data on logout
- Use HTTPS for all requests
- Keep API keys in environment variables

## Premium Subscription

### Pricing
- $25 USD per year
- Includes all features
- Cancellable anytime

### Payment Flow (TODO)
1. User clicks "Purchase Premium"
2. App initiates Dodo Payment
3. User redirected to payment page
4. Payment processed
5. Webhook notifies app
6. Subscription updated in database
7. User redirected to home

### Subscription Verification
- Checked on every login
- Expiry compared with current time
- Automatically downgraded if expired
- User can purchase again anytime

## Testing Checklist

- [ ] Create account with signup
- [ ] Receive and enter OTP
- [ ] Successfully logged in
- [ ] User data persists after app restart
- [ ] Can logout
- [ ] Login with existing account
- [ ] Subscription status verified
- [ ] Premium screen appears after onboarding
- [ ] Navigation between Premium, Signup, Login works

## Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| OTP not received | Email not configured | Enable Email provider in Supabase |
| Can't create user | Email already exists | Use unique email or clear database |
| Session lost on restart | Token expired | Implement token refresh logic |
| RLS policy errors | User not identified | Check auth.uid() availability |
| 404 on API calls | Supabase URL wrong | Verify URL in .env.local |

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Configure email authentication
3. ✅ Create database schema
4. ⏳ Test authentication flows
5. ⏳ Integrate Dodo Payments
6. ⏳ Set up payment webhooks
7. ⏳ Deploy to production

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [PostgreSQL RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Dodo Payments API](https://docs.dodo-payments.com)
- [React Native Async Storage](https://react-native-async-storage.github.io/async-storage/)

## Support

For issues or questions:
1. Check SUPABASE_SETUP.md for detailed instructions
2. Review Supabase documentation
3. Check React Native console for errors
4. Verify environment variables are set

---

**Last Updated**: November 2025
**Status**: Backend core setup complete, awaiting Dodo Payments integration
