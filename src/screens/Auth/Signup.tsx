import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, Mail, Lock, User } from 'react-native-feather';
import useColors from '@/hooks/useColors';
import { t } from '@/helpers/translation';
import { RootStackScreenProps } from '../../../types';
import { useAuth } from '@/contexts/AuthContext';

export const SignupScreen = ({ navigation }: RootStackScreenProps<'Signup'>) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSignup = async () => {
    // Validation
    if (!email || !password || !confirmPassword || !fullName) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure your passwords match');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the terms and privacy policy');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup(email, password, fullName);
      
      if (result.success) {
        // Navigate to OTP verification
        navigation.navigate('OTPVerification', { email });
      } else {
        Alert.alert('Signup failed', result.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Signup failed', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 30,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            Join Aurora and start your mood tracking journey
          </Text>
        </View>

        {/* Form */}
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* Full Name */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Full Name
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: `${colors.text}10`,
              }}
            >
              <User width={20} height={20} color={colors.textSecondary} />
              <TextInput
                placeholder="John Doe"
                placeholderTextColor={colors.textSecondary}
                value={fullName}
                onChangeText={setFullName}
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

          {/* Email */}
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
                borderColor: `${colors.text}10`,
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

          {/* Password */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Password
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: `${colors.text}10`,
              }}
            >
              <Lock width={20} height={20} color={colors.textSecondary} />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingLeft: 12,
                  fontSize: 14,
                  color: colors.text,
                }}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <Eye width={20} height={20} color={colors.textSecondary} />
                ) : (
                  <EyeOff width={20} height={20} color={colors.textSecondary} />
                )}
              </Pressable>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                marginTop: 6,
              }}
            >
              At least 8 characters with a mix of letters and numbers
            </Text>
          </View>

          {/* Confirm Password */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Confirm Password
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: `${colors.text}10`,
              }}
            >
              <Lock width={20} height={20} color={colors.textSecondary} />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingLeft: 12,
                  fontSize: 14,
                  color: colors.text,
                }}
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <Eye width={20} height={20} color={colors.textSecondary} />
                ) : (
                  <EyeOff width={20} height={20} color={colors.textSecondary} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Terms and Privacy */}
          <Pressable
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: agreedToTerms ? colors.tint : `${colors.text}30`,
                backgroundColor: agreedToTerms ? colors.tint : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {agreedToTerms && (
                <Text style={{ fontSize: 12, color: 'white', fontWeight: 'bold' }}>✓</Text>
              )}
            </View>
            <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>
              I agree to the{' '}
              <Text style={{ color: colors.tint, fontWeight: '600' }}>Terms of Service</Text> and{' '}
              <Text style={{ color: colors.tint, fontWeight: '600' }}>Privacy Policy</Text>
            </Text>
          </Pressable>
        </View>

        {/* Sign Up Button */}
        <View style={{ marginHorizontal: 20, marginTop: 24, marginBottom: 16 }}>
          <Pressable
            onPress={handleSignup}
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
                Create Account
              </Text>
            )}
          </Pressable>
        </View>

        {/* Login Link */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Already have an account?{' '}
            <Text
              style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}
              onPress={handleLogin}
            >
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};
