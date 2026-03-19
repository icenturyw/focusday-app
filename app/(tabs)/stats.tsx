import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatBarChart } from '@/components/stat-bar-chart';
import { palette, sharedStyles } from '@/constants/theme';
import { useFocusDay } from '@/context/focus-day-context';
import { StatsDimension } from '@/types/app';
import { buildStatsView } from '@/utils/stats';

const dimensions: { label: string; value: StatsDimension }[] = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
];

export default function StatsScreen() {
  const [dimension, setDimension] = useState<StatsDimension>('today');
  const { sessions, tasks } = useFocusDay();
  const stats = useMemo(() => buildStatsView(tasks, sessions, dimension), [dimension, sessions, tasks]);

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>统计与复盘</Text>
        <Text style={styles.subtitle}>结果要看得见，才更容易形成连续专注。</Text>

        <View style={styles.segment}>
          {dimensions.map((item) => {
            const active = item.value === dimension;
            return (
              <Text
                key={item.value}
                onPress={() => setDimension(item.value)}
                style={[styles.segmentItem, active && styles.segmentItemActive]}>
                {item.label}
              </Text>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryRange}>{stats.rangeLabel}</Text>
          <Text style={styles.summaryText}>{stats.summary}</Text>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard label="完成任务" value={`${stats.taskCompleted}/${stats.taskTotal}`} />
          <MetricCard label="完成番茄" value={stats.pomodoroCompleted.toString()} />
          <MetricCard label="总专注时长" value={`${stats.focusMinutes} 分钟`} />
          <MetricCard label="连续打卡" value={`${stats.streakDays} 天`} />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>趋势图</Text>
          <StatBarChart points={stats.chart} />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>任务分布</Text>
          {stats.taskDistribution.length === 0 ? (
            <Text style={styles.emptyText}>暂无专注记录，完成第一个番茄后这里会出现任务排行。</Text>
          ) : (
            stats.taskDistribution.map((item, index) => (
              <View key={item.taskId} style={styles.distributionRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.distributionMeta}>
                  <Text style={styles.distributionTitle}>{item.title}</Text>
                  <Text style={styles.distributionCaption}>
                    {item.pomodoros} 个番茄 · {item.minutes} 分钟
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: 14,
    color: palette.mutedText,
  },
  segment: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentItem: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: palette.surface,
    color: palette.mutedText,
    fontWeight: '700',
    overflow: 'hidden',
  },
  segmentItemActive: {
    backgroundColor: palette.accent,
    color: palette.surface,
  },
  summaryCard: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: palette.accentSoft,
    gap: 8,
  },
  summaryRange: {
    color: palette.accent,
    fontWeight: '700',
  },
  summaryText: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 22,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '47%',
    borderRadius: 22,
    padding: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.text,
  },
  metricLabel: {
    marginTop: 6,
    color: palette.mutedText,
  },
  panel: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 18,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  emptyText: {
    color: palette.mutedText,
    lineHeight: 20,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceAlt,
  },
  rankText: {
    fontWeight: '800',
    color: palette.text,
  },
  distributionMeta: {
    flex: 1,
    gap: 4,
  },
  distributionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  distributionCaption: {
    color: palette.mutedText,
  },
});
