# Supabase Setup Guide

## 1. Create Environment Variables

Create a `.env.local` file in the project root with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 2. Supabase Project Setup

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Get your project URL and API key from Project Settings > API

## 3. Create Database Schema

1. Go to SQL Editor in Supabase Dashboard
2. Create a new query
3. Copy and paste the contents of `supabase/database_schema.sql`
4. Execute the query

This will create:
- `users` table - User profiles and subscription information
- `purchases` table - Track subscription purchases
- `logs` table - Mood tracking entries
- `actions` table - User behavior tracking

## 4. Enable Email Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates (optional)

## 5. Configure OTP Settings

1. Go to Authentication > Email
2. Enable OTP (One-Time Password) for email verification
3. Set OTP validity period (default: 1 hour)

## 6. Configure Redirect URLs

1. Go to Authentication > URL Configuration
2. Add authorized redirect URLs:
   - `exp://localhost:19000/*`
   - `exp://localhost:19001/*`
   - Your production app URL

## 7. User Flow

### Signup Flow
1. User enters email, password, full name → Signup screen
2. AuthContext.signup() creates user in Supabase Auth
3. OTP sent to user email
4. User enters OTP → OTPVerification screen
5. AuthContext.verifyOtp() verifies OTP
6. User profile created in database
7. Session token stored in AsyncStorage
8. Redirected to Home

### Login Flow
1. User enters email and password → Login screen
2. AuthContext.login() authenticates with Supabase
3. Subscription status verified
4. If expired, marked as free
5. Session token stored
6. Redirected to Home

### Premium Purchase Flow
1. After Onboarding → Premium screen
2. User can purchase or navigate to Login
3. Dodo Payments integration processes payment (TODO)
4. updateSubscription() marks user as premium
5. Navigation routing based on `premium_purchase` action flag

## 8. API Endpoints Setup

### For Dodo Payments Integration

Create a backend service that:
1. Receives payment requests from the app
2. Calls Dodo Payments API
3. Updates user subscription in Supabase
4. Returns payment confirmation

Example endpoint: `POST /api/payments/subscribe`

```json
{
  "user_id": "uuid",
  "amount": 2500,
  "currency": "USD",
  "payment_method": "card"
}
```

## 9. Testing

### Test Signup
- Navigate to Premium screen (after Onboarding)
- Click "Purchase Premium"
- Fill in signup form
- Use a test email (e.g., test@example.com)
- Enter OTP from Supabase test email
- Should be redirected to Home

### Test Login
- Click "Already have an account? Sign in"
- Login with credentials created during signup
- Should be redirected to Home

### Test Session Persistence
- Login successfully
- Kill and restart app
- Should automatically restore session
- User data should be available

## 10. Database Queries (if needed)

```sql
-- Get user with subscription info
SELECT * FROM users WHERE id = 'user-id';

-- Get user's recent logs
SELECT * FROM logs WHERE user_id = 'user-id' 
ORDER BY created_at DESC LIMIT 30;

-- Get purchase history
SELECT * FROM purchases WHERE user_id = 'user-id' 
ORDER BY created_at DESC;

-- Mark expired subscriptions as free
UPDATE users 
SET subscription = 'free', subscription_expiry = NULL
WHERE subscription = 'premium' 
AND subscription_expiry < NOW();
```

## 11. Important Notes

- All table operations are secured with Row Level Security (RLS)
- Users can only access their own data
- Tokens are validated on app launch (AuthContext.restoreToken)
- Subscriptions are validated on each login
- Premium screen is forced before accessing app (unless premium purchase completed)

## 12. Troubleshooting

### OTP not received
- Check spam folder
- Ensure email provider is enabled in Supabase
- Check email templates configuration

### Cannot create user
- Check if email already exists
- Verify email format is valid
- Check RLS policies are correct

### Session not persisting
- Clear app cache and storage
- Check AsyncStorage permissions
- Verify token validation logic

For more help, refer to:
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
