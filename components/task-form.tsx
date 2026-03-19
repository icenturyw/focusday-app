import { useMemo, useState } from 'react';
import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette } from '@/constants/theme';
import { TaskDraft, TaskPriority } from '@/types/app';
import { normalizeDateKey, toDateKey } from '@/utils/date';

type TaskFormProps = {
  footerContent?: ReactNode;
  initialValue?: TaskDraft;
  isEditing?: boolean;
  submitLabel: string;
  onSubmit: (draft: TaskDraft) => void;
};

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export function TaskForm({
  footerContent,
  initialValue,
  isEditing = false,
  onSubmit,
  submitLabel,
}: TaskFormProps) {
  const defaultDate = toDateKey(new Date());
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initialValue?.priority ?? 'medium');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(
    initialValue?.estimatedPomodoros ?? 1
  );
  const [deadline, setDeadline] = useState(initialValue?.deadline ?? '');
  const [note, setNote] = useState(initialValue?.note ?? '');
  const [startDate, setStartDate] = useState(initialValue?.startDate ?? defaultDate);
  const [endDate, setEndDate] = useState(initialValue?.endDate ?? defaultDate);
  const [pinQuickDeadline, setPinQuickDeadline] = useState(false);

  const isSubmitDisabled = useMemo(() => title.trim().length === 0, [title]);

  function handleSubmit() {
    const normalizedStartDate = normalizeDateKey(startDate, defaultDate);
    const normalizedEndDate = normalizeDateKey(endDate, normalizedStartDate);

    onSubmit({
      title,
      priority,
      estimatedPomodoros,
      deadline,
      note,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate < normalizedStartDate ? normalizedStartDate : normalizedEndDate,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.block}>
        <Text style={styles.label}>任务名称</Text>
        <TextInput
          placeholder="例如：完成方案初稿"
          placeholderTextColor={palette.mutedText}
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>优先级</Text>
        <View style={styles.row}>
          {priorityOptions.map((option) => {
            const active = option.value === priority;
            return (
              <Pressable
                key={option.value}
                onPress={() => setPriority(option.value)}
                style={[styles.pill, active && styles.pillActive]}>
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>{isEditing ? '排期日期' : '日期范围'}</Text>
        {isEditing ? (
          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyValue}>{startDate}</Text>
            <Text style={styles.helperText}>编辑时保留当前日期；如需改整段日期范围，请新建一个新的任务序列。</Text>
          </View>
        ) : (
          <>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateHint}>开始</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={palette.mutedText}
                  style={styles.input}
                  value={startDate}
                  onChangeText={setStartDate}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateHint}>结束</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={palette.mutedText}
                  style={styles.input}
                  value={endDate}
                  onChangeText={setEndDate}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <Text style={styles.helperText}>保存后会自动为范围内的每一天生成一条任务。</Text>
          </>
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>预计番茄数</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setEstimatedPomodoros((value) => Math.max(1, value - 1))}
            style={styles.stepperButton}>
            <Text style={styles.stepperButtonText}>-</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{estimatedPomodoros}</Text>
          <Pressable
            onPress={() => setEstimatedPomodoros((value) => Math.min(12, value + 1))}
            style={styles.stepperButton}>
            <Text style={styles.stepperButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>截止时间</Text>
        <TextInput
          placeholder="例如：今天 18:00 / 周三下班前"
          placeholderTextColor={palette.mutedText}
          style={styles.input}
          value={deadline}
          onChangeText={setDeadline}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>快捷填入今晚 22:00</Text>
          <Switch
            value={pinQuickDeadline}
            onValueChange={(enabled) => {
              setPinQuickDeadline(enabled);
              setDeadline(enabled ? '今天 22:00' : '');
            }}
            trackColor={{ false: palette.border, true: palette.accentSoft }}
            thumbColor={pinQuickDeadline ? palette.accent : palette.surface}
          />
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>备注</Text>
        <TextInput
          placeholder="补充信息、执行步骤、提醒事项"
          placeholderTextColor={palette.mutedText}
          style={[styles.input, styles.textArea]}
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />
      </View>

      {footerContent}

      <Pressable
        disabled={isSubmitDisabled}
        onPress={handleSubmit}
        style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}>
        <Text style={styles.submitText}>{submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20,
    backgroundColor: palette.background,
  },
  block: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
  },
  input: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: palette.text,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
    gap: 8,
  },
  dateHint: {
    fontSize: 12,
    color: palette.mutedText,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.mutedText,
  },
  readOnlyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 16,
    gap: 8,
  },
  readOnlyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
  },
  textArea: {
    minHeight: 120,
  },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
  },
  pillActive: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  pillText: {
    color: palette.mutedText,
    fontWeight: '700',
  },
  pillTextActive: {
    color: palette.accent,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 22,
    color: palette.text,
  },
  stepperValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: palette.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 13,
    color: palette.mutedText,
  },
  submitButton: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: palette.accent,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.surface,
  },
});
