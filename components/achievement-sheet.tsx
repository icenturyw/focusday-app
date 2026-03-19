import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { AchievementProgress } from '@/types/app';

type AchievementSheetProps = {
  achievement: AchievementProgress | null;
  onDismiss: () => void;
};

export function AchievementSheet({ achievement, onDismiss }: AchievementSheetProps) {
  return (
    <Modal transparent animationType="fade" visible={Boolean(achievement)} onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={
                (achievement?.icon ?? 'medal-outline') as React.ComponentProps<
                  typeof MaterialCommunityIcons
                >['name']
              }
              size={34}
              color={palette.warning}
            />
          </View>
          <Text style={styles.eyebrow}>新成就解锁</Text>
          <Text style={styles.title}>{achievement?.title}</Text>
          <Text style={styles.description}>{achievement?.description}</Text>
          <Pressable onPress={onDismiss} style={styles.button}>
            <Text style={styles.buttonText}>我知道了</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(34, 27, 22, 0.32)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.warningSoft,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: palette.warning,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.text,
  },
  description: {
    textAlign: 'center',
    color: palette.mutedText,
    lineHeight: 21,
  },
  button: {
    marginTop: 8,
    minWidth: 160,
    borderRadius: 999,
    backgroundColor: palette.accent,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: palette.surface,
    fontSize: 15,
    fontWeight: '800',
  },
});
