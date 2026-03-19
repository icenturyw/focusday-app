import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';

import { palette, sharedStyles } from '@/constants/theme';
import { useFocusDay } from '@/context/focus-day-context';
import { RecurringEditScope, Task } from '@/types/app';
import { formatMinutes, formatFriendlyDate, getGreeting } from '@/utils/date';
import { buildDailyStats, getCurrentStreak, getTodayTasks } from '@/utils/stats';

export default function HomeScreen() {
  const router = useRouter();
  const {
    activeTimer,
    deleteTask,
    markTaskComplete,
    reopenTask,
    reorderTasks,
    sessions,
    startFocus,
    tasks,
  } = useFocusDay();

  const todayTasks = useMemo(() => getTodayTasks(tasks), [tasks]);
  const todayStats = useMemo(() => buildDailyStats(tasks, sessions), [sessions, tasks]);
  const streakDays = useMemo(() => getCurrentStreak(sessions), [sessions]);

  const progressCards = [
    { label: '今日任务', value: todayStats.taskTotal.toString(), icon: 'clipboard-list-outline' },
    { label: '已完成', value: todayStats.taskCompleted.toString(), icon: 'check-circle-outline' },
    { label: '专注时长', value: formatMinutes(todayStats.focusMinutes), icon: 'timer-sand' },
    { label: '已完成番茄', value: todayStats.pomodoroCompleted.toString(), icon: 'fruit-cherries' },
  ];

  const renderItem = ({ drag, isActive, item }: RenderItemParams<Task>) => (
    <ScaleDecorator>
      <Swipeable
        renderLeftActions={() => (
          <ActionPill
            color={item.status === 'completed' ? palette.surfaceAlt : palette.success}
            icon={item.status === 'completed' ? 'backup-restore' : 'check'}
            label={item.status === 'completed' ? '恢复' : '完成'}
          />
        )}
        renderRightActions={() => (
          <ActionPill color={palette.danger} icon="delete-outline" label="删除" align="right" />
        )}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') {
            openDeleteDialog(item);
            return;
          }

          if (item.status === 'completed') {
            reopenTask(item.id);
          } else {
            markTaskComplete(item.id);
          }
        }}>
        <Pressable
          onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
          style={[
            styles.taskCard,
            isActive && styles.taskCardActive,
            item.status === 'completed' && styles.taskCardDone,
          ]}>
          <View style={styles.taskHeader}>
            <View style={styles.taskTitleWrap}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <PriorityBadge priority={item.priority} />
            </View>
            <Pressable onLongPress={drag} delayLongPress={180} style={styles.dragHandle}>
              <MaterialCommunityIcons name="drag" size={20} color={palette.mutedText} />
            </Pressable>
          </View>

          <View style={styles.taskMetaRow}>
            <MetaChip
              icon="timer-outline"
              label={`${item.completedPomodoros}/${item.estimatedPomodoros} 个番茄`}
            />
            {item.deadline ? <MetaChip icon="calendar-clock" label={item.deadline} /> : null}
            <MetaChip
              icon={item.status === 'completed' ? 'check-decagram' : 'clock-outline'}
              label={item.status === 'completed' ? '已完成' : '进行中'}
            />
          </View>

          {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}

          <View style={styles.taskFooter}>
            <Text style={styles.taskHint}>
              {item.completedPomodoros >= item.estimatedPomodoros
                ? '已达到预计番茄数，可直接标记完成'
                : '长按右上角可拖动排序'}
            </Text>
            <Pressable
              onPress={() => {
                startFocus(item.id);
                router.push('/focus');
              }}
              style={styles.startButton}>
              <MaterialCommunityIcons name="play" size={16} color={palette.surface} />
              <Text style={styles.startButtonText}>开始专注</Text>
            </Pressable>
          </View>
        </Pressable>
      </Swipeable>
    </ScaleDecorator>
  );

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <DraggableFlatList
        contentContainerStyle={styles.listContent}
        data={todayTasks}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => reorderTasks(data.map((task) => task.id))}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={styles.dateLabel}>{formatFriendlyDate(new Date())}</Text>
            <Text style={styles.heroTitle}>{getGreeting()}，今天把重要的事做完。</Text>
            <Text style={styles.heroSubTitle}>
              完成率{' '}
              {todayStats.taskTotal === 0
                ? 0
                : Math.round((todayStats.taskCompleted / todayStats.taskTotal) * 100)}
              % · 连续专注 {streakDays} 天
            </Text>

            <View style={styles.progressGrid}>
              {progressCards.map((card) => (
                <View key={card.label} style={styles.progressCard}>
                  <MaterialCommunityIcons name={card.icon as never} size={20} color={palette.accent} />
                  <Text style={styles.progressValue}>{card.value}</Text>
                  <Text style={styles.progressLabel}>{card.label}</Text>
                </View>
              ))}
            </View>

            {activeTimer ? (
              <Pressable onPress={() => router.push('/focus')} style={styles.currentFocusCard}>
                <View>
                  <Text style={styles.currentFocusLabel}>当前专注</Text>
                  <Text style={styles.currentFocusTitle}>
                    {activeTimer.phase === 'focus' ? '专注中' : '休息中'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="arrow-right" size={20} color={palette.surface} />
              </Pressable>
            ) : null}

            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>今日任务</Text>
              <Text style={styles.sectionCaption}>左滑删除，右滑完成，长按拖动</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="coffee-outline" size={40} color={palette.accent} />
            <Text style={styles.emptyTitle}>今天还没有任务</Text>
            <Text style={styles.emptyCaption}>先列出 3 到 5 件最重要的事，再开始第一个番茄。</Text>
            <Pressable onPress={() => router.push('/task-editor')} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>添加今日第一个任务</Text>
            </Pressable>
          </View>
        }
      />

      <Pressable onPress={() => router.push('/task-editor')} style={styles.fab}>
        <MaterialCommunityIcons name="plus" size={28} color={palette.surface} />
      </Pressable>
    </SafeAreaView>
  );

  function openDeleteDialog(task: Task) {
    const confirmDelete = (scope: RecurringEditScope) => deleteTask(task.id, scope);

    if (!task.recurringTaskId) {
      Alert.alert('删除任务', `确认删除「${task.title}」吗？`, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => confirmDelete('single') },
      ]);
      return;
    }

    Alert.alert('删除系列任务', '选择删除范围', [
      { text: '取消', style: 'cancel' },
      { text: '仅今天', style: 'destructive', onPress: () => confirmDelete('single') },
      { text: '本次以后', style: 'destructive', onPress: () => confirmDelete('future') },
      { text: '全部', style: 'destructive', onPress: () => confirmDelete('all') },
    ]);
  }
}

function MetaChip({
  icon,
  label,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.metaChip}>
      <MaterialCommunityIcons name={icon} size={14} color={palette.mutedText} />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const config = {
    high: { label: '高优先', backgroundColor: '#F9D4C5', color: '#A6402C' },
    medium: { label: '中优先', backgroundColor: '#F3E7B9', color: '#89640F' },
    low: { label: '低优先', backgroundColor: '#D7E6CF', color: '#2E6A47' },
  }[priority];

  return (
    <View style={[styles.priorityBadge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.priorityBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function ActionPill({
  align = 'left',
  color,
  icon,
  label,
}: {
  align?: 'left' | 'right';
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}) {
  return (
    <View
      style={[
        styles.actionPill,
        { backgroundColor: color },
        align === 'right' ? styles.actionRight : undefined,
      ]}>
      <MaterialCommunityIcons name={icon} size={20} color={palette.surface} />
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 120,
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  dateLabel: {
    fontSize: 13,
    color: palette.mutedText,
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    color: palette.text,
  },
  heroSubTitle: {
    fontSize: 15,
    color: palette.mutedText,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  progressCard: {
    width: '47%',
    borderRadius: 24,
    backgroundColor: palette.surface,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  progressValue: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.text,
  },
  progressLabel: {
    fontSize: 13,
    color: palette.mutedText,
  },
  currentFocusCard: {
    backgroundColor: palette.accent,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentFocusLabel: {
    color: '#FFF5ED',
    fontSize: 13,
  },
  currentFocusTitle: {
    color: palette.surface,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.text,
  },
  sectionCaption: {
    fontSize: 12,
    color: palette.mutedText,
  },
  taskCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 14,
  },
  taskCardActive: {
    transform: [{ scale: 0.98 }],
  },
  taskCardDone: {
    opacity: 0.72,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskTitleWrap: {
    flex: 1,
    gap: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  dragHandle: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceAlt,
  },
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.surfaceAlt,
  },
  metaChipText: {
    fontSize: 12,
    color: palette.mutedText,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.mutedText,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  taskHint: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: palette.mutedText,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: palette.text,
  },
  startButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.surface,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionPill: {
    width: 88,
    marginBottom: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionRight: {
    marginRight: 20,
  },
  actionLabel: {
    color: palette.surface,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderRadius: 28,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.text,
  },
  emptyCaption: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.mutedText,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  emptyButtonText: {
    color: palette.surface,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 28,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.accent,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
  },
});
