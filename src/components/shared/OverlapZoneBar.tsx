import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { OverlapZonePosition } from '../../types';

interface Props {
  score: number; // 0–100
  position: OverlapZonePosition;
  label?: string;
  compact?: boolean;
}

const ZONE_LABELS = {
  green: 'Lifestyle First',
  yellow: 'Gray Zone',
  red: 'Medication Indicated',
};

const ZONE_COLORS: Record<OverlapZonePosition, string> = {
  green: COLORS.green,
  yellow: COLORS.yellow,
  red: COLORS.red,
};

export function OverlapZoneBar({ score, position, label, compact = false }: Props) {
  const dotAnim = useRef(new Animated.Value(score)).current;

  useEffect(() => {
    Animated.spring(dotAnim, {
      toValue: score,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const dotColor = ZONE_COLORS[position];
  const barHeight = compact ? 12 : 20;
  const dotSize = compact ? 20 : 28;

  return (
    <View style={styles.container}>
      {label && <Text style={[TYPOGRAPHY.label, styles.label]}>{label}</Text>}

      {/* Zone labels */}
      {!compact && (
        <View style={styles.zoneLabels}>
          <Text style={[styles.zoneLabelText, { color: COLORS.green }]}>Lifestyle{'\n'}First</Text>
          <Text style={[styles.zoneLabelText, { color: COLORS.yellow, textAlign: 'center' }]}>Gray{'\n'}Zone</Text>
          <Text style={[styles.zoneLabelText, { color: COLORS.red, textAlign: 'right' }]}>Medication{'\n'}Indicated</Text>
        </View>
      )}

      {/* Track */}
      <View style={[styles.track, { height: barHeight }]}>
        {/* Green zone */}
        <View style={[styles.zone, { flex: 35, backgroundColor: COLORS.greenLight, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }]} />
        {/* Yellow zone */}
        <View style={[styles.zone, { flex: 30, backgroundColor: COLORS.yellowLight }]} />
        {/* Red zone */}
        <View style={[styles.zone, { flex: 35, backgroundColor: COLORS.redLight, borderTopRightRadius: 8, borderBottomRightRadius: 8 }]} />

        {/* Zone dividers */}
        <View style={[styles.divider, { left: '35%' }]} />
        <View style={[styles.divider, { left: '65%' }]} />

        {/* Animated dot */}
        <Animated.View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: dotColor,
              left: dotAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              marginLeft: -(dotSize / 2),
              top: -(dotSize - barHeight) / 2,
            },
          ]}
        />
      </View>

      {/* Score + position label */}
      {!compact && (
        <View style={styles.scoreRow}>
          <View style={[styles.positionBadge, { backgroundColor: dotColor + '20' }]}>
            <View style={[styles.positionDot, { backgroundColor: dotColor }]} />
            <Text style={[styles.positionText, { color: dotColor }]}>
              {ZONE_LABELS[position]}
            </Text>
          </View>
          <Text style={styles.scoreText}>Score {Math.round(score)}/100</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: { marginBottom: SPACING.sm },
  zoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  zoneLabelText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  track: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'visible',
    position: 'relative',
  },
  zone: { height: '100%' },
  divider: {
    position: 'absolute',
    width: 2,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dot: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  positionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  positionText: { fontSize: 13, fontWeight: '700' },
  scoreText: { fontSize: 13, color: COLORS.gray600 },
});
