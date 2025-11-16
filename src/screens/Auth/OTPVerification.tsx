import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useColors from '@/hooks/useColors';
import { RootStackScreenProps } from '../../../types';
import { useAuth } from '@/contexts/AuthContext';

export const OTPVerificationScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'OTPVerification'>) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { verifyOtp } = useAuth();
  const email = route.params?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (otp[index]) return;

    if (index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyOtp(email, otpCode);
      
      if (result.success) {
        Alert.alert('Success', 'Email verified!', [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Home'),
          },
        ]);
      } else {
        Alert.alert('Verification failed', result.message || 'Invalid OTP code');
      }
    } catch (error) {
      Alert.alert('Verification failed', error instanceof Error ? error.message : 'Invalid OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = () => {
    // TODO: Resend OTP via Supabase
    setTimer(60);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 30,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, color: colors.tint, fontWeight: '600' }}>← Back</Text>
        </Pressable>

        <Text
          style={{
            fontSize: 28,
            fontWeight: '800',
            color: colors.text,
            marginBottom: 8,
          }}
        >
          Verify Email
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
          }}
        >
          Enter the 6-digit code sent to
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.tint,
            fontWeight: '700',
            marginTop: 4,
          }}
        >
          {email}
        </Text>
      </View>

      {/* OTP Input */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
          marginVertical: 40,
          paddingHorizontal: 20,
        }}
      >
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(value) => handleOtpChange(index, value)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace') {
                handleBackspace(index);
              }
            }}
            maxLength={1}
            keyboardType="number-pad"
            style={{
              width: 50,
              height: 60,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: digit ? colors.tint : colors.backgroundSecondary,
              backgroundColor: colors.backgroundSecondary,
              textAlign: 'center',
              fontSize: 24,
              fontWeight: '700',
              color: colors.text,
            }}
          />
        ))}
      </View>

      {/* Verify Button */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Pressable
          onPress={handleVerifyOtp}
          disabled={isLoading}
          style={({ pressed }) => ({
            backgroundColor: colors.tint,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
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
              Verify Code
            </Text>
          )}
        </Pressable>
      </View>

      {/* Resend OTP */}
      <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
        {timer > 0 ? (
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Resend code in{' '}
            <Text style={{ fontWeight: '700', color: colors.tint }}>0:{timer.toString().padStart(2, '0')}</Text>
          </Text>
        ) : (
          <Pressable onPress={handleResendOtp}>
            <Text style={{ fontSize: 13, color: colors.tint, fontWeight: '700' }}>
              Resend Code
            </Text>
          </Pressable>
        )}
      </View>

      {/* Help Text */}
      <View
        style={{
          marginTop: 30,
          marginHorizontal: 20,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 12,
          borderLeftWidth: 3,
          borderLeftColor: colors.tint,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: colors.text,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          💡 Tip
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: colors.textSecondary,
            lineHeight: 16,
          }}
        >
          Check your spam folder if you don't see the code. We sent it from noreply@aurora.app
        </Text>
      </View>
    </View>
  );
};
