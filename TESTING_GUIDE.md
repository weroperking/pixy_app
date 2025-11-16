# Aurora App - Complete Testing Guide

End-to-end testing for the entire Premium Purchase & Authentication system.

**Status**: ✅ All components ready for testing

---

## Quick Start Testing (5 minutes)

### Prerequisites
- Supabase project created
- Environment variables configured in `.env.local`
- Dodo Payments account (optional, can test signup without payment)
- Android emulator or iOS simulator running

### Test 1: Verify Environment Configuration
```bash
# In project root, check .env.local has all required variables:
cat .env.local

# Should contain:
# EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx
# EXPO_PUBLIC_DODO_API_KEY=xxxxx
# EXPO_PUBLIC_DODO_MERCHANT_ID=xxxxx
# EXPO_PUBLIC_DODO_API_URL=https://api.dodopayments.com
# EXPO_PUBLIC_BACKEND_URL=https://your-backend.com (optional for first test)
```

### Test 2: Start App and Reach Premium Screen
```bash
# Install dependencies
npm install

# Start Expo
npm start

# On emulator/simulator:
# 1. Press 'a' for Android or 'i' for iOS
# 2. App should launch and show onboarding
# 3. Swipe through onboarding (2-3 screens)
# 4. After onboarding, MUST see Premium screen
# 5. Verify: "Purchase Premium - $25/year" button visible
```

### Test 3: Test Navigation Without Payment
```bash
# On Premium Screen:
# Click "Already have an account? Sign in"
# Should navigate to Login Screen

# Check Login Screen appears with:
# ✓ Email input field
# ✓ Password input field  
# ✓ Eye icon for password toggle
# ✓ "Forgot password?" link
# ✓ Sign up link at bottom

# Click "Don't have an account? Sign up"
# Should navigate to Signup Screen

# Check Signup Screen has:
# ✓ Full Name field
# ✓ Email field
# ✓ Password field
# ✓ Confirm Password field
# ✓ Terms & Conditions checkbox
# ✓ Sign up button
# ✓ Sign in link
```

---

## Detailed Testing: Authentication Flow

### Test Suite 1: Signup Flow

**Goal**: Test user registration with Supabase Auth

#### Test 1.1: Valid Signup
```
Steps:
1. Start app and navigate to Premium screen
2. Click "Already have an account? Sign in"
3. Click "Don't have an account? Sign up"
4. Fill signup form:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "SecurePassword123!"
   - Confirm Password: "SecurePassword123!"
   - Check "I agree to Terms & Conditions"
5. Tap "Sign up" button

Expected Results:
✓ Loading indicator shows briefly
✓ Navigate to OTP Verification screen
✓ Show message: "Enter the 6-digit code sent to test@example.com"
✓ 6 digit input fields appear
✓ 60-second countdown timer visible
✓ No errors in console

Backend Verification:
✓ User created in Supabase Auth
✓ OTP email received (check spam folder)
✓ User row created in `users` table with status='free'
```

**Debugging Tips:**
- Check console for auth errors
- Verify email in Supabase Auth dashboard
- Check SUPABASE_URL and ANON_KEY are correct
- If no OTP email: Check spam folder, verify email config in Supabase

#### Test 1.2: Validation - Weak Password
```
Steps:
1. Go to Signup screen
2. Fill form with weak password:
   - Full Name: "Test User"
   - Email: "test2@example.com"
   - Password: "123"
   - Confirm Password: "123"
3. Tap "Sign up"

Expected Results:
✓ Error message appears: "Password must be at least 8 characters"
✓ Form stays on Signup screen
✓ No navigation occurs
```

#### Test 1.3: Validation - Password Mismatch
```
Steps:
1. Go to Signup screen
2. Fill form with mismatched passwords:
   - Password: "SecurePassword123!"
   - Confirm Password: "DifferentPassword456!"
3. Tap "Sign up"

Expected Results:
✓ Error message: "Passwords do not match"
✓ Form stays on Signup screen
✓ No API call made
```

#### Test 1.4: Validation - Invalid Email
```
Steps:
1. Go to Signup screen
2. Fill form with invalid email:
   - Email: "invalid-email"
3. Tap "Sign up"

Expected Results:
✓ Error message: "Please enter a valid email"
✓ Form stays on Signup screen
```

#### Test 1.5: Validation - Duplicate Email
```
Steps:
1. Sign up successfully with "test@example.com"
2. Complete OTP verification
3. Log out (navigate back to Premium)
4. Try to sign up again with same email
5. Tap "Sign up"

Expected Results:
✓ Error message: "Email already registered"
✓ Or: "User already exists"
✓ Form stays on Signup screen
```

---

### Test Suite 2: OTP Verification Flow

**Goal**: Test email verification via 6-digit OTP

#### Test 2.1: Valid OTP Entry
```
Steps:
1. Complete signup flow
2. Navigate to OTP Verification screen
3. Check email (including spam) for OTP
4. Enter 6-digit code in OTP input fields
5. Tap "Verify"

Expected Results:
✓ Loading indicator shows
✓ Navigate to Home screen (or Dashboard)
✓ User is now authenticated
✓ Session token stored in AsyncStorage
✓ User can access premium features

Backend Verification:
✓ Supabase Auth: User email_confirmed = true
✓ `users` table: User has valid session
```

**Getting OTP Email:**
- Check email inbox
- If not received, check spam/promotions folder
- If still not received:
  - Verify email config in Supabase → Settings → Email
  - Check Supabase Auth logs: Settings → Auth Providers
  - Test email by resetting password

#### Test 2.2: Resend OTP
```
Steps:
1. On OTP Verification screen
2. Wait for timer to show "0:00"
3. Tap "Resend Code" button
4. Should receive new OTP email

Expected Results:
✓ Button is disabled until timer reaches 0
✓ New OTP code sent to email
✓ Timer resets to 60 seconds
✓ Can enter new code and verify
```

#### Test 2.3: Invalid OTP Code
```
Steps:
1. On OTP Verification screen
2. Enter wrong 6-digit code (e.g., "000000")
3. Tap "Verify"

Expected Results:
✓ Error message: "Invalid OTP code"
✓ Or: "Verification code incorrect"
✓ Stays on OTP screen
✓ Can retry with correct code
```

#### Test 2.4: Expired OTP
```
Steps:
1. On OTP Verification screen
2. Wait 30+ minutes (OTP typically expires after 10-30 min)
3. Enter the old code
4. Tap "Verify"

Expected Results:
✓ Error message: "OTP has expired"
✓ Suggest: "Tap Resend Code to get a new one"
✓ Can request new OTP
```

---

### Test Suite 3: Login Flow

**Goal**: Test user login with existing account

#### Test 3.1: Valid Login
```
Steps:
1. Complete signup and OTP verification
2. Log out (or navigate back to Premium)
3. Go to Premium screen → "Already have account? Sign in"
4. Enter credentials:
   - Email: test@example.com
   - Password: SecurePassword123!
5. Tap "Sign in"

Expected Results:
✓ Loading indicator shows briefly
✓ Navigate to Home screen
✓ User is authenticated
✓ Session token stored
✓ Can access all app features

Backend Verification:
✓ Session created in Supabase Auth
✓ Token stored in AsyncStorage
✓ User subscription status checked (free or premium)
```

#### Test 3.2: Invalid Password
```
Steps:
1. Go to Login screen
2. Enter credentials:
   - Email: test@example.com
   - Password: WrongPassword123!
3. Tap "Sign in"

Expected Results:
✓ Error message: "Invalid email or password"
✓ Stay on Login screen
✓ Can retry
✓ No session created
```

#### Test 3.3: Non-existent Email
```
Steps:
1. Go to Login screen
2. Enter credentials:
   - Email: nonexistent@example.com
   - Password: SomePassword123!
3. Tap "Sign in"

Expected Results:
✓ Error message: "Invalid email or password"
✓ (Don't reveal which part is wrong for security)
✓ Stay on Login screen
```

#### Test 3.4: Session Persistence
```
Steps:
1. Log in successfully
2. Close app completely
3. Reopen app
4. Should automatically show Home screen (not Premium)

Expected Results:
✓ App checks AsyncStorage for session token
✓ Verifies token with Supabase
✓ Auto-logs in user
✓ No need to log in again
✓ User session persists

If user token expired:
✓ Shows login screen
✓ User must log in again
```

#### Test 3.5: Logout
```
Steps:
1. Log in and reach Home screen
2. Navigate to Settings (if available)
3. Tap "Logout" button
4. Should return to Premium screen

Expected Results:
✓ Session cleared from AsyncStorage
✓ Token invalidated
✓ Navigate to Premium screen
✓ Next app open requires login again
```

---

### Test Suite 4: Password Reset Flow

**Goal**: Test forgot password functionality

#### Test 4.1: Password Reset Request
```
Steps:
1. Go to Login screen
2. Tap "Forgot password?"
3. Enter email: test@example.com
4. Tap "Send reset link"

Expected Results:
✓ Loading indicator shows
✓ Success message appears
✓ Email sent with reset link
✓ Can check email for reset link
```

#### Test 4.2: Check Reset Email
```
Steps:
1. Complete password reset request (Test 4.1)
2. Check email inbox for "Reset Password" email
3. Should contain:
   - "Reset Password" button/link
   - Backup reset link
   - Expiration time (usually 24 hours)

Expected Results:
✓ Email received within 1 minute
✓ Link is valid
✓ Can click link to reset password
```

#### Test 4.3: Reset Password
```
Steps:
1. Get reset link from email (Test 4.2)
2. Click reset link in email
3. Browser opens to reset page (or deep link to app)
4. Enter new password:
   - New Password: "NewSecurePassword456!"
   - Confirm: "NewSecurePassword456!"
5. Tap "Reset Password"

Expected Results:
✓ Success message: "Password reset successfully"
✓ Redirect to login screen
✓ Can log in with new password
✓ Old password no longer works
```

---

## Testing: Premium Purchase Flow

**Note**: Requires Dodo Payments backend to be implemented

### Test Suite 5: Checkout Session Creation

**Prerequisites:**
- Backend endpoints implemented (see `/DODO_BACKEND_GUIDE.md`)
- Backend URL in `EXPO_PUBLIC_BACKEND_URL` environment variable
- Dodo API credentials configured

#### Test 5.1: Create Checkout Session
```
Steps:
1. Sign up successfully and verify OTP
2. Should auto-navigate to Home
3. Go back to Premium screen (via navigation)
4. Tap "Purchase Premium - $25/year"

Expected Results:
✓ Loading indicator shows
✓ Backend called to create checkout
✓ Checkout URL opened in browser
✓ Dodo checkout page appears
✓ Shows:
  - Price: $25.00
  - Description: "Aurora Premium - 1 Year"
  - Payment form
  - Card input fields

Console Verification:
✓ No errors about backend URL
✓ No auth errors
✓ API call logs show successful response
```

#### Test 5.2: Test Card Payment
```
Steps:
1. Reach Dodo checkout page (Test 5.1)
2. Enter test card details:
   - Card: 4111 1111 1111 1111
   - Expiry: 12/25
   - CVC: 123
3. Enter any email: test@example.com
4. Complete payment

Expected Results:
✓ Payment processes successfully
✓ "Payment successful" message shown
✓ Browser redirects back to app
✓ Session stored in Supabase

Backend Verification:
✓ Webhook received from Dodo
✓ Webhook signature verified
✓ `users.subscription` updated to 'premium'
✓ `subscription_expiry` set to 1 year from now
✓ Purchase logged in `purchases` table
✓ Confirmation email sent to user
```

#### Test 5.3: Payment Error Handling
```
Steps:
1. Reach Dodo checkout page
2. Enter invalid card: 4000 0000 0000 0002
3. Try to pay

Expected Results:
✓ Dodo shows error: "Card declined"
✓ Payment fails
✓ User can try again with different card
✓ Supabase NOT updated
✓ User still has 'free' subscription
```

#### Test 5.4: Cancel Checkout
```
Steps:
1. Reach Dodo checkout page
2. Tap "Cancel" button (or go back)
3. Redirected back to app

Expected Results:
✓ Return to Premium screen
✓ No payment processed
✓ No Supabase updates
✓ Can try again later
```

---

## Testing: Subscription Verification

**Goal**: Verify subscription status throughout app lifecycle

### Test Suite 6: Subscription Checks

#### Test 6.1: Free User Navigation
```
Steps:
1. Sign up but don't purchase premium
2. Log in and reach Home screen
3. Try to access "Premium Feature" (if any)

Expected Results:
✓ User can log in with free subscription
✓ `users.subscription` = 'free'
✓ Limited features available
✓ Prompts to upgrade when accessing premium features
✓ Can navigate back to Premium screen to purchase
```

#### Test 6.2: Premium User Navigation
```
Steps:
1. Complete signup + OTP + purchase (Tests 1, 2, 5)
2. Log in and reach Home screen

Expected Results:
✓ `users.subscription` = 'premium'
✓ `subscription_expiry` is set (date 1 year from now)
✓ All premium features available
✓ No upgrade prompts
✓ Can access all app sections
```

#### Test 6.3: Subscription Expiry
```
Steps:
1. Premium user logs in
2. Update Supabase directly:
   - subscription_expiry = TODAY (in past)
3. Close and reopen app
4. User logs back in

Expected Results:
✓ App detects expired subscription
✓ Downgrades user to 'free' automatically
✓ Prompts to renew subscription
✓ Redirects to Premium screen
✓ Can purchase again
```

#### Test 6.4: Check Subscription Endpoint
```
Steps:
1. Log in as premium user
2. Make API call (from debug console or test):
   GET /api/dodo/subscription/{userId}

Expected Results:
✓ Response status: 200
✓ Returns: { subscription: { status: 'active', ... } }
✓ `status` field is 'active'
✓ `nextBillingDate` is set correctly
```

---

## Testing: Error Handling & Edge Cases

### Test Suite 7: Resilience

#### Test 7.1: Network Error During Signup
```
Steps:
1. Turn off internet/WiFi
2. Try to sign up
3. Complete form and tap "Sign up"

Expected Results:
✓ Error message: "Network error" or "No internet connection"
✓ Button shows error state
✓ User can retry when internet is back
✓ No incomplete user created in Supabase
```

#### Test 7.2: Network Error During Login
```
Steps:
1. Turn off internet
2. Try to log in
3. Enter credentials and tap "Sign in"

Expected Results:
✓ Error message: "Network error"
✓ Can retry with internet restored
```

#### Test 7.3: Slow Network
```
Steps:
1. Use throttled network (slow 3G):
   - Dev tools → Network → Slow 3G
2. Try signup/login

Expected Results:
✓ Loading indicators show
✓ Buttons disabled while loading
✓ No duplicate submissions
✓ Completes eventually (takes longer)
```

#### Test 7.4: Backend Timeout
```
Steps:
1. Backend server offline/down
2. Try to create checkout session

Expected Results:
✓ Error message after timeout
✓ "Failed to create checkout session"
✓ Can retry
✓ No transaction created
```

---

## Testing: Mobile-Specific

### Test Suite 8: Platform Testing

#### Test 8.1: iOS Specific
```
Steps:
1. Run on iOS simulator (iPhone 14)
2. Test all auth flows
3. Check:
   - Status bar appearance
   - Safe area respected
   - Keyboard behavior
   - Back button navigation

Expected Results:
✓ No layout issues
✓ Text readable (no overlaps)
✓ Buttons easily tappable (44+ pt height)
✓ Form fields scroll above keyboard
```

#### Test 8.2: Android Specific
```
Steps:
1. Run on Android emulator (Pixel 4)
2. Test all auth flows
3. Check:
   - Back button (hardware)
   - Notifications
   - Keyboard behavior (material style)
   - Color rendering

Expected Results:
✓ Back button works correctly
✓ No crashes
✓ Material Design followed
✓ Colors display correctly
```

#### Test 8.3: Screen Sizes
```
Test on different device sizes:
- Small: iPhone SE (375x667)
- Medium: iPhone 12 (390x844)
- Large: iPhone 14 Pro Max (430x932)
- Tablet: iPad (768x1024)

Expected Results:
✓ All layouts responsive
✓ Text readable on all sizes
✓ Buttons accessible on all sizes
✓ No cut-off text or buttons
✓ Good use of space on large screens
```

---

## Complete End-to-End Flow

**Total Time: ~15 minutes**

### The Full Journey
```
1. Start app
   ↓
2. See onboarding
   ↓
3. Navigate to Premium screen (automatically)
   ↓
4. Tap "Purchase Premium"
   ↓
5. (Backend available?) Yes: Go to Dodo checkout → Skip to step 8
   ↓
6. (No backend?) No: Navigate to Signup
   ↓
7. Click "Already have account? Sign in"
   ↓
8. Go to Login screen
   ↓
9. Click "Don't have account? Sign up"
   ↓
10. Fill signup form
   ↓
11. Tap "Sign up"
   ↓
12. Enter OTP code from email
   ↓
13. Reach Home screen (as free user)
   ↓
14. Log out
   ↓
15. Return to Premium screen
   ↓
16. Log in again
   ↓
17. Session persists - logged in automatically
   ↓
18. Log out
   ↓
19. Go to Premium screen
   ↓
20. Back to signup flow (different user)
```

---

## Checklist Before Production

- [ ] All auth flows tested (signup, login, OTP, password reset)
- [ ] Session persistence working
- [ ] Logout clears session
- [ ] Subscription status verified
- [ ] All error messages user-friendly
- [ ] No console errors or warnings
- [ ] Network errors handled gracefully
- [ ] Works on iOS and Android
- [ ] Responsive on different screen sizes
- [ ] Backend endpoints implemented
- [ ] Webhook signature verification working
- [ ] Supabase RLS policies prevent unauthorized access
- [ ] Confirmation emails sending
- [ ] Test card payments working
- [ ] Production Dodo credentials configured
- [ ] SSL/TLS on all endpoints
- [ ] Rate limiting implemented
- [ ] Logs review for security issues
- [ ] Documentation updated
- [ ] Team trained on incident response

---

## Debugging Commands

### Check Local Storage (Async Storage)
```javascript
// Add to AuthContext or any component
import AsyncStorage from '@react-native-async-storage/async-storage';

// View stored data
const stored = await AsyncStorage.getItem('auth');
console.log('Stored auth:', JSON.parse(stored));

// Clear all
await AsyncStorage.clear();
```

### Check Supabase Logs
1. Go to https://supabase.com/dashboard
2. Select project
3. Go to Logs → Auth → Edge Functions
4. See real-time logs for auth operations

### Test Supabase Connection
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Test connection
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data?.session);
console.log('Error:', error);
```

### Monitor Network Calls
```javascript
// In app startup, add network interceptor:
const originalFetch = fetch;
global.fetch = (...args) => {
  console.log('API Call:', args[0], args[1]?.method);
  return originalFetch(...args).then(res => {
    console.log('Response:', res.status);
    return res;
  });
};
```

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Dodo Payments Docs**: https://docs.dodopayments.com
- **React Native**: https://reactnative.dev
- **Expo**: https://docs.expo.dev
- **Our Docs**: See `/BACKEND_INTEGRATION.md` and `DODO_BACKEND_GUIDE.md`

---

## Next Steps

1. ✅ Sign up and verify OTP
2. ✅ Log in and check session
3. ✅ Navigate through all screens
4. ⏳ Implement backend checkout endpoint
5. ⏳ Test payment with Dodo test card
6. ⏳ Deploy to TestFlight/Google Play
7. ⏳ Real payment testing

**Questions?** Check relevant guide files or contact the development team.
