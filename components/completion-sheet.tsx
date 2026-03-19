import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { CompletionPrompt } from '@/types/app';

type CompletionSheetProps = {
  prompt: CompletionPrompt | null;
  onDismiss: () => void;
  onStartBreak: () => void;
  onContinue: () => void;
  onCompleteTask: () => void;
};

export function CompletionSheet({
  prompt,
  onDismiss,
  onStartBreak,
  onContinue,
  onCompleteTask,
}: CompletionSheetProps) {
  return (
    <Modal transparent animationType="slide" visible={Boolean(prompt)} onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View style={styles.sheet}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="check-bold" size={22} color={palette.surface} />
          </View>
          <Text style={styles.title}>本次已完成 1 个番茄</Text>
          <Text style={styles.subtitle}>
            {prompt?.taskTitle} 已累计 {prompt?.completedPomodoros}/{prompt?.estimatedPomodoros} 个番茄
          </Text>

          <Pressable onPress={onStartBreak} style={styles.primaryButton}>
            <Text style={styles.primaryText}>
              进入{prompt?.nextBreakType === 'longBreak' ? '长休息' : '短休息'}
            </Text>
          </Pressable>
          <Pressable onPress={onContinue} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>继续下一个番茄</Text>
          </Pressable>
          <Pressable onPress={onCompleteTask} style={styles.inlineButton}>
            <Text style={styles.inlineText}>标记任务完成</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(34, 27, 22, 0.28)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: palette.surface,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    gap: 14,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.success,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    textAlign: 'center',
    color: palette.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: palette.accent,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryText: {
    color: palette.surface,
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    borderRadius: 999,
    backgroundColor: palette.surfaceAlt,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryText: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 15,
  },
  inlineButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  inlineText: {
    color: palette.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});
