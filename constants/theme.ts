import { StyleSheet } from 'react-native';

export const palette = {
  background: '#F7F2EA',
  surface: '#FFFDFC',
  surfaceAlt: '#F1E8DE',
  border: '#E4D6C7',
  text: '#221B16',
  mutedText: '#7B6758',
  accent: '#D36A3A',
  accentSoft: '#F4DDCF',
  success: '#4E8E63',
  successSoft: '#D7E8D8',
  warning: '#C49231',
  warningSoft: '#F6E6B9',
  danger: '#B94F45',
  dangerSoft: '#F1D1CE',
};

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  sectionCard: {
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
});
