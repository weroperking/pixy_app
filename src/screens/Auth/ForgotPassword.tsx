import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'react-native-feather';
import useColors from '@/hooks/useColors';
import { RootStackScreenProps } from '../../../types';

export const ForgotPasswordScreen = ({
  navigation,
}: RootStackScreenProps<'ForgotPassword'>) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Send password reset email via Supabase
      setTimeout(() => {
        setIsLoading(false);
        setSent(true);
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to send reset email');
    }
  };

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: insets.top + 40,
            justifyContent: 'center',
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <Text style={{ fontSize: 60, marginBottom: 20 }}>✓</Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '800',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Check Your Email
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: 'center',
              }}
            >
              We've sent a password reset link to {email}
            </Text>
          </View>

          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 12,
              borderLeftWidth: 3,
              borderLeftColor: colors.tint,
              marginBottom: 30,
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
              Next steps:
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
              1. Check your email (including spam folder){'\n'}
              2. Click the reset link{'\n'}
              3. Create a new password{'\n'}
              4. Return and sign in
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={({ pressed }) => ({
              backgroundColor: colors.tint,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
              marginBottom: 12,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: 'white',
              }}
            >
              Back to Login
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setSent(false);
              setEmail('');
            }}
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
              Try a different email
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
          Reset Password
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
          }}
        >
          Enter your email and we'll send you a reset link
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        <View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Email
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 12,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: colors.backgroundTertiary || `${colors.text}10`,
            }}
          >
            <Mail width={20} height={20} color={colors.textSecondary} />
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingLeft: 12,
                fontSize: 14,
                color: colors.text,
              }}
            />
          </View>
        </View>
      </View>

      <View style={{ marginHorizontal: 20, marginTop: 32 }}>
        <Pressable
          onPress={handleSendReset}
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
              Send Reset Link
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};
