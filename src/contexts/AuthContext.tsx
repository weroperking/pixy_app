import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  fullName: string;
  subscription: 'free' | 'premium';
  subscriptionExpiry?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  updateSubscription: (subscription: 'free' | 'premium', expiryDate: string) => Promise<void>;
  restoreToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore token on app launch
  useEffect(() => {
    restoreToken();
  }, []);

  const restoreToken = async () => {
    try {
      setIsLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (userToken && userData) {
        // Verify token is still valid with Supabase
        const { data: { user: authUser }, error } = await supabase.auth.getUser(userToken);
        
        if (!error && authUser) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } else {
          // Token expired, clear stored data
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error restoring token:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Failed to create user' };
      }

      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name: fullName,
            subscription: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Profile creation failed but auth succeeded, still proceed
      }

      // Store temporary session (OTP verification happens next)
      await AsyncStorage.setItem('pendingEmail', email);
      await AsyncStorage.setItem('pendingUserId', authData.user.id);

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      // In a real implementation, verify the OTP code
      // For now, we're using Supabase Auth's built-in verification
      
      const { data: { user: authUser }, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (!authUser) {
        return { success: false, message: 'OTP verification failed' };
      }

      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return { success: false, message: 'Failed to create session' };
      }

      // Get or create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      let userData: User;

      if (profileError && profileError.code === 'PGRST116') {
        // User not found, create profile
        const fullName = authUser.user_metadata?.full_name || 'User';
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authUser.id,
              email: authUser.email || email,
              full_name: fullName,
              subscription: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (insertError) {
          return { success: false, message: insertError.message };
        }

        userData = {
          id: authUser.id,
          email: authUser.email || email,
          fullName,
          subscription: 'free',
          createdAt: new Date().toISOString(),
        };
      } else if (profileError) {
        return { success: false, message: profileError.message };
      } else {
        userData = {
          id: authUser.id,
          email: profile.email,
          fullName: profile.full_name,
          subscription: profile.subscription,
          subscriptionExpiry: profile.subscription_expiry,
          createdAt: profile.created_at,
        };
      }

      // Store session
      await AsyncStorage.setItem('userToken', session.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Clear pending data
      await AsyncStorage.removeItem('pendingEmail');
      await AsyncStorage.removeItem('pendingUserId');

      setUser(userData);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { success: false, message: authError.message };
      }

      if (!authData.session) {
        return { success: false, message: 'Failed to create session' };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        return { success: false, message: profileError.message };
      }

      // Check if subscription is still valid
      const now = new Date();
      const isSubscriptionValid = profile.subscription === 'premium' && 
        profile.subscription_expiry && 
        new Date(profile.subscription_expiry) > now;

      if (!isSubscriptionValid && profile.subscription === 'premium') {
        // Subscription expired, update to free
        await supabase
          .from('users')
          .update({ subscription: 'free', subscription_expiry: null })
          .eq('id', authData.user.id);

        profile.subscription = 'free';
        profile.subscription_expiry = null;
      }

      const userData: User = {
        id: authData.user.id,
        email: profile.email,
        fullName: profile.full_name,
        subscription: profile.subscription,
        subscriptionExpiry: profile.subscription_expiry,
        createdAt: profile.created_at,
      };

      // Store session
      await AsyncStorage.setItem('userToken', authData.session.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateSubscription = async (subscription: 'free' | 'premium', expiryDate: string) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({
            subscription,
            subscription_expiry: expiryDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) throw error;

        const updatedUser = {
          ...user,
          subscription,
          subscriptionExpiry: expiryDate,
        };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Update subscription error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSignedIn: !!user,
        signup,
        login,
        logout,
        verifyOtp,
        updateSubscription,
        restoreToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
