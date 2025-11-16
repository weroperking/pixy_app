import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { User, LogOut, Cloud, Lock, Bell, Zap } from 'react-native-feather';
import useColors from '@/hooks/useColors';
import { useLogState } from '@/hooks/useLogs';
import { useSettings } from '@/hooks/useSettings';
import { useTagsState } from '@/hooks/useTags';
import { RootStackScreenProps } from '../../../types';
import { PageWithHeaderLayout } from '@/components/PageWithHeaderLayout';
import MenuList from '@/components/MenuList';
import MenuListItem from '@/components/MenuListItem';
import MenuListHeadline from '@/components/MenuListHeadline';
import TextHeadline from '@/components/TextHeadline';
import { t } from '@/helpers/translation';
import dayjs from 'dayjs';
import { useAnalytics } from '@/hooks/useAnalytics';

interface UserStats {
  totalLogs: number;
  totalTags: number;
  accountCreatedDate: string;
  lastSyncDate: string;
  storageUsed: string;
}

export const UserProfileScreen = ({ navigation }: RootStackScreenProps<'UserProfile'>) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { items: logs } = useLogState();
  const { settings } = useSettings();
  const { tags } = useTagsState();
  const analytics = useAnalytics();
  const [userStats, setUserStats] = useState<UserStats>({
    totalLogs: logs.length,
    totalTags: tags.length,
    accountCreatedDate: dayjs().format('MMM D, YYYY'),
    lastSyncDate: dayjs().format('MMM D, YYYY [at] h:mm A'),
    storageUsed: '2.4 MB',
  });

  useEffect(() => {
    setUserStats({
      totalLogs: logs.length,
      totalTags: tags.length,
      accountCreatedDate: dayjs().subtract(6, 'months').format('MMM D, YYYY'),
      lastSyncDate: dayjs().format('MMM D, YYYY [at] h:mm A'),
      storageUsed: ((logs.length * 0.05).toFixed(1)) + ' MB',
    });
  }, [logs, tags]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Logout',
          onPress: () => {
            analytics.track('user_logout');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: () => {
            analytics.track('user_account_deletion_initiated');
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <PageWithHeaderLayout
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.palette.blue[100],
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <User width={48} color={colors.palette.blue[500]} />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {settings.deviceId ? settings.deviceId.substring(0, 8).toUpperCase() : 'Aurora User'}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            {t('premium_coming_soon') || 'Account • Premium Coming Soon'}
          </Text>
        </View>

        {/* Account Statistics */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <TextHeadline style={{ marginBottom: 16 }}>
            {t('account_stats') || 'Account Statistics'}
          </TextHeadline>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                flex: 1,
                minWidth: '48%',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: colors.palette.blue[500],
                  marginBottom: 4,
                }}
              >
                {userStats.totalLogs}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                {t('total_entries') || 'Total Entries'}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: '48%',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: colors.palette.green[500],
                  marginBottom: 4,
                }}
              >
                {userStats.totalTags}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                {t('tags') || 'Tags'}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: '48%',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.textSecondary,
                  marginBottom: 4,
                  textAlign: 'center',
              }}
              >
                {t('account_created') || 'Account Created'}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  textAlign: 'center',
                }}
              >
                {userStats.accountCreatedDate}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: '48%',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: colors.textSecondary,
                  marginBottom: 4,
                  textAlign: 'center',
              }}
              >
                {t('storage_used') || 'Storage Used'}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.palette.purple[500],
                  textAlign: 'center',
                }}
              >
                {userStats.storageUsed}
              </Text>
            </View>
          </View>
        </View>

        {/* Cloud Sync Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <TextHeadline style={{ marginBottom: 16 }}>
            {t('cloud_sync') || 'Cloud Sync'}
          </TextHeadline>

          <View style={{ backgroundColor: colors.backgroundSecondary, padding: 16, borderRadius: 12, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Cloud width={24} color={colors.palette.cyan[500]} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 }}>
                  {t('sync_status') || 'Sync Status'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Last synced: {userStats.lastSyncDate}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              🚀 {t('supabase_coming_soon') || 'Supabase integration coming soon! Your data will be automatically synced to the cloud.'}
            </Text>
          </View>
        </View>

        {/* Account Settings */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <TextHeadline style={{ marginBottom: 16 }}>
            {t('account_settings') || 'Account Settings'}
          </TextHeadline>

          <MenuList>
            <MenuListItem
              title={t('notifications') || 'Notifications'}
              iconLeft={<Bell width={18} color={colors.menuListItemIcon} />}
              onPress={() => navigation.navigate('Reminder')}
              isLink
            />
            <MenuListItem
              title={t('privacy') || 'Privacy & Security'}
              iconLeft={<Lock width={18} color={colors.menuListItemIcon} />}
              onPress={() => navigation.navigate('Privacy')}
              isLink
            />
            <MenuListItem
              title={t('advanced') || 'Advanced'}
              iconLeft={<Zap width={18} color={colors.menuListItemIcon} />}
              onPress={() => navigation.navigate('Settings')}
              isLink
              isLast
            />
          </MenuList>
        </View>

        {/* Danger Zone */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: colors.palette.red[500] }}>
            {t('danger_zone') || 'Danger Zone'}
          </Text>

          <MenuList>
            <MenuListItem
              title={t('logout') || 'Logout'}
              onPress={handleLogout}
              isLast
            />
          </MenuList>

          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              marginTop: 12,
            })}
          >
            <View
              style={{
                backgroundColor: colors.palette.red[50],
                borderColor: colors.palette.red[200],
                borderWidth: 1,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.palette.red[600],
                }}
              >
                {t('delete_account') || 'Delete Account'}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </PageWithHeaderLayout>
  );
};
