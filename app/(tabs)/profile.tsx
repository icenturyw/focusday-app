import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, sharedStyles } from '@/constants/theme';
import { useFocusDay } from '@/context/focus-day-context';
import { formatFriendlyDate, formatMinutes } from '@/utils/date';
import {
  getCompletedFocusMinutes,
  getCompletedPomodoros,
  getCompletedTasks,
} from '@/utils/achievements';
import { getCurrentStreak } from '@/utils/stats';

export default function ProfileScreen() {
  const { achievements, sessions, settings, tasks, updateSettings } = useFocusDay();

  const completedPomodoros = getCompletedPomodoros(sessions);
  const focusMinutes = getCompletedFocusMinutes(sessions);
  const currentStreak = getCurrentStreak(sessions);
  const completedTasks = getCompletedTasks(tasks);
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>F</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.name}>FocusDay 用户</Text>
            <Text style={styles.caption}>让每天的计划、专注和复盘真正连起来。</Text>
          </View>
          <Pressable
            onPress={() =>
              Alert.alert('会员中心', '后续可扩展云同步、主题皮肤、更多白噪音与高级统计。')
            }
            style={styles.memberButton}>
            <Text style={styles.memberButtonText}>会员入口</Text>
          </Pressable>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard label="已解锁成就" value={`${unlockedCount}/${achievements.length}`} icon="medal-outline" />
          <SummaryCard label="累计番茄" value={`${completedPomodoros}`} icon="timer-check-outline" />
          <SummaryCard label="累计专注" value={formatMinutes(focusMinutes)} icon="clock-outline" />
          <SummaryCard label="当前连续" value={`${currentStreak} 天`} icon="calendar-check-outline" />
        </View>

        <Section title="专注设置">
          <StepperRow
            label="默认专注时长"
            value={`${settings.focusMinutes} 分钟`}
            onDecrease={() => updateSettings({ focusMinutes: Math.max(15, settings.focusMinutes - 5) })}
            onIncrease={() => updateSettings({ focusMinutes: Math.min(90, settings.focusMinutes + 5) })}
          />
          <StepperRow
            label="短休息时长"
            value={`${settings.shortBreakMinutes} 分钟`}
            onDecrease={() =>
              updateSettings({ shortBreakMinutes: Math.max(3, settings.shortBreakMinutes - 1) })
            }
            onIncrease={() =>
              updateSettings({ shortBreakMinutes: Math.min(15, settings.shortBreakMinutes + 1) })
            }
          />
          <StepperRow
            label="长休息时长"
            value={`${settings.longBreakMinutes} 分钟`}
            onDecrease={() =>
              updateSettings({ longBreakMinutes: Math.max(10, settings.longBreakMinutes - 5) })
            }
            onIncrease={() =>
              updateSettings({ longBreakMinutes: Math.min(30, settings.longBreakMinutes + 5) })
            }
          />
          <SwitchRow
            label="自动开始下一轮"
            value={settings.autoStartNextRound}
            onValueChange={(value) => updateSettings({ autoStartNextRound: value })}
          />
        </Section>

        <Section title="提醒设置">
          <SwitchRow
            label="任务提醒"
            value={settings.taskReminderEnabled}
            onValueChange={(value) => updateSettings({ taskReminderEnabled: value })}
          />
          <SwitchRow
            label="番茄结束提醒"
            value={settings.sessionReminderEnabled}
            onValueChange={(value) => updateSettings({ sessionReminderEnabled: value })}
          />
          <SwitchRow
            label="每晚复盘提醒"
            value={settings.eveningReviewReminderEnabled}
            onValueChange={(value) => updateSettings({ eveningReviewReminderEnabled: value })}
          />
        </Section>

        <Section title="成就中心">
          <View style={styles.achievementIntro}>
            <Text style={styles.achievementIntroTitle}>当前已完成 {completedTasks} 个任务</Text>
            <Text style={styles.achievementIntroText}>
              成就会随番茄数、专注时长、连续天数和任务完成量自动解锁。
            </Text>
          </View>
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                achievement.unlocked ? styles.achievementCardUnlocked : styles.achievementCardLocked,
              ]}>
              <View
                style={[
                  styles.achievementIcon,
                  achievement.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked,
                ]}>
                <MaterialCommunityIcons
                  name={(achievement.unlocked ? achievement.icon : 'lock-outline') as React.ComponentProps<
                    typeof MaterialCommunityIcons
                  >['name']}
                  size={22}
                  color={achievement.unlocked ? palette.warning : palette.mutedText}
                />
              </View>
              <View style={styles.achievementMeta}>
                <View style={styles.achievementHeader}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text
                    style={[
                      styles.achievementStatus,
                      achievement.unlocked ? styles.achievementStatusUnlocked : styles.achievementStatusLocked,
                    ]}>
                    {achievement.unlocked ? '已解锁' : achievement.progressLabel}
                  </Text>
                </View>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(8, Math.min(100, (achievement.progress / achievement.target) * 100))}%` },
                      achievement.unlocked ? styles.progressFillUnlocked : null,
                    ]}
                  />
                </View>
                <Text style={styles.achievementFootnote}>
                  {achievement.unlocked && achievement.unlockedAt
                    ? `解锁于 ${formatFriendlyDate(achievement.unlockedAt)}`
                    : `当前进度 ${achievement.progressLabel}`}
                </Text>
              </View>
            </View>
          ))}
        </Section>

        <Section title="其他">
          <NavRow
            label="意见反馈"
            onPress={() => Alert.alert('意见反馈', 'MVP 先保留入口，后续可接表单、邮箱或工单。')}
          />
          <NavRow
            label="关于我们"
            onPress={() => Alert.alert('关于 FocusDay', '这是一个围绕任务完成设计的番茄专注 App。')}
          />
          <NavRow
            label="隐私政策"
            onPress={() => Alert.alert('隐私政策', '当前版本默认仅在本地存储任务、专注记录和成就数据。')}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <MaterialCommunityIcons name={icon} size={20} color={palette.accent} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StepperRow({
  label,
  onDecrease,
  onIncrease,
  value,
}: {
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMeta}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable onPress={onDecrease} style={styles.stepperButton}>
          <Text style={styles.stepperText}>-</Text>
        </Pressable>
        <Pressable onPress={onIncrease} style={styles.stepperButton}>
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SwitchRow({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: palette.border, true: palette.accentSoft }}
        thumbColor={value ? palette.accent : palette.surface}
      />
    </View>
  );
}

function NavRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={palette.mutedText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: palette.text,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.surface,
  },
  profileMeta: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: palette.surface,
    fontSize: 20,
    fontWeight: '800',
  },
  caption: {
    color: '#D8CCC0',
    lineHeight: 18,
  },
  memberButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.surface,
  },
  memberButtonText: {
    color: palette.text,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: '48%',
    borderRadius: 24,
    padding: 16,
    gap: 8,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.text,
  },
  summaryLabel: {
    color: palette.mutedText,
    fontSize: 13,
  },
  section: {
    borderRadius: 26,
    padding: 20,
    gap: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowMeta: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    fontSize: 15,
    color: palette.text,
  },
  rowValue: {
    color: palette.mutedText,
    fontSize: 13,
  },
  stepper: {
    flexDirection: 'row',
    gap: 10,
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 20,
    color: palette.text,
  },
  achievementIntro: {
    borderRadius: 20,
    padding: 14,
    gap: 6,
    backgroundColor: palette.surfaceAlt,
  },
  achievementIntroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  achievementIntroText: {
    color: palette.mutedText,
    lineHeight: 18,
  },
  achievementCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
  },
  achievementCardUnlocked: {
    borderColor: '#E8C16A',
    backgroundColor: '#FFF7E2',
  },
  achievementCardLocked: {
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  achievementIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconUnlocked: {
    backgroundColor: palette.warningSoft,
  },
  achievementIconLocked: {
    backgroundColor: palette.surfaceAlt,
  },
  achievementMeta: {
    flex: 1,
    gap: 6,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  achievementTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: palette.text,
  },
  achievementStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  achievementStatusUnlocked: {
    color: palette.warning,
  },
  achievementStatusLocked: {
    color: palette.mutedText,
  },
  achievementDescription: {
    color: palette.mutedText,
    lineHeight: 19,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EADFD4',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  progressFillUnlocked: {
    backgroundColor: palette.warning,
  },
  achievementFootnote: {
    color: palette.mutedText,
    fontSize: 12,
  },
});
