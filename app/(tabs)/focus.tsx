import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompletionSheet } from '@/components/completion-sheet';
import { palette, sharedStyles } from '@/constants/theme';
import { useFocusDay } from '@/context/focus-day-context';
import { formatClock, getRemainingSeconds } from '@/utils/date';
import { getTodayTasks } from '@/utils/stats';

export default function FocusScreen() {
  const router = useRouter();
  const [tick, setTick] = useState(Date.now());
  const {
    activeTimer,
    completionPrompt,
    dismissCompletionPrompt,
    continueWithTask,
    endCurrentSession,
    markTaskComplete,
    pauseTimer,
    resumeTimer,
    selectedTaskId,
    selectTask,
    settings,
    skipBreak,
    startBreak,
    startFocus,
    tasks,
    updateSettings,
  } = useFocusDay();

  useEffect(() => {
    if (!activeTimer?.isRunning) {
      return;
    }
    const intervalId = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [activeTimer?.id, activeTimer?.isRunning]);

  const todayTasks = useMemo(
    () => getTodayTasks(tasks).filter((task) => task.status === 'pending'),
    [tasks]
  );
  const selectedTask =
    tasks.find((task) => task.id === activeTimer?.taskId) ??
    tasks.find((task) => task.id === selectedTaskId) ??
    null;

  const remainingSeconds = activeTimer ? getRemainingSeconds(activeTimer) : 0;
  void tick;

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>FocusDay</Text>
          <Text style={styles.title}>围绕任务进入专注，而不是空转计时。</Text>
        </View>

        {selectedTask ? (
          <View style={styles.currentTaskCard}>
            <View style={styles.currentTaskHeader}>
              <Text style={styles.currentTaskLabel}>当前任务</Text>
              <Pressable onPress={() => router.push({ pathname: '/task/[id]', params: { id: selectedTask.id } })}>
                <Text style={styles.detailLink}>详情</Text>
              </Pressable>
            </View>
            <Text style={styles.currentTaskTitle}>{selectedTask.title}</Text>
            <Text style={styles.currentTaskMeta}>
              进度 {selectedTask.completedPomodoros}/{selectedTask.estimatedPomodoros} · 第{' '}
              {selectedTask.completedPomodoros + 1} 个番茄
            </Text>
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>先选择一个今日任务</Text>
            <Text style={styles.placeholderCaption}>专注必须和具体任务绑定，数据才有意义。</Text>
          </View>
        )}

        <View style={styles.timerPanel}>
          <Text style={styles.phaseLabel}>
            {activeTimer?.phase === 'focus'
              ? '专注中'
              : activeTimer?.phase === 'longBreak'
                ? '长休息'
                : activeTimer?.phase === 'shortBreak'
                  ? '短休息'
                  : '准备开始'}
          </Text>
          <Text style={styles.timerText}>
            {activeTimer ? formatClock(remainingSeconds) : formatClock(settings.focusMinutes * 60)}
          </Text>
          <Text style={styles.timerHint}>
            {activeTimer
              ? activeTimer.phase === 'focus'
                ? '完成后会累计任务进度'
                : '休息结束后返回下一轮专注'
              : `默认 ${settings.focusMinutes} 分钟专注 + ${settings.shortBreakMinutes} 分钟休息`}
          </Text>

          <View style={styles.timerActions}>
            {!activeTimer ? (
              <Pressable
                disabled={!selectedTask}
                onPress={() => selectedTask && startFocus(selectedTask.id)}
                style={[styles.primaryAction, !selectedTask && styles.disabledButton]}>
                <MaterialCommunityIcons name="play" size={18} color={palette.surface} />
                <Text style={styles.primaryActionText}>开始</Text>
              </Pressable>
            ) : activeTimer.isRunning ? (
              <>
                <Pressable onPress={pauseTimer} style={styles.secondaryAction}>
                  <MaterialCommunityIcons name="pause" size={18} color={palette.text} />
                  <Text style={styles.secondaryActionText}>暂停</Text>
                </Pressable>
                {activeTimer.phase !== 'focus' ? (
                  <Pressable onPress={skipBreak} style={styles.secondaryAction}>
                    <MaterialCommunityIcons name="skip-next" size={18} color={palette.text} />
                    <Text style={styles.secondaryActionText}>跳过休息</Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <>
                <Pressable onPress={resumeTimer} style={styles.primaryAction}>
                  <MaterialCommunityIcons name="play" size={18} color={palette.surface} />
                  <Text style={styles.primaryActionText}>继续</Text>
                </Pressable>
                <Pressable onPress={endCurrentSession} style={styles.secondaryAction}>
                  <MaterialCommunityIcons name="stop" size={18} color={palette.text} />
                  <Text style={styles.secondaryActionText}>结束本次专注</Text>
                </Pressable>
              </>
            )}
          </View>

          {activeTimer?.isRunning ? (
            <Pressable onPress={endCurrentSession} style={styles.ghostAction}>
              <Text style={styles.ghostActionText}>提前结束本次 {activeTimer.phase === 'focus' ? '专注' : '休息'}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.helperCard}>
          <Text style={styles.sectionTitle}>辅助功能</Text>
          <View style={styles.helperRow}>
            <Text style={styles.helperLabel}>白噪音</Text>
            <View style={styles.whiteNoiseRow}>
              {[
                { label: '关', value: 'off' },
                { label: '雨声', value: 'rain' },
                { label: '咖啡馆', value: 'cafe' },
              ].map((option) => {
                const active = option.value === settings.whiteNoiseMode;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => updateSettings({ whiteNoiseMode: option.value as typeof settings.whiteNoiseMode })}
                    style={[styles.soundPill, active && styles.soundPillActive]}>
                    <Text style={[styles.soundPillText, active && styles.soundPillTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.helperRow}>
            <Text style={styles.helperLabel}>震动提醒</Text>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
              trackColor={{ false: palette.border, true: palette.accentSoft }}
              thumbColor={settings.vibrationEnabled ? palette.accent : palette.surface}
            />
          </View>
          <View style={styles.helperPrompt}>
            <MaterialCommunityIcons name="bell-ring-outline" size={18} color={palette.accent} />
            <Text style={styles.helperPromptText}>专注前建议打开系统勿扰，减少社交应用打断。</Text>
          </View>
        </View>

        <View style={styles.helperCard}>
          <Text style={styles.sectionTitle}>可选任务</Text>
          {todayTasks.length === 0 ? (
            <Text style={styles.helperPromptText}>今天还没有待处理任务，先去首页添加一个。</Text>
          ) : (
            todayTasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => selectTask(task.id)}
                style={[
                  styles.taskPickerCard,
                  selectedTask?.id === task.id && styles.taskPickerCardActive,
                ]}>
                <View>
                  <Text style={styles.taskPickerTitle}>{task.title}</Text>
                  <Text style={styles.taskPickerMeta}>
                    {task.completedPomodoros}/{task.estimatedPomodoros} 个番茄
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.mutedText} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <CompletionSheet
        prompt={completionPrompt}
        onDismiss={dismissCompletionPrompt}
        onStartBreak={() => completionPrompt && startBreak(completionPrompt.taskId, completionPrompt.nextBreakType)}
        onContinue={() => completionPrompt && continueWithTask(completionPrompt.taskId)}
        onCompleteTask={() => {
          if (!completionPrompt) {
            return;
          }
          markTaskComplete(completionPrompt.taskId);
          dismissCompletionPrompt();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 40,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 13,
    color: palette.accent,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: palette.text,
  },
  currentTaskCard: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 8,
  },
  currentTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentTaskLabel: {
    fontSize: 13,
    color: palette.mutedText,
  },
  detailLink: {
    color: palette.accent,
    fontWeight: '700',
  },
  currentTaskTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: palette.text,
  },
  currentTaskMeta: {
    color: palette.mutedText,
  },
  placeholderCard: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: palette.accentSoft,
    gap: 6,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.text,
  },
  placeholderCaption: {
    color: palette.mutedText,
  },
  timerPanel: {
    borderRadius: 32,
    padding: 26,
    backgroundColor: palette.text,
    alignItems: 'center',
    gap: 12,
  },
  phaseLabel: {
    color: '#D8CCC0',
    fontSize: 13,
  },
  timerText: {
    fontSize: 68,
    letterSpacing: -2,
    fontWeight: '900',
    color: palette.surface,
  },
  timerHint: {
    color: '#D8CCC0',
    fontSize: 14,
    textAlign: 'center',
  },
  timerActions: {
    marginTop: 6,
    width: '100%',
    gap: 12,
  },
  primaryAction: {
    borderRadius: 999,
    backgroundColor: palette.accent,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionText: {
    color: palette.surface,
    fontWeight: '800',
  },
  secondaryAction: {
    borderRadius: 999,
    backgroundColor: palette.surface,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionText: {
    color: palette.text,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.4,
  },
  ghostAction: {
    paddingTop: 4,
  },
  ghostActionText: {
    color: '#D8CCC0',
    fontSize: 13,
  },
  helperCard: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  helperRow: {
    gap: 10,
  },
  helperLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
  },
  whiteNoiseRow: {
    flexDirection: 'row',
    gap: 8,
  },
  soundPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.surfaceAlt,
  },
  soundPillActive: {
    backgroundColor: palette.accentSoft,
  },
  soundPillText: {
    color: palette.mutedText,
    fontWeight: '700',
  },
  soundPillTextActive: {
    color: palette.accent,
  },
  helperPrompt: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  helperPromptText: {
    flex: 1,
    color: palette.mutedText,
    lineHeight: 19,
  },
  taskPickerCard: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskPickerCardActive: {
    backgroundColor: palette.accentSoft,
    marginHorizontal: -6,
    paddingHorizontal: 6,
    borderRadius: 18,
    borderBottomWidth: 0,
  },
  taskPickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  taskPickerMeta: {
    color: palette.mutedText,
    marginTop: 4,
  },
});
