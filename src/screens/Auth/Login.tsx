import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, Mail, Lock } from 'react-native-feather';
import useColors from '@/hooks/useColors';
import { t } from '@/helpers/translation';
import { RootStackScreenProps } from '../../../types';
import { useAuth } from '@/contexts/AuthContext';

export const LoginScreen = ({ navigation }: RootStackScreenProps<'Login'>) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Navigate to Home
        navigation.navigate('Home');
      } else {
        Alert.alert('Login failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignup = () => {
    navigation.navigate('Premium');
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
            paddingTop: insets.top + 40,
            paddingHorizontal: 20,
            paddingBottom: 40,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 20,
              backgroundColor: `${colors.tint}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 36 }}>🌈</Text>
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Sign in to continue your mood tracking journey
          </Text>
        </View>

        {/* Form */}
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
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
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.text,
                }}
              >
                Password
              </Text>
              <Pressable onPress={handleForgotPassword}>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.tint,
                    fontWeight: '600',
                  }}
                >
                  Forgot?
                </Text>
              </Pressable>
            </View>
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
          </View>
        </View>

        {/* Login Button */}
        <View style={{ marginHorizontal: 20, marginTop: 32, marginBottom: 16 }}>
          <Pressable
            onPress={handleLogin}
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
                Login
              </Text>
            )}
          </Pressable>
        </View>

        {/* Signup Link */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Don't have an account?{' '}
            <Text
              style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}
              onPress={handleSignup}
            >
              Sign up
            </Text>
          </Text>
        </View>

        {/* Divider */}
        <View
          style={{
            marginHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 24,
            gap: 12,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: colors.backgroundSecondary }} />
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.backgroundSecondary }} />
        </View>

        {/* OAuth Buttons */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Pressable
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: colors.backgroundSecondary,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: `${colors.text}10`,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 20 }}>🍎</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
              Sign in with Apple
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: colors.backgroundSecondary,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: `${colors.text}10`,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 20 }}>🔵</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
              Sign in with Google
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};
