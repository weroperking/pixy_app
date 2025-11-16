/**
 * Dodo Payments Integration Service
 * 
 * Handles all Dodo Payments API interactions for the Aurora app.
 * 
 * ⚠️  IMPORTANT: All payment operations should call YOUR BACKEND
 * Do NOT call Dodo API directly from mobile app (security risk)
 * 
 * Architecture:
 * Mobile App → Your Backend → Dodo Payments API
 *   ↓
 * Backend validates API key and creates/manages sessions
 * Mobile opens checkout URL (hosted by Dodo)
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DodoPaymentConfig {
  apiKey: string;
  apiUrl: string;
  merchantId: string;
}

/**
 * Request to create a checkout session
 * Sent by mobile app to YOUR BACKEND (not directly to Dodo)
 */
export interface CheckoutSessionRequest {
  userId: string;
  email: string;
  amount: number; // in cents (e.g., 2500 for $25.00)
  currency: string; // e.g., "USD"
  description: string; // e.g., "Aurora Premium - 1 Year"
  successUrl: string; // Redirect after success
  cancelUrl: string; // Redirect after cancel
  metadata?: {
    subscriptionType: 'premium_yearly' | 'premium_monthly';
    userId: string;
    [key: string]: any;
  };
}

/**
 * Response from Dodo when creating a checkout session
 */
export interface DodoCheckoutSession {
  id: string;
  url: string; // URL to send user to for payment
  customer?: {
    id: string;
    email: string;
    metadata?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  status: 'open' | 'expired' | 'completed';
  created_at: string;
}

/**
 * Response from backend checkout endpoint
 */
export interface CheckoutSessionResponse {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string; // URL to redirect user to
  error?: string;
  code?: string;
}

/**
 * Dodo Payments subscription response
 */
export interface DodoSubscription {
  id: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  customerId: string;
  nextBillingDate?: string;
  canceledAt?: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription?: DodoSubscription;
  error?: string;
}

// ============================================
// SERVICE CLASS
// ============================================

class DodoPaymentsService {
  private config: DodoPaymentConfig;
  private backendUrl: string;

  /**
   * Initialize Dodo Payments service
   * 
   * @param config - Configuration with API credentials
   * @param backendUrl - URL to your backend (e.g., https://api.example.com)
   */
  constructor(config: DodoPaymentConfig, backendUrl: string) {
    this.config = config;
    this.backendUrl = backendUrl;
  }

  /**
   * Create a checkout session for premium purchase
   * 
   * FLOW:
   * 1. Mobile app calls this method with user info and plan
   * 2. This sends request to YOUR BACKEND
   * 3. Backend validates user and calls Dodo API
   * 4. Backend returns checkout URL
   * 5. Mobile opens URL in browser (Dodo handles payment)
   * 6. After payment, user redirected back to app
   * 7. Backend webhook updates subscription in Supabase
   * 
   * @param request - Checkout request with user and plan details
   * @returns Checkout URL and session ID
   */
  async createCheckoutSession(
    request: CheckoutSessionRequest
  ): Promise<CheckoutSessionResponse> {
    try {
      // Call YOUR BACKEND endpoint (not Dodo directly)
      const response = await fetch(`${this.backendUrl}/api/dodo/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: request.userId,
          email: request.email,
          amount: request.amount,
          currency: request.currency,
          description: request.description,
          successUrl: request.successUrl,
          cancelUrl: request.cancelUrl,
          metadata: request.metadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to create checkout session',
          code: data.code,
        };
      }

      return {
        success: true,
        sessionId: data.sessionId,
        checkoutUrl: data.checkoutUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Get checkout session status
   * 
   * USAGE:
   * - Check if payment was completed
   * - Verify session exists before redirecting
   * - Handle expired sessions gracefully
   * 
   * @param sessionId - Dodo checkout session ID
   * @returns Session status and details
   */
  async getCheckoutSessionStatus(sessionId: string): Promise<CheckoutSessionResponse> {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/dodo/checkout/${sessionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to get session status',
          code: data.code,
        };
      }

      return {
        success: true,
        sessionId: data.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Get user's subscription from Dodo
   * 
   * USAGE:
   * - Check if user has active subscription
   * - Show renewal date to user
   * - Handle expired/canceled subscriptions
   * 
   * @param userId - Aurora user ID (to look up in Dodo)
   * @returns User's active subscription
   */
  async getSubscription(userId: string): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/dodo/subscription/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to get subscription',
        };
      }

      return {
        success: true,
        subscription: data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Cancel user's subscription
   * 
   * USAGE:
   * - Allow users to cancel from settings
   * - Show confirmation dialog first
   * - Update local state after cancellation
   * 
   * @param userId - Aurora user ID
   * @returns Success/failure result
   */
  async cancelSubscription(userId: string): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/dodo/subscription/${userId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to cancel subscription',
        };
      }

      return {
        success: true,
        subscription: data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Update subscription (e.g., upgrade/downgrade plan)
   * 
   * USAGE:
   * - Change between plans
   * - Update payment method
   * - Adjust billing cycle
   * 
   * @param userId - Aurora user ID
   * @param planId - New plan ID
   * @returns Updated subscription
   */
  async updateSubscription(
    userId: string,
    planId: string
  ): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/dodo/subscription/${userId}/update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to update subscription',
        };
      }

      return {
        success: true,
        subscription: data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        error: message,
      };
    }
  }
}

// ============================================
// EXPORTS
// ============================================

/**
 * Create and initialize Dodo Payments service
 * 
 * USAGE:
 * import { createDodoPaymentsService } from '@/lib/dodoPayments';
 * 
 * const dodo = createDodoPaymentsService({
 *   apiKey: process.env.EXPO_PUBLIC_DODO_API_KEY || '',
 *   apiUrl: process.env.EXPO_PUBLIC_DODO_API_URL || 'https://api.dodopayments.com',
 *   merchantId: process.env.EXPO_PUBLIC_DODO_MERCHANT_ID || '',
 * }, 'https://your-backend-api.com');
 * 
 * await dodo.createCheckoutSession({...})
 */
export const createDodoPaymentsService = (
  config: DodoPaymentConfig,
  backendUrl: string
): DodoPaymentsService => {
  return new DodoPaymentsService(config, backendUrl);
};

export { DodoPaymentsService };
