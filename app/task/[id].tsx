import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, sharedStyles } from '@/constants/theme';
import { useFocusDay } from '@/context/focus-day-context';
import { RecurringEditScope } from '@/types/app';

export default function TaskDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const { deleteTask, markTaskComplete, reopenTask, startFocus, tasks } = useFocusDay();

  const task = useMemo(() => tasks.find((item) => item.id === params.id), [params.id, tasks]);

  useEffect(() => {
    navigation.setOptions({
      title: task?.title ?? '任务详情',
    });
  }, [navigation, task?.title]);

  function confirmDelete(scope: RecurringEditScope) {
    if (!task) {
      return;
    }

    deleteTask(task.id, scope);
    router.back();
  }

  function openDeleteDialog() {
    if (!task) {
      return;
    }

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

  if (!task) {
    return (
      <SafeAreaView style={[sharedStyles.screen, styles.center]} edges={['bottom']}>
        <Text style={styles.emptyText}>任务不存在或已被删除。</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{task.title}</Text>
          <Text style={styles.heroMeta}>
            {task.status === 'completed' ? '已完成' : '进行中'} · {task.completedPomodoros}/
            {task.estimatedPomodoros} 个番茄
          </Text>
        </View>

        <View style={styles.section}>
          <InfoRow label="排期日期" value={task.scheduledDate} />
          <InfoRow label="优先级" value={task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'} />
          <InfoRow label="截止时间" value={task.deadline || '未设置'} />
          <InfoRow label="创建时间" value={new Date(task.createdAt).toLocaleString('zh-CN')} />
          <InfoRow label="备注" value={task.note || '无'} multiline />
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              startFocus(task.id);
              router.push('/focus');
            }}
            style={[styles.actionButton, styles.primaryButton]}>
            <MaterialCommunityIcons name="play" size={18} color={palette.surface} />
            <Text style={styles.primaryButtonText}>开始专注</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: '/task-editor', params: { taskId: task.id } })}
            style={[styles.actionButton, styles.secondaryButton]}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={palette.text} />
            <Text style={styles.secondaryButtonText}>编辑任务</Text>
          </Pressable>

          <Pressable
            onPress={() => (task.status === 'completed' ? reopenTask(task.id) : markTaskComplete(task.id))}
            style={[styles.actionButton, styles.ghostButton]}>
            <MaterialCommunityIcons
              name={task.status === 'completed' ? 'backup-restore' : 'check'}
              size={18}
              color={palette.accent}
            />
            <Text style={styles.ghostButtonText}>
              {task.status === 'completed' ? '恢复任务' : '标记完成'}
            </Text>
          </Pressable>

          <Pressable onPress={openDeleteDialog} style={[styles.actionButton, styles.deleteButton]}>
            <MaterialCommunityIcons name="delete-outline" size={18} color={palette.danger} />
            <Text style={styles.deleteButtonText}>删除任务</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  multiline,
  value,
}: {
  label: string;
  multiline?: boolean;
  value: string;
}) {
  return (
    <View style={[styles.infoRow, multiline && styles.infoRowTop]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, multiline && styles.infoValueMultiline]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: palette.mutedText,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: palette.accentSoft,
    gap: 8,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: palette.text,
  },
  heroMeta: {
    color: palette.mutedText,
    fontSize: 14,
  },
  section: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  infoRowTop: {
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    color: palette.mutedText,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    color: palette.text,
    fontWeight: '600',
  },
  infoValueMultiline: {
    textAlign: 'left',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: palette.text,
  },
  primaryButtonText: {
    color: palette.surface,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  secondaryButtonText: {
    color: palette.text,
    fontWeight: '700',
  },
  ghostButton: {
    backgroundColor: palette.accentSoft,
  },
  ghostButtonText: {
    color: palette.accent,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: palette.dangerSoft,
  },
  deleteButtonText: {
    color: palette.danger,
    fontWeight: '700',
  },
});
