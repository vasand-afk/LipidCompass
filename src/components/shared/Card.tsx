import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../constants';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: Props) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: SPACING.md,
  },
  padded: {
    padding: SPACING.md,
  },
});
