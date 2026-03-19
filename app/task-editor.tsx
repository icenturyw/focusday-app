import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskForm } from '@/components/task-form';
import { palette, sharedStyles } from '@/constants/theme';
import { useFocusDay } from '@/context/focus-day-context';
import { RecurringEditScope, TaskDraft } from '@/types/app';

export default function TaskEditorScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const { addTask, tasks, updateTask } = useFocusDay();
  const [scope, setScope] = useState<RecurringEditScope>('single');

  const currentTask = useMemo(
    () => tasks.find((task) => task.id === params.taskId),
    [params.taskId, tasks]
  );

  useEffect(() => {
    navigation.setOptions({
      title: currentTask ? '编辑任务' : '新增任务',
    });
  }, [currentTask, navigation]);

  useEffect(() => {
    setScope('single');
  }, [currentTask?.id]);

  function handleSubmit(draft: TaskDraft) {
    if (currentTask) {
      updateTask(currentTask.id, draft, scope);
      router.back();
      return;
    }

    addTask(draft);
    router.back();
  }

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['bottom']}>
      <TaskForm
        footerContent={
          currentTask?.recurringTaskId ? (
            <View style={styles.scopeCard}>
              <Text style={styles.scopeTitle}>编辑范围</Text>
              <View style={styles.scopeRow}>
                {[
                  { label: '仅今天', value: 'single' },
                  { label: '本次以后', value: 'future' },
                  { label: '全部', value: 'all' },
                ].map((option) => {
                  const active = option.value === scope;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setScope(option.value as RecurringEditScope)}
                      style={[styles.scopePill, active && styles.scopePillActive]}>
                      <Text style={[styles.scopePillText, active && styles.scopePillTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null
        }
        isEditing={Boolean(currentTask)}
        initialValue={
          currentTask
            ? {
                title: currentTask.title,
                priority: currentTask.priority,
                estimatedPomodoros: currentTask.estimatedPomodoros,
                deadline: currentTask.deadline,
                note: currentTask.note,
                startDate: currentTask.scheduledDate,
                endDate: currentTask.scheduledDate,
              }
            : undefined
        }
        submitLabel={currentTask ? '保存修改' : '创建任务'}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scopeCard: {
    gap: 12,
  },
  scopeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scopePill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingVertical: 12,
    alignItems: 'center',
  },
  scopePillActive: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  scopePillText: {
    color: palette.mutedText,
    fontWeight: '700',
  },
  scopePillTextActive: {
    color: palette.accent,
  },
});
