import React, { useMemo } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, Heart, Tag, AlertCircle, Zap } from 'react-native-feather';
import useColors from '@/hooks/useColors';
import { useLogState } from '@/hooks/useLogs';
import { useTagsState } from '@/hooks/useTags';
import dayjs from 'dayjs';
import { t } from '@/helpers/translation';
import TextHeadline from '@/components/TextHeadline';
import { RootStackScreenProps } from '../../../types';

interface InsightCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
  onPress?: () => void;
}

export const HomeScreen = ({ navigation }: RootStackScreenProps<'Home'>) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { items: logs, loaded: logsLoaded } = useLogState();
  const { tags } = useTagsState();

  // Calculate insights
  const insights = useMemo(() => {
    if (!logsLoaded) return null;

    const today = dayjs();
    const thisWeekStart = today.clone().startOf('week');
    const thisMonthStart = today.clone().startOf('month');

    // Total logs
    const totalLogs = logs.length;

    // This week logs
    const thisWeekLogs = logs.filter(log => 
      dayjs(log.createdAt).isBetween(thisWeekStart, today, 'day', '[]')
    ).length;

    // This month logs
    const thisMonthLogs = logs.filter(log =>
      dayjs(log.createdAt).isBetween(thisMonthStart, today, 'day', '[]')
    ).length;

    // Current streak
    let streak = 0;
    let checkDate = today;
    while (logs.some(log => dayjs(log.createdAt).format('YYYY-MM-DD') === checkDate.format('YYYY-MM-DD'))) {
      streak++;
      checkDate = checkDate.subtract(1, 'day');
    }

    // Average mood this week
    const thisWeekRatings = logs
      .filter(log => dayjs(log.createdAt).isBetween(thisWeekStart, today, 'day', '[]'))
      .map(log => log.rating);
    const avgMoodThisWeek = thisWeekRatings.length > 0
      ? (thisWeekRatings.reduce((a, b) => {
          const ratingMap = { extremely_bad: 0, very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5, extremely_good: 6 };
          return a + (ratingMap[b as keyof typeof ratingMap] || 0);
        }, 0) / thisWeekRatings.length).toFixed(1)
      : 0;

    // Most used tag
    const tagCounts: Record<string, number> = {};
    logs.forEach(log => {
      log.tags?.forEach(tag => {
        tagCounts[tag.id] = (tagCounts[tag.id] || 0) + 1;
      });
    });
    const mostUsedTagId = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])[0];
    const mostUsedTag = mostUsedTagId ? tags.find(t => t.id === mostUsedTagId) : null;
    const mostUsedTagCount = mostUsedTagId ? tagCounts[mostUsedTagId] : 0;

    // Days with logs this month
    const daysWithLogsThisMonth = new Set(
      thisMonthLogs > 0 ? logs
        .filter(log => dayjs(log.createdAt).isBetween(thisMonthStart, today, 'day', '[]'))
        .map(log => dayjs(log.createdAt).format('YYYY-MM-DD'))
      : []
    ).size;

    return {
      totalLogs,
      thisWeekLogs,
      thisMonthLogs,
      streak,
      avgMoodThisWeek,
      mostUsedTag,
      mostUsedTagCount,
      daysWithLogsThisMonth,
    };
  }, [logs, logsLoaded, tags]);

  const insightCards: InsightCard[] = useMemo(() => {
    if (!insights) return [];

    return [
      {
        title: t('streak') || 'Streak',
        value: insights.streak,
        icon: <TrendingUp width={24} color={colors.palette.blue[500]} />,
        color: colors.palette.blue[500],
        subtext: 'days',
        onPress: () => navigation.navigate('Statistics'),
      },
      {
        title: 'This Week',
        value: insights.thisWeekLogs,
        icon: <Calendar width={24} color={colors.palette.green[500]} />,
        color: colors.palette.green[500],
        subtext: 'logs',
        onPress: () => navigation.navigate('Calendar'),
      },
      {
        title: 'Avg Mood',
        value: insights.avgMoodThisWeek,
        icon: <Heart width={24} color={colors.palette.red[500]} />,
        color: colors.palette.red[500],
        subtext: '/10',
        onPress: () => navigation.navigate('Statistics'),
      },
      {
        title: 'Top Tag',
        value: insights.mostUsedTag?.title || 'N/A',
        icon: <Tag width={24} color={colors.palette.orange[500]} />,
        color: colors.palette.orange[500],
        subtext: insights.mostUsedTag ? `${insights.mostUsedTagCount} uses` : '',
        onPress: () => navigation.navigate('Tags'),
      },
      {
        title: 'This Month',
        value: insights.daysWithLogsThisMonth,
        icon: <Calendar width={24} color={colors.palette.cyan[500]} />,
        color: colors.palette.cyan[500],
        subtext: 'days logged',
        onPress: () => navigation.navigate('Calendar'),
      },
    ];
  }, [insights, colors]);

  const todayLogs = useMemo(() => {
    return logs.filter(log => dayjs(log.createdAt).isSame(dayjs(), 'day'));
  }, [logs]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 8,
            }}
          >
            {t('welcome') || 'Welcome back'}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
            }}
          >
            {dayjs().format('dddd, MMMM D')}
          </Text>
        </View>

        {/* Modern Streak Visualization */}
        {insights && insights.streak > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 16,
                padding: 20,
                borderLeftWidth: 5,
                borderLeftColor: '#FF6B35',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>🔥</Text>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: '800',
                    color: '#FF6B35',
                    marginBottom: 4,
                  }}
                >
                  {insights.streak}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Day Streak! 🎉
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 18,
                }}
              >
                {insights.streak === 1
                  ? "You've started your journey! Keep tracking daily to build momentum."
                  : insights.streak < 7
                  ? `Amazing! ${7 - insights.streak} more days until your first week!`
                  : insights.streak < 30
                  ? `Incredible dedication! You're on track for a 30-day milestone.`
                  : `You're unstoppable! This incredible streak shows true commitment.`}
              </Text>
            </View>
          </View>
        )}

        {/* Streak Warning - If no entry today */}
        {insights && insights.streak > 0 && todayLogs.length === 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                padding: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#FFA500',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <AlertCircle width={20} height={20} color="#FFA500" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 2,
                  }}
                >
                  Keep your streak alive!
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Add an entry today to maintain your {insights.streak}-day streak.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats Grid */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <TextHeadline style={{ marginBottom: 16 }}>
            {t('insights') || 'Your Insights'}
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
            {insightCards.map((card, index) => (
              <Pressable
                key={index}
                onPress={card.onPress}
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: '48%',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 12,
                    padding: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: card.color,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: colors.textSecondary,
                        flex: 1,
                      }}
                    >
                      {card.title}
                    </Text>
                    {card.icon}
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: '700',
                        color: card.color,
                        marginBottom: 4,
                      }}
                    >
                      {card.value}
                    </Text>
                    {card.subtext && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textSecondary,
                        }}
                      >
                        {card.subtext}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Today's Summary */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <TextHeadline style={{ marginBottom: 16 }}>
            {t('todays_summary') || "Today's Summary"}
          </TextHeadline>

          {todayLogs.length > 0 ? (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                  Total entries
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: colors.text,
                  }}
                >
                  {todayLogs.length}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Last updated: {dayjs(todayLogs[todayLogs.length - 1]?.createdAt).format('h:mm A')}
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                No entries today yet
              </Text>
              <Pressable
                onPress={() => navigation.navigate('LogCreate', { dateTime: dayjs().toISOString() })}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    backgroundColor: colors.tint,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>
                    {t('add_entry') || 'Add Entry'}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <TextHeadline style={{ marginBottom: 16 }}>
            {t('quick_actions') || 'Quick Actions'}
          </TextHeadline>

          <View style={{ gap: 12 }}>
            <Pressable
              onPress={() => navigation.navigate('Calendar')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  padding: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                    {t('calendar') || 'Calendar'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    View your mood history
                  </Text>
                </View>
                <Calendar width={24} color={colors.tint} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Statistics')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  padding: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                    {t('statistics') || 'Statistics'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Detailed analytics
                  </Text>
                </View>
                <TrendingUp width={24} color={colors.tint} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Tags')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  padding: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                    {t('tags') || 'Tags'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Manage your tags
                  </Text>
                </View>
                <Tag width={24} color={colors.tint} />
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
