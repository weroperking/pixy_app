# Dodo Payments - Backend Integration Guide

This guide explains how to implement the backend endpoints required for Dodo Payments integration with the Aurora app.

**Status**: ✅ Mobile app integration complete → ⏳ Backend implementation needed

---

## Overview

The Aurora app uses a **secure 3-tier architecture** for payments:

```
Mobile App (React Native)
    ↓
Your Backend Server (Node.js/Python/Java)
    ↓
Dodo Payments API
```

**Why this architecture?**
- Mobile apps cannot safely store API keys
- Backend validates all requests
- Webhook signatures verified securely on backend
- Subscription status synced to Supabase

---

## Architecture Diagram

```
┌─────────────────────┐
│  Mobile App         │
│  (React Native)     │
│                     │
│ - User enters email │
│ - Clicks "Purchase" │
│ - Calls backend     │
└──────────┬──────────┘
           │
    POST /api/dodo/create-checkout
           │
    ┌──────▼───────────────────────┐
    │ Your Backend Server           │
    │ (Node.js/Python/Java)        │
    │                              │
    │ 1. Validate user email       │
    │ 2. Create checkout session   │
    │ 3. Call Dodo API             │
    │ 4. Return checkout URL       │
    └──────┬──────────────────────┘
           │
           │ POST /checkouts
           │
    ┌──────▼────────────────────┐
    │ Dodo Payments API         │
    │                           │
    │ {                         │
    │   id: "session_123",      │
    │   url: "https://..."      │
    │ }                         │
    └──────────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ Mobile App Opens Checkout    │
    │ (User enters card details)   │
    │ (Dodo handles payment)       │
    └──────────────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ Dodo Webhook                │
    │ (After payment)             │
    │                             │
    │ POST /webhooks/dodo         │
    │ (Sent to your backend)      │
    └──────┬───────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ Your Backend:               │
    │ 1. Verify webhook signature │
    │ 2. Get payment details      │
    │ 3. Update Supabase          │
    │ 4. Send confirmation email  │
    └──────────────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ Supabase                     │
    │ - users.subscription='premium'
    │ - users.subscription_expiry= │
    │   DATE + 1 year             │
    │ - purchases table updated   │
    └──────────────────────────────┘
```

---

## Required Backend Endpoints

Your backend must implement these 5 endpoints:

### 1. Create Checkout Session
```
POST /api/dodo/create-checkout

REQUEST:
{
  "userId": "user_123",
  "email": "user@example.com",
  "amount": 2500,              // in cents ($25.00)
  "currency": "USD",
  "description": "Aurora Premium - 1 Year",
  "successUrl": "auroras://premium-success",
  "cancelUrl": "auroras://premium-cancel",
  "metadata": {
    "subscriptionType": "premium_yearly",
    "userId": "user_123"
  }
}

RESPONSE (Success 200):
{
  "sessionId": "sess_12345",
  "checkoutUrl": "https://checkout.dodo.com/...",
  "message": "Checkout session created successfully"
}

RESPONSE (Error 400/500):
{
  "success": false,
  "message": "Failed to create checkout",
  "code": "CHECKOUT_CREATION_FAILED"
}
```

**Implementation Notes:**
- Validate email format
- Check amount is 2500 (cents)
- Call Dodo API: `POST https://api.dodopayments.com/checkouts`
- Dodo returns `id` and `url`
- Map and return to mobile app

---

### 2. Get Checkout Session Status
```
GET /api/dodo/checkout/{sessionId}

RESPONSE (Success 200):
{
  "id": "sess_12345",
  "status": "open|expired|completed",
  "paymentStatus": "pending|success|failed",
  "customerId": "cust_456",
  "metadata": {...}
}

RESPONSE (Not Found 404):
{
  "success": false,
  "message": "Session not found",
  "code": "SESSION_NOT_FOUND"
}
```

**Implementation Notes:**
- Query Dodo API: `GET /checkouts/{id}`
- Return status to mobile
- Mobile uses this to verify payment completion

---

### 3. Get User Subscription
```
GET /api/dodo/subscription/{userId}

RESPONSE (Success 200):
{
  "id": "sub_123",
  "status": "active|inactive|canceled|past_due",
  "customerId": "cust_456",
  "nextBillingDate": "2025-12-15",
  "canceledAt": null,
  "metadata": {
    "subscriptionType": "premium_yearly"
  }
}

RESPONSE (Not Found 404):
{
  "success": false,
  "message": "No active subscription",
  "code": "NO_SUBSCRIPTION"
}
```

**Implementation Notes:**
- Query Supabase `users` table for subscription status
- Verify subscription hasn't expired
- Return subscription details
- Mobile uses this to check premium status

---

### 4. Cancel Subscription
```
POST /api/dodo/subscription/{userId}/cancel

REQUEST: {} (empty body)

RESPONSE (Success 200):
{
  "id": "sub_123",
  "status": "canceled",
  "canceledAt": "2024-12-15T10:30:00Z"
}

RESPONSE (Error 404):
{
  "success": false,
  "message": "No active subscription to cancel",
  "code": "NO_SUBSCRIPTION"
}
```

**Implementation Notes:**
- Find Dodo subscription in Supabase
- Call Dodo API to cancel
- Update Supabase: `users.subscription = 'free'`
- Set `canceled_at` timestamp
- Return confirmation to mobile

---

### 5. Update Subscription
```
POST /api/dodo/subscription/{userId}/update

REQUEST:
{
  "planId": "plan_premium_yearly|plan_premium_monthly"
}

RESPONSE (Success 200):
{
  "id": "sub_123",
  "planId": "plan_premium_yearly",
  "status": "active",
  "nextBillingDate": "2025-12-15"
}

RESPONSE (Error 400):
{
  "success": false,
  "message": "Invalid plan ID",
  "code": "INVALID_PLAN"
}
```

**Implementation Notes:**
- Validate plan ID exists
- Call Dodo API to update subscription
- Recalculate next billing date
- Update Supabase
- Return updated subscription

---

## Webhook Handler

After user completes payment on Dodo, Dodo sends a webhook to your backend:

```
POST /webhooks/dodo

HEADERS:
{
  "dodo-signature": "sha256=...",
  "dodo-timestamp": "1703081400"
}

BODY (Example):
{
  "id": "evt_12345",
  "type": "checkout.session.completed",
  "created": 1703081400,
  "data": {
    "object": {
      "id": "sess_12345",
      "status": "completed",
      "customer": {
        "id": "cust_456",
        "email": "user@example.com",
        "metadata": {
          "userId": "user_123"
        }
      },
      "payment_status": "paid",
      "metadata": {
        "subscriptionType": "premium_yearly",
        "userId": "user_123"
      }
    }
  }
}
```

**Webhook Implementation Checklist:**

1. **Verify Signature** (Security Critical!)
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}

// In your webhook handler:
const signature = req.headers['dodo-signature'];
const secret = process.env.DODO_WEBHOOK_SECRET;
const rawBody = req.rawBody; // Must be raw string, not parsed JSON

if (!verifyWebhookSignature(rawBody, signature, secret)) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

2. **Handle Webhook Events**
```javascript
const event = req.body;

switch(event.type) {
  case 'checkout.session.completed':
    handleCheckoutCompleted(event.data.object);
    break;
    
  case 'checkout.session.expired':
    handleCheckoutExpired(event.data.object);
    break;
    
  case 'subscription.created':
    handleSubscriptionCreated(event.data.object);
    break;
    
  case 'subscription.updated':
    handleSubscriptionUpdated(event.data.object);
    break;
    
  case 'subscription.deleted':
    handleSubscriptionDeleted(event.data.object);
    break;
    
  default:
    console.log('Unknown event type:', event.type);
}

res.status(200).json({ received: true });
```

3. **Update Supabase on Checkout Completion**
```javascript
async function handleCheckoutCompleted(session) {
  const { customer, metadata } = session;
  const userId = metadata.userId;
  const email = customer.email;
  
  // Calculate next billing date (1 year from now)
  const nextBillingDate = new Date();
  nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  
  // Update user in Supabase
  const { error } = await supabase
    .from('users')
    .update({
      subscription: 'premium',
      subscription_expiry: nextBillingDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  if (error) {
    console.error('Failed to update subscription:', error);
    return;
  }
  
  // Log purchase in Supabase
  await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      amount: 2500,
      currency: 'USD',
      status: 'completed',
      payment_method: 'dodo_checkout',
      transaction_id: session.id,
      metadata: metadata,
    });
  
  // Send confirmation email
  await sendConfirmationEmail(email, userId);
}
```

4. **Send Confirmation Email**
```javascript
async function sendConfirmationEmail(email, userId) {
  const emailContent = `
    Thank you for upgrading to Aurora Premium!
    
    Your subscription is now active and will renew on ${nextBillingDate}.
    
    You now have access to:
    - Cloud Sync
    - Unlimited Entries
    - Advanced Analytics
    - Data Backup
    - Export Data
    - Priority Support
    
    To manage your subscription, log in to the Aurora app.
    
    Questions? Contact support@aurora.app
  `;
  
  // Use SendGrid, Mailgun, AWS SES, etc.
  await emailService.send({
    to: email,
    subject: 'Welcome to Aurora Premium!',
    text: emailContent,
  });
}
```

---

## Implementation Examples

### Node.js (Express)

```javascript
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Create Checkout Session
app.post('/api/dodo/create-checkout', async (req, res) => {
  try {
    const { userId, email, amount, currency, metadata } = req.body;
    
    // Validate input
    if (amount !== 2500 || currency !== 'USD') {
      return res.status(400).json({ 
        message: 'Invalid amount or currency' 
      });
    }
    
    // Call Dodo API
    const response = await axios.post(
      'https://api.dodopayments.com/checkouts',
      {
        amount,
        currency,
        customer: {
          email,
          metadata: { userId },
        },
        metadata,
        success_url: 'auroras://premium-success',
        cancel_url: 'auroras://premium-cancel',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DODO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    res.json({
      sessionId: response.data.id,
      checkoutUrl: response.data.url,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create checkout',
      error: error.message 
    });
  }
});

// 2. Webhook Handler
app.post('/webhooks/dodo', async (req, res) => {
  const signature = req.headers['dodo-signature'];
  const secret = process.env.DODO_WEBHOOK_SECRET;
  
  // Verify signature
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (`sha256=${hash}` !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = req.body;
  
  if (event.type === 'checkout.session.completed') {
    const { customer, metadata } = event.data.object;
    const userId = metadata.userId;
    
    // Calculate next billing
    const nextBillingDate = new Date();
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    
    // Update Supabase
    await supabase
      .from('users')
      .update({
        subscription: 'premium',
        subscription_expiry: nextBillingDate.toISOString(),
      })
      .eq('id', userId);
    
    // Log purchase
    await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        amount: 2500,
        status: 'completed',
        transaction_id: event.data.object.id,
      });
  }
  
  res.json({ received: true });
});

app.listen(3000, () => console.log('Server running'));
```

---

## Environment Variables for Backend

Create a `.env` file on your backend server:

```bash
# Dodo Payments
DODO_API_KEY=sk_live_xxxxx           # Secret key (keep safe!)
DODO_WEBHOOK_SECRET=whsec_xxxxx     # Webhook signing secret

# Supabase (use service role key)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx        # Service role key (keep safe!)

# Email Service (SendGrid, Mailgun, etc.)
SENDGRID_API_KEY=SG.xxxxx

# Server Configuration
NODE_ENV=production
PORT=3000
```

---

## Testing Checklist

- [ ] Create checkout session endpoint working
- [ ] Dodo checkout URL opens correctly
- [ ] Webhook signature verification working
- [ ] Supabase updates on payment completion
- [ ] Confirmation email sent to user
- [ ] User subscription status updated
- [ ] Mobile app can get subscription status
- [ ] Cancel subscription endpoint working
- [ ] Unsubscribe webhook handled correctly

---

## Dodo Test Cards

For testing payments:

```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVC: 123
3D Secure: Any value accepted

Status: Payment will complete successfully
```

Enable test mode in Dodo dashboard:
1. Go to Settings → Mode
2. Select "Test"
3. Use test API keys

---

## Security Best Practices

1. **Never expose API keys in frontend code**
   - Only use backend for Dodo API calls
   - Mobile app calls backend endpoints only

2. **Always verify webhook signatures**
   - Use HMAC-SHA256 verification
   - Check timestamp (within 5 minutes)
   - Ignore replayed webhooks

3. **Validate all user input**
   - Email format validation
   - Amount verification (must be 2500)
   - User existence check

4. **Use HTTPS everywhere**
   - All backend endpoints must be HTTPS
   - Webhook endpoint must be HTTPS
   - Certificate validation enabled

5. **Store secrets securely**
   - Use environment variables
   - Never commit .env to git
   - Rotate keys regularly
   - Use key management service (AWS KMS, etc.)

---

## Troubleshooting

### Webhook not received
- Check webhook URL is correct in Dodo dashboard
- Verify endpoint is publicly accessible (HTTPS)
- Check firewall/network rules
- Look at Dodo webhook logs: Settings → Webhooks → Logs

### Signature verification failing
- Ensure using raw request body (not parsed JSON)
- Check webhook secret matches
- Verify timestamp is recent (< 5 min)
- Enable debug logging

### Supabase updates not working
- Check service role key (not anon key)
- Verify user exists in Supabase
- Check RLS policies aren't blocking updates
- Look at Supabase logs

### Payment not completing
- Verify checkout session created
- Check payment method valid
- Try with test card
- Check Dodo API response for errors
- Look at Dodo transaction logs

---

## Support Links

- Dodo Payments Docs: https://docs.dodopayments.com
- Dodo Dashboard: https://dashboard.dodopayments.com
- Webhook Testing: https://webhook.site (for development)
- Node.js Axios: https://github.com/axios/axios

---

## Next Steps

1. ✅ Mobile app ready for payment (Premium screen integrated)
2. ⏳ Implement backend endpoints (use examples above)
3. ⏳ Test checkout flow with test cards
4. ⏳ Deploy to production
5. ⏳ Configure webhook in Dodo dashboard
6. ⏳ Test with real payments

**Questions?** See `/TESTING_GUIDE.md` for end-to-end testing instructions.
