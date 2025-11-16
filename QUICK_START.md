# 🚀 Aurora Premium Backend - Complete Setup & Deployment Guide

## Executive Summary

Full backend integration with:
- ✅ Supabase authentication (signup/login/OTP)
- ✅ PostgreSQL database with Row Level Security
- ✅ Session persistence and token management
- ✅ Subscription tracking and management
- ✅ Forced Premium screen after onboarding
- ⏳ Dodo Payments integration (template ready)

## 📋 Your Next Actions (3 Steps)

### STEP 1: Get Your Supabase Credentials (5 minutes)

```
1. Visit: https://app.supabase.com
2. Click "New Project"
3. Name: "Aurora"
4. Password: (secure password)
5. Region: (closest to you)
6. Wait for creation (2-3 minutes)
7. Copy:
   - Project URL
   - Anon Key (from Settings > API)
```

### STEP 2: Add Environment Variables (2 minutes)

Create `.env.local` in project root:

```bash
# Copy these from Step 1
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

**CRITICAL**: Never commit `.env.local` to git

### STEP 3: Setup Database (3 minutes)

```
In Supabase Dashboard:
1. Go to: SQL Editor
2. Click: New Query
3. Paste: Contents of supabase/database_schema.sql
4. Click: Execute
5. Wait for success message
```

---

## 🔐 Configuration Checklist

```
Supabase Dashboard Settings:

□ Email Authentication
  → Authentication > Providers
  → Enable "Email"
  → Configure templates (optional)

□ Redirect URLs
  → Authentication > URL Configuration
  → Add redirect URLs:
    - exp://localhost:19000/*
    - exp://localhost:19001/*
    - Your production URLs

□ OTP Settings
  → Authentication > Email
  → OTP enabled (should be automatic)
  → Valid for: 1 hour

□ Database
  → Tables created (users, purchases, logs, actions)
  → RLS enabled on all tables
  → Indexes created for performance
```

---

## 👤 User Authentication Flow

### NEW USER: Signup Flow

```
User Journey:
┌─────────────────────────────────┐
│ 1. App Launches After Onboarding│
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 2. Premium Screen Appears (     │
│    FORCED - Can't Skip)         │
│    - Shows $25/year pricing     │
│    - Feature highlights         │
│    - "Purchase" or "Sign in"    │
└────────────────┬────────────────┘
                 │ Clicks "Purchase"
┌────────────────▼────────────────┐
│ 3. Signup Screen                │
│    - Full Name                  │
│    - Email                      │
│    - Password (8+ chars)        │
│    - Confirm Password           │
│    - Accept Terms               │
└────────────────┬────────────────┘
                 │
    ┌────────────▼────────────────┐
    │ Backend: Supabase Auth      │
    │ - Create user account       │
    │ - Send OTP to email         │
    │ - Create user profile in DB │
    └────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 4. OTP Verification             │
│    - Enter 6-digit code         │
│    - 60-second timer            │
│    - Resend button              │
└────────────────┬────────────────┘
                 │
    ┌────────────▼────────────────┐
    │ Backend: Verify OTP         │
    │ - Verify OTP token          │
    │ - Create session            │
    │ - Store access token        │
    └────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 5. Home Screen (Logged In! ✓)   │
│    - User can access app        │
│    - Mood tracking available    │
│    - Premium features enabled   │
└─────────────────────────────────┘
```

### EXISTING USER: Login Flow

```
User Journey:
┌─────────────────────────────────┐
│ 1. Premium Screen               │
│    - "Already have account?"    │
└────────────────┬────────────────┘
                 │ Clicks "Sign in"
┌────────────────▼────────────────┐
│ 2. Login Screen                 │
│    - Email                      │
│    - Password                   │
│    - "Forgot Password?" link    │
└────────────────┬────────────────┘
                 │
    ┌────────────▼────────────────┐
    │ Backend: Authenticate       │
    │ - Verify email/password     │
    │ - Check subscription status │
    │ - If expired: downgrade     │
    │ - Create session            │
    └────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 3. Home Screen (Logged In! ✓)   │
│    - Session persisted          │
│    - Subscription verified      │
└─────────────────────────────────┘
```

### SESSION PERSISTENCE

```
App Restart:
┌─────────────────────────────────┐
│ 1. App Launches                 │
│    - Loads stored token from    │
│      AsyncStorage               │
└────────────────┬────────────────┘
                 │
    ┌────────────▼────────────────┐
    │ Backend: Validate Token     │
    │ - Check with Supabase       │
    │ - If valid: restore user    │
    │ - If expired: clear session │
    └────────────┬────────────────┘
                 │
    ┌────────────▼────────────────┐
    │ If Logged In:               │
    │ Go to Home Screen           │
    │ (Skip Premium/Auth)         │
    │                             │
    │ If Not Logged In:           │
    │ Go to Premium Screen        │
    │ (Show auth options)         │
    └─────────────────────────────┘
```

---

## 💾 Database Structure

### users table
Every user has ONE record:
```
id (UUID)              → Unique identifier
email (TEXT)           → Unique email address
full_name (TEXT)       → User's display name
subscription           → 'free' or 'premium'
subscription_expiry    → NULL or date (when premium ends)
created_at             → When account created
updated_at             → Last profile update
```

### purchases table
Track each payment:
```
id (UUID)              → Payment ID
user_id (UUID)         → Which user
amount (DECIMAL)       → How much paid
currency (TEXT)        → USD, EUR, etc
status                 → completed/failed/refunded
payment_method         → Credit card, etc
transaction_id         → Dodo transaction ID
created_at             → Payment date
```

### logs table
User mood entries:
```
id (UUID)              → Entry ID
user_id (UUID)         → Which user
mood (1-10)            → Mood rating
notes (TEXT)           → Optional notes
tags (TEXT[])          → Associated tags
created_at             → Entry date
```

### actions table
Track user behavior:
```
id (UUID)              → Event ID
user_id (UUID)         → Which user
action_type            → Type of action
data (JSONB)           → Event metadata
created_at             → Event time
```

**All tables use Row Level Security (RLS)**
→ Users can ONLY see/edit their own data

---

## 🔒 Security Features

### Row Level Security (RLS)
```sql
-- Example: users table
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);
```
Result: User only sees their own record ✓

### Password Security
```
✓ Never stored in database
✓ Handled only by Supabase Auth
✓ Never transmitted in plain text
✓ Never logged or exposed
```

### Session Management
```
✓ Token validated on app launch
✓ Token automatically refreshed
✓ Tokens expire after inactivity
✓ User data cleared on logout
```

### Data Isolation
```
✓ Each user's data is private
✓ No cross-user data access
✓ Subscriptions per user
✓ Purchase history per user
```

---

## 📱 Mobile App Integration

### Environment Variables
```
.env.local:
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

### How Auth Works in App
```
1. User submits signup form
   ↓
2. AuthContext.signup() called
   - Creates Supabase auth user
   - Sends OTP to email
   - Creates database profile
   ↓
3. User verifies OTP
   ↓
4. AuthContext.verifyOtp() called
   - Validates OTP token
   - Creates session
   - Stores token in AsyncStorage
   ↓
5. User logged in to app
   - Session persists
   - Can access premium features
```

---

## 💳 Premium Payments (Ready for Integration)

### Pricing
```
$25 USD per year
Includes:
✓ Cloud Sync
✓ Unlimited Entries
✓ Advanced Analytics
✓ Data Backup
✓ Export Data
✓ Priority Support
```

### Payment Flow (TODO - with Dodo)
```
1. User clicks "Purchase Premium"
   ↓
2. App calls Dodo Payments API
   ↓
3. User taken to payment page
   ↓
4. User enters card details
   ↓
5. Payment processed
   ↓
6. App notified (via webhook)
   ↓
7. Supabase updated:
   - subscription = 'premium'
   - subscription_expiry = 1 year from now
   ↓
8. User redirected to Home
   - Now has premium features
```

### Dodo Configuration
```
1. Get Dodo API credentials
2. Add to .env.local:
   EXPO_PUBLIC_DODO_API_KEY=xxxxx
   EXPO_PUBLIC_DODO_MERCHANT_ID=xxxxx
   EXPO_PUBLIC_DODO_API_URL=https://api.dodo-payments.com

3. Implement DodoPaymentsService in Premium screen
4. Handle payment callbacks
5. Update subscription via AuthContext
```

---

## ✅ Testing Checklist

After setup, test each flow:

### [ ] Signup Flow
```
1. Launch app after onboarding
2. Premium screen appears (FORCED)
3. Click "Purchase Premium"
4. Click "Create Account" in Signup
5. Fill form with:
   - Full Name: Test User
   - Email: test@example.com
   - Password: TestPassword123
   - Confirm: TestPassword123
6. Check terms box
7. Click "Sign Up"
   → Wait for "OTP sent"
8. Check your email for 6-digit code
9. Enter code in OTP screen
10. Click "Verify"
    → Should see Home screen ✓
```

### [ ] Login Flow
```
1. Premium screen
2. Click "Already have an account? Sign in"
3. Enter credentials from signup
4. Click "Sign In"
   → Should see Home screen ✓
```

### [ ] Session Persistence
```
1. Login successfully
2. Force close app
3. Reopen app
   → Should show Home screen (no login needed) ✓
```

### [ ] Logout
```
1. In Settings (when implemented)
2. Click Logout
3. Next app launch shows Premium screen ✓
```

### [ ] Subscription Verification
```
1. Login with account
2. App checks subscription status
3. If premium: all features available
4. If free: shows "upgrade" prompts
```

---

## 🐛 Troubleshooting

### OTP Code Not Received
```
Issue: Email not arriving
Fix:
1. Check spam folder
2. Verify email in Supabase > Authentication
3. Check email templates in Supabase
4. Try different email address
5. Wait 5-10 seconds before resending
```

### Cannot Create Account
```
Issue: "Email already exists" error
Fix:
1. Use a different email address
2. OR delete user in Supabase > Authentication > Users
3. Verify email format (must have @)
4. Check password is 8+ characters
```

### Login Says "Invalid Credentials"
```
Issue: Can't login
Fix:
1. Verify email is correct (check capitalization)
2. Verify password is exact (case-sensitive)
3. Confirm account was fully created (OTP verified)
4. Try another email account
5. Check Supabase project is active
```

### App Shows "No Database Connection"
```
Issue: Can't reach Supabase
Fix:
1. Check .env.local has correct URL
2. Check .env.local has correct API key
3. Verify Supabase project is active
4. Test URL in browser (should give 404 or redirect)
5. Check internet connection
```

### Session Lost on App Restart
```
Issue: Logged out after restart
Fix:
1. Check AsyncStorage is working
2. Verify token wasn't expired
3. Check Supabase is still accessible
4. Look at console for error messages
5. Try logout then login again
```

---

## 📊 Monitoring & Analytics

### What to Monitor
```
✓ Signup completion rate
✓ OTP verification success
✓ Login success rate
✓ Session persistence
✓ Subscription conversions
✓ Payment failures
✓ User retention
```

### Database Queries
```sql
-- Count total users
SELECT COUNT(*) FROM users;

-- Count premium users
SELECT COUNT(*) FROM users WHERE subscription = 'premium';

-- Recent signups
SELECT email, created_at FROM users 
ORDER BY created_at DESC LIMIT 10;

-- Recent purchases
SELECT user_id, amount, status, created_at FROM purchases
ORDER BY created_at DESC;

-- Expired subscriptions
SELECT id, email, subscription_expiry FROM users
WHERE subscription = 'premium' 
AND subscription_expiry < NOW();
```

---

## 🚀 Deployment Checklist

### Before Production:
```
□ Supabase project in production tier
□ All environment variables configured
□ RLS policies enabled
□ Email templates configured
□ Redirect URLs updated
□ Database backups enabled
□ Error logging setup (Sentry)
□ Payment webhooks configured
□ Support email setup
□ Privacy policy linked
□ Terms of service linked
```

### Monitoring:
```
□ Error tracking enabled
□ Performance monitoring
□ User analytics
□ Payment tracking
□ Database performance
□ Uptime monitoring
```

---

## 📞 Support & Resources

### Documentation Files in Project:
- `SUPABASE_SETUP.md` - Detailed setup
- `BACKEND_INTEGRATION.md` - Architecture
- `IMPLEMENTATION_SUMMARY.md` - What's built

### External Resources:
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

### Supabase Support:
- Email: support@supabase.com
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.io

---

## ⏱️ Quick Timeline

```
⏱️ 5 min:  Create Supabase project
⏱️ 2 min:  Add environment variables
⏱️ 3 min:  Execute database schema
⏱️ 2 min:  Configure email auth
⏱️ 2 min:  Test signup flow
⏱️ 2 min:  Test login flow
⏱️ 2 min:  Test OTP verification
────────────────────────────────
📊 ~20 minutes: Complete setup & testing
```

---

## 🎯 Success Indicators

You'll know everything works when:

✅ **Signup Works**
- Fill form → Enter OTP → See Home screen

✅ **Login Works**
- Enter credentials → Authenticated → See Home screen

✅ **Session Persists**
- Close app → Reopen → Already logged in

✅ **Database Connected**
- New user appears in Supabase > Tables > users

✅ **Subscriptions Work**
- Premium checkbox appears for logged-in users
- Subscription status matches database

---

**Status: Ready for Production Setup**
**Next Step: Create Supabase account and add credentials**

Questions? Check the detailed guides:
- SUPABASE_SETUP.md
- BACKEND_INTEGRATION.md
- IMPLEMENTATION_SUMMARY.md
