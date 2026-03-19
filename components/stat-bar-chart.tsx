import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

export function StatBarChart({
  points,
}: {
  points: { label: string; value: number }[];
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <View style={styles.chart}>
      {points.map((point) => (
        <View key={point.label} style={styles.column}>
          <Text style={styles.valueText}>{point.value}</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  height: `${Math.max((point.value / maxValue) * 100, point.value === 0 ? 8 : 18)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.labelText}>{point.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    fontSize: 12,
    color: palette.mutedText,
  },
  track: {
    width: '100%',
    height: 132,
    borderRadius: 20,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    backgroundColor: palette.accent,
    borderRadius: 20,
    minHeight: 8,
  },
  labelText: {
    fontSize: 12,
    color: palette.mutedText,
  },
});
