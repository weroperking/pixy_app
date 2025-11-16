import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Zap } from 'react-native-feather';
import useColors from '@/hooks/useColors';
import { t } from '@/helpers/translation';
import { RootStackScreenProps } from '../../../types';
import { createDodoPaymentsService, CheckoutSessionRequest } from '@/lib/dodoPayments';

export const PremiumScreen = ({ navigation }: RootStackScreenProps<'Premium'>) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    { title: 'Cloud Sync', description: 'Access your data from any device' },
    { title: 'Unlimited Entries', description: 'Log as much as you want' },
    { title: 'Advanced Analytics', description: 'Deep insights into your mood patterns' },
    { title: 'Data Backup', description: 'Automatic daily backups to cloud' },
    { title: 'Export Data', description: 'Download your data anytime' },
    { title: 'Priority Support', description: 'Get help when you need it' },
  ];

  /**
   * Handle Premium Purchase
   * 
   * FLOW:
   * 1. Check for backend URL and payment config
   * 2. Create checkout session via backend
   * 3. Open Dodo checkout URL in browser
   * 4. After user completes/cancels payment, they're redirected back
   * 5. Navigate to Signup for new users or Home for existing users
   */
  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      // Check configuration
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        Alert.alert(
          'Configuration Error',
          'Backend API URL not configured. Ask the app administrator to set EXPO_PUBLIC_BACKEND_URL.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // Initialize Dodo service
      const dodo = createDodoPaymentsService(
        {
          apiKey: process.env.EXPO_PUBLIC_DODO_API_KEY || '',
          apiUrl: process.env.EXPO_PUBLIC_DODO_API_URL || 'https://api.dodopayments.com',
          merchantId: process.env.EXPO_PUBLIC_DODO_MERCHANT_ID || '',
        },
        backendUrl
      );

      // Prepare checkout request
      // Note: In a real app, you'd get this from AuthContext or user state
      const checkoutRequest: CheckoutSessionRequest = {
        userId: 'temp-user-' + Date.now(), // Temporary - will be set in backend
        email: 'user@example.com', // Temporary - should come from form
        amount: 2500, // $25.00 in cents
        currency: 'USD',
        description: 'Aurora Premium - 1 Year Subscription',
        successUrl: 'auroras://premium-success', // Deep link on success
        cancelUrl: 'auroras://premium-cancel', // Deep link on cancel
        metadata: {
          subscriptionType: 'premium_yearly',
          userId: 'temp-user-' + Date.now(),
        },
      };

      // Create checkout session via backend
      const response = await dodo.createCheckoutSession(checkoutRequest);

      if (!response.success || !response.checkoutUrl) {
        Alert.alert(
          'Payment Error',
          response.error || 'Failed to create checkout session. Please try again.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // Open checkout URL in browser
      const supported = await Linking.canOpenURL(response.checkoutUrl);
      if (supported) {
        await Linking.openURL(response.checkoutUrl);
      } else {
        Alert.alert(
          'Error',
          `Cannot open payment link. URL: ${response.checkoutUrl}`,
          [{ text: 'OK' }]
        );
      }

      // After payment (user returns via deep link or navigates manually)
      // They should land on Signup/Login
      setTimeout(() => {
        setIsLoading(false);
        navigation.navigate('Signup');
      }, 500);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Purchase Failed', message, [{ text: 'OK' }]);
      setIsLoading(false);
      console.error('Purchase error:', error);
    }
  };

  const handleSkip = () => {
    // For demo purposes, users can skip (this will be forced in production)
    navigation.navigate('Signup');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 30,
            paddingHorizontal: 20,
            paddingBottom: 20,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              backgroundColor: `${colors.tint}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Zap width={32} height={32} color={colors.tint} />
          </View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: '800',
              color: colors.text,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Unlock Your
            {'\n'}
            Full Potential
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Join thousands tracking their mood with Aurora Premium
          </Text>
        </View>

        {/* Pricing Card */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 32,
          }}
        >
          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 20,
              padding: 24,
              borderWidth: 2,
              borderColor: colors.tint,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: colors.tint,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: 'white',
                  letterSpacing: 0.5,
                }}
              >
                BEST VALUE
              </Text>
            </View>

            <Text
              style={{
                fontSize: 48,
                fontWeight: '900',
                color: colors.text,
                marginBottom: 4,
              }}
            >
              $25
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                marginBottom: 24,
              }}
            >
              per year
            </Text>

            <View
              style={{
                width: '100%',
                height: 1,
                backgroundColor: `${colors.text}20`,
                marginBottom: 24,
              }}
            />

            {/* Features List */}
            <View style={{ width: '100%', gap: 16 }}>
              {features.map((feature, index) => (
                <View key={index} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: colors.tint,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    <Check width={14} height={14} color="white" strokeWidth={3} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.text,
                        marginBottom: 2,
                      }}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                      }}
                    >
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Money Back Guarantee */}
          <View
            style={{
              marginTop: 20,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: `${colors.palette?.green?.[500] || colors.tint}15`,
              borderRadius: 12,
              borderLeftWidth: 3,
              borderLeftColor: colors.palette?.green?.[500] || colors.tint,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.text,
                fontWeight: '600',
              }}
            >
              ✓ 30-day money-back guarantee
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              Not satisfied? We'll refund you, no questions asked.
            </Text>
          </View>
        </View>

        {/* Pricing Banner */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 24,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.tint,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: colors.text,
              textAlign: 'center',
            }}
          >
            💳 $25 per year
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            Full access to all premium features. Secure payments powered by Dodo.
          </Text>
        </View>

        {/* FAQs */}
        <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Frequently Asked Questions
          </Text>

          {[
            {
              q: 'How much does it cost?',
              a: 'Premium access costs $25 per year and gives you unlimited access to all features.',
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Yes, you can cancel at any time and stop your subscription.',
            },
            {
              q: 'Is my data safe?',
              a: 'Yes, all data is encrypted and stored securely on Supabase servers.',
            },
          ].map((faq, index) => (
            <View key={index} style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 6,
                }}
              >
                Q: {faq.q}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  lineHeight: 18,
                }}
              >
                A: {faq.a}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.backgroundSecondary,
        }}
      >
        <Pressable
          onPress={handlePurchase}
          disabled={isLoading}
          style={({ pressed }) => ({
            backgroundColor: colors.tint,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: 'white',
              }}
            >
              Purchase Premium - $25/year
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
          style={({ pressed }) => ({
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.textSecondary,
            }}
          >
            Already have an account? Sign in
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
